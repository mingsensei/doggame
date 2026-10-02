import { useDogStore } from '@/stores/useDogStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { useUltimateStore } from '@/stores/useUltimateStore'
import { useMultiplayerStore } from '@/stores/useMultiplayerStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface HUDProps {
  onOpenSettings?: () => void
}

export function HUD({ onOpenSettings }: HUDProps): JSX.Element {
  const state = useDogStore((s) => s.state)
  const bonesCollected = useDogStore((s) => s.bonesCollected)
  const activeTarget = useInteractionStore((s) => s.activeTarget)

  // Player & Multiplayer Info
  const playerName = useSettingsStore((s) => s.playerName)
  const multiplayerStatus = useMultiplayerStore((s) => s.status)
  const remotePlayers = useMultiplayerStore((s) => s.players)
  const onlineCount = Object.keys(remotePlayers).length + 1

  // Ultimate Skill Store
  const ultimatePhase = useUltimateStore((s) => s.phase)
  const activeTimer = useUltimateStore((s) => s.activeTimer)
  const cooldownTimer = useUltimateStore((s) => s.cooldownTimer)
  const cooldownDuration = useUltimateStore((s) => s.cooldownDuration)
  const triggerUltimate = useUltimateStore((s) => s.triggerUltimate)

  // Status badge config
  const stateBadges: Record<string, { label: string; bg: string }> = {
    IDLE: { label: '🐶 Thư giãn', bg: 'bg-emerald-500/80 text-white' },
    WALKING: { label: '🐾 Đi dạo', bg: 'bg-sky-500/80 text-white' },
    RUNNING: { label: '⚡ Chạy nhanh', bg: 'bg-amber-500/90 text-white' },
    JUMPING: { label: '🐾 Nhảy lên', bg: 'bg-emerald-600/90 text-white' },
    BARKING: { label: '🔊 Gâu gâu!', bg: 'bg-rose-500/90 text-white' },
    PEEING: { label: '💦 Đánh dấu', bg: 'bg-yellow-500/90 text-white' },
    SNIFFING: { label: '👃 Đánh hơi', bg: 'bg-indigo-500/80 text-white' },
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

  // Handle clicking the ultimate button
  const handleUltimateClick = () => {
    const pos = useDogStore.getState().position
    triggerUltimate(pos)
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

        {/* Bone Collection Counter & Settings Button */}
        <div className="flex items-center gap-3">
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-lg flex items-center gap-2">
            <span className="text-xl animate-pulse">🦴</span>
            <span className="font-bold text-amber-300 text-sm">
              {bonesCollected} <span className="text-white/60 font-normal">/ 8</span>
            </span>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="pointer-events-auto bg-black/40 hover:bg-black/60 active:scale-95 transition-all backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-white/80 hover:text-white shadow-lg"
              title="Settings"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

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
        {/* Controls Legend */}
        <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white">WASD</span>
            <span>Di chuyển</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white">SPACE</span>
            <span>Nhảy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white">SHIFT</span>
            <span>Chạy nhanh</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white">E</span>
            <span>Sủa / Đánh dấu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-400/40 text-amber-200 font-mono text-[10px] font-bold">F</span>
            <span className="text-amber-200 font-medium">Nhặt Xương</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-yellow-400/40 text-yellow-200 font-mono text-[10px] font-bold">Q</span>
            <span className="text-yellow-200 font-medium">Mở Lãnh Địa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] text-white">CHUỘT</span>
            <span>Xoay góc nhìn</span>
          </div>
        </div>

        {/* ── Ultimate Skill "Territory Expansion" Widget ──────── */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {ultimatePhase === 'READY' && (
            <button
              onClick={handleUltimateClick}
              className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/90 to-yellow-400/90 hover:from-amber-400 hover:to-yellow-300 text-black font-bold shadow-[0_0_25px_rgba(251,197,49,0.7)] border-2 border-yellow-200 transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center text-xl">
                👑
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-black text-white font-mono text-[9px]">Q</span>
                  <span>Sẵn Sàng</span>
                </div>
                <div className="text-sm font-extrabold tracking-wide text-black drop-shadow-sm">
                  Bành Trướng Lãnh Địa
                </div>
              </div>
            </button>
          )}

          {(ultimatePhase === 'ACTIVATING' || ultimatePhase === 'CHAOS' || ultimatePhase === 'CLEANUP') && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-500/80 to-amber-600/80 backdrop-blur-md text-white border-2 border-amber-300 shadow-[0_0_30px_rgba(243,156,18,0.8)] animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl animate-spin">
                ⚡
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-yellow-200 font-bold flex items-center gap-1.5">
                  <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-yellow-300 opacity-75"></span>
                  <span>Đang Kích Hoạt</span>
                </div>
                <div className="text-sm font-extrabold tracking-wide text-white flex items-center gap-2">
                  <span>Còn lại: {activeTimer.toFixed(1)}s</span>
                  <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-300 transition-all duration-100"
                      style={{ width: `${Math.max(0, Math.min(100, (activeTimer / 7.0) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {ultimatePhase === 'COOLDOWN' && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white/50">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-mono text-xs text-amber-400 font-bold border border-white/10">
                Q
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  Lãnh Địa
                </div>
                <div className="text-xs font-mono font-bold text-amber-300/80">
                  Hồi chiêu: {cooldownTimer.toFixed(1)}s
                </div>
              </div>
              {/* Radial or linear CD indicator */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400/80 transition-all duration-100"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((cooldownDuration - cooldownTimer) / cooldownDuration) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="text-right text-[11px] text-white/50 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5">
            Tìm đủ 8 khúc xương vàng trong bãi cỏ nhé! 🐕
          </div>
        </div>
      </div>
    </div>
  )
}
