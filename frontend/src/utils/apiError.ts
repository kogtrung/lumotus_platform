import type { AxiosError } from 'axios'

interface ApiErrorBody {
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosErr = error as AxiosError<ApiErrorBody>
  return axiosErr.response?.data?.message ?? fallback
}
