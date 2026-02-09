'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateEventProperty } from './actions'
import { PropertySchemaModal } from './property-schema-modal'

interface PropertyDefinition {
  id: string
  name: string
  type: string
  options: string | null
  position: number
}

interface PropertyValue {
  id: string
  definitionId: string
  value: string
}

interface PropertiesSectionProps {
  workspaceId: string
  eventId: string
  definitions: PropertyDefinition[]
  properties: PropertyValue[]
  flat?: boolean
}

export function PropertiesSection({
  workspaceId,
  eventId,
  definitions,
  properties,
  flat,
}: PropertiesSectionProps) {
  const [localValues, setLocalValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const prop of properties) {
      map[prop.definitionId] = prop.value
    }
    return map
  })
  const [schemaModalOpen, setSchemaModalOpen] = useState(false)

  const sortedDefinitions = [...definitions].sort((a, b) => a.position - b.position)

  const content = sortedDefinitions.length === 0 ? (
    <p className="text-sm text-muted-foreground">No properties defined.</p>
  ) : (
    <div className="space-y-4">
      {sortedDefinitions.map((def) => (
        <PropertyRow
          key={def.id}
          definition={def}
          value={localValues[def.id] ?? ''}
          workspaceId={workspaceId}
          eventId={eventId}
          onValueChange={(val) =>
            setLocalValues((prev) => ({ ...prev, [def.id]: val }))
          }
        />
      ))}
    </div>
  )

  if (flat) {
    return (
      <div className="pt-4 mt-4 border-t border-border">
        <PropertySchemaModal
          open={schemaModalOpen}
          onOpenChange={setSchemaModalOpen}
          workspaceId={workspaceId}
          definitions={definitions}
        />
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Properties
          </h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSchemaModalOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
        {content}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Properties
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSchemaModalOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <PropertySchemaModal
        open={schemaModalOpen}
        onOpenChange={setSchemaModalOpen}
        workspaceId={workspaceId}
        definitions={definitions}
      />
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}

interface PropertyRowProps {
  definition: PropertyDefinition
  value: string
  workspaceId: string
  eventId: string
  onValueChange: (value: string) => void
}

function PropertyRow({
  definition,
  value,
  workspaceId,
  eventId,
  onValueChange,
}: PropertyRowProps) {
  const [isPending, startTransition] = useTransition()

  const handleSave = (newValue: string) => {
    onValueChange(newValue)
    startTransition(async () => {
      await updateEventProperty(workspaceId, eventId, definition.id, newValue)
    })
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm font-medium shrink-0 min-w-[120px]">
        {definition.name}
      </label>
      <div className="flex-1 max-w-[300px]">
        <PropertyInput
          type={definition.type}
          options={definition.options}
          value={value}
          onSave={handleSave}
          isPending={isPending}
        />
      </div>
    </div>
  )
}

interface PropertyInputProps {
  type: string
  options: string | null
  value: string
  onSave: (value: string) => void
  isPending: boolean
}

function PropertyInput({ type, options, value, onSave, isPending }: PropertyInputProps) {
  switch (type) {
    case 'text':
      return (
        <TextPropertyInput value={value} onSave={onSave} isPending={isPending} />
      )
    case 'number':
      return (
        <NumberPropertyInput value={value} onSave={onSave} isPending={isPending} />
      )
    case 'boolean':
      return (
        <BooleanPropertyInput value={value} onSave={onSave} isPending={isPending} />
      )
    case 'date':
      return (
        <DatePropertyInput value={value} onSave={onSave} isPending={isPending} />
      )
    case 'select':
      return (
        <SelectPropertyInput
          value={value}
          options={options}
          onSave={onSave}
          isPending={isPending}
        />
      )
    default:
      return <span className="text-sm text-muted-foreground">Empty</span>
  }
}

function TextPropertyInput({
  value,
  onSave,
  isPending,
}: {
  value: string
  onSave: (v: string) => void
  isPending: boolean
}) {
  const [localVal, setLocalVal] = useState(value ? parseJsonString(value) : '')

  return (
    <Input
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => {
        const jsonVal = JSON.stringify(localVal)
        if (jsonVal !== value) {
          onSave(jsonVal)
        }
      }}
      placeholder="Empty"
      disabled={isPending}
      className="h-8 text-sm"
    />
  )
}

function NumberPropertyInput({
  value,
  onSave,
  isPending,
}: {
  value: string
  onSave: (v: string) => void
  isPending: boolean
}) {
  const parsed = value ? parseJsonNumber(value) : ''
  const [localVal, setLocalVal] = useState(String(parsed))

  return (
    <Input
      type="number"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => {
        const num = localVal === '' ? '' : Number(localVal)
        const jsonVal = num === '' ? '' : JSON.stringify(num)
        if (jsonVal !== value) {
          onSave(jsonVal)
        }
      }}
      placeholder="Empty"
      disabled={isPending}
      className="h-8 text-sm"
    />
  )
}

function BooleanPropertyInput({
  value,
  onSave,
  isPending,
}: {
  value: string
  onSave: (v: string) => void
  isPending: boolean
}) {
  const checked = value === 'true'

  return (
    <Switch
      checked={checked}
      onCheckedChange={(newChecked) => {
        onSave(String(newChecked))
      }}
      disabled={isPending}
      size="sm"
    />
  )
}

function DatePropertyInput({
  value,
  onSave,
  isPending,
}: {
  value: string
  onSave: (v: string) => void
  isPending: boolean
}) {
  const parsed = value ? parseJsonString(value) : ''
  const [localVal, setLocalVal] = useState(parsed)

  return (
    <Input
      type="date"
      value={localVal}
      onChange={(e) => {
        setLocalVal(e.target.value)
        const jsonVal = JSON.stringify(e.target.value)
        if (jsonVal !== value) {
          onSave(jsonVal)
        }
      }}
      disabled={isPending}
      className="h-8 text-sm"
    />
  )
}

function SelectPropertyInput({
  value,
  options,
  onSave,
  isPending,
}: {
  value: string
  options: string | null
  onSave: (v: string) => void
  isPending: boolean
}) {
  const parsed = value ? parseJsonString(value) : ''
  let selectOptions: string[] = []
  try {
    if (options) {
      selectOptions = JSON.parse(options)
    }
  } catch {
    // ignore parse errors
  }

  return (
    <Select
      value={parsed}
      onValueChange={(newVal) => {
        const jsonVal = JSON.stringify(newVal)
        if (jsonVal !== value) {
          onSave(jsonVal)
        }
      }}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Empty" />
      </SelectTrigger>
      <SelectContent>
        {selectOptions.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Parse a JSON-encoded string value, e.g. '"hello"' -> 'hello' */
function parseJsonString(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr)
    return typeof parsed === 'string' ? parsed : String(parsed)
  } catch {
    return jsonStr
  }
}

/** Parse a JSON-encoded number value, e.g. '42' -> 42 */
function parseJsonNumber(jsonStr: string): number | '' {
  try {
    const parsed = JSON.parse(jsonStr)
    return typeof parsed === 'number' ? parsed : ''
  } catch {
    return ''
  }
}
