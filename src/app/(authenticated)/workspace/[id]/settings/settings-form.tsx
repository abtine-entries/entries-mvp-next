'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Lock, Unlock, Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { updateAutonomyLevel, toggleConfidenceLock } from './actions'
import type { ConfidenceRecord } from './actions'

const AUTONOMY_OPTIONS = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'Always ask before acting',
    icon: ShieldAlert,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Act on high-confidence, ask on uncertain',
    icon: ShieldCheck,
  },
  {
    value: 'autonomous',
    label: 'Autonomous',
    description: 'Act on most, notify after',
    icon: Shield,
  },
] as const

const TIER_LABELS: Record<number, string> = {
  1: 'Suggest',
  2: 'Act + Notify',
  3: 'Act Silently',
}

const TIER_VARIANTS: Record<number, 'secondary' | 'default' | 'outline'> = {
  1: 'secondary',
  2: 'default',
  3: 'outline',
}

interface SettingsFormProps {
  workspaceId: string
  autonomyLevel: string
  confidences: ConfidenceRecord[]
}

export function SettingsForm({ workspaceId, autonomyLevel, confidences }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleAutonomyChange(value: string) {
    startTransition(async () => {
      const result = await updateAutonomyLevel(workspaceId, value)
      if (result.success) {
        toast.success(`Autonomy level updated to ${value}`)
      } else {
        toast.error(result.error ?? 'Failed to update autonomy level')
      }
    })
  }

  function handleLockToggle(confidence: ConfidenceRecord, checked: boolean) {
    startTransition(async () => {
      const result = await toggleConfidenceLock(confidence.id, checked, workspaceId)
      if (result.success) {
        toast.success(
          checked
            ? `Locked "${confidence.patternKey}" at current tier`
            : `Unlocked "${confidence.patternKey}"`
        )
      } else {
        toast.error(result.error ?? 'Failed to update lock status')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Autonomy Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Autonomy Level</CardTitle>
          <CardDescription>
            Control how much independence Esme has when categorizing transactions and making
            decisions for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={autonomyLevel}
            onValueChange={handleAutonomyChange}
            disabled={isPending}
            className="gap-3"
          >
            {AUTONOMY_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={`autonomy-${option.value}`}
                className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value={option.value} id={`autonomy-${option.value}`} className="mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Category Tier Locks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Confidence Tiers</CardTitle>
          <CardDescription>
            Lock categories to their current tier to prevent Esme from automatically promoting or
            demoting them. Locked categories will always behave at their current confidence level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {confidences.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No category confidence records yet. Esme will build confidence as you categorize
              transactions.
            </p>
          ) : (
            <div className="space-y-1">
              {confidences.map((confidence) => (
                <div
                  key={confidence.id}
                  className="flex items-center justify-between py-3 px-1 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {confidence.patternKey}
                        </span>
                        <Badge variant={TIER_VARIANTS[confidence.tier] ?? 'secondary'} className="text-xs shrink-0">
                          {TIER_LABELS[confidence.tier] ?? `Tier ${confidence.tier}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {confidence.confirmCount} confirmations · {confidence.correctionCount} corrections
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {confidence.isLocked ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Switch
                      size="sm"
                      checked={confidence.isLocked}
                      onCheckedChange={(checked) => handleLockToggle(confidence, checked)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
