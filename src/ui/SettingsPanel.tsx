import { useSettingsStore } from '@/stores/useSettingsStore'
import { soundManager } from '@/game/audio/SoundManager'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps): JSX.Element {
  const masterVolume = useSettingsStore((s) => s.masterVolume)
  const sfxVolume = useSettingsStore((s) => s.sfxVolume)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume)
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume)
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume)

  const handleChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(parseFloat(e.target.value))
    soundManager.updateVolumes()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 border border-white/10 rounded-3xl shadow-2xl w-[380px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-white font-bold text-lg tracking-wide">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-white/70 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Sliders */}
        <div className="px-6 py-5 space-y-5">
          <SliderRow
            label="🔊 Master Volume"
            value={masterVolume}
            onChange={handleChange(setMasterVolume)}
          />
          <SliderRow
            label="🎮 SFX Volume"
            value={sfxVolume}
            onChange={handleChange(setSfxVolume)}
          />
          <SliderRow
            label="🎵 Ambient Volume"
            value={musicVolume}
            onChange={handleChange(setMusicVolume)}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 text-center">
          <p className="text-white/40 text-xs">Settings saved automatically</p>
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
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-white/90 text-sm font-medium">{label}</span>
        <span className="text-white/50 text-xs font-mono w-8 text-right">
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
