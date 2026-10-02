import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { useDogStore, type DogState } from '@/stores/useDogStore'

/**
 * Animated Shiba Inu 3D Model
 * Model & Skeletal Rig: Quaternius Shiba Inu GLB
 * Features:
 * - Full skeletal animation system (Idle, Walk, Gallop, Jump, Bark/Attack, Sniff, Pee)
 * - Three.js AnimationMixer crossfade blending between actions
 * - Realtime heading synchronization
 * - Casts & receives dynamic shadows
 */
export function DogModel(): JSX.Element {
  const groupRef = useRef<THREE.Group>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)
  const currentStateRef = useRef<DogState>('IDLE')

  // Load Quaternius Shiba Inu model & animations
  const { scene, animations } = useGLTF('/assets/models/dog.glb')
  const { actions } = useAnimations(animations, groupRef)

  // Configure shadows
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  // Resolve matching animation name in glb
  const getActionForState = (state: DogState): THREE.AnimationAction | null => {
    if (!actions) return null

    switch (state) {
      case 'WALKING':
        return actions['Walk'] || actions['AnimalArmature|Walk'] || null
      case 'RUNNING':
        return actions['Gallop'] || actions['AnimalArmature|Gallop'] || null
      case 'JUMPING':
        return actions['Gallop_Jump'] || actions['AnimalArmature|Gallop_Jump'] || null
      case 'BARKING':
        return actions['Attack'] || actions['AnimalArmature|Attack'] || null
      case 'SNIFFING':
        return actions['Idle_2_HeadLow'] || actions['AnimalArmature|Idle_2_HeadLow'] || null
      case 'PEEING':
        return actions['Idle_2'] || actions['AnimalArmature|Idle_2'] || null
      case 'IDLE':
      default:
        return actions['Idle'] || actions['AnimalArmature|Idle'] || null
    }
  }

  // Handle animation transitions with smooth crossfading
  useEffect(() => {
    const targetAction = getActionForState('IDLE')
    if (targetAction) {
      targetAction.reset().fadeIn(0.2).play()
      currentActionRef.current = targetAction
    }

    return () => {
      currentActionRef.current?.stop()
    }
  }, [actions])

  useFrame(() => {
    const { state, rotation } = useDogStore.getState()

    // Sync heading rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation
    }

    // Trigger crossfade when FSM state changes
    if (state !== currentStateRef.current) {
      const nextAction = getActionForState(state)
      const prevAction = currentActionRef.current

      if (nextAction && nextAction !== prevAction) {
        if (prevAction) {
          prevAction.fadeOut(0.18)
        }
        nextAction.reset().fadeIn(0.18).play()
        currentActionRef.current = nextAction
      }
      currentStateRef.current = state
    }
  })

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={[0.26, 0.26, 0.26]}
        position={[0, 0, 0]}
      />
    </group>
  )
}

useGLTF.preload('/assets/models/dog.glb')
