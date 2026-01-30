'use client'

import { useRef, useState, useTransition, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadDocument } from './actions'

const ACCEPTED_TYPES = '.pdf,.csv,.png,.jpg,.jpeg'
const ACCEPTED_EXTENSIONS = ['pdf', 'csv', 'png', 'jpg', 'jpeg']

interface DocumentUploadProps {
  workspaceId: string
}

export function DocumentUpload({ workspaceId }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() || ''

        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
          toast.error(`Unsupported file type: .${ext}`)
          continue
        }

        startTransition(async () => {
          const result = await uploadDocument(
            workspaceId,
            file.name,
            '',
            file.size
          )
          if (result.success) {
            toast.success(`Uploaded: ${file.name}`)
          } else {
            toast.error(result.error || 'Upload failed')
          }
        })
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [workspaceId]
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
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles]
  )

  return (
    <Card
      className={`bg-card border-dashed transition-colors ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Upload className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <h3 className="font-medium mb-2">
          {isDragging ? 'Drop files here' : 'Drop files here to upload'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Supported formats: PDF, CSV, PNG, JPG. Max file size: 10MB.
        </p>
        <Button variant="outline" onClick={handleBrowse} disabled={isPending}>
          {isPending ? 'Uploading...' : 'Browse files'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  )
}
