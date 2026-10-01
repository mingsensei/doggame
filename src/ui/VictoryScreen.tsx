import { useDogStore } from '@/stores/useDogStore'

const TOTAL_BONES = 8

export function VictoryScreen(): JSX.Element | null {
  const bonesCollected = useDogStore((s) => s.bonesCollected)

  if (bonesCollected < TOTAL_BONES) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto">
      <div className="text-center space-y-4 animate-bounce-slow">
        <div className="text-8xl mb-2">🎉</div>
        <h1 className="text-5xl font-black text-amber-300 drop-shadow-lg tracking-tight">
          Good Boy!
        </h1>
        <p className="text-white/80 text-lg">
          You found all {TOTAL_BONES} golden bones! 🦴
        </p>
        <p className="text-white/50 text-sm mt-4">
          Every hydrant has been marked. Every bone has been found. What a good dog! 🐕
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-black font-bold text-lg shadow-xl pointer-events-auto"
        >
          🐾 Play Again
        </button>
      </div>
    </div>
  )
}
