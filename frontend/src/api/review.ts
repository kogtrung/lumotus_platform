import axiosClient from '@/api/axiosClient'
import type {
  DueCardsResponse,
  RateReviewResponse,
  ReviewRating,
  StarReviewResponse,
} from '@/types/review'

export interface DeckProgressResponse {
  deckId: string
  totalCards: number
  learnedCards: number
  masteredCards: number
}

export const reviewApi = {
  getDue(params?: { deckRef?: string; deckId?: string; limit?: number; starredOnly?: boolean }) {
    return axiosClient.get<DueCardsResponse>('/flashcards/due', { params })
  },
  getDueCount(params?: { deckRef?: string; deckId?: string; starredOnly?: boolean }) {
    return axiosClient.get<number>('/flashcards/due-count', { params })
  },
  getDeckProgress(params: { deckRef?: string; deckId?: string }) {
    return axiosClient.get<DeckProgressResponse>('/flashcards/progress', { params })
  },

  rate(cardId: string, rating: ReviewRating) {
    return axiosClient.post<RateReviewResponse>(`/flashcards/${cardId}/rate`, { rating })
  },

  star(cardId: string, starred?: boolean) {
    return axiosClient.post<StarReviewResponse>(`/flashcards/${cardId}/star`, starred != null ? { starred } : {})
  },
}
