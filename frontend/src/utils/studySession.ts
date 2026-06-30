/**
 * Unified study session persistence.
 *
 * Design:
 * - Mỗi mode có session riêng theo key `{deckRef}:{mode}`.
 *   Khi chuyển mode → session cũ được lưu lại (nếu có), session mới được load (nếu có).
 * - Chỉ xóa session khi: user restart, session hết hạn, hoặc session hoàn thành.
 * - Full data luôn re-fetch từ API khi resume — đảm bảo cards/questions mới nhất.
 * - TTL per-mode. Supports "never save" option.
 */

import type { StudyMode, Question } from '@/types/study'
import type { DueCard, ReviewRating } from '@/types/review'

/* ─── Types ────────────────────────────────────────────────────── */

export interface FlashcardProgress {
  cardIds: string[]
  currentIndex: number
  flipped: boolean
}

export interface QuizProgress {
  attemptId: string
  answeredCount: number
  questions: Question[]
  answers: Record<string, string>
  answeredSet: number[]
  startedAt: number
  navIndex: number
}

export interface StudyProgress {
  mode: StudyMode
  flashcard?: FlashcardProgress
  quiz?: QuizProgress
  stats: {
    again: number
    hard: number
    good: number
    easy: number
    xp: number
  }
}

export interface StudySession {
  deckRef: string
  mode: StudyMode
  config: StudyConfig
  progress: StudyProgress
  sessionCardIds: string[]
  savedAt: number
}

export interface StudyConfig {
  shuffle: boolean
  count: number
  /** Hours before session is considered stale. 0 = never save. */
  ttlHours: number
}

export const DEFAULT_CONFIG: Record<StudyMode, StudyConfig> = {
  FLASHCARD: { shuffle: true, count: 20, ttlHours: 1 },
  QUIZ:      { shuffle: true, count: 20, ttlHours: 24 },
}

/* ─── TTL options ───────────────────────────────────────────────── */

export const TTL_OPTIONS: { label: string; value: number }[] = [
  { label: '5 min',  value: 5  / 60 },
  { label: '15 min', value: 15 / 60 },
  { label: '30 min', value: 30 / 60 },
  { label: '1h',    value: 1 },
  { label: '3h',    value: 3 },
  { label: '6h',    value: 6 },
  { label: '1d',    value: 24 },
  { label: '3d',    value: 72 },
  { label: 'Never', value: 0 },
]

export function formatTtlLabel(hours: number): string {
  return TTL_OPTIONS.find((o) => o.value === hours)?.label ?? `${hours}h`
}

/* ─── Storage keys ──────────────────────────────────────────────── */

/** Per-mode session key: deckRef + mode riêng biệt */
const SESSION_KEY = (deckRef: string, mode: StudyMode) => `lumotus:study:${deckRef}:${mode}`
const CONFIG_KEY  = (mode: StudyMode) => `lumotus:study:config:${mode}`
const GLOBAL_KEY  = 'lumotus:study:global-ttl'

/* ─── Config helpers ─────────────────────────────────────────────── */

export function loadConfig(mode: StudyMode): StudyConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY(mode))
    return raw ? { ...DEFAULT_CONFIG[mode], ...JSON.parse(raw) } : DEFAULT_CONFIG[mode]
  } catch {
    return DEFAULT_CONFIG[mode]
  }
}

export function saveConfig(mode: StudyMode, config: StudyConfig) {
  localStorage.setItem(CONFIG_KEY(mode), JSON.stringify(config))
}

export function getGlobalTtlHours(): number {
  try {
    const raw = localStorage.getItem(GLOBAL_KEY)
    return raw ? parseFloat(raw) : 6
  } catch { return 6 }
}

export function setGlobalTtlHours(hours: number) {
  localStorage.setItem(GLOBAL_KEY, String(hours))
}

/* ─── Relative time ──────────────────────────────────────────────── */

export function relativeTime(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000)
  if (sec < 60)  return 'a few seconds ago'
  const min = Math.floor(sec / 60)
  if (min < 60)  return `${min} min ago`
  const hr  = Math.floor(min / 60)
  if (hr < 24)   return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  return `${day} day${day > 1 ? 's' : ''} ago`
}

/* ─── Session persistence (per-mode) ─────────────────────────────── */

function effectiveTtl(session: StudySession): number {
  const hours = session.config?.ttlHours ?? 6
  return hours === 0 ? Infinity : hours * 3600 * 1000
}

function isExpired(session: StudySession): boolean {
  if (session.config.ttlHours === 0) return false
  return Date.now() - session.savedAt > effectiveTtl(session)
}

/** Save session cho mode hiện tại */
export function saveSession(session: StudySession): void {
  if (session.config.ttlHours === 0) return
  try {
    localStorage.setItem(SESSION_KEY(session.deckRef, session.mode), JSON.stringify({
      ...session,
      savedAt: Date.now(),
    }))
  } catch { /* quota exceeded — silently ignore */ }
}

