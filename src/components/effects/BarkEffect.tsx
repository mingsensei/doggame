import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDogStore } from '@/stores/useDogStore'

export function BarkEffect(): JSX.Element {
  const ringsRef = useRef<THREE.Group>(null)
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)
  const animClock = useRef(0)

  useFrame((_, delta) => {
    const { state, position, rotation } = useDogStore.getState()

    if (state !== 'BARKING') {
      if (ringsRef.current) ringsRef.current.visible = false
      animClock.current = 0
      return
    }

    if (ringsRef.current) {
      ringsRef.current.visible = true
      // Position at dog mouth
      ringsRef.current.position.set(
        position[0] + Math.sin(rotation) * 0.45,
        position[1] + 0.6,
        position[2] + Math.cos(rotation) * 0.45
      )
      ringsRef.current.rotation.y = rotation
    }

    animClock.current += delta * 4

    // 3 Pulsing expanding acoustic wave rings
    const rings = [ring1.current, ring2.current, ring3.current]
    rings.forEach((mesh, index) => {
      if (!mesh) return
      const phase = (animClock.current + index * 0.3) % 1
      const scale = 0.2 + phase * 1.5
      mesh.scale.set(scale, scale, 1)

      const mat = mesh.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.opacity = (1 - phase) * 0.7
      }
    })
  })

  return (
    <group ref={ringsRef} visible={false}>
      <mesh ref={ring1} position={[0, 0, 0.2]}>
        <ringGeometry args={[0.2, 0.26, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2} position={[0, 0, 0.4]}>
        <ringGeometry args={[0.3, 0.38, 24]} />
        <meshBasicMaterial color="#ffeaa7" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3} position={[0, 0, 0.6]}>
        <ringGeometry args={[0.4, 0.5, 24]} />
        <meshBasicMaterial color="#74b9ff" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
