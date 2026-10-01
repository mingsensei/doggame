import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useDogStore } from '@/stores/useDogStore'
import { soundManager } from '@/game/audio/SoundManager'
import { FOOTSTEP_WALK_INTERVAL, FOOTSTEP_RUN_INTERVAL } from '@/utils/constants'

export function DogAudio(): null {
  const lastState = useRef(useDogStore.getState().state)
  const footstepTimer = useRef(0)

  // Start background ambient sound on first user interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      soundManager.startAmbient()
      window.removeEventListener('keydown', handleFirstGesture)
      window.removeEventListener('pointerdown', handleFirstGesture)
    }

    window.addEventListener('keydown', handleFirstGesture)
    window.addEventListener('pointerdown', handleFirstGesture)

    return () => {
      window.removeEventListener('keydown', handleFirstGesture)
      window.removeEventListener('pointerdown', handleFirstGesture)
    }
  }, [])

  useFrame((_, delta) => {
    const { state, position } = useDogStore.getState()

    // 1. Detect state entry for single-shot SFX
    if (state !== lastState.current) {
      if (state === 'BARKING') {
        soundManager.playBark(Math.floor(Math.random() * 3))
      } else if (state === 'PEEING') {
        soundManager.playPee()
      } else if (state === 'SNIFFING') {
        soundManager.playSniff()
      }
      lastState.current = state
    }

    // 2. Surface-aware continuous footstep sounds
    if (state === 'WALKING' || state === 'RUNNING') {
      const isRunning = state === 'RUNNING'
      const interval =
        (isRunning ? FOOTSTEP_RUN_INTERVAL : FOOTSTEP_WALK_INTERVAL) / 1000

      footstepTimer.current += delta
      if (footstepTimer.current >= interval) {
        footstepTimer.current = 0
        soundManager.playFootstep('grass', isRunning)
      }
    } else {
      footstepTimer.current = 0
    }
  })

  return null
}