/**
 * Load session cho một mode cụ thể.
 * Trả về null nếu không có hoặc đã hết hạn.
 */
export function loadSession(deckRef: string, mode: StudyMode): StudySession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY(deckRef, mode))
    if (!raw) return null
    const session: StudySession = JSON.parse(raw)
    if (isExpired(session)) {
      clearSession(deckRef, mode)
      return null
    }
    return session
  } catch { return null }
}

/**
 * Clear session cho một mode cụ thể.
 */
export function clearSession(deckRef: string, mode: StudyMode): void {
  try {
    localStorage.removeItem(SESSION_KEY(deckRef, mode))
  } catch { /* ignore */ }
}

/**
 * Clear toàn bộ sessions của một deck (all modes).
 */
export function clearAllSessions(deckRef: string): void {
  const modes: StudyMode[] = ['FLASHCARD', 'QUIZ']
  modes.forEach((m) => clearSession(deckRef, m))
}

/**
 * Scan all localStorage keys to find any active session across all decks.
 * Returns the first session found, or null.
 * Uses brute-force scan (keys are deterministic so this is reliable).
 */
export function findAnyActiveSession(): { deckRef: string; session: StudySession } | null {
  try {
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith('lumotus:study:') && k.includes(':FLASHCARD')
    )
    for (const key of keys) {
      const deckRef = key.replace('lumotus:study:', '').replace(':FLASHCARD', '')
      const session = loadSession(deckRef, 'FLASHCARD')
      if (session && !isExpired(session)) {
        return { deckRef, session }
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Load session cho một mode cụ thể.
 * Alias để tương thích ngược — khuyến khích dùng loadSession(deckRef, mode).
 */
export function loadSessionForMode(deckRef: string, mode: StudyMode): StudySession | null {
  return loadSession(deckRef, mode)
}

/**
 * Kiểm tra xem có session nào (bất kỳ mode nào) cho deck này không.
 * Trả về mode đầu tiên tìm được.
 */
export function findAnySession(deckRef: string): { mode: StudyMode; session: StudySession } | null {
  const modes: StudyMode[] = ['FLASHCARD', 'QUIZ']
  for (const m of modes) {
    const s = loadSession(deckRef, m)
    if (s) return { mode: m, session: s }
  }
  return null
}

/* ─── Session factories ──────────────────────────────────────────── */

/** Create initial flashcard session from fresh card list */
export function createSession(
  deckRef: string,
  mode: StudyMode,
  config: StudyConfig,
  cards: DueCard[],
): StudySession {
  const ids = cards.map((c) => c.cardId)
  return {
    deckRef,
    mode,
    config,
    sessionCardIds: ids,
    progress: {
      mode,
      flashcard: { cardIds: ids, currentIndex: 0, flipped: false },
      stats: { again: 0, hard: 0, good: 0, easy: 0, xp: 0 },
    },
    savedAt: Date.now(),
  }
}

/** Create quiz/learn/spell session */
export function createQuizSession(
  deckRef: string,
  mode: StudyMode,
  config: StudyConfig,
  attemptId: string,
  questions: Question[] = [],
  answers: Record<string, string> = {},
  answeredSet: number[] = [],
  navIndex: number = 0,
): StudySession {
  return {
    deckRef,
    mode,
    config,
    sessionCardIds: [],
    progress: {
      mode,
      quiz: {
        attemptId,
        answeredCount: Object.keys(answers).length,
        questions,
        answers,
        answeredSet,
        startedAt: Date.now(),
        navIndex,
      },
      stats: { again: 0, hard: 0, good: 0, easy: 0, xp: 0 },
    },
    savedAt: Date.now(),
  }
}

/* ─── Helpers ───────────────────────────────────────────────────── */

/** Resolve card IDs → full card objects from session */
export function resolveSessionCards(
  session: StudySession,
  allCards: DueCard[],
  shuffledIds: string[],
): DueCard[] {
  const availableIds = session.config.shuffle ? shuffledIds : allCards.map((c) => c.cardId)
  const sessionSet = new Set(session.sessionCardIds)
  const present = availableIds.filter((id) => sessionSet.has(id))
  const cardMap = new Map(allCards.map((c) => [c.cardId, c]))
  const rehydrated = present.map((id) => cardMap.get(id)).filter((c): c is DueCard => c != null)
  return rehydrated.slice(0, session.config.count)
}

/** Merge a fresh rating into session stats */
export function mergeRating(
  session: StudySession,
  rating: ReviewRating,
  xpEarned: number,
): StudySession {
  const stats = { ...session.progress.stats }
  if (rating === 'AGAIN') stats.again++
  else if (rating === 'HARD') stats.hard++
  else if (rating === 'GOOD') stats.good++
  else if (rating === 'EASY') stats.easy++
  stats.xp += xpEarned
  return {
    ...session,
    progress: { ...session.progress, stats },
    savedAt: Date.now(),
  }
}
