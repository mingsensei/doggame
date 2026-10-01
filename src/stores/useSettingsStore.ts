import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  mouseSensitivity: number
  setMasterVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  setMusicVolume: (v: number) => void
  setMouseSensitivity: (v: number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      masterVolume: 0.8,
      sfxVolume: 1.0,
      musicVolume: 0.4,
      mouseSensitivity: 0.003,

      setMasterVolume: (v) => set({ masterVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setMouseSensitivity: (v) => set({ mouseSensitivity: v }),
    }),
    { name: 'dog-world-settings' },
  ),
)
