import axiosClient from '@/api/axiosClient'
import type {
  DueCardsResponse,
  RateReviewResponse,
  ReviewRating,
  StarReviewResponse,
} from '@/types/review'

export const reviewApi = {
  getDue(params?: { deckRef?: string; deckId?: string; limit?: number; starredOnly?: boolean }) {
    return axiosClient.get<DueCardsResponse>('/review/due', { params })
  },

  rate(cardId: string, rating: ReviewRating) {
    return axiosClient.post<RateReviewResponse>(`/review/${cardId}/rate`, { rating })
  },

  star(cardId: string, starred?: boolean) {
    return axiosClient.post<StarReviewResponse>(`/review/${cardId}/star`, starred != null ? { starred } : {})
  },
}
