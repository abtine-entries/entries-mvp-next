'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PlatformSelector } from '@/components/gl-import/platform-selector'
import { CSVDropZone } from '@/components/gl-import/csv-drop-zone'
import { ImportPreview } from '@/components/gl-import/import-preview'
import { parseGLCSV } from '@/components/gl-import/parse-csv'
import { generateDemoData } from '@/components/gl-import/demo-data'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import { createWorkspace } from '@/app/(authenticated)/actions'
import { importGLData } from '@/app/(authenticated)/workspace/[id]/connectors/actions'
import type { Platform, ParsedGLData } from '@/components/gl-import/types'
import Link from 'next/link'
import {
  Building2,
  Layers,
  Users,
  ArrowRightLeft,
  FileSpreadsheet,
  X,
} from 'lucide-react'

type Step = 'name' | 'platform' | 'upload'

const STEPS: Step[] = ['name', 'platform', 'upload']

const STEP_LABELS: Record<Step, string> = {
  name: 'Client Name',
  platform: 'Platform',
  upload: 'Import GL',
}

const PLATFORM_NAMES: Record<Platform, string> = {
  qbo: 'QuickBooks Online',
  xero: 'Xero',
}

const PLATFORM_CONNECTORS: Record<Platform, 'quickbooks' | 'xero'> = {
  qbo: 'quickbooks',
  xero: 'xero',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [parsedData, setParsedData] = useState<ParsedGLData | null>(null)
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const currentStepIndex = STEPS.indexOf(step)

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Client name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createWorkspace(trimmedName)
      if (result.success && result.workspaceId) {
        setWorkspaceId(result.workspaceId)
        setStep('platform')
      } else {
        setError(result.error || 'Failed to create workspace')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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

      if (data.transactions.length === 0) {
        data = generateDemoData(platform)
      }

      setParsedData(data)
      setFileName(name)
    },
    [platform]
  )

  const handleImport = useCallback(async () => {
    if (!parsedData || !platform || !workspaceId) return

    setIsImporting(true)
    try {
      const result = await importGLData(workspaceId, parsedData, fileName, platform)
      if (result.success) {
        toast.success(
          `Imported ${result.transactionCount} transactions, ${result.categoryCount} accounts, ${result.vendorCount} vendors`
        )
        router.push(`/workspace/${workspaceId}/event-feed`)
      } else {
        toast.error(result.error || 'Import failed')
      }
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }, [parsedData, platform, workspaceId, fileName, router])

  const handlePreviewBack = useCallback(() => {
    setParsedData(null)
    setFileName('')
  }, [])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left panel — form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <Image
              src="/entries-icon.png"
              alt="Entries"
              width={24}
              height={24}
              className="size-6 rounded-lg"
              priority
              unoptimized
            />
            Entries
          </a>
          <Link
            href="/"
            className="ml-auto flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
            <span className="sr-only">Cancel</span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 md:justify-start">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                <span
                  className={`text-xs transition-colors ${
                    i === currentStepIndex
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form content — vertically centered */}
        <div className="flex flex-1 items-center justify-center">
          <div className={`w-full ${step === 'upload' ? 'max-w-xl' : 'max-w-sm'}`}>
            {/* Step 1: Name */}
            {step === 'name' && (
              <form onSubmit={handleNameSubmit}>
                <h1 className="text-lg font-semibold mb-1">Add a new client</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Create a workspace for your client to get started.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="name">Client Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter client name"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Continue'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Platform */}
            {step === 'platform' && (
              <>
                <h1 className="text-lg font-semibold mb-1">Select platform</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Which accounting platform does this client use?
                </p>
                <PlatformSelector onSelect={handlePlatformSelect} />
              </>
            )}

            {/* Step 3: Upload & Preview */}
            {step === 'upload' && !parsedData && (
              <>
                <h1 className="text-lg font-semibold mb-1">
                  Import General Ledger
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Upload a{' '}
                  {platform === 'qbo' ? 'QuickBooks Online' : 'Xero'} General
                  Ledger CSV export to seed the workspace.
                </p>
                <CSVDropZone
                  onFileLoaded={handleFileLoaded}
                  disabled={isImporting}
                />
              </>
            )}

            {step === 'upload' && parsedData && (
              <ImportPreview
                data={parsedData}
                fileName={fileName}
                onImport={handleImport}
                onBack={handlePreviewBack}
                isImporting={isImporting}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right panel — live preview (hidden on mobile) */}
      <div className="bg-muted relative hidden lg:flex items-center justify-center p-10">
        <PreviewCard
          name={name}
          step={step}
          platform={platform}
          parsedData={parsedData}
        />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Preview Card — purely visual, reads state
   ────────────────────────────────────────────── */

function PreviewCard({
  name,
  step,
  platform,
  parsedData,
}: {
  name: string
  step: Step
  platform: Platform | null
  parsedData: ParsedGLData | null
}) {
  const displayName = name.trim() || 'Client Name'
  const hasName = name.trim().length > 0
  const hasPlatform = platform !== null
  const hasData = parsedData !== null

  return (
    <div className="w-full max-w-sm">
      {/* Mock workspace card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
        {/* Header with logo + name */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            {hasPlatform ? (
              <ConnectorLogo
                connector={PLATFORM_CONNECTORS[platform!]}
                size="sm"
              />
            ) : (
              <Building2 className="size-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold truncate transition-colors ${
                hasName ? 'text-foreground' : 'text-muted-foreground/40'
              }`}
            >
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {hasPlatform ? PLATFORM_NAMES[platform!] : 'Accounting platform'}
            </p>
          </div>
        </div>

        {/* Placeholder rows */}
        <div className="space-y-3">
          <PreviewRow
            icon={<ArrowRightLeft className="size-4" />}
            label="Transactions"
            value={hasData ? parsedData!.transactions.length : undefined}
            active={step === 'upload' && hasData}
          />
          <PreviewRow
            icon={<Layers className="size-4" />}
            label="Accounts"
            value={hasData ? parsedData!.categories.length : undefined}
            active={step === 'upload' && hasData}
          />
          <PreviewRow
            icon={<Users className="size-4" />}
            label="Vendors"
            value={hasData ? parsedData!.vendors.length : undefined}
            active={step === 'upload' && hasData}
          />
          <PreviewRow
            icon={<FileSpreadsheet className="size-4" />}
            label="Source file"
            text={hasData ? 'CSV imported' : undefined}
            active={step === 'upload' && hasData}
          />
        </div>
      </div>
    </div>
  )
}

function PreviewRow({
  icon,
  label,
  value,
  text,
  active,
}: {
  icon: React.ReactNode
  label: string
  value?: number
  text?: string
  active: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-8 items-center justify-center rounded-md transition-colors ${
          active
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground/40'
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-sm flex-1 transition-colors ${
          active ? 'text-foreground' : 'text-muted-foreground/40'
        }`}
      >
        {label}
      </span>
      {active && value !== undefined && (
        <Badge variant="secondary" className="tabular-nums">
          {value}
        </Badge>
      )}
      {active && text && (
        <span className="text-xs text-muted-foreground">{text}</span>
      )}
      {!active && (
        <div className="h-2 w-10 rounded-full bg-muted-foreground/10" />
      )}
    </div>
  )
}
