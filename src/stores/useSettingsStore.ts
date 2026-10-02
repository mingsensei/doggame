import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GraphicsQuality = 'low' | 'balanced' | 'cinematic'

interface SettingsStore {
  playerName: string
  graphicsQuality: GraphicsQuality
  dpr: number
  shadowsEnabled: boolean
  postProcessingEnabled: boolean
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  mouseSensitivity: number

  setPlayerName: (name: string) => void
  setGraphicsQuality: (q: GraphicsQuality) => void
  setMasterVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  setMusicVolume: (v: number) => void
  setMouseSensitivity: (v: number) => void
}

const DEFAULT_NAMES = [
  'ShibaPro',
  'CúnVàng',
  'ChopKing',
  'BossTuất',
  'Mochi',
  'Lucky',
  'AkitaNinja',
  'PugLười',
]

const randomInitialName =
  DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)]

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      playerName: randomInitialName,
      graphicsQuality: 'balanced',
      dpr: 1.0,
      shadowsEnabled: true,
      postProcessingEnabled: true,
      masterVolume: 0.8,
      sfxVolume: 1.0,
      musicVolume: 0.4,
      mouseSensitivity: 0.003,

      setPlayerName: (playerName: string) => set({ playerName }),

      setGraphicsQuality: (q: GraphicsQuality) => {
        if (q === 'low') {
          set({
            graphicsQuality: 'low',
            dpr: 0.85,
            shadowsEnabled: false,
            postProcessingEnabled: false,
          })
        } else if (q === 'balanced') {
          set({
            graphicsQuality: 'balanced',
            dpr: 1.0,
            shadowsEnabled: true,
            postProcessingEnabled: true,
          })
        } else {
          set({
            graphicsQuality: 'cinematic',
            dpr: 1.25,
            shadowsEnabled: true,
            postProcessingEnabled: true,
          })
        }
      },

      setMasterVolume: (v: number) => set({ masterVolume: v }),
      setSfxVolume: (v: number) => set({ sfxVolume: v }),
      setMusicVolume: (v: number) => set({ musicVolume: v }),
      setMouseSensitivity: (v: number) => set({ mouseSensitivity: v }),
    }),
    { name: 'dog-world-settings' }
  )
)
