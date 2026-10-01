import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PCFSoftShadowMap, ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { Scene } from '@/components/scene/Scene'
import { HUD } from '@/ui/HUD'
import { LoadingScreen } from '@/ui/LoadingScreen'
import { SettingsPanel } from '@/ui/SettingsPanel'
import { VictoryScreen } from '@/ui/VictoryScreen'
import { useInputControls } from '@/hooks/useInputControls'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { CAMERA_FOV_DEFAULT } from '@/utils/constants'

/**
 * App root — mounts R3F Canvas and HTML UI overlay side-by-side.
 *
 * Separation of concerns:
 * - Canvas: all 3D rendering
 * - HTML overlay: HUD, loading screen, settings, victory
 */
export default function App(): JSX.Element {
  const [showSettings, setShowSettings] = useState(false)

  // Register keyboard & mouse drag listeners at app root (outside Canvas)
  useInputControls()
  // Mute audio when tab is hidden
  usePageVisibility()

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-black">
      {/* ── 3D Canvas ──────────────────────────────────────────── */}
      <Suspense fallback={<LoadingScreen />}>
        <Canvas
          shadows={{ type: PCFSoftShadowMap, enabled: true }}
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
          dpr={[1, 1.25]}
          className="w-full h-full"
        >
          <Scene />
        </Canvas>
      </Suspense>

      {/* ── HTML Overlay ───────────────────────────────────────── */}
      <HUD onOpenSettings={() => setShowSettings(true)} />
      <VictoryScreen />

      {/* ── Settings Modal ─────────────────────────────────────── */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
