import { useState } from 'react'
import { useSettingsStore, type GraphicsQuality } from '@/stores/useSettingsStore'

interface EntryScreenProps {
  onJoin: (name: string) => void
}

const FUN_NAMES = [
  'ShibaPro',
  'CúnVàng',
  'ChopKing',
  'BossTuất',
  'Mochi',
  'Lucky',
  'AkitaNinja',
  'CorgiMôngBự',
  'HuskyNgáo',
  'SamoyedTuyết',
]

export function EntryScreen({ onJoin }: EntryScreenProps): JSX.Element {
  const currentName = useSettingsStore((s) => s.playerName)
  const setPlayerName = useSettingsStore((s) => s.setPlayerName)
  const quality = useSettingsStore((s) => s.graphicsQuality)
  const setGraphicsQuality = useSettingsStore((s) => s.setGraphicsQuality)

  const [name, setName] = useState(currentName || 'ShibaPro')

  const handleRandomName = () => {
    const random = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]
    setName(random)
    setPlayerName(random)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = name.trim() || 'Shiba'
    setPlayerName(trimmed)
    onJoin(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-950 via-slate-900 to-emerald-950 select-none p-4">
      {/* Background Ambient Glow & Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-white flex flex-col gap-6">
        {/* Game Title & Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wider uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Multiplayer Online</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-300 to-emerald-300 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <span>🐕</span>
            <span>DOG WORLD</span>
          </h1>
          <p className="text-white/60 text-xs md:text-sm mt-1">
            Mô phỏng thế giới mở 3D chân thực & kết nối cùng bạn bè
          </p>
        </div>

        {/* Form: Name input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              🏷️ Tên của bạn trong game
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                maxLength={16}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập nickname của bạn..."
                className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 focus:outline-none rounded-2xl px-4 py-3 text-white font-bold text-sm transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={handleRandomName}
                title="Đổi tên ngẫu nhiên"
                className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 rounded-2xl px-3.5 flex items-center justify-center text-lg transition-all"
              >
                🎲
              </button>
            </div>
          </div>

          {/* Graphics Quality Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
              ⚡ Tùy chọn đồ họa & Hiệu năng
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'low', label: 'Siêu Mượt', sub: 'Max FPS', icon: '⚡' },
                  { id: 'balanced', label: 'Cân Bằng', sub: 'Chuẩn 60FPS', icon: '⚖️' },
                  { id: 'cinematic', label: 'Điện Ảnh', sub: 'PBR & Bloom', icon: '✨' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGraphicsQuality(item.id as GraphicsQuality)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border transition-all ${
                    quality === item.id
                      ? 'bg-amber-500/30 border-amber-400 text-white shadow-[0_0_15px_rgba(251,197,49,0.3)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-bold mt-1">{item.label}</span>
                  <span className="text-[10px] text-white/40">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Server Connection Status */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-2.5 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Máy chủ WebSocket: Sẵn sàng</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400/80">ws://online</span>
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-base tracking-wide shadow-[0_0_30px_rgba(251,197,49,0.6)] hover:shadow-[0_0_40px_rgba(251,197,49,0.8)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>VÀO THẾ GIỚI CÚN (PLAY)</span>
            <span className="text-xl">🐾</span>
          </button>
        </form>

        {/* Footer controls hint */}
        <div className="text-center text-[11px] text-white/40">
          Phím điều khiển: <span className="text-white/70">WASD</span> di chuyển •{' '}
          <span className="text-white/70">Space</span> nhảy •{' '}
          <span className="text-white/70">Q</span> Lãnh địa •{' '}
          <span className="text-white/70">F</span> nhặt xương
        </div>
      </div>
    </div>
  )
}
