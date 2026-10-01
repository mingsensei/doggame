/**
 * Full-screen loading overlay shown while the R3F scene loads.
 * Animates paw prints with a CSS pulse.
 */
export function LoadingScreen(): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 to-green-300">
      <div className="text-8xl mb-6 animate-bounce select-none">🐾</div>
      <h1 className="text-3xl font-bold text-white drop-shadow mb-2 tracking-wide">
        Dog World
      </h1>
      <p className="text-white/80 text-sm tracking-widest uppercase mb-8">
        Loading…
      </p>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-white/70"
            style={{ animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </div>
  )
}
