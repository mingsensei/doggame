import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import { SceneEnvironment } from './SceneEnvironment'
import { Ground } from './Ground'
import { World } from './World'
import { Dog } from '@/components/character/Dog'
import { TerritoryExpansion } from '@/components/character/TerritoryExpansion'
import { ThirdPersonCamera } from '@/components/camera/ThirdPersonCamera'
import { PeeEffect } from '@/components/effects/PeeEffect'
import { BarkEffect } from '@/components/effects/BarkEffect'
import { FootstepParticles } from '@/components/effects/FootstepParticles'
import { DogAudio } from '@/components/character/DogAudio'
import { PostProcessing } from './PostProcessing'

/**
 * Root R3F scene component.
 * Composes: physics → environment → ground → world → dog → effects → audio → camera → postprocessing
 */
export function Scene(): JSX.Element {
  return (
    <>
      <Physics gravity={[0, -20, 0]}>
        <Suspense fallback={null}>
          <SceneEnvironment />
          <Ground />
          <World />
          <Dog />
          <TerritoryExpansion />
          <PeeEffect />
          <BarkEffect />
          <FootstepParticles />
          <DogAudio />
          <ThirdPersonCamera />
        </Suspense>
      </Physics>
      <PostProcessing />
    </>
  )
}
