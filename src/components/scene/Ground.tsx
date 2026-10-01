import { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { GrassField } from '@/components/environment/GrassField'

const GROUND_SIZE = 200

/**
 * Realistic Ground Plane:
 * - Generates high-resolution procedural turf texture with micro-grain noise and soil tones
 * - Physical properties: high friction, zero restitution for realistic dog paw contact
 * - Houses the GPU-animated GrassField instanced mesh
 */
export function Ground(): JSX.Element {
  // Procedurally generate seamless turf texture with subtle color variations
  const groundTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Base turf green
      ctx.fillStyle = '#487532'
      ctx.fillRect(0, 0, 512, 512)

      // Layered noise for organic soil, clover patches, and earthy grain
      for (let i = 0; i < 40000; i++) {
        const x = Math.random() * 512
        const y = Math.random() * 512
        const radius = Math.random() * 2.5 + 0.5
        const roll = Math.random()

        if (roll < 0.4) {
          ctx.fillStyle = '#395e26' // darker forest soil
        } else if (roll < 0.75) {
          ctx.fillStyle = '#558838' // bright sunlit clover
        } else {
          ctx.fillStyle = '#2f4f1d' // damp loam patch
        }

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(40, 40)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  return (
    <>
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
          <meshStandardMaterial
            map={groundTexture}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
      </RigidBody>

      {/* GPU Vertex-Animated Grass Field */}
      <GrassField />
    </>
  )
}

