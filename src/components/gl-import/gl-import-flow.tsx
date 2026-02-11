'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { PlatformSelector } from './platform-selector'
import { CSVDropZone } from './csv-drop-zone'
import { ImportPreview } from './import-preview'
import { parseGLCSV } from './parse-csv'
import { importGLData } from '@/app/(authenticated)/workspace/[id]/connectors/actions'
import { generateDemoData } from './demo-data'
import type { Platform, ParsedGLData } from './types'

type Step = 'platform' | 'upload' | 'preview'

interface GLImportFlowProps {
  workspaceId: string
  /** Pre-selected platform (skips platform step) */
  initialPlatform?: Platform
  onComplete?: () => void
  onSkip?: () => void
  /** Whether to show the skip link on platform step */
  showSkip?: boolean
}

export function GLImportFlow({
  workspaceId,
  initialPlatform,
  onComplete,
  onSkip,
  showSkip = false,
}: GLImportFlowProps) {
  const [step, setStep] = useState<Step>(initialPlatform ? 'upload' : 'platform')
  const [platform, setPlatform] = useState<Platform | null>(initialPlatform ?? null)
  const [parsedData, setParsedData] = useState<ParsedGLData | null>(null)
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const handlePlatformSelect = useCallback((p: Platform) => {
    setPlatform(p)
    setStep('upload')
  }, [])

  const handleFileLoaded = useCallback(
    (text: string, name: string) => {
      if (!platform) return

      let data: ParsedGLData
      try {
        data = parseGLCSV(text, platform)
      } catch {
        data = { transactions: [], categories: [], vendors: [] }
      }

      // Fall back to demo data if parsing finds nothing
      if (data.transactions.length === 0) {
        data = generateDemoData(platform)
      }

      setParsedData(data)
      setFileName(name)
      setStep('preview')
    },
    [platform]
  )

  const handleBack = useCallback(() => {
    if (step === 'preview') {
      setParsedData(null)
      setFileName('')
      setStep('upload')
    } else if (step === 'upload') {
      setPlatform(null)
      setStep('platform')
    }
  }, [step])

  const handleImport = useCallback(async () => {
    if (!parsedData || !platform) return

    setIsImporting(true)
    try {
      const result = await importGLData(workspaceId, parsedData, fileName, platform)
      if (result.success) {
        toast.success(
          `Imported ${result.transactionCount} transactions, ${result.categoryCount} accounts, ${result.vendorCount} vendors`
        )
        onComplete?.()
      } else {
        toast.error(result.error || 'Import failed')
      }
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }, [parsedData, platform, workspaceId, fileName, onComplete])

  return (
    <div>
      {step === 'platform' && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-medium">Select Platform</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Which accounting platform is this General Ledger export from?
            </p>
          </div>
          <PlatformSelector onSelect={handlePlatformSelect} onSkip={showSkip ? onSkip : undefined} />
        </>
      )}

      {step === 'upload' && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-medium">Upload General Ledger</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your {platform === 'qbo' ? 'QuickBooks Online' : 'Xero'} General Ledger CSV export.
            </p>
          </div>
          <CSVDropZone onFileLoaded={handleFileLoaded} disabled={isImporting} />
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          </div>
        </>
      )}

      {step === 'preview' && parsedData && (
        <ImportPreview
          data={parsedData}
          fileName={fileName}
          onImport={handleImport}
          onBack={handleBack}
          isImporting={isImporting}
        />
      )}
    </div>
  )
}
