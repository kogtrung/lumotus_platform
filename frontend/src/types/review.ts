export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

export interface DueCard {
  cardId: string
  deckId: string
  front: string
  back: string
  phonetic: string | null
  example: string | null
  hint: string | null
  imageUrl: string | null
  audioUrl: string | null
  isNew: boolean
  isStarred: boolean
  repetitions: number | null
  intervalDays: number | null
  nextReviewAt: string | null
}

export interface DueCardsResponse {
  deckId: string | null
  dueCount: number
  cards: DueCard[]
}

export interface RateReviewResponse {
  cardId: string
  repetitions: number
  easeFactor: number
  intervalDays: number
  nextReviewAt: string
  xpEarned: number
}

export interface StarReviewResponse {
  cardId: string
  starred: boolean
}
