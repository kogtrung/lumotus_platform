import axiosClient from '@/api/axiosClient'
import type {
  Card,
  CreateCardPayload,
  CreateDeckPayload,
  DeckListParams,
  DeckSummary,
  PageResponse,
  UpdateCardPayload,
  UpdateDeckPayload,
} from '@/types/deck'

export const decksApi = {
  list: (params: DeckListParams = {}) =>
    axiosClient.get<PageResponse<DeckSummary>>('/decks', { params }),

  get: (deckRef: string) => axiosClient.get<DeckSummary>(`/decks/${deckRef}`),

  create: (payload: CreateDeckPayload) => axiosClient.post<DeckSummary>('/decks', payload),

  update: (deckRef: string, payload: UpdateDeckPayload) =>
    axiosClient.put<DeckSummary>(`/decks/${deckRef}`, payload),

  remove: (deckRef: string) => axiosClient.delete(`/decks/${deckRef}`),

  copy: (deckRef: string) => axiosClient.post<DeckSummary>(`/decks/${deckRef}/copy`),

  listCards: (deckRef: string, page = 0, size = 50) =>
    axiosClient.get<PageResponse<Card>>(`/decks/${deckRef}/cards`, { params: { page, size } }),

  addCard: (deckRef: string, payload: CreateCardPayload) =>
    axiosClient.post<Card>(`/decks/${deckRef}/cards`, payload),

  updateCard: (deckRef: string, cardId: string, payload: UpdateCardPayload) =>
    axiosClient.put<Card>(`/decks/${deckRef}/cards/${cardId}`, payload),

  deleteCard: (deckRef: string, cardId: string) =>
    axiosClient.delete(`/decks/${deckRef}/cards/${cardId}`),
}
