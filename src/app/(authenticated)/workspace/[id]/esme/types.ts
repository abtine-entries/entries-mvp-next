export interface SerializedAlert {
  id: string
  type: string
  priority: string
  status: string
  title: string
  body: string
  responseType: string | null
  responseOptions: string | null
  responseValue: string | null
  createdAt: string
}

export interface TextBlock {
  type: 'text'
  id: string
  content: string
  createdAt: string
}

export interface AlertBlock {
  type: 'alert'
  id: string
  content: string
  alert: SerializedAlert
  createdAt: string
}

export interface BriefingBlock {
  type: 'briefing'
  id: string
  content: string
  greeting: string
  summary: string
  stats: { label: string; value: string; icon: string }[]
  createdAt: string
}

export interface InsightBlock {
  type: 'insight'
  id: string
  content: string
  data?: { label: string; value: string }[]
  createdAt: string
}

export interface ActionBlock {
  type: 'action'
  id: string
  content: string
  actionType: string
  actionData?: Record<string, string>
  actionStatus: 'pending' | 'completed' | 'dismissed'
  createdAt: string
}

export interface UserMessageBlock {
  type: 'user_message'
  id: string
  content: string
  createdAt: string
}

export type CanvasBlock =
  | TextBlock
  | AlertBlock
  | BriefingBlock
  | InsightBlock
  | ActionBlock
  | UserMessageBlock
