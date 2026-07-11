import { ArrowRight, Check, BookOpen, Users, Award, Menu, X } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionTemplate,
  type Variants,
} from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

// =================== Shared Animation Components ===================

function WordsPullUpMultiStyle({
  segments,
  className = '',
}: {
  segments: { text: string; className?: string }[]
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const lines: { text: string; className?: string }[][] = []
  let currentLine: { text: string; className?: string }[] = []
  segments.forEach((seg) => {
    const words = seg.text.split(' ')
    words.forEach((w, wi) => {
      currentLine.push({ text: w, className: seg.className })
      if (wi < words.length - 1) currentLine.push({ text: ' ', className: '' })
    })
    lines.push(currentLine)
    currentLine = []
  })

  let globalIndex = 0

  return (
    <div ref={ref} className={className}>
      {lines.map((line, lineIdx) => (
        <div
          key={lineIdx}
          className="flex flex-wrap justify-center"
          style={{ textAlign: 'center' }}
        >
          {line.map((item, i) => {
            if (item.text === ' ') {
              return <span key={`${lineIdx}-${i}`} className="w-2 inline-block" />
            }
            const idx = globalIndex++
            return (
              <span key={`${lineIdx}-${i}`} className="inline-block overflow-hidden mr-[0.2em]">
                <motion.span
                  className={`inline-block ${item.className ?? ''}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {item.text}
                </motion.span>
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function AnimatedLetter({
  char,
  index,
  totalChars,
}: {
  char: string
  index: number
  totalChars: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })
  const charProgress = index / totalChars
  const opacity = useTransform(
    scrollYProgress,
    [charProgress - 0.1, charProgress + 0.05],
    [0.2, 1],
  )

  return (
    <motion.span ref={ref} style={{ opacity }}>
      {char}
    </motion.span>
  )
}

// =================== Falling Flashcard ===================

interface FlashcardData {
  id: number
  front: string
  back: string
  phonetic?: string
  color: string
  accentColor: string
}

const FALLING_FLASHCARDS: FlashcardData[] = [
  { id: 1, front: 'Ephemeral', back: 'Tạm thời', phonetic: '/ɪˈfem(ə)rəl/', color: '#FFF0F3', accentColor: '#EC4899' },
  { id: 2, front: 'Serendipity', back: 'May mắn', phonetic: '/ˌserənˈdipədē/', color: '#F0F4FF', accentColor: '#6366F1' },
  { id: 3, front: 'Mellifluous', back: 'Dịu ngọt', phonetic: '/məˈliflo͞oəs/', color: '#F0FDF4', accentColor: '#10B981' },
  { id: 4, front: 'Sonder', back: 'Thấu hiểu', phonetic: '/ˈsändər/', color: '#FFFBEB', accentColor: '#F59E0B' },
  { id: 5, front: 'Petrichor', back: 'Mùi đất mưa', phonetic: '/ˈpetrɪkɔː/', color: '#FDF2F8', accentColor: '#EC4899' },
  { id: 6, front: 'Ethereal', back: 'Siêu thực', phonetic: '/əˈTHirēəl/', color: '#EFF6FF', accentColor: '#3B82F6' },
  { id: 7, front: 'Luminous', back: 'Bừng sáng', phonetic: '/ˈlo͞omənəs/', color: '#FFF7ED', accentColor: '#F97316' },
  { id: 8, front: 'Resilience', back: 'Kiên cường', phonetic: '/rəˈzilyəns/', color: '#F5F3FF', accentColor: '#8B5CF6' },
  { id: 9, front: 'Aurora', back: 'Cực quang', phonetic: '/əˈrôrə/', color: '#FFF0F3', accentColor: '#EC4899' },
  { id: 10, front: 'Panacea', back: 'Thuốc chữa mọi bệnh', phonetic: '/ˌpanəˈsēə/', color: '#F0F4FF', accentColor: '#6366F1' },
  { id: 11, front: 'Hiraeth', back: 'Nỗi nhớ', phonetic: '/ˈhirīeth/', color: '#F0FDF4', accentColor: '#10B981' },
  { id: 12, front: 'Saudade', back: 'Nỗi khát khao', phonetic: '/säˈTHäTHə/', color: '#FFFBEB', accentColor: '#F59E0B' },
  { id: 13, front: 'Labyrinth', back: 'Mê cung', phonetic: '/ˈlab(ə)rinTH/', color: '#EFF6FF', accentColor: '#3B82F6' },
  { id: 14, front: 'Euphoria', back: 'Hưng phấn', phonetic: '/yo͞oˈfôrēə/', color: '#F5F3FF', accentColor: '#8B5CF6' },
  { id: 15, front: 'Nirvana', back: 'Cảnh giới siêu thoát', phonetic: '/nərˈväNə/', color: '#FFF7ED', accentColor: '#F97316' },
  { id: 16, front: 'Halcyon', back: 'Thái bình', phonetic: '/ˈhalˌsīən/', color: '#FDF2F8', accentColor: '#EC4899' },
]

function FallingFlashcard({
  data,
  delay,
  duration,
  x,
}: {
  data: FlashcardData
  delay: number
  duration: number
  x: number
}) {
  const [flipped, setFlipped] = useState(false)

  const variants: Variants = {
    hidden: { y: '-20vh', x: 0, opacity: 0, rotate: 0 },
    visible: {
      y: '115vh',
      x: x + Math.sin(delay * 1.7) * 50,
      opacity: [0, 1, 1, 0],
      rotate: Math.sin(delay) * 20,
      transition: {
        duration,
        delay,
        ease: 'linear',
        repeat: Infinity,
        repeatDelay: Math.random() * 12 + 8,
      },
    },
  }

  return (
    <motion.div
      className="absolute cursor-pointer z-[2]"
      style={{ left: `${x}%`, top: 0 }}
      variants={variants}
      initial="hidden"
      animate="visible"
      onClick={() => setFlipped(!flipped)}
      whileHover={{ scale: 1.08, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* 1/8 of original: ~w-16 h-20 (64x80px) */}
      <div
        className="relative w-16 h-20 rounded-xl overflow-hidden"
        style={{ perspective: '800px' }}
      >
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Front — botanical illustration, blank card */}
          <div
            className="absolute inset-0 rounded-xl shadow-md border"
            style={{
              backgroundColor: data.color,
              borderColor: data.accentColor + '50',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Botanical SVG: small leaf/petal illustration */}
            <svg
              viewBox="0 0 64 80"
              className="absolute inset-0 w-full h-full opacity-40"
              style={{ color: data.accentColor }}
              fill="currentColor"
            >
              {/* Stem */}
              <path d="M32 78 C32 60, 28 45, 20 30 C14 20, 8 15, 6 10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              {/* Leaf 1 */}
              <path d="M20 30 C16 26, 10 28, 8 24 C6 20, 12 16, 20 18 C24 19, 22 26, 20 30Z" />
              {/* Leaf 2 */}
              <path d="M24 42 C22 38, 16 40, 14 36 C12 32, 18 28, 24 30 C28 31, 26 38, 24 42Z" />
              {/* Small petal top */}
              <ellipse cx="6" cy="8" rx="4" ry="5" opacity="0.7" />
              {/* Small dots/seeds */}
              <circle cx="12" cy="22" r="1" opacity="0.5" />
              <circle cx="18" cy="34" r="0.8" opacity="0.4" />
            </svg>
          </div>

          {/* Back — word + phonetic + Vietnamese meaning */}
          <div
            className="absolute inset-0 rounded-xl p-2 flex flex-col items-center justify-center text-center overflow-hidden"
            style={{
              backgroundColor: data.accentColor,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
            />
            {/* Word */}
            <p
              className="text-[11px] font-bold text-white leading-tight mb-0.5"
              style={{ fontFamily: 'Literata, serif' }}
            >
              {data.front}
            </p>
            {/* Phonetic */}
            <p className="text-[8px] text-white/70 leading-tight mb-1">
              {data.phonetic}
            </p>
            {/* Divider */}
            <div className="w-6 h-px bg-white/30 mb-1" />
            {/* Vietnamese meaning */}
            <p className="text-[9px] text-white/90 leading-snug font-medium">
              {data.back}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function BotanicalFalling({
  intensity = 'normal',
}: {
  intensity?: 'normal' | 'gentle' | 'dense'
}) {
  const count = intensity === 'dense' ? 16 : intensity === 'gentle' ? 6 : 12
  const items = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * (intensity === 'gentle' ? 16 : 8),
    duration: intensity === 'gentle'
      ? 18 + Math.random() * 12
      : 10 + Math.random() * 6,
    x: Math.random() * 100,
    size: Math.random() * 12 + 8,
  }))

  const petalColors = ['#FBCFE8', '#FDE68A', '#A7F3D0', '#F9A8D4', '#BFDBFE']
  const leafEmojis = ['🍃', '🌿', '🍂', '🌾', '🍀', '✿']

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden>
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="absolute pointer-events-none select-none"
          style={{ left: `${item.x}%`, top: 0, fontSize: item.size }}
          animate={{
            y: ['-10vh', '110vh'],
            x: item.x + Math.sin(item.id * 2.1) * 40,
            opacity: [0, 0.8, 0.8, 0],
            rotate: Math.sin(item.id * 1.3) * 180,
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: Math.random() * 6 + 4,
          }}
        >
          {item.id % 3 === 0 ? (
            <div
              className="rounded-full opacity-70"
              style={{
                width: item.size,
                height: item.size,
                backgroundColor: petalColors[item.id % petalColors.length],
              }}
            />
          ) : (
            <span>{leafEmojis[item.id % leafEmojis.length]}</span>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// =================== Header ===================

const NAV_ITEMS = [
  { label: 'Giới thiệu', href: '#about-section' },
  { label: 'Tính năng', href: '#features-section' },
  { label: 'Cộng đồng', href: '#features-section' },
  { label: 'Hướng dẫn', href: '#cta-section' },
]

function Header() {
  const user = useAuthStore((s) => s.user)
  const [overDark, setOverDark] = useState(false)
  const [overLight, setOverLight] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const heroSection = document.getElementById('hero-section')
    const ctaSection = document.getElementById('cta-section')

    const onScroll = () => {
      const heroBottom = heroSection?.getBoundingClientRect().bottom ?? 0
      const ctaTop = ctaSection?.getBoundingClientRect().top ?? window.innerHeight
      setOverDark(heroBottom > 0)
      setOverLight(ctaTop <= 0)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const textColor = overDark || overLight ? 'text-white' : 'text-[#F5F0FA]'
  const linkColor = overDark || overLight
    ? 'text-white/80 hover:text-white'
    : 'text-[#C4B8D9] hover:text-[#EC4899]'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 lg:px-8 py-3 pointer-events-none [&>*]:pointer-events-auto safe-area-inset">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className={`flex items-center gap-2 ${textColor} transition-colors duration-200`}>
          <img
            src="/logo.svg"
            alt="Lumotus"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain"
          />
          <span className="text-base sm:text-lg font-bold drop-shadow-sm">Lumotus</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`text-xs sm:text-sm transition-colors duration-200 font-medium ${linkColor}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`md:hidden flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm ${textColor}`}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {user ? (
            <a
              href="/home"
              className="hidden sm:flex items-center gap-2 bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-200"
            >
              Tiếp tục học
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          ) : (
            <>
              <a
                href="/login"
                className={`hidden sm:block text-xs sm:text-sm transition-colors duration-200 font-medium ${linkColor}`}
              >
                Đăng nhập
              </a>
              <a
                href="/register"
                className="hidden sm:flex items-center gap-1.5 text-white bg-[#EC4899] hover:bg-[#DB2777] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-200"
              >
                Bắt đầu
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-4 right-4 mt-2 rounded-2xl border border-white/20 bg-[#1A1520]/95 backdrop-blur-xl p-4 space-y-3"
        >
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-sm font-medium ${linkColor} py-1`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="h-px bg-white/10" />
          <div className="flex flex-col gap-2">
            {user ? (
              <a
                href="/home"
                className="flex items-center justify-center gap-2 bg-[#EC4899] text-white rounded-full px-4 py-2 text-sm font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                Tiếp tục học
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className={`text-sm font-medium text-center ${linkColor} py-2`}
                  onClick={() => setMobileOpen(false)}
                >
                  Đăng nhập
                </a>
                <a
                  href="/register"
                  className="flex items-center justify-center gap-2 bg-[#EC4899] text-white rounded-full px-4 py-2 text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  Bắt đầu
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  )
}

// =================== Section 1: Hero ===================

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4'

function HeroSection() {
  const user = useAuthStore((s) => s.user)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="hero-section" className="relative h-screen overflow-hidden">
      {/* Background video */}
      <video
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/85" />

      {/* Falling flashcards — botanical cards from hero */}
      {FALLING_FLASHCARDS.slice(0, 6).map((card, i) => (
        <FallingFlashcard
          key={card.id}
          data={card}
          delay={i * 5 + Math.random() * 6}
          duration={35 + Math.random() * 15}
          x={10 + (i * 16) % 75}
        />
      ))}

      {/* Hero content — split layout: giant text left, CTA right */}
      <div
        ref={ref}
        className="relative h-full flex flex-col md:flex-row items-center justify-end md:items-end text-center md:text-left px-5 sm:px-8 md:px-12 lg:px-16 pb-16 pt-24 md:pt-16 gap-6 md:gap-0"
      >
        {/* Left: Giant heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex justify-center md:justify-start w-full"
        >
          <h1 className="text-[20vw] xs:text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] xl:text-[10vw] font-extrabold leading-[0.88] tracking-tight">
            <span 
              className="bg-gradient-to-r from-[#FBCFE8] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(236,72,153,0.5)]"
              style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            >
              Lumotus
            </span>
          </h1>
        </motion.div>

        {/* Right: Badge + Description + CTA + Stats */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center md:items-start gap-4 sm:gap-5 md:gap-6 w-full max-w-sm md:max-w-md lg:max-w-lg mb-4"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-white/20">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#10B981]" />
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm text-white/80">
              Hơn <span className="text-white font-semibold">10,000</span> người đang học
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base text-white/70 leading-relaxed">
            Học từ vựng mỗi ngày, tích lũy kiến thức, tiến bộ từng bước cùng cộng đồng người học trên toàn thế giới.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center md:justify-start">
            {user ? (
              <a
                href="/home"
                className="flex items-center justify-center gap-2 bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:gap-3 shadow-lg w-full sm:w-auto"
                style={{ boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)' }}
              >
                Tiếp tục học tập
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            ) : (
              <>
                <a
                  href="/register"
                  className="flex items-center justify-center gap-2 bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-full px-4 sm:px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg w-full sm:w-auto"
                  style={{ boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)' }}
                >
                  Bắt đầu ngay
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-full px-4 sm:px-6 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20 w-full sm:w-auto"
                >
                  Đăng nhập
                </a>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-5 text-white/60 w-full">
            {[
              { icon: Users, label: '50K+' },
              { icon: BookOpen, label: '500K+' },
              { icon: Award, label: '5M+' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm">
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#EC4899]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2 }}
      >
        <div className="w-4 h-7 sm:w-5 sm:h-8 rounded-full border-2 border-white/30 flex justify-center pt-1 sm:pt-1.5">
          <div className="w-0.5 h-1.5 sm:w-1 sm:h-2 bg-white/50 rounded-full animate-bounce" />
        </div>
      </motion.div>
    </section>
  )
}

// =================== Section 2: About ===================

function AboutSection() {
  const bodyText =
    'Lumotus giúp bạn xây dựng thói quen học tập lành mạnh, theo dõi tiến độ với streak, XP và bảng xếp hạng. Mỗi ngày một bước tiến, bạn sẽ ngạc nhiên với những gì mình đạt được.'

  return (
    <section id="about-section" className="relative py-16 sm:py-20 md:py-28 px-4 sm:px-6 overflow-hidden" style={{ background: '#1A1520' }}>
      <BotanicalFalling intensity="gentle" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(236,72,153,0.04)] to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Label */}
        <p className="text-[#EC4899] text-[10px] sm:text-xs uppercase tracking-widest mb-8 sm:mb-10 md:mb-14 font-semibold">
          Về chúng tôi
        </p>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl max-w-3xl mx-auto leading-[1.25] sm:leading-[1.15] mb-10 sm:mb-12 md:mb-16 font-extrabold" style={{ color: '#F5F0FA' }}>
          <WordsPullUpMultiStyle
            segments={[
              { text: 'Mỗi ngày', className: '' },
              { text: 'một bước tiến,', className: '' },
              { text: 'kiến thức tích lũy,', className: 'text-[#EC4899]' },
              { text: 'thói quen bền vững.', className: '' },
            ]}
          />
        </h2>

        {/* Body paragraph */}
        <p className="text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: '#C4B8D9' }}>
          {bodyText.split('').map((char, i) => (
            <AnimatedLetter
              key={i}
              char={char}
              index={i}
              totalChars={bodyText.length}
            />
          ))}
        </p>
      </div>
    </section>
  )
}

// =================== Section 3: Features ===================

const FEATURE_CARD_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4'

const STORYBOARD_ICON =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85'

const CRITIQUES_ICON =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85'

const CAPSULE_ICON =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85'

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.15,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

function FeatureCardVideo() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10"
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={0}
      whileHover={{ y: -5, borderColor: 'rgba(236,72,153,0.5)', boxShadow: '0 20px 40px -15px rgba(236,72,153,0.3)' }}
    >
      <video
        src={FEATURE_CARD_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 group-hover:from-black/80 transition-colors duration-500" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#EC4899]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" style={{ mixBlendMode: 'overlay' }} />
      <div className="relative z-10 p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-end h-full min-h-[240px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[400px]">
        <p className="text-sm sm:text-base md:text-lg font-bold text-white mb-0.5 sm:mb-1 drop-shadow-md">
          Nền tảng học tập
        </p>
        <p className="text-[10px] sm:text-xs md:text-sm text-white/80 group-hover:text-white transition-colors">
          Mọi thứ bạn cần trong một ứng dụng
        </p>
      </div>
    </motion.div>
  )
}

function FeatureCardContent({
  number,
  title,
  iconUrl,
  items,
  delay,
}: {
  number: string
  title: string
  iconUrl: string
  items: string[]
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col border transition-all duration-300 min-h-[240px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[400px] overflow-hidden bg-[rgba(37,32,48,0.4)] border-white/5"
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={delay}
      whileHover={{ y: -5, borderColor: 'rgba(236,72,153,0.4)', boxShadow: '0 20px 40px -15px rgba(236,72,153,0.2)' }}
    >
      {/* Spotlight Hover Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl sm:rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              rgba(236, 72, 153, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

      {/* Top icon */}
      <div className="relative z-10 flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
        <img
          src={iconUrl}
          alt=""
          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded object-cover shadow-[0_0_15px_rgba(236,72,153,0.3)] group-hover:scale-110 transition-transform duration-500"
        />
        <span className="text-[#EC4899] text-[10px] sm:text-xs font-semibold tracking-widest">{number}</span>
      </div>

      {/* Title */}
      <h3 className="relative z-10 text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-3 sm:mb-4 md:mb-5 transition-colors group-hover:text-white" style={{ color: '#F5F0FA' }}>
        {title}
      </h3>

      {/* Checklist */}
      <ul className="relative z-10 space-y-1.5 sm:space-y-2 md:space-y-2.5 flex-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 group/item">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 text-[#EC4899] shrink-0 mt-0.5 group-hover/item:scale-125 transition-transform" />
            <span className="text-[10px] sm:text-xs md:text-sm leading-snug transition-colors group-hover/item:text-white" style={{ color: '#C4B8D9' }}>{item}</span>
          </li>
        ))}
      </ul>

      {/* Learn more */}
      <a
        href="#"
        className="relative z-10 inline-flex items-center gap-1.5 mt-4 sm:mt-5 text-[#EC4899] text-[10px] sm:text-xs md:text-sm font-semibold hover:gap-2.5 transition-all duration-200"
      >
        Tìm hiểu thêm
        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rotate-[-45deg] group-hover:rotate-0 transition-transform duration-300" />
      </a>
    </motion.div>
  )
}



function FeaturesSection() {

  return (
    <section id="features-section" className="min-h-screen relative py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 overflow-hidden" style={{ background: '#1A1520' }}>
      <BotanicalFalling intensity="gentle" />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(236,72,153,0.04)] via-transparent to-[rgba(249,115,22,0.04)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-start">
          <FeatureCardVideo />

          <FeatureCardContent
            number="01"
            title="Ôn tập thông minh."
            iconUrl={STORYBOARD_ICON}
            delay={0}
            items={[
              'Học qua Flashcard linh hoạt',
              'Lặp lại ngắt quãng (SRS)',
              'Thuật toán đánh giá SM-2',
              'Tối ưu hóa thời gian học',
            ]}
          />

          <FeatureCardContent
            number="02"
            title="Cộng đồng."
            iconUrl={CRITIQUES_ICON}
            delay={1}
            items={[
              'Chia sẻ deck công khai',
              'Khám phá bộ từ vựng hot',
              'Theo dõi bạn bè',
              'Thi đua trên bảng xếp hạng',
            ]}
          />

          <FeatureCardContent
            number="03"
            title="Theo dõi tiến độ."
            iconUrl={CAPSULE_ICON}
            delay={2}
            items={[
              'Heatmap học tập hàng ngày',
              'Streak & chuỗi ngày liên tiếp',
              'Biểu đồ XP & thành tựu',
              'Báo cáo chi tiết hàng tuần',
            ]}
          />
        </div>
      </div>
    </section>
  )
}

// =================== CTA Section ===================

function CTASection() {
  const user = useAuthStore((s) => s.user)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section id="cta-section" className="relative bg-[#0a0614] py-16 sm:py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
      {/* Dark gradient background matching hero overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0614] via-[#1a0a2e] to-[#2d0a3a]" />
      {/* Decorative blobs */}
      <div className="absolute -top-24 sm:-top-32 -right-24 sm:-right-32 w-64 sm:w-72 h-64 sm:h-72 rounded-full bg-[#EC4899]/10 blur-3xl" />
      <div className="absolute -bottom-24 sm:-bottom-32 -left-24 sm:-left-32 w-56 sm:w-80 h-56 sm:h-80 rounded-full bg-[#F97316]/10 blur-3xl" />
      {/* Soft inner glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      {/* Botanical on CTA */}
      <BotanicalFalling />

      <div ref={ref} className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-6 sm:mb-8 text-xs sm:text-sm text-white/80 border border-white/20">
            <span className="text-white font-semibold">Miễn phí</span> mãi mãi
          </p>
        </motion.div>

        <motion.h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          Sẵn sàng bắt đầu
          <br />
          <span className="bg-gradient-to-r from-[#FBCFE8] to-[#F97316] bg-clip-text text-transparent">
            hành trình của bạn?
          </span>
        </motion.h2>

        <motion.p
          className="text-sm sm:text-base md:text-lg text-white/70 mb-8 sm:mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Đăng ký trong 10 giây và bắt đầu học ngay hôm nay.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {user ? (
            <a
              href="/home"
              className="flex items-center justify-center gap-2 bg-white text-[#EC4899] rounded-full px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base font-bold hover:bg-white/90 transition-all duration-300 hover:scale-105"
            >
              Tiếp tục học tập
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          ) : (
            <>
              <a
                href="/register"
                className="flex items-center justify-center gap-2 bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-full px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base font-bold transition-all duration-300 hover:scale-105 shadow-lg"
                style={{ boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)' }}
              >
                Đăng ký miễn phí
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a
                href="/login"
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-full px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base font-semibold transition-all duration-300 border border-white/30"
              >
                Đăng nhập
              </a>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}

// =================== Footer ===================

function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white/60 py-10 sm:py-12 md:py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <img src="/logo.svg" alt="Lumotus" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
              <span className="text-sm sm:text-base font-bold text-white">Lumotus</span>
            </div>
            <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed">
              Học từ vựng mỗi ngày, tích lũy kiến thức, tiến bộ từng bước.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: 'Sản phẩm',
              links: ['Tính năng', 'Bảng giá', 'Hướng dẫn', 'Cập nhật'],
            },
            {
              title: 'Cộng đồng',
              links: ['Blog', 'Diễn đàn', 'Sự kiện', 'Hỗ trợ'],
            },
            {
              title: 'Công ty',
              links: ['Giới thiệu', 'Tuyển dụng', 'Liên hệ', 'Bảo mật'],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-[10px] sm:text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 sm:mb-3">{title}</p>
              <ul className="space-y-1.5 sm:space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[10px] sm:text-xs hover:text-white transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p className="text-[10px] sm:text-xs text-white/30">
            &copy; {new Date().getFullYear()} Lumotus. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            {['Facebook', 'Twitter', 'Instagram'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-[10px] sm:text-xs text-white/30 hover:text-white transition-colors duration-200"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// =================== Page ===================

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#1A1520' }}>
      <Header />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  )
}