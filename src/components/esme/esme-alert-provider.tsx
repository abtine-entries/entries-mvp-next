'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import type { SerializedAlert } from '@/app/(authenticated)/workspace/[id]/esme/types'

interface EsmeAlertContextValue {
  alerts: SerializedAlert[]
  workspaceId: string | null
  removeAlert: (id: string) => void
}

const EsmeAlertContext = createContext<EsmeAlertContextValue>({
  alerts: [],
  workspaceId: null,
  removeAlert: () => {},
})

export function useEsmeAlerts() {
  return useContext(EsmeAlertContext)
}

// ── Seed alerts for demo / experimentation ──────────────────────────
const SEED_ALERTS: SerializedAlert[] = [
  {
    id: 'seed-1',
    type: 'anomaly',
    priority: 'requires_action',
    status: 'active',
    title: 'Duplicate payment detected: $4,250 to Acme Supplies',
    body: 'Invoice #1042 appears to have been paid twice on Jan 28 and Jan 30. The amounts and vendor match exactly.',
    responseType: null,
    responseOptions: null,
    responseValue: null,
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: 'seed-2',
    type: 'ai_question',
    priority: 'requires_action',
    status: 'active',
    title: 'How should I categorize "Stripe Atlas" — SaaS or Legal?',
    body: 'Stripe Atlas charges $500/yr. It bundles incorporation services with payment processing. Previous transactions were split across categories.',
    responseType: 'choice',
    responseOptions: JSON.stringify(['SaaS / Software', 'Legal & Professional', 'Split 50/50']),
    responseValue: null,
    createdAt: new Date(Date.now() - 35 * 60_000).toISOString(),
  },
  {
    id: 'seed-3',
    type: 'anomaly',
    priority: 'requires_action',
    status: 'active',
    title: 'Unusual amount: $18,700 wire to "GreenField Partners"',
    body: 'This vendor typically invoices between $2,000–$5,000/mo. The current charge is 3.7x the historical average.',
    responseType: null,
    responseOptions: null,
    responseValue: null,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: 'seed-4',
    type: 'insight',
    priority: 'fyi',
    status: 'active',
    title: 'Monthly SaaS spend up 23% vs. last quarter',
    body: 'Total SaaS subscriptions rose from $8,420/mo to $10,360/mo. New additions: Linear ($320), Vercel Pro ($200), Notion Teams ($400).',
    responseType: null,
    responseOptions: null,
    responseValue: null,
    createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  },
  {
    id: 'seed-5',
    type: 'system',
    priority: 'fyi',
    status: 'active',
    title: 'Bank sync completed — 47 new transactions imported',
    body: 'Chase Business Checking synced successfully. 47 transactions from Jan 15–Jan 31 have been imported and auto-categorized.',
    responseType: null,
    responseOptions: null,
    responseValue: null,
    createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
  },
  {
    id: 'seed-6',
    type: 'anomaly',
    priority: 'fyi',
    status: 'active',
    title: 'Recurring charge missing: "AWS" expected on the 1st',
    body: 'AWS typically bills on the 1st of each month (~$3,200). No charge has appeared yet for February. This may just be delayed.',
    responseType: null,
    responseOptions: null,
    responseValue: null,
    createdAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
  },
]

interface EsmeAlertProviderProps {
  children: React.ReactNode
  initialAlerts: Record<string, SerializedAlert[]>
}

export function EsmeAlertProvider({
  children,
  initialAlerts,
}: EsmeAlertProviderProps) {
  const [alertsByWorkspace, setAlertsByWorkspace] =
    useState<Record<string, SerializedAlert[]>>(initialAlerts)

  const removeAlert = useCallback((id: string) => {
    setAlertsByWorkspace((prev) => {
      const next: Record<string, SerializedAlert[]> = {}
      for (const [wsId, alerts] of Object.entries(prev)) {
        next[wsId] = alerts.filter((a) => a.id !== id)
      }
      return next
    })
    // Also remove from the seed set so dismissed seeds stay gone
    dismissedSeedIds.add(id)
  }, [])

  return (
    <EsmeAlertInternalProvider
      alertsByWorkspace={alertsByWorkspace}
      removeAlert={removeAlert}
    >
      {children}
    </EsmeAlertInternalProvider>
  )
}

// Track dismissed seed IDs at module level so they persist across re-renders
const dismissedSeedIds = new Set<string>()

/**
 * Inner provider that resolves the current workspace from the URL
 * and exposes only the relevant alerts. Seeds are injected here
 * so they appear for any workspace, even those with 0 DB alerts.
 */
function EsmeAlertInternalProvider({
  children,
  alertsByWorkspace,
  removeAlert,
}: {
  children: React.ReactNode
  alertsByWorkspace: Record<string, SerializedAlert[]>
  removeAlert: (id: string) => void
}) {
  const pathname = usePathname()
  const workspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1] ?? null

  const alerts = useMemo(() => {
    if (!workspaceId) return []
    const dbAlerts = alertsByWorkspace[workspaceId] ?? []
    const activeSeeds = SEED_ALERTS.filter((s) => !dismissedSeedIds.has(s.id))
    return [...activeSeeds, ...dbAlerts]
  }, [workspaceId, alertsByWorkspace])

  return (
    <EsmeAlertContext.Provider value={{ alerts, workspaceId, removeAlert }}>
      {children}
    </EsmeAlertContext.Provider>
  )
}
