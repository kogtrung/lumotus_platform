export interface Topic {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  colorHex: string | null
  sortOrder: number
}

export interface DeckSummary {
  id: string
  slug: string
  title: string
  description: string | null
  coverImageUrl: string | null
  ownerId: string
  ownerType: string
  isPublic: boolean
  isCopyable: boolean
  languageFront: string
  languageBack: string
  viewCount: number
  copyCount: number
  cardCount: number
  topics: Topic[]
  createdAt: string
  updatedAt: string
}

export interface Card {
  id: string
  deckId: string
  front: string
  back: string
  phonetic: string | null
  partOfSpeech: string | null
  hint: string | null
  example: string | null
  imageUrl: string | null
  icon: string | null
  audioUrl: string | null
  difficulty: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CreateDeckPayload {
  title: string
  slug?: string
  description?: string
  coverImageUrl?: string
  isPublic?: boolean
  isCopyable?: boolean
  languageFront?: string
  languageBack?: string
  topicIds?: string[]
}

export interface UpdateDeckPayload {
  title?: string
  slug?: string
  description?: string
  coverImageUrl?: string
  isPublic?: boolean
  isCopyable?: boolean
  languageFront?: string
  languageBack?: string
  topicIds?: string[]
}

export interface CreateCardPayload {
  front: string
  back: string
  phonetic?: string
  partOfSpeech?: string
  hint?: string
  example?: string
  imageUrl?: string
  icon?: string
  audioUrl?: string
  difficulty?: string
  sortOrder?: number
}

export type UpdateCardPayload = Partial<CreateCardPayload>

export interface DeckListParams {
  page?: number
  size?: number
  q?: string
  topicSlug?: string
  mine?: boolean
}
