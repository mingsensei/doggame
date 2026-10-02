import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { PCFSoftShadowMap, ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { Scene } from '@/components/scene/Scene'
import { HUD } from '@/ui/HUD'
import { LoadingScreen } from '@/ui/LoadingScreen'
import { EntryScreen } from '@/ui/EntryScreen'
import { SettingsPanel } from '@/ui/SettingsPanel'
import { VictoryScreen } from '@/ui/VictoryScreen'
import { useInputControls } from '@/hooks/useInputControls'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { CAMERA_FOV_DEFAULT } from '@/utils/constants'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useMultiplayerStore } from '@/stores/useMultiplayerStore'

export type GameState = 'ENTRY' | 'LOADING' | 'PLAYING'

/**
 * App root — orchestrates Entry lobby, Loading screen, 3D Canvas, and HUD.
 */
export default function App(): JSX.Element {
  const [gameState, setGameState] = useState<GameState>('ENTRY')
  const [showSettings, setShowSettings] = useState(false)

  const dpr = useSettingsStore((s) => s.dpr)
  const shadowsEnabled = useSettingsStore((s) => s.shadowsEnabled)

  // Register keyboard & mouse drag listeners at app root (outside Canvas)
  useInputControls()
  // Mute audio when tab is hidden
  usePageVisibility()

  const handleJoinGame = useCallback((playerName: string) => {
    // Connect to WebSocket multiplayer room
    useMultiplayerStore.getState().connect(playerName)
    // Transition to loading screen
    setGameState('LOADING')
  }, [])

  const handleLoaded = useCallback(() => {
    setGameState('PLAYING')
  }, [])

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-black">
      {/* ── 3D Canvas (Starts rendering once player leaves Entry screen to load assets) ── */}
      {gameState !== 'ENTRY' && (
        <Suspense fallback={null}>
          <Canvas
            shadows={shadowsEnabled ? { type: PCFSoftShadowMap, enabled: true } : false}
            camera={{
              fov: CAMERA_FOV_DEFAULT,
              near: 0.1,
              far: 500,
              position: [0, 5, 10],
            }}
            gl={{
              antialias: true,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
              toneMappingExposure: 1.0,
              outputColorSpace: SRGBColorSpace,
            }}
            dpr={dpr}
            className="w-full h-full"
          >
            <Scene />
          </Canvas>
        </Suspense>
      )}

      {/* ── Entry Screen (Nickname & Quality Select) ── */}
      {gameState === 'ENTRY' && <EntryScreen onJoin={handleJoinGame} />}

      {/* ── Loading Screen (Progress bar, tip carousel, 3D loader) ── */}
      {gameState === 'LOADING' && <LoadingScreen onLoaded={handleLoaded} />}

      {/* ── In-Game HUD & Victory (when Playing) ── */}
      {gameState === 'PLAYING' && (
        <>
          <HUD onOpenSettings={() => setShowSettings(true)} />
          <VictoryScreen />
        </>
      )}

      {/* ── Settings Modal ── */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

