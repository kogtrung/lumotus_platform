export type StudyMode = 'FLASHCARD' | 'QUIZ'

export interface CardInfo {
  front: string
  back: string
  phonetic: string | null
  imageUrl: string | null
  audioUrl: string | null
}

export interface Question {
  questionId: string
  type: string
  front: string
  phonetic: string | null
  hint: string | null
  imageUrl: string | null
  audioUrl: string | null
  correctAnswer: string
  options: string[] | null
  cardInfo: CardInfo | null
}

export interface StartStudyResponse {
  attemptId: string
  studyMode: StudyMode
  deckTitle: string
  cardCount: number
  questions: Question[]
}

export interface Answer {
  questionId: string
  selectedAnswer: string
}

export interface SubmitStudyResponse {
  attemptId: string
  studyMode: StudyMode
  score: number
  correct: number
  total: number
  xpEarned: number
  timeTakenSeconds: number
  details: AnswerDetail[]
}

export interface AnswerDetail {
  questionId: string
  questionText: string
  correctAnswer: string
  selectedAnswer: string
  correct: boolean
}
