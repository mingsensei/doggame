import { useDogStore } from '@/stores/useDogStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { useMultiplayerStore } from '@/stores/useMultiplayerStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useInputStore } from '@/stores/useInputStore'
import { soundManager } from '@/game/audio/SoundManager'

interface HUDProps {
  onOpenSettings?: () => void
}

export function HUD({ onOpenSettings }: HUDProps): JSX.Element {
  const state = useDogStore((s) => s.state)
  const form = useDogStore((s) => s.form)
  const comboStep = useDogStore((s) => s.comboStep)
  const toggleForm = useDogStore((s) => s.toggleForm)
  const bonesCollected = useDogStore((s) => s.bonesCollected)
  const activeTarget = useInteractionStore((s) => s.activeTarget)

  // Player & Multiplayer Info
  const playerName = useSettingsStore((s) => s.playerName)
  const multiplayerStatus = useMultiplayerStore((s) => s.status)
  const remotePlayers = useMultiplayerStore((s) => s.players)
  const onlineCount = Object.keys(remotePlayers).length + 1

  // Mouse Lock state
  const isPointerLocked = useInputStore((s) => s.isPointerLocked)
  const togglePointerLock = useInputStore((s) => s.togglePointerLock)

  // Handle clicking the form transformation button
  const handleFormClick = () => {
    toggleForm()
    soundManager.playTransform()
    useMultiplayerStore.getState().sendAction('transform')
  }

  // Status badge config
  const stateBadges: Record<string, { label: string; bg: string }> = {
    IDLE: { label: form === 2 ? '🐺 Sẵn Sàng' : '🐶 Thư giãn', bg: 'bg-emerald-500/80 text-white' },
    WALKING: { label: '🐾 Đi dạo', bg: 'bg-sky-500/80 text-white' },
    RUNNING: { label: '⚡ Chạy nhanh', bg: 'bg-amber-500/90 text-white' },
    JUMPING: { label: '🐾 Nhảy lên', bg: 'bg-emerald-600/90 text-white' },
    BARKING: { label: '🔊 Gâu gâu!', bg: 'bg-rose-500/90 text-white' },
    PEEING: { label: '💦 Đánh dấu', bg: 'bg-yellow-500/90 text-white' },
    SNIFFING: { label: '👃 Đánh hơi', bg: 'bg-indigo-500/80 text-white' },
    ATTACKING: { label: '🥊 Tấn công!', bg: 'bg-red-600/90 text-white animate-pulse' },
  }

  const badge = stateBadges[state] || stateBadges.IDLE

  // Action hint message (only when near an interactable target)
  let actionPrompt = ''
  let actionKey = 'E'
  if (activeTarget) {
    if (activeTarget.type === 'bone') {
      actionPrompt = 'Nhặt Xương Vàng'
      actionKey = 'F'
    } else if (activeTarget.type === 'bush' || activeTarget.type === 'tree') {
      actionPrompt = 'Ngửi & Đánh Dấu'
      actionKey = 'E'
    } else {
      actionPrompt = 'Tương tác'
      actionKey = 'E'
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-10 select-none flex flex-col justify-between p-6">
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div className="flex justify-between items-start">
        {/* Game Title, Player Nickname & Status Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg flex items-center gap-2.5">
            <span className="text-xl">🐕</span>
            <div>
              <div className="font-extrabold text-white tracking-wide text-xs">
                {playerName || 'Cún Cưng'}
              </div>
              <div className="text-[10px] text-amber-300/80 font-mono">Dog World 🐾</div>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase shadow-md transition-all duration-300 ${badge.bg}`}
          >
            {badge.label}
          </div>

          {/* Multiplayer Online Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs text-white/80">
            <span
              className={`w-2 h-2 rounded-full ${
                multiplayerStatus === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-medium">
              {multiplayerStatus === 'CONNECTED'
                ? `${onlineCount} Người chơi online`
                : 'Chế độ Chơi đơn'}
            </span>
          </div>
        </div>

        {/* Pointer Lock Button, Bone Collection Counter & Settings Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={togglePointerLock}
            className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-2xl border backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer text-xs font-bold ${
              isPointerLocked
                ? 'bg-emerald-500/85 hover:bg-emerald-500 border-emerald-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                : 'bg-black/50 hover:bg-black/70 border-white/15 text-white/90 hover:text-white'
            }`}
            title="Bấm để ẩn con trỏ chuột và xoay màn hình tự do (hoặc bấm phím TAB / L)"
          >
            <span className="text-base">{isPointerLocked ? '🎯' : '🖱️'}</span>
            <span>{isPointerLocked ? 'Đang Khóa Chuột' : 'Khóa Chuột (Xoay tự do)'}</span>
            <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[9px] text-white font-extrabold">
              {isPointerLocked ? 'ESC mở' : 'TAB'}
            </span>
          </button>

          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-lg flex items-center gap-2">
            <span className="text-xl animate-pulse">🦴</span>
            <span className="font-bold text-amber-300 text-sm">
              {bonesCollected} <span className="text-white/60 font-normal">/ 8</span>
            </span>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="pointer-events-auto bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-white/80 hover:text-white shadow-lg cursor-pointer"
              title="Settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* ── Active Pointer Lock Free Look Banner ────────────────── */}
      {isPointerLocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300">
          <div className="px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Chế độ xoay chuột tự do đang bật</span>
            <span className="text-[10px] text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded-md">
              Nhấn [ESC] hoặc [TAB] để hiện lại chuột
            </span>
          </div>
        </div>
      )}

      {/* ── Center Crosshair ───────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2.5 h-2.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-black/20 transition-all duration-200" />
      </div>

      {/* ── Dynamic Action Hint (Shown ONLY when near an interactable object) ── */}
      {activeTarget ? (
        <div className="flex flex-col items-center justify-center mb-4 transition-all duration-200">
          <div className="px-5 py-2.5 rounded-2xl backdrop-blur-md border text-sm font-semibold shadow-xl transition-all duration-300 flex items-center gap-2.5 bg-amber-500/90 border-amber-300/40 text-black scale-105 animate-bounce">
            <span className="px-2 py-0.5 rounded bg-white/30 text-xs font-bold font-mono">{actionKey}</span>
            <span>{actionPrompt}</span>
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* ── Bottom Controls & Ultimate Bar ──────────────────────── */}
      <div className="flex justify-between items-end text-xs text-white/70">
        {/* Controls Legend — Dạng Chó (Form 1) */}
        {form === 1 && (
          <div className="bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 space-y-1.5 shadow-xl">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>🐕</span>
              <span>Điều khiển: Cún Shiba</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">WASD</span>
              <span>Di chuyển</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">SPACE</span>
              <span>Nhảy qua vật cản</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">SHIFT</span>
              <span>Chạy nhanh</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">E</span>
              <span>Sủa / Đánh dấu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-400/40 text-amber-200 font-mono text-[10px] font-bold">F</span>
              <span className="text-amber-200 font-medium">Nhặt Xương Vàng</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-yellow-400/40 text-yellow-200 font-mono text-[10px] font-bold">Q</span>
              <span className="text-yellow-200 font-bold">Biến Thành Chiến Binh 🐺</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">CHUỘT</span>
              <span>Xoay góc nhìn ({isPointerLocked ? 'Đang xoay tự do' : 'Bấm TAB khóa chuột'})</span>
            </div>
          </div>
        )}

        {/* Controls Legend — Dạng Chiến Binh (Form 2) */}
        {form === 2 && (
          <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-red-500/40 space-y-1.5 shadow-[0_0_20px_rgba(235,77,75,0.25)]">
            <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>🐺</span>
              <span>Điều khiển: Chiến Binh Chó</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-400/30 font-mono text-[10px] font-extrabold">CHUỘT TRÁI</span>
              <span className="text-red-200 font-bold">Đấm Đá Combo (1-2-3-4)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">WASD</span>
              <span>Di chuyển</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">SPACE</span>
              <span>Bật nhảy cao</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">SHIFT</span>
              <span>Chạy nhanh</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">E</span>
              <span>Gầm gừ / Sủa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-400/40 text-amber-200 font-mono text-[10px] font-bold">F</span>
              <span className="text-amber-200 font-medium">Nhặt Xương</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-yellow-400/40 text-yellow-200 font-mono text-[10px] font-bold">Q</span>
              <span className="text-yellow-200 font-bold">Trở Về Dạng Cún 🐕</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white font-bold">CHUỘT</span>
              <span>Xoay góc nhìn ({isPointerLocked ? 'Đang xoay tự do' : 'Bấm TAB khóa chuột'})</span>
            </div>
          </div>
        )}

        {/* ── Form Transformation & Attack Combo Widget ──────── */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Active Combo Hit Banner (Form 2) */}
          {form === 2 && comboStep > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600/90 to-amber-500/90 text-white font-extrabold shadow-[0_0_25px_rgba(235,77,75,0.8)] border border-yellow-300 animate-bounce">
              <span className="text-lg">
                {comboStep === 1 ? '🥊' : comboStep === 2 ? '💥' : comboStep === 3 ? '🌪️' : '⚡'}
              </span>
              <div>
                <div className="text-[10px] text-yellow-200 uppercase tracking-widest">
                  Combo Hit {comboStep}/4
                </div>
                <div className="text-sm tracking-wide">
                  {comboStep === 1
                    ? 'Cú Đấm Trái'
                    : comboStep === 2
                    ? 'Cú Đấm Phải'
                    : comboStep === 3
                    ? 'Cú Đá Xoay 360°'
                    : 'Đòn Giáng Sấm Sét!'}
                </div>
              </div>
            </div>
          )}

          {/* Form Switch Button (Q key) */}
          <button
            onClick={handleFormClick}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl cursor-pointer ${
              form === 2
                ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white border-2 border-yellow-300 shadow-[0_0_30px_rgba(235,77,75,0.7)]'
                : 'bg-gradient-to-r from-amber-500/90 to-yellow-400/90 hover:from-amber-400 hover:to-yellow-300 text-black border-2 border-yellow-200 shadow-[0_0_25px_rgba(251,197,49,0.7)]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-2xl">
              {form === 2 ? '🐺' : '🐕'}
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-black text-white font-mono text-[9px]">Q</span>
                <span>{form === 2 ? 'Đang Dạng Chiến Binh' : 'Đang Dạng Cún'}</span>
              </div>
              <div className="text-sm font-extrabold tracking-wide drop-shadow-sm">
                {form === 2 ? 'Trở Về Dạng Cún' : 'Chuyển Dạng: Chiến Binh 🥋'}
              </div>
            </div>
          </button>

          <div className="text-right text-[11px] text-white/50 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5">
            {form === 2
              ? 'Nhấp chuột trái liên tục để tung combo đấm đá! 🥊'
              : 'Tìm đủ 8 khúc xương vàng trong bãi cỏ nhé! 🐕'}
          </div>
        </div>
      </div>
    </div>
  )
}
