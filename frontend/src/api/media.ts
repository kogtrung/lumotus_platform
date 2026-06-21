import axiosClient from '@/api/axiosClient'

export type MediaFolder = 'avatars' | 'cards' | 'decks' | 'audio'

export interface MediaUploadResponse {
  url: string
  publicId: string
  folder: string
}

export const mediaApi = {
  upload: (file: File, folder: MediaFolder = 'cards') => {
    const form = new FormData()
    form.append('file', file)
    return axiosClient.post<MediaUploadResponse>('/media/upload', form, {
      params: { folder },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
