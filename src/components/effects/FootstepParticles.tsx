import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDogStore } from '@/stores/useDogStore'

export function FootstepParticles(): JSX.Element {
  const count = 25
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useRef(new Float32Array(count * 3))
  const lifetimes = useRef(new Float32Array(count))
  const spawnTimer = useRef(0)

  useFrame((_, delta) => {
    const { state, position, rotation, speed } = useDogStore.getState()
    const posAttr = pointsRef.current?.geometry.attributes.position

    if (!posAttr) return

    spawnTimer.current += delta

    // Spawn new dust puff behind dog when moving
    if ((state === 'RUNNING' || state === 'WALKING') && spawnTimer.current > (state === 'RUNNING' ? 0.08 : 0.16)) {
      spawnTimer.current = 0

      // Find an expired particle
      for (let i = 0; i < count; i++) {
        if (lifetimes.current[i] <= 0) {
          lifetimes.current[i] = 0.5 // 0.5s lifetime
          const rearOffset = 0.35
          const sideOffset = (Math.random() - 0.5) * 0.25
          const px = position[0] - Math.sin(rotation) * rearOffset + Math.cos(rotation) * sideOffset
          const py = 0.08
          const pz = position[2] - Math.cos(rotation) * rearOffset - Math.sin(rotation) * sideOffset
          posAttr.setXYZ(i, px, py, pz)
          break
        }
      }
    }

    // Update existing particles
    for (let i = 0; i < count; i++) {
      if (lifetimes.current[i] > 0) {
        lifetimes.current[i] -= delta
        const y = posAttr.getY(i) + delta * 0.25 // drift up slightly
        posAttr.setY(i, y)
      } else {
        posAttr.setXYZ(i, 0, -10, 0) // hide offscreen
      }
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#c8d6af"
        size={0.12}
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </points>
  )
}
