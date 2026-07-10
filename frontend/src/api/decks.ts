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

export interface ImportDeckResponse {
  deck: DeckSummary
  addedCount: number
  updatedCount: number
  skippedCount: number
  errors: string[]
}

export const decksApi = {
  list: (params: DeckListParams = {}) =>
    axiosClient.get<PageResponse<DeckSummary>>('/decks', { params }),

  get: (deckRef: string) => axiosClient.get<DeckSummary>(`/decks/${deckRef}`),

  create: (payload: CreateDeckPayload) => axiosClient.post<DeckSummary>('/decks', payload),

  update: (deckRef: string, payload: UpdateDeckPayload) =>
    axiosClient.put<DeckSummary>(`/decks/${deckRef}`, payload),

  remove: (deckRef: string) => axiosClient.delete(`/decks/${deckRef}`),

  copy: (deckRef: string) => axiosClient.post<DeckSummary>(`/decks/${deckRef}/copy`),

  listCards: (
    deckRef: string,
    params: { page?: number; size?: number; q?: string } = {},
  ) =>
    axiosClient.get<PageResponse<Card>>(`/decks/${deckRef}/cards`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
        q: params.q || undefined,
      },
    }),

  addCard: (deckRef: string, payload: CreateCardPayload) =>
    axiosClient.post<Card>(`/decks/${deckRef}/cards`, payload),

  updateCard: (deckRef: string, cardId: string, payload: UpdateCardPayload) =>
    axiosClient.put<Card>(`/decks/${deckRef}/cards/${cardId}`, payload),

  deleteCard: (deckRef: string, cardId: string) =>
    axiosClient.delete(`/decks/${deckRef}/cards/${cardId}`),

  importCsv: (file: File, options?: { title?: string; deckRef?: string; topicIds?: string[] }) => {
    const form = new FormData()
    form.append('file', file)
    if (options?.title) form.append('title', options.title)
    if (options?.deckRef) form.append('deckRef', options.deckRef)
    return axiosClient.post<ImportDeckResponse>('/decks/import', form, {
      params: {
        topicIds: options?.topicIds && options.topicIds.length > 0 ? options.topicIds : undefined,
      },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  submitForApproval: (deckRef: string, payload?: { description?: string; topicIds?: string[]; requestedTopic?: string }) =>
    axiosClient.post<DeckSummary>(`/decks/${deckRef}/submit-for-approval`, payload),

  approveDeck: (deckRef: string, options?: { note?: string; topicIds?: string[] }) =>
    axiosClient.post<DeckSummary>(`/admin/decks/${deckRef}/approve`, null, {
      params: {
        note: options?.note,
        topicIds: options?.topicIds,
      },
    }),

  getAdminDeck: (deckRef: string) =>
    axiosClient.get<DeckSummary>(`/admin/decks/${deckRef}`),

  listAdminDeckCards: (
    deckRef: string,
    params: { page?: number; size?: number; q?: string } = {},
  ) =>
    axiosClient.get<PageResponse<Card>>(`/admin/decks/${deckRef}/cards`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
        q: params.q || undefined,
      },
    }),

  publishDeck: (deckRef: string) =>
    axiosClient.post<DeckSummary>(`/admin/decks/${deckRef}/publish`),

  rejectDeck: (deckRef: string, note?: string) =>
    axiosClient.post<DeckSummary>(`/admin/decks/${deckRef}/reject`, null, { params: { note } }),
}
