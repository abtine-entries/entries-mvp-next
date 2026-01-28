'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, FileSpreadsheet, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionRow } from './transaction-row'
import { Transaction } from '@/generated/prisma/client'
import { getMatchSuggestionsForTransaction, approveMatch, createManualMatch, MatchSuggestion } from './actions'
import { toast } from 'sonner'

interface ReconciliationPanelsProps {
  workspaceId: string
  bankTransactions: Transaction[]
  qboTransactions: Transaction[]
}

export function ReconciliationPanels({
  workspaceId,
  bankTransactions,
  qboTransactions,
}: ReconciliationPanelsProps) {
  const router = useRouter()
  const [selectedBankTxnId, setSelectedBankTxnId] = useState<string | null>(null)
  const [selectedQboTxnId, setSelectedQboTxnId] = useState<string | null>(null) // For manual matching
  const [highlightedSuggestionId, setHighlightedSuggestionId] = useState<string | null>(null)
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isCreatingManualMatch, setIsCreatingManualMatch] = useState(false)

  // Get suggestion for a specific QBO transaction
  const getSuggestionForQbo = (qboTxnId: string): MatchSuggestion | undefined => {
    return matchSuggestions.find(s => s.qboTxnId === qboTxnId)
  }

  // Fetch match suggestions when a bank transaction is selected
  useEffect(() => {
    if (!selectedBankTxnId) {
      setMatchSuggestions([])
      setHighlightedSuggestionId(null)
      setSelectedQboTxnId(null)
      return
    }

    const selectedBankTxn = bankTransactions.find(t => t.id === selectedBankTxnId)
    if (!selectedBankTxn) {
      setMatchSuggestions([])
      setHighlightedSuggestionId(null)
      setSelectedQboTxnId(null)
      return
    }

    setIsLoadingSuggestions(true)
    setHighlightedSuggestionId(null)
    setSelectedQboTxnId(null)
    getMatchSuggestionsForTransaction(selectedBankTxn, qboTransactions)
      .then(suggestions => {
        setMatchSuggestions(suggestions)
      })
      .catch(error => {
        console.error('Failed to get match suggestions:', error)
        setMatchSuggestions([])
      })
      .finally(() => {
        setIsLoadingSuggestions(false)
      })
  }, [selectedBankTxnId, bankTransactions, qboTransactions])

  const handleBankTxnClick = (transactionId: string) => {
    // Toggle selection: clicking the same transaction deselects it
    setSelectedBankTxnId((prev) =>
      prev === transactionId ? null : transactionId
    )
  }

  const handleSuggestionClick = (qboTxnId: string) => {
    // Toggle highlight: clicking the same suggestion deselects it
    setHighlightedSuggestionId((prev) =>
      prev === qboTxnId ? null : qboTxnId
    )
  }

  const handleQboTxnClick = (qboTxnId: string, e: React.MouseEvent) => {
    // Only allow manual selection when shift is held and a bank transaction is selected
    if (e.shiftKey && selectedBankTxnId) {
      // Clear suggestion highlight when doing manual selection
      setHighlightedSuggestionId(null)
      // Toggle selection: clicking the same transaction deselects it
      setSelectedQboTxnId((prev) =>
        prev === qboTxnId ? null : qboTxnId
      )
    }
  }

  const handleCreateManualMatch = async () => {
    if (!selectedBankTxnId || !selectedQboTxnId) return

    setIsCreatingManualMatch(true)
    try {
      const result = await createManualMatch(
        workspaceId,
        selectedBankTxnId,
        selectedQboTxnId
      )

      if (result.success) {
        toast.success('Manual match created successfully')
        // Reset selection state
        setSelectedBankTxnId(null)
        setSelectedQboTxnId(null)
        setHighlightedSuggestionId(null)
        setMatchSuggestions([])
        // Refresh the page to get updated data
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to create manual match')
      }
    } catch (error) {
      console.error('Failed to create manual match:', error)
      toast.error('Failed to create manual match. Please try again.')
    } finally {
      setIsCreatingManualMatch(false)
    }
  }

  const handleApproveMatch = async () => {
    if (!selectedBankTxnId || !highlightedSuggestionId) return

    const suggestion = matchSuggestions.find(s => s.qboTxnId === highlightedSuggestionId)
    if (!suggestion) return

    setIsApproving(true)
    try {
      const result = await approveMatch(
        workspaceId,
        selectedBankTxnId,
        highlightedSuggestionId,
        suggestion.matchType,
        suggestion.confidence,
        suggestion.reasoning
      )

      if (result.success) {
        toast.success('Match approved successfully')
        // Reset selection state
        setSelectedBankTxnId(null)
        setHighlightedSuggestionId(null)
        setMatchSuggestions([])
        // Refresh the page to get updated data
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve match')
      }
    } catch (error) {
      console.error('Failed to approve match:', error)
      toast.error('Failed to approve match. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  // Show manual match action bar when both bank and QBO transactions are selected
  const showManualMatchBar = selectedBankTxnId && selectedQboTxnId

  return (
    <div className="space-y-3">
      {/* Manual Match Action Bar */}
      {showManualMatchBar && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Link2 className="h-4 w-4" />
            <span>Ready to create manual match between selected transactions</span>
          </div>
          <Button
            onClick={handleCreateManualMatch}
            disabled={isCreatingManualMatch}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingManualMatch ? 'Creating...' : 'Create Match'}
          </Button>
        </div>
      )}

      {/* Hint when bank is selected but QBO is not */}
      {selectedBankTxnId && !selectedQboTxnId && !highlightedSuggestionId && matchSuggestions.length === 0 && !isLoadingSuggestions && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Link2 className="h-4 w-4" />
          <span>Shift+click a QBO transaction to create a manual match</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-250px)]">
      {/* Bank Transactions Panel */}
      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0 border-b py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Bank Transactions</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              {bankTransactions.length} transactions
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {bankTransactions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No bank transactions found.
            </div>
          ) : (
            <div className="divide-y">
              {bankTransactions.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  transaction={txn}
                  isSelected={selectedBankTxnId === txn.id}
                  onClick={() => handleBankTxnClick(txn.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QBO Transactions Panel */}
      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0 border-b py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">QuickBooks Transactions</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              {qboTransactions.length} transactions
              {isLoadingSuggestions && (
                <span className="ml-2 text-xs text-muted-foreground">(analyzing...)</span>
              )}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {qboTransactions.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No QuickBooks transactions found.
            </div>
          ) : (
            <div className="divide-y">
              {qboTransactions.map((txn) => {
                const suggestion = getSuggestionForQbo(txn.id)
                const isHighlighted = highlightedSuggestionId === txn.id
                const isManualSelected = selectedQboTxnId === txn.id
                return (
                  <TransactionRow
                    key={txn.id}
                    transaction={txn}
                    matchSuggestion={suggestion}
                    isSuggestionHighlighted={isHighlighted}
                    isManualSelected={isManualSelected}
                    onClick={suggestion ? () => handleSuggestionClick(txn.id) : undefined}
                    onShiftClick={selectedBankTxnId ? (e) => handleQboTxnClick(txn.id, e) : undefined}
                    onApproveClick={isHighlighted && !isApproving ? handleApproveMatch : undefined}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
