import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { InteractableZone } from './InteractableZone'
import { useDogStore } from '@/stores/useDogStore'
import { useInputStore } from '@/stores/useInputStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { soundManager } from '@/game/audio/SoundManager'

interface BoneProps {
  id: string
  position: [number, number, number]
}

export function Bone({ id, position }: BoneProps): JSX.Element | null {
  const meshRef = useRef<THREE.Group>(null)
  const [collected, setCollected] = useState(false)
  const { collectBone } = useDogStore()

  useFrame((_, delta) => {
    if (collected) return
    if (meshRef.current) {
      // Gentle floating bob and rotation
      meshRef.current.rotation.y += delta * 1.5
      meshRef.current.position.y = position[1] + 0.35 + Math.sin(Date.now() * 0.003) * 0.1
    }

    // Check if player presses F while this bone is activeTarget
    const { activeTarget } = useInteractionStore.getState()
    const { collect } = useInputStore.getState()
    if (collect && activeTarget?.id === id && !collected) {
      useInputStore.getState().setKey('collect', false)
      setCollected(true)
      collectBone()
      soundManager.playBoneCollect()
    }
  })

  if (collected) return null

  return (
    <group position={position}>
      <group ref={meshRef}>
        {/* Central bone shaft */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.45, 8]} />
          <meshStandardMaterial color="#fffbe0" roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Left bone knobs */}
        <mesh position={[-0.24, 0.07, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#fffbe0" roughness={0.3} />
        </mesh>
        <mesh position={[-0.24, -0.07, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#fffbe0" roughness={0.3} />
        </mesh>

        {/* Right bone knobs */}
        <mesh position={[0.24, 0.07, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#fffbe0" roughness={0.3} />
        </mesh>
        <mesh position={[0.24, -0.07, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#fffbe0" roughness={0.3} />
        </mesh>

        {/* Golden Sparkle Glow Aura */}
        <pointLight color="#fbc531" intensity={2} distance={2.5} />
      </group>

      <InteractableZone id={id} type="bone" position={position} radius={1.8} />
    </group>
  )
}
