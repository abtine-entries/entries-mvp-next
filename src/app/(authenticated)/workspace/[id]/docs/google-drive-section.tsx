'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConnectorLogo } from '@/components/ui/connector-logo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  Check,
  Cloud,
  FolderOpen,
  RefreshCw,
  MoreHorizontal,
  FileText,
  FileSpreadsheet,
  FileImage,
  Unplug,
  ChevronRight,
} from 'lucide-react'

// --- Types ---

interface SyncedFolder {
  id: string
  name: string
  path: string
  lastSynced: Date
  fileCount: number
}

interface SyncedFile {
  id: string
  name: string
  type: 'document' | 'spreadsheet' | 'image' | 'pdf'
  lastModified: Date
  size: string
}

type DriveState =
  | { status: 'disconnected' }
  | { status: 'connected'; folder: null }
  | { status: 'connected'; folder: SyncedFolder }

// --- Mock data ---

const MOCK_FOLDERS = [
  { id: 'f1', name: 'Accounting 2024', path: '/Accounting 2024' },
  { id: 'f2', name: 'Receipts', path: '/Accounting 2024/Receipts' },
  { id: 'f3', name: 'Invoices', path: '/Accounting 2024/Invoices' },
  { id: 'f4', name: 'Tax Documents', path: '/Tax Documents' },
  { id: 'f5', name: 'Client Contracts', path: '/Client Contracts' },
]

const MOCK_SYNCED_FILES: SyncedFile[] = [
  { id: 'sf1', name: 'Q4 2024 P&L Statement.pdf', type: 'pdf', lastModified: new Date('2024-01-15T09:30:00'), size: '342 KB' },
  { id: 'sf2', name: 'January Expense Report.xlsx', type: 'spreadsheet', lastModified: new Date('2024-01-18T14:20:00'), size: '128 KB' },
  { id: 'sf3', name: 'Vendor Invoice #4521.pdf', type: 'pdf', lastModified: new Date('2024-01-19T11:00:00'), size: '89 KB' },
  { id: 'sf4', name: 'Office Lease Agreement.pdf', type: 'document', lastModified: new Date('2024-01-10T16:45:00'), size: '1.2 MB' },
  { id: 'sf5', name: 'Receipt - Amazon Business.png', type: 'image', lastModified: new Date('2024-01-20T08:15:00'), size: '456 KB' },
]

// --- Helpers ---

function getFileIcon(type: SyncedFile['type']) {
  switch (type) {
    case 'spreadsheet':
      return <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
    case 'image':
      return <FileImage className="h-4 w-4 text-muted-foreground" />
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return formatDate(date)
}

// --- Sub-components ---

function DriveActionsDropdown({
  onChangeFolder,
  onDisconnect,
}: {
  onChangeFolder?: () => void
  onDisconnect: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onChangeFolder && (
          <>
            <DropdownMenuItem onClick={onChangeFolder}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Change Folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem className="text-destructive" onClick={onDisconnect}>
          <Unplug className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// --- Main component ---

export function GoogleDriveSection() {
  const [driveState, setDriveState] = useState<DriveState>({ status: 'disconnected' })
  const [folderPickerOpen, setFolderPickerOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  function handleConnect() {
    setIsConnecting(true)
    setTimeout(() => {
      setDriveState({ status: 'connected', folder: null })
      setIsConnecting(false)
    }, 800)
  }

  function handleSelectFolder(folder: (typeof MOCK_FOLDERS)[number]) {
    setDriveState({
      status: 'connected',
      folder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        lastSynced: new Date(),
        fileCount: MOCK_SYNCED_FILES.length,
      },
    })
    setFolderPickerOpen(false)
  }

  function handleSyncNow() {
    setIsSyncing(true)
    setTimeout(() => {
      if (driveState.status === 'connected' && driveState.folder) {
        setDriveState({
          ...driveState,
          folder: { ...driveState.folder, lastSynced: new Date() },
        })
      }
      setIsSyncing(false)
    }, 1500)
  }

  function handleDisconnect() {
    setDriveState({ status: 'disconnected' })
  }

  // --- Disconnected ---
  if (driveState.status === 'disconnected') {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <ConnectorLogo connector="google_drive" size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Google Drive</p>
              <p className="text-sm text-muted-foreground">
                Connect your Google Drive to sync documents from a folder automatically.
              </p>
            </div>
            <Button onClick={handleConnect} disabled={isConnecting}>
              <Cloud className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- Connected, no folder ---
  if (driveState.folder === null) {
    return (
      <>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <ConnectorLogo connector="google_drive" size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Google Drive</p>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 dark:bg-green-500/20 dark:text-green-400">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select a folder to start syncing documents.
                </p>
              </div>
              <Button variant="outline" onClick={() => setFolderPickerOpen(true)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Select Folder
              </Button>
              <DriveActionsDropdown onDisconnect={handleDisconnect} />
            </div>
          </CardContent>
        </Card>

        <FolderPickerDialog
          open={folderPickerOpen}
          onOpenChange={setFolderPickerOpen}
          onSelect={handleSelectFolder}
        />
      </>
    )
  }

  // --- Connected with folder ---
  const { folder } = driveState

  return (
    <>
      <Card className="bg-card border-border">
        <CardContent className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <ConnectorLogo connector="google_drive" size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Google Drive</p>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 dark:bg-green-500/20 dark:text-green-400">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FolderOpen className="h-3 w-3 shrink-0" />
                <span className="truncate">{folder.path}</span>
                <span className="shrink-0">&middot; {folder.fileCount} files &middot; Last synced {formatRelativeTime(folder.lastSynced)}</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={isSyncing}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')} />
              Sync Now
            </Button>
            <DriveActionsDropdown
              onChangeFolder={() => setFolderPickerOpen(true)}
              onDisconnect={handleDisconnect}
            />
          </div>
        </CardContent>

        {/* Synced files list */}
        <div className="mt-4 border-t border-border">
          <div className="divide-y divide-border">
            {MOCK_SYNCED_FILES.map((file) => (
              <div key={file.id} className="flex items-center gap-3 px-6 py-2.5">
                <div className="shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{file.size}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(file.lastModified)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <FolderPickerDialog
        open={folderPickerOpen}
        onOpenChange={setFolderPickerOpen}
        onSelect={handleSelectFolder}
      />
    </>
  )
}

// --- Folder picker dialog ---

function FolderPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (folder: (typeof MOCK_FOLDERS)[number]) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Google Drive folder</DialogTitle>
          <DialogDescription>
            Choose a folder to sync documents from.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-border border border-border rounded-md">
          {MOCK_FOLDERS.map((folder) => (
            <button
              key={folder.id}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
              onClick={() => onSelect(folder)}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{folder.name}</p>
                <p className="text-xs text-muted-foreground">{folder.path}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
