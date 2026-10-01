import { useRef, useMemo, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import type { MiniDogState } from '@/stores/useUltimateStore'

interface MiniDogProps {
  data: MiniDogState
}

export function MiniDog({ data }: MiniDogProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)

  // Use cached dog glb
  const { scene, animations } = useGLTF('/assets/models/dog.glb')

  // Clone skeletal hierarchy independently for each mini puppy
  const clonedScene = useMemo(() => {
    const cloned = cloneSkeleton(scene)
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return cloned
  }, [scene])

  const { actions } = useAnimations(animations, groupRef)

  // Switch animation based on data.action ('Gallop' | 'Gallop_Jump' | 'Attack')
  useEffect(() => {
    if (!actions) return
    const targetName =
      data.action === 'Gallop_Jump'
        ? actions['Gallop_Jump'] || actions['AnimalArmature|Gallop_Jump']
        : actions['Gallop'] || actions['AnimalArmature|Gallop']

    if (targetName && targetName !== currentActionRef.current) {
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.12)
      }
      targetName.reset().fadeIn(0.12).play()
      targetName.timeScale = 1.7 // High-energy mini puppy zoomies!
      currentActionRef.current = targetName
    }
  }, [actions, data.action])

  // Sync position & rotation from store
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(data.position[0], data.position[1], data.position[2])
      groupRef.current.rotation.y = data.rotation
    }
  })

  return (
    <group ref={groupRef} position={data.position} rotation={[0, data.rotation, 0]}>
      {/* Mini Shiba Inu Model */}
      <primitive object={clonedScene} scale={[data.scale, data.scale, data.scale]} />

      {/* Golden Summoning Aura Disc under paws */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.45, 16]} />
        <meshBasicMaterial color="#fbc531" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Mini Golden Glow Light */}
      <pointLight color="#fbc531" intensity={0.8} distance={2.5} />
    </group>
  )
}
