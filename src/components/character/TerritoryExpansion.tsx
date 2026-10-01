import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useUltimateStore } from '@/stores/useUltimateStore'
import { useDogStore } from '@/stores/useDogStore'
import { MiniDog } from '@/components/character/MiniDog'

/**
 * 3D Territory Expansion ("Domain Expansion") VFX Manager
 *
 * Features:
 * - Expanding golden translucent barrier dome with Fresnel/energy wireframe
 * - Concentric ground runic seals with counter-rotating sacred geometry
 * - Pulsing outer boundary energy ring
 * - Autonomous mini-dog puppy swarm executing high-speed chaos
 * - Automated lifecycle driven by useUltimateStore
 */
export function TerritoryExpansion(): JSX.Element | null {
  const phase = useUltimateStore((s) => s.phase)
  const expansionProgress = useUltimateStore((s) => s.expansionProgress)
  const domainCenter = useUltimateStore((s) => s.domainCenter)
  const domainRadius = useUltimateStore((s) => s.domainRadius)
  const miniDogs = useUltimateStore((s) => s.miniDogs)

  const innerSealRef = useRef<THREE.Group>(null)
  const outerSealRef = useRef<THREE.Group>(null)
  const domeRef = useRef<THREE.Mesh>(null)

  // Advance Ultimate Store simulation clock every frame
  useFrame((_, delta) => {
    const dogPos = useDogStore.getState().position
    useUltimateStore.getState().tick(delta, dogPos)

    if (innerSealRef.current) {
      innerSealRef.current.rotation.z += delta * 0.6
    }
    if (outerSealRef.current) {
      outerSealRef.current.rotation.z -= delta * 0.35
    }
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * 0.2
    }
  })

  // Only render visuals during active phases
  const isVisible = phase === 'ACTIVATING' || phase === 'CHAOS' || phase === 'CLEANUP'
  if (!isVisible) return null

  const currentRadius = Math.max(0.5, domainRadius * expansionProgress)
  const opacity = phase === 'CLEANUP' ? expansionProgress * 0.6 : 0.65

  return (
    <group position={domainCenter}>
      {/* ── 1. Translucent Golden Barrier Dome ── */}
      <mesh ref={domeRef} position={[0, 0, 0]}>
        <sphereGeometry args={[currentRadius, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color="#fbc531"
          emissive="#e1b12c"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={opacity * 0.35}
          side={THREE.DoubleSide}
          wireframe={false}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe Domain Boundary Shell */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[currentRadius * 0.998, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshBasicMaterial
          color="#f5cd79"
          wireframe
          transparent
          opacity={opacity * 0.35}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2. Outer Perimeter Glowing Boundary Ring ── */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[currentRadius - 0.45, currentRadius, 64]} />
        <meshBasicMaterial
          color="#fbc531"
          transparent
          opacity={opacity * 0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── 3. Ground Sacred Domain Runic Seals ── */}
      {/* Counter-rotating Inner Magic Seal */}
      <group ref={innerSealRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[currentRadius * 0.25, currentRadius * 0.3, 32]} />
          <meshBasicMaterial
            color="#e1b12c"
            transparent
            opacity={opacity * 0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[currentRadius * 0.55, currentRadius * 0.6, 48]} />
          <meshBasicMaterial
            color="#fbc531"
            transparent
            opacity={opacity * 0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Counter-rotating Outer Magic Spokes */}
      <group ref={outerSealRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[currentRadius * 0.82, currentRadius * 0.86, 64]} />
          <meshBasicMaterial
            color="#ffeaa7"
            transparent
            opacity={opacity * 0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ── 4. Golden Domain Pillar Center Light ── */}
      <pointLight color="#fbc531" intensity={3.5 * expansionProgress} distance={currentRadius * 1.5} />

      {/* ── 5. Summoned Mini Dogs Swarm ── */}
      {miniDogs.map((dog) => (
        <MiniDog key={dog.id} data={dog} />
      ))}
    </group>
  )
}
