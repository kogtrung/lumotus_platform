import { useMemo } from 'react'
import { cn } from '@/utils/cn'

const MILESTONES = [3, 7, 10, 21, 30, 45, 60, 75, 90, 120]

export default function StreakProgressBar({ streak, className }: { streak: number, className?: string }) {
  const nextMilestone = useMemo(() => {
    return MILESTONES.find(m => m > streak) ?? null
  }, [streak])

  const maxStreak = MILESTONES[MILESTONES.length - 1]
  const progressPercent = Math.min((streak / maxStreak) * 100, 100)

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative h-2 sm:h-2.5 rounded-full bg-white/20 mt-4 sm:mt-5">
        {/* Fill */}
        <div 
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-yellow-400 to-[#EC4899] transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(236,72,153,0.6)]"
          style={{ width: `${progressPercent}%` }}
        />
        
        {/* Nodes */}
        {MILESTONES.map((m) => {
          const isReached = streak >= m
          const leftPercent = (m / maxStreak) * 100
          return (
            <div 
              key={m} 
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-help z-10"
              style={{ left: `${leftPercent}%` }}
            >
               <div className={cn(
                 "w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 transition-all duration-300",
                 isReached ? "bg-[#EC4899] border-[var(--color-primary)] shadow-[0_0_8px_rgba(236,72,153,0.8)]" : "bg-[var(--color-surface)]/80 border-[var(--color-border)]"
               )} />
               
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all pointer-events-none z-20">
                 <div className="bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl p-2.5 rounded-lg text-center min-w-[120px] whitespace-nowrap">
                   <p className="text-xs font-bold text-white">Mốc {m} ngày</p>
                   <p className="text-[10px] text-yellow-400 font-semibold mt-1 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 w-fit mx-auto">
                     +5% XP Xếp hạng
                   </p>
                 </div>
                 <div className="w-2.5 h-2.5 bg-[var(--color-bg)] border-b border-r border-[var(--color-border)] rotate-45 absolute -bottom-[5px] left-1/2 -translate-x-1/2" />
               </div>
            </div>
          )
        })}
      </div>
      
      <p className="mt-3 text-[11px] sm:text-xs text-white/80 font-bold tracking-wide">
        {nextMilestone 
          ? `${nextMilestone - streak} ngày nữa đến mốc ${nextMilestone}` 
          : '🎉 Chúc mừng! Bạn đã đạt mốc rực rỡ nhất 120 ngày!'}
      </p>
    </div>
  )
}
