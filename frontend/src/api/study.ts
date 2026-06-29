import axiosClient from '@/api/axiosClient'
import type { StartStudyResponse, SubmitStudyResponse, Answer } from '@/types/study'

export const studyApi = {
  start(params: { deckRef: string; mode: string; count?: number }) {
    return axiosClient.post<StartStudyResponse>(`/study/${params.deckRef}/start`, {
      mode: params.mode,
      count: params.count,
    })
  },

  submit(attemptId: string, answers: Answer[]) {
    return axiosClient.post<SubmitStudyResponse>(`/study/${attemptId}/submit`, { answers })
  },

  getResult(attemptId: string) {
    return axiosClient.get<SubmitStudyResponse>(`/study/${attemptId}/result`)
  },
}
