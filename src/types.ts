export type ContentType = 'voice' | 'photo' | 'quote' | 'fact'

export interface ContentItem {
  id: string
  type: ContentType
  label: string
  source: string
  detail?: string
  created_at?: string
  meta?: {
    uploaded?: boolean
  }
}

