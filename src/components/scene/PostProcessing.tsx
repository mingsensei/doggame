import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/**
 * Lightweight Cinematic Post-Processing Pipeline
 * Optimized for high framerates:
 * - Subtle bloom for solar flares and golden aura highlights
 * - Cinematic vignette for contrast and depth
 */
export function PostProcessing(): JSX.Element {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false} autoClear={false}>
      <Bloom
        intensity={0.2}
        luminanceThreshold={0.92}
        luminanceSmoothing={0.08}
        mipmapBlur={false}
      />
      <Vignette
        offset={0.35}
        darkness={0.4}
        eskil={false}
      />
    </EffectComposer>
  )
}
