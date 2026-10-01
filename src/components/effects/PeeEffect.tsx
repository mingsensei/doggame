import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDogStore } from '@/stores/useDogStore'

export function PeeEffect(): JSX.Element | null {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 30

  // Pre-allocate geometry and velocities
  const positions = useRef(new Float32Array(count * 3))
  const velocities = useRef<THREE.Vector3[]>(
    Array.from({ length: count }, () => new THREE.Vector3())
  )

  useFrame((_, delta) => {
    const { state, position, rotation } = useDogStore.getState()
    if (state !== 'PEEING') {
      if (particlesRef.current) particlesRef.current.visible = false
      return
    }

    if (particlesRef.current) {
      particlesRef.current.visible = true
      const posAttr = particlesRef.current.geometry.attributes.position

      // Compute dog's rear right hip position in world space
      const hipX = position[0] + Math.cos(rotation) * 0.2 - Math.sin(rotation) * -0.2
      const hipY = position[1] + 0.35
      const hipZ = position[2] + Math.sin(rotation) * 0.2 + Math.cos(rotation) * -0.2

      for (let i = 0; i < count; i++) {
        let px = posAttr.getX(i)
        let py = posAttr.getY(i)
        let pz = posAttr.getZ(i)

        // If particle hit ground or uninitialized, spawn at hip
        if (py <= 0.05 || (px === 0 && py === 0 && pz === 0)) {
          px = hipX + (Math.random() - 0.5) * 0.05
          py = hipY
          pz = hipZ + (Math.random() - 0.5) * 0.05

          // Spray outward from dog's right side
          const sprayAngle = rotation + Math.PI / 2 + (Math.random() - 0.5) * 0.4
          velocities.current[i].set(
            Math.sin(sprayAngle) * (1.2 + Math.random() * 0.8),
            0.5 + Math.random() * 0.5,
            Math.cos(sprayAngle) * (1.2 + Math.random() * 0.8)
          )
        } else {
          // Physics step
          velocities.current[i].y -= 9.8 * delta // gravity
          px += velocities.current[i].x * delta
          py += velocities.current[i].y * delta
          pz += velocities.current[i].z * delta
        }

        posAttr.setXYZ(i, px, py, pz)
      }
      posAttr.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef} visible={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#f1c40f"
        size={0.08}
        transparent
        opacity={0.8}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}
