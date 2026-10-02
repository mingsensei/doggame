import { useState } from 'react'
import { useSettingsStore, type GraphicsQuality } from '@/stores/useSettingsStore'
import { soundManager } from '@/game/audio/SoundManager'
import { getGpuInfo } from '@/utils/gpuDetector'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'graphics' | 'audio'>('graphics')
  const [showGpuHelp, setShowGpuHelp] = useState(false)

  // Audio settings
  const masterVolume = useSettingsStore((s) => s.masterVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume)
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume)

  // Graphics settings
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality)
  const dpr = useSettingsStore((s) => s.dpr)
  const shadowsEnabled = useSettingsStore((s) => s.shadowsEnabled)
  const postProcessingEnabled = useSettingsStore((s) => s.postProcessingEnabled)
  const setGraphicsQuality = useSettingsStore((s) => s.setGraphicsQuality)
  const setDpr = useSettingsStore((s) => s.setDpr)
  const setShadowsEnabled = useSettingsStore((s) => s.setShadowsEnabled)
  const setPostProcessingEnabled = useSettingsStore((s) => s.setPostProcessingEnabled)

  // Hardware GPU info
  const gpuInfo = getGpuInfo()

  const handleVolumeChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(parseFloat(e.target.value))
    soundManager.updateVolumes()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <div className="bg-gray-900/95 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <h2 className="text-white font-extrabold text-base tracking-wide">Cài Đặt Hệ Thống</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-white/70 hover:text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ── Tabs Navigation ────────────────────────────────── */}
        <div className="flex border-b border-white/10 bg-black/20 p-1 gap-1">
          <button
            onClick={() => setActiveTab('graphics')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'graphics'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>⚡</span>
            <span>Đồ Họa & GPU</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔊</span>
            <span>Âm Thanh</span>
          </button>
        </div>

        {/* ── Tab Content ────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-white">
          {activeTab === 'graphics' ? (
            <>
              {/* GPU Hardware Detection Banner */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  gpuInfo.isIntegrated
                    ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                    : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-75 flex items-center gap-1.5">
                      <span>{gpuInfo.isIntegrated ? '⚠️' : '🚀'}</span>
                      <span>GPU Đang Chạy WebGL</span>
                    </div>
                    <div className="font-bold text-xs text-white break-words">
                      {gpuInfo.name}
                    </div>
                  </div>
                  {gpuInfo.isIntegrated && (
                    <button
                      onClick={() => setShowGpuHelp(!showGpuHelp)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-extrabold text-[10px] hover:bg-amber-300 transition-all shrink-0 cursor-pointer"
                    >
                      Cách dùng Card rời
                    </button>
                  )}
                </div>

                {gpuInfo.isIntegrated && (
                  <p className="mt-2 text-[11px] text-amber-200/90 leading-relaxed">
                    Trình duyệt đang chạy bằng <strong className="text-white">GPU tích hợp</strong> thay vì Card rời. Hãy chọn chế độ <strong>Mượt mà (Max FPS)</strong> bên dưới hoặc bật Card rời theo hướng dẫn để đạt 60–120 FPS.
                  </p>
                )}
              </div>

              {/* Windows GPU Guide Popup */}
              {showGpuHelp && (
                <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-400/50 text-[11px] text-white/90 space-y-2">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>3 Bước bật Card rời cho Chrome / Edge trên Windows:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-white/80">
                    <li>Mở <strong>Windows Settings</strong> $\rightarrow$ tìm <strong>Graphics Settings</strong>.</li>
                    <li>Ở mục <em>Custom options for apps</em>, bấm <strong>Browse</strong> $\rightarrow$ chọn file <code>chrome.exe</code> (hoặc <code>msedge.exe</code>).</li>
                    <li>Bấm vào Chrome $\rightarrow$ <strong>Options</strong> $\rightarrow$ tích chọn <strong>High performance</strong> (NVIDIA / AMD) $\rightarrow$ <strong>Save</strong> rồi mở lại trình duyệt!</li>
                  </ol>
                </div>
              )}

              {/* Quality Presets */}
              <div>
                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-2">
                  Chế độ cấu hình nhanh
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'low', label: 'Mượt mà', sub: 'Max FPS ⚡', icon: '⚡' },
                    { id: 'balanced', label: 'Cân bằng', sub: '60 FPS ⚖️', icon: '⚖️' },
                    { id: 'cinematic', label: 'Sắc nét', sub: 'Đẹp nhất ✨', icon: '✨' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setGraphicsQuality(preset.id as GraphicsQuality)}
                      className={`p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                        graphicsQuality === preset.id
                          ? 'bg-amber-400 text-black border-amber-300 font-extrabold shadow-lg scale-102'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      }`}
                    >
                      <div className="text-base mb-0.5">{preset.icon}</div>
                      <div className="text-xs font-bold">{preset.label}</div>
                      <div className={`text-[10px] ${graphicsQuality === preset.id ? 'text-black/70' : 'text-white/50'}`}>
                        {preset.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Toggles */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                  Tùy chỉnh chi tiết
                </div>

                {/* Shadows Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <div className="font-bold text-white text-xs">Đổ bóng thời gian thực (Shadows)</div>
                    <div className="text-[10px] text-white/50">Tắt đi tăng ngay 30–50% FPS trên mọi máy</div>
                  </div>
                  <button
                    onClick={() => setShadowsEnabled(!shadowsEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                      shadowsEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        shadowsEnabled ? 'left-6.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Post-Processing Bloom Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <div className="font-bold text-white text-xs">Hiệu ứng Ánh sáng (Bloom & Flare)</div>
                    <div className="text-[10px] text-white/50">Tia sáng mặt trời và hào quang</div>
                  </div>
                  <button
                    onClick={() => setPostProcessingEnabled(!postProcessingEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                      postProcessingEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        postProcessingEnabled ? 'left-6.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* DPR Scale Selector */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-xs">Độ phân giải hiển thị (Render Scale)</span>
                    <span className="font-mono text-amber-300 font-bold text-xs">{dpr}x</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 0.85, label: '0.85x (Nhẹ)' },
                      { val: 1.0, label: '1.0x (Chuẩn)' },
                      { val: 1.25, label: '1.25x (Nét)' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setDpr(opt.val)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          dpr === opt.val
                            ? 'bg-amber-400 text-black border-amber-300'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Audio Volume Sliders */}
              <SliderRow
                label="🔊 Tổng Âm Lượng"
                value={masterVolume}
                onChange={handleVolumeChange(setMasterVolume)}
              />
              <SliderRow
                label="🎮 Hiệu Ứng Sfx & Gâu Gâu"
                value={sfxVolume}
                onChange={handleVolumeChange(setSfxVolume)}
              />
              <SliderRow
                label="🎵 Âm Môi Trường"
                value={musicVolume}
                onChange={handleVolumeChange(setMusicVolume)}
              />
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-[11px] text-white/50">
          <span>Tự động lưu cấu hình</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold cursor-pointer transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}): JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-white/90 text-xs font-semibold">{label}</span>
        <span className="text-amber-300 font-mono text-xs font-bold">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-amber-400
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:bg-amber-300
          [&::-webkit-slider-thumb]:active:scale-110"
      />
    </div>
  )
}
