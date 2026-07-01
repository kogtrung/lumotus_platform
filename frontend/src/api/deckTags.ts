import axiosClient from '@/api/axiosClient'

export interface DeckTagsResponse {
  tags: string[]
}

export interface UpdateDeckTagsPayload {
  tags: string[]
}

export const deckTagsApi = {
  getTags: (deckId: string) =>
    axiosClient.get<DeckTagsResponse>(`/decks/${deckId}/tags`),

  updateTags: (deckId: string, tags: string[]) =>
    axiosClient.put<DeckTagsResponse>(`/decks/${deckId}/tags`, { tags }),

  deleteTag: (deckId: string, tagName: string) =>
    axiosClient.delete(`/decks/${deckId}/tags/${encodeURIComponent(tagName)}`),
}
