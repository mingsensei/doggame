import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useDogStore } from '@/stores/useDogStore'

/**
 * DogWarriorModel — Form 2: Humanoid Dog Warrior (Chiến Binh Chó)
 * Model from assets: dog-warrior-3d-character-model-free
 * Features:
 * - Fluid procedural locomotion & combat animation
 * - 4-Hit Martial Arts Attack Combo (Jab -> Cross Hook -> 360 Spin Kick -> Power Slam)
 * - Dynamic punch/kick slash arcs & ground slam shockwave
 * - Jump, Bark, Run & Idle support
 */
export function DogWarriorModel(): JSX.Element {
  const rootGroupRef = useRef<THREE.Group>(null)
  const meshGroupRef = useRef<THREE.Group>(null)
  const slashArcRef = useRef<THREE.Mesh>(null)
  const slamRingRef = useRef<THREE.Mesh>(null)
  const [transformBurst, setTransformBurst] = useState(true)

  // Load dog warrior model
  const { scene } = useGLTF('/assets/models/dogwarrior.glb')

  // Configure shadows
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  // Transformation burst fadeout
  useEffect(() => {
    const timer = setTimeout(() => setTransformBurst(false), 900)
    return () => clearTimeout(timer)
  }, [])

  // Animation cycle variables
  const walkPhase = useRef(0)
  const prevAttackTime = useRef(0)

  useFrame((state, delta) => {
    const {
      state: dogState,
      rotation,
      speed,
      comboStep,
      lastAttackTimestamp,
    } = useDogStore.getState()

    // Heading rotation on root group
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.y = rotation
    }

    const mesh = meshGroupRef.current
    if (!mesh) return

    const now = Date.now()
    const attackAge = (now - lastAttackTimestamp) / 1000 // seconds since attack

    // ── 1. Combat Attack Animation (Overrides body posture) ─────
    if (comboStep > 0 && attackAge < 0.45) {
      const progress = attackAge / 0.45 // 0 to 1

      if (comboStep === 1) {
        // Step 1: Left Jab
        // Thrust forward, quick torso twist
        const thrust = Math.sin(progress * Math.PI) * 0.4
        mesh.position.set(0.12, 0, thrust)
        mesh.rotation.set(0.1, 0.4 * Math.sin(progress * Math.PI), -0.05)

        if (slashArcRef.current) {
          slashArcRef.current.visible = progress < 0.8
          slashArcRef.current.scale.setScalar(1 + progress * 0.8)
          slashArcRef.current.position.set(-0.2, 0.8, 0.6)
          slashArcRef.current.rotation.set(0, 0.3, 0.5)
        }
      } else if (comboStep === 2) {
        // Step 2: Right Cross Hook
        const thrust = Math.sin(progress * Math.PI) * 0.45
        mesh.position.set(-0.15, 0, thrust)
        mesh.rotation.set(0.12, -0.55 * Math.sin(progress * Math.PI), 0.08)

        if (slashArcRef.current) {
          slashArcRef.current.visible = progress < 0.8
          slashArcRef.current.scale.setScalar(1.2 + progress)
          slashArcRef.current.position.set(0.25, 0.85, 0.65)
          slashArcRef.current.rotation.set(0, -0.4, -0.5)
        }
      } else if (comboStep === 3) {
        // Step 3: 360-Degree Airborne Spin Kick!
        const spinAngle = progress * Math.PI * 2
        const jumpHeight = Math.sin(progress * Math.PI) * 0.45
        mesh.position.set(0, jumpHeight, Math.sin(progress * Math.PI) * 0.25)
        mesh.rotation.set(0.15 * Math.sin(progress * Math.PI), spinAngle, 0.25)

        if (slashArcRef.current) {
          slashArcRef.current.visible = true
          slashArcRef.current.scale.setScalar(1.8 + progress * 0.5)
          slashArcRef.current.position.set(0, 0.7 + jumpHeight, 0.2)
          slashArcRef.current.rotation.set(-Math.PI / 2, 0, spinAngle)
        }
      } else if (comboStep === 4) {
        // Step 4: Heavy Power Slam
        let slamHeight = 0
        if (progress < 0.45) {
          // Leap up
          slamHeight = (progress / 0.45) * 0.65
          mesh.rotation.set(-0.25, 0, 0)
        } else {
          // Smash down
          const downT = (progress - 0.45) / 0.55
          slamHeight = 0.65 * (1 - downT * downT)
          mesh.rotation.set(0.35, 0, 0)
        }
        mesh.position.set(0, slamHeight, Math.sin(progress * Math.PI) * 0.3)

        // Ground shockwave ring on landing
        if (slamRingRef.current) {
          if (progress > 0.4) {
            slamRingRef.current.visible = true
            const ringT = (progress - 0.4) / 0.6
            slamRingRef.current.scale.setScalar(0.4 + ringT * 2.8)
            const mat = slamRingRef.current.material as THREE.MeshBasicMaterial
            mat.opacity = 1 - ringT
          } else {
            slamRingRef.current.visible = false
          }
        }
      }

      // Automatically reset comboStep when animation finishes
      if (attackAge >= 0.44 && prevAttackTime.current !== lastAttackTimestamp) {
        prevAttackTime.current = lastAttackTimestamp
        useDogStore.getState().setComboStep(0)
        useDogStore.getState().setState('IDLE')
      }
      return
    }

    // Hide attack effect meshes when not attacking
    if (slashArcRef.current) slashArcRef.current.visible = false
    if (slamRingRef.current) slamRingRef.current.visible = false

    // ── 2. Jump Animation ──────────────────────────────────────
    if (dogState === 'JUMPING') {
      mesh.position.set(0, 0.1, 0)
      mesh.rotation.set(-0.15, 0, 0)
      return
    }

    // ── 3. Bark Animation (E key roar/bark) ─────────────────────
    if (dogState === 'BARKING') {
      const roarShake = Math.sin(state.clock.elapsedTime * 28) * 0.04
      mesh.position.set(0, roarShake, 0.12)
      mesh.rotation.set(0.28, roarShake * 0.5, 0)
      return
    }

    // ── 4. Locomotion / Walk / Run Cycle ────────────────────────
    if (dogState === 'WALKING' || dogState === 'RUNNING') {
      const isRun = dogState === 'RUNNING'
      const freq = isRun ? 13 : 8.5
      walkPhase.current += delta * freq

      // Vertical bounce
      const bounceY = Math.abs(Math.sin(walkPhase.current)) * (isRun ? 0.08 : 0.04)
      // Forward tilt
      const forwardTilt = isRun ? 0.18 : 0.08
      // Lateral hip sway
      const swayZ = Math.sin(walkPhase.current * 0.5) * (isRun ? 0.08 : 0.04)

      mesh.position.set(0, bounceY, 0)
      mesh.rotation.set(forwardTilt, 0, swayZ)
      return
    }

    // ── 5. Idle Breathing Stance ─────────────────────────────────
    const t = state.clock.elapsedTime
    const breathe = Math.sin(t * 2.5) * 0.015
    mesh.position.set(0, breathe, 0)
    mesh.rotation.set(Math.sin(t * 1.5) * 0.02, 0, 0)
  })

  return (
    <group ref={rootGroupRef}>
      {/* Mesh offset & procedural animation container */}
      <group ref={meshGroupRef}>
        {/* Humanoid Dog Warrior Mesh */}
        <primitive
          object={scene}
          scale={[1.35, 1.35, 1.35]}
          position={[0, 0, 0]}
        />

        {/* Martial Arts Attack Slash Wave Arc */}
        <mesh ref={slashArcRef} visible={false} position={[0, 0.8, 0.5]}>
          <ringGeometry args={[0.3, 0.65, 32, 1, 0, Math.PI * 1.2]} />
          <meshBasicMaterial
            color="#fbc531"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Ground Power Slam Shockwave Ring */}
      <mesh
        ref={slamRingRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[0.6, 1.0, 32]} />
        <meshBasicMaterial
          color="#ffb142"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Transformation Burst Light & Rings */}
      {transformBurst && (
        <group position={[0, 0.6, 0]}>
          <pointLight color="#fbc531" intensity={4} distance={6} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 1.2, 32]} />
            <meshBasicMaterial
              color="#fbc531"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
useGLTF.preload('/assets/models/dogwarrior.glb')
