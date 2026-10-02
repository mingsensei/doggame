import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

interface LoadingScreenProps {
  onLoaded?: () => void
}

const TIPS = [
  'Mẹo: Bấm phím [Q] để mở "Lãnh Địa" triệu hồi bầy cún con chạy quanh bạn!',
  'Mẹo: Đến gần các khúc xương phát sáng và bấm [F] để nhặt.',
  'Mẹo: Bấm phím [Space] để nhảy qua các bụi cỏ và chướng ngại vật.',
  'Mẹo: Bấm [E] để sủa hoặc đánh dấu lãnh thổ tại các gốc cây thông.',
  'Mẹo: Giữ [Shift] để chạy nước rút với tốc độ cao!',
  'Bạn bè: Những người chơi khác trong thế giới sẽ thấy tên và cùng chạy nhảy với bạn!',
]

export function LoadingScreen({ onLoaded }: LoadingScreenProps): JSX.Element {
  const { progress } = useProgress()
  const [tipIndex, setTipIndex] = useState(0)
  const [displayProgress, setDisplayProgress] = useState(0)

  // Smoothly interpolate displayed percentage up to real progress
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        const target = Math.max(prev, Math.round(progress))
        if (prev < target) return prev + 1
        if (prev < 35 && progress === 0) return prev + 1
        return prev
      })
    }, 25)
    return () => clearInterval(interval)
  }, [progress])

  // Tip carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  // Auto trigger onLoaded when loading hits 100%
  useEffect(() => {
    if (displayProgress >= 100 && onLoaded) {
      const timeout = setTimeout(() => {
        onLoaded()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [displayProgress, onLoaded])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950 select-none p-8 text-white">
      {/* Top Brand Tag */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold tracking-wider uppercase">
        <span className="text-amber-400">🐕</span>
        <span>Dog World</span>
      </div>

      {/* Center Animated Loader */}
      <div className="flex flex-col items-center max-w-md w-full text-center">
        {/* Bouncing Paw Icon with Pulse Ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-ping" />
          <div className="text-7xl md:text-8xl animate-bounce drop-shadow-[0_10px_20px_rgba(251,197,49,0.5)]">
            🐾
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
          Đang chuẩn bị thế giới mở...
        </h2>

        <p className="text-xs md:text-sm text-white/60 mb-6 font-medium">
          Đang chuẩn bị cỏ hoa, xương thưởng và đón bạn bè...
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-white/10 border border-white/15 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-150 shadow-[0_0_15px_rgba(251,197,49,0.8)]"
            style={{ width: `${Math.min(100, Math.max(5, displayProgress))}%` }}
          />
        </div>

        {/* Percentage Counter */}
        <div className="flex justify-between w-full text-xs font-mono text-white/70 font-semibold px-1">
          <span>{displayProgress < 100 ? 'Đang tải...' : 'Hoàn tất!'}</span>
          <span className="text-amber-300 font-bold">{displayProgress}%</span>
        </div>
      </div>

      {/* Bottom Gameplay Tip Banner */}
      <div className="w-full max-w-lg bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
        <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider mb-1">
          💡 Hướng dẫn chơi
        </div>
        <p className="text-xs text-white/90 font-medium transition-all duration-300 min-h-[36px] flex items-center justify-center">
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  )
}
