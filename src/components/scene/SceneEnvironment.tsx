import { useMemo, useRef } from 'react'
import { Sky, Environment, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Realistic Blue Sky with 3D Sun and Animated Floating Clouds
 * Assets:
 * - Sun GLB: Zeph Sun by DJ Logitrax (/assets/models/sun.glb)
 * - Clouds GLB: Clouds by Jarlan Perez (/assets/models/clouds.glb)
 * Features:
 * - Clear, vibrant azure blue sky with calibrated atmospheric scattering
 * - Glowing 3D Sun oriented towards the player with solar flare lighting
 * - Gently drifting fluffy 3D clouds with continuous sky wrapping
 * - Directional sunlight with 2048px soft shadows & natural hemisphere bounce
 */
export function SceneEnvironment(): JSX.Element {
  // Sun celestial coordinates (elevated high-noon/afternoon sunny angle)
  const sunPos: [number, number, number] = [65, 50, 65]

  return (
    <>
      {/* ── 1. Clear Vibrant Blue Sky Dome ─────────────────────────── */}
      <Sky
        distance={450000}
        sunPosition={sunPos}
        turbidity={0.6} // Crystal clear blue sky (minimal dust haze)
        rayleigh={0.35} // Deep azure Rayleigh scattering
        mieCoefficient={0.001}
        mieDirectionalG={0.8}
      />

      {/* ── 2. HDR Outdoor Reflections & Diffuse Ambient ──────────── */}
      <Environment preset="park" background={false} environmentIntensity={0.65} />

      {/* ── 3. 3D Sun Model in the Sky ────────────────────────────── */}
      <Sun3D position={sunPos} />

      {/* ── 4. Floating & Drifting 3D Fluffy Clouds ───────────────── */}
      <DriftingClouds />

      {/* ── 5. Primary Sunlight with Crisp Soft Shadows ───────────── */}
      <directionalLight
        position={sunPos}
        intensity={3.2}
        color="#fffbe8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={5}
        shadow-camera-far={180}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
      />

      {/* ── 6. Natural Outdoor Hemisphere Light (Vibrant Blue + Green Bounce) ── */}
      <hemisphereLight
        args={['#70b5ff', '#3d6124', 0.85]}
      />

      {/* ── 7. Soft Blue Skylight Fill ────────────────────────────── */}
      <directionalLight
        position={[-40, 30, -40]}
        intensity={0.4}
        color="#93c5fd"
      />

      {/* ── 8. Soft Aerial Horizon Fog (blends smoothly into blue sky) ── */}
      <fog attach="fog" args={['#a3d8f8', 75, 230]} />
    </>
  )
}

// ─── 3D Sun Component ────────────────────────────────────────────────────────

function Sun3D({ position }: { position: [number, number, number] }): JSX.Element {
  const sunRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/assets/models/sun.glb')

  const clonedSun = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat) {
          mat.emissive = new THREE.Color('#ffeaa7')
          mat.emissiveIntensity = 2.5 // Shines brilliantly through the bloom pipeline
        }
      }
    })
    return clone
  }, [scene])

  useFrame(() => {
    if (sunRef.current) {
      // Keep sun disc oriented towards the center of the world
      sunRef.current.lookAt(0, 5, 0)
    }
  })

  return (
    <group ref={sunRef} position={position}>
      <primitive object={clonedSun} scale={[3.8, 3.8, 3.8]} />
      {/* Warm solar flare glow */}
      <pointLight color="#ffeaa7" intensity={3.5} distance={120} />
    </group>
  )
}

useGLTF.preload('/assets/models/sun.glb')

// ─── Drifting 3D Clouds Component ────────────────────────────────────────────

interface CloudData {
  group: THREE.Group
  speed: number
  altitude: number
}

function DriftingClouds(): JSX.Element {
  const { scene } = useGLTF('/assets/models/clouds.glb')
  const cloudsRef = useRef<THREE.Group>(null)

  const cloudList = useMemo(() => {
    const list: CloudData[] = []
    const cloudCount = 14
    const skyRadius = 120

    for (let i = 0; i < cloudCount; i++) {
      const clone = scene.clone(true)
      const x = (Math.random() - 0.5) * skyRadius * 2
      const z = (Math.random() - 0.5) * skyRadius * 2
      const altitude = 38 + Math.random() * 26 // Floating high in the sky

      // Cloud scale variation
      const s = 18 + Math.random() * 18
      const sy = s * (0.6 + Math.random() * 0.4)

      clone.position.set(x, altitude, z)
      clone.scale.set(s, sy, s)
      clone.rotation.y = Math.random() * Math.PI * 2

      // Pure white puffy cloud material
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.9,
            metalness: 0.0,
          })
          mesh.castShadow = false // Sky clouds don't need real-time shadow map passes
        }
      })

      list.push({
        group: clone,
        speed: 0.8 + Math.random() * 1.4, // Gentle breeze drift speed
        altitude,
      })
    }

    return list
  }, [scene])

  // Animate clouds gently drifting with wind across the sky
  useFrame((_, delta) => {
    const skyBound = 130
    cloudList.forEach((cloud) => {
      cloud.group.position.x += cloud.speed * delta * 2.5
      cloud.group.position.z += cloud.speed * delta * 1.0

      // Wrap around when drifting beyond the sky horizon
      if (cloud.group.position.x > skyBound) {
        cloud.group.position.x = -skyBound
      }
      if (cloud.group.position.z > skyBound) {
        cloud.group.position.z = -skyBound
      }
    })
  })

  return (
    <group ref={cloudsRef}>
      {cloudList.map((cloud, idx) => (
        <primitive key={`cloud-${idx}`} object={cloud.group} />
      ))}
    </group>
  )
}

useGLTF.preload('/assets/models/clouds.glb')
