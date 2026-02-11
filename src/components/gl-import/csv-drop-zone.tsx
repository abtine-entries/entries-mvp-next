'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

interface CSVDropZoneProps {
  onFileLoaded: (text: string, fileName: string) => void
  disabled?: boolean
}

export function CSVDropZone({ onFileLoaded, disabled }: CSVDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'csv') {
        toast.error('Please upload a CSV file')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (text) {
          onFileLoaded(text, file.name)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read file')
      }
      reader.readAsText(file)
    },
    [onFileLoaded]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [handleFile]
  )

  return (
    <div
      className={`rounded-lg border border-dashed transition-colors ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Upload className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <h3 className="font-medium mb-2">
          {isDragging ? 'Drop CSV here' : 'Drop your General Ledger CSV here'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Export from your accounting platform and drop the CSV file here.
        </p>
        <Button variant="outline" onClick={handleBrowse} disabled={disabled}>
          Browse files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
