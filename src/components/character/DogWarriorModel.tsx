import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useDogStore } from '@/stores/useDogStore'

/**
 * DogWarriorModel — Form 2: Humanoid Dog Warrior (Chiến Binh Chó)
 * Features:
 * - Real GPU Vertex Shader Skeletal Limb Deformation (Khớp cử động tay & chân thực sự)
 * - Articulated Bipedal Locomotion (Chân bước so le, hai tay vung nhịp nhàng)
 * - 4-Hit Martial Arts Attack Combo (Tay trái đấm Jab, tay phải đấm Hook, chân xoay đá 360°, hai tay đập đất Slam)
 * - Jump, Bark, Run & Idle breathing support
 */
export function DogWarriorModel(): JSX.Element {
  const rootGroupRef = useRef<THREE.Group>(null)
  const meshGroupRef = useRef<THREE.Group>(null)
  const slashArcRef = useRef<THREE.Mesh>(null)
  const slamRingRef = useRef<THREE.Mesh>(null)
  const [transformBurst, setTransformBurst] = useState(true)

  // Load dog warrior model
  const { scene } = useGLTF('/assets/models/dogwarrior.glb')

  // Shader uniforms ref for real-time limb rotation & punching
  const uniformsRef = useRef({
    uLeftLegAngle: { value: 0 },
    uRightLegAngle: { value: 0 },
    uLeftArmAngle: { value: 0 },
    uRightArmAngle: { value: 0 },
    uLeftArmPunch: { value: 0 },
    uRightArmPunch: { value: 0 },
    uKickAngle: { value: 0 },
    uSlamPose: { value: 0 },
  })

  // Clone scene & inject vertex shader skeletal deformation
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
          mat.customProgramCacheKey = () => 'dogwarrior_procedural_limbs_v2'
          mat.onBeforeCompile = (shader) => {
            // Link uniforms
            Object.assign(shader.uniforms, uniformsRef.current)

            shader.vertexShader = `
              uniform float uLeftLegAngle;
              uniform float uRightLegAngle;
              uniform float uLeftArmAngle;
              uniform float uRightArmAngle;
              uniform float uLeftArmPunch;
              uniform float uRightArmPunch;
              uniform float uKickAngle;
              uniform float uSlamPose;
            ` + shader.vertexShader

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              vec3 p = transformed;

              // ── 1. Right Leg (x > 0.010, y < 0.44) ────────────
              if (p.x > 0.010 && p.y < 0.44) {
                float w = smoothstep(0.44, 0.36, p.y);
                float angle = uRightLegAngle * w;
                if (uKickAngle != 0.0) {
                  angle += uKickAngle * w;
                }
                float dy = p.y - 0.42;
                float dz = p.z - 0.0;
                p.y = 0.42 + dy * cos(angle) - dz * sin(angle);
                p.z = 0.0 + dy * sin(angle) + dz * cos(angle);
              }

              // ── 2. Left Leg (x < -0.010, y < 0.44) ───────────
              if (p.x < -0.010 && p.y < 0.44) {
                float w = smoothstep(0.44, 0.36, p.y);
                float angle = uLeftLegAngle * w;
                float dy = p.y - 0.42;
                float dz = p.z - 0.0;
                p.y = 0.42 + dy * cos(angle) - dz * sin(angle);
                p.z = 0.0 + dy * sin(angle) + dz * cos(angle);
              }

              // ── 3. Right Arm (x > 0.060, y >= 0.36 && y <= 0.78) ───
              if (p.x > 0.060 && p.y >= 0.36 && p.y <= 0.78) {
                float w = smoothstep(0.060, 0.090, p.x);
                float angle = uRightArmAngle * w;
                float dy = p.y - 0.68;
                float dz = p.z - 0.0;
                p.y = 0.68 + dy * cos(angle) - dz * sin(angle);
                p.z = 0.0 + dy * sin(angle) + dz * cos(angle);

                if (uRightArmPunch > 0.0) {
                  p.z += uRightArmPunch * 0.42 * w;
                  p.x -= uRightArmPunch * 0.08 * w;
                  p.y += uRightArmPunch * 0.12 * w;
                }
                if (uSlamPose > 0.0) {
                  p.y += uSlamPose * 0.32 * w;
                  p.z += uSlamPose * 0.18 * w;
                }
              }

              // ── 4. Left Arm (x < -0.060, y >= 0.36 && y <= 0.78) ───
              if (p.x < -0.060 && p.y >= 0.36 && p.y <= 0.78) {
                float w = smoothstep(-0.060, -0.090, p.x);
                float angle = uLeftArmAngle * w;
                float dy = p.y - 0.68;
                float dz = p.z - 0.0;
                p.y = 0.68 + dy * cos(angle) - dz * sin(angle);
                p.z = 0.0 + dy * sin(angle) + dz * cos(angle);

                if (uLeftArmPunch > 0.0) {
                  p.z += uLeftArmPunch * 0.45 * w;
                  p.x += uLeftArmPunch * 0.06 * w;
                  p.y += uLeftArmPunch * 0.10 * w;
                }
                if (uSlamPose > 0.0) {
                  p.y += uSlamPose * 0.32 * w;
                  p.z += uSlamPose * 0.18 * w;
                }
              }

              transformed = p;
              `
            )
          }
          mesh.material = mat
        }
      }
    })
    return clone
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
    const uniforms = uniformsRef.current

    let targetLeftLeg = 0
    let targetRightLeg = 0
    let targetLeftArm = 0
    let targetRightArm = 0
    let targetLeftPunch = 0
    let targetRightPunch = 0
    let targetKick = 0
    let targetSlam = 0

    // ── 1. Combat Attack Animation ──────────────────────────────
    if (comboStep > 0 && attackAge < 0.45) {
      const progress = attackAge / 0.45 // 0 to 1

      if (comboStep === 1) {
        // Step 1: Left Jab Punch (Tay trái đấm thẳng)
        const punchCurve = Math.sin(progress * Math.PI)
        targetLeftPunch = punchCurve * 1.1
        targetRightArm = -0.35 // Tay phải phòng thủ
        targetLeftLeg = 0.22   // Chân trái bước lên
        targetRightLeg = -0.18

        mesh.position.set(0.08, 0, punchCurve * 0.22)
        mesh.rotation.set(0.06, punchCurve * 0.32, -0.04)

        if (slashArcRef.current) {
          slashArcRef.current.visible = progress < 0.85
          slashArcRef.current.scale.setScalar(1 + progress * 0.8)
          slashArcRef.current.position.set(-0.25, 0.85, 0.7)
          slashArcRef.current.rotation.set(0, 0.3, 0.5)
        }
      } else if (comboStep === 2) {
        // Step 2: Right Cross Hook (Tay phải đấm móc)
        const punchCurve = Math.sin(progress * Math.PI)
        targetRightPunch = punchCurve * 1.15
        targetLeftArm = -0.35  // Tay trái phòng thủ
        targetRightLeg = 0.25  // Chân phải bước dồn lực
        targetLeftLeg = -0.20

        mesh.position.set(-0.10, 0, punchCurve * 0.25)
        mesh.rotation.set(0.08, -punchCurve * 0.42, 0.06)

        if (slashArcRef.current) {
          slashArcRef.current.visible = progress < 0.85
          slashArcRef.current.scale.setScalar(1.2 + progress)
          slashArcRef.current.position.set(0.3, 0.9, 0.75)
          slashArcRef.current.rotation.set(0, -0.4, -0.5)
        }
      } else if (comboStep === 3) {
        // Step 3: 360-Degree Airborne Spin Kick! (Xoay người vung chân đá 360°)
        const spinAngle = progress * Math.PI * 2
        const kickCurve = Math.sin(progress * Math.PI)
        targetKick = kickCurve * 1.35 // Chân phải vung cao đá
        targetLeftLeg = -0.25
        targetLeftArm = -0.4
        targetRightArm = 0.4

        const jumpHeight = kickCurve * 0.48
        mesh.position.set(0, jumpHeight, kickCurve * 0.2)
        mesh.rotation.set(0.15 * kickCurve, spinAngle, 0.2)

        if (slashArcRef.current) {
          slashArcRef.current.visible = true
          slashArcRef.current.scale.setScalar(1.8 + progress * 0.5)
          slashArcRef.current.position.set(0, 0.7 + jumpHeight, 0.2)
          slashArcRef.current.rotation.set(-Math.PI / 2, 0, spinAngle)
        }
      } else if (comboStep === 4) {
        // Step 4: Heavy Power Slam (Cả 2 tay giơ cao rồi đập mạnh xuống đất)
        if (progress < 0.45) {
          // Nhảy lên, 2 tay giơ cao
          const upT = progress / 0.45
          targetSlam = upT * 1.0
          targetLeftArm = upT * 0.85
          targetRightArm = upT * 0.85
          mesh.position.set(0, upT * 0.65, 0)
          mesh.rotation.set(-0.25, 0, 0)
        } else {
          // Đập mạnh xuống đất
          const downT = (progress - 0.45) / 0.55
          targetSlam = (1 - downT) * 1.0
          mesh.position.set(0, 0.65 * (1 - downT * downT), 0)
          mesh.rotation.set(0.35, 0, 0)
        }

        // Vòng sóng xung kích lan toả khi chạm đất
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

      // Reset comboStep khi đòn đánh kết thúc
      if (attackAge >= 0.44 && prevAttackTime.current !== lastAttackTimestamp) {
        prevAttackTime.current = lastAttackTimestamp
        useDogStore.getState().setComboStep(0)
        useDogStore.getState().setState('IDLE')
      }
    } else {
      // Hide attack visual effects when not attacking
      if (slashArcRef.current) slashArcRef.current.visible = false
      if (slamRingRef.current) slamRingRef.current.visible = false

      // ── 2. Jump Animation ─────────────────────────────────────
      if (dogState === 'JUMPING') {
        targetLeftLeg = -0.5  // Co chân lên khi nhảy
        targetRightLeg = -0.5
        targetLeftArm = 0.45  // Vung tay giữ thăng bằng
        targetRightArm = 0.45
        mesh.position.set(0, 0.12, 0)
        mesh.rotation.set(-0.15, 0, 0)
      }
      // ── 3. Bark / Battle Cry Animation ────────────────────────
      else if (dogState === 'BARKING') {
        const roarShake = Math.sin(state.clock.elapsedTime * 28) * 0.04
        targetLeftArm = -0.35 // Gồng tay ra sau hét lớn
        targetRightArm = -0.35
        mesh.position.set(0, roarShake, 0.12)
        mesh.rotation.set(0.28, roarShake * 0.5, 0)
      }
      // ── 4. Locomotion Walk / Run Cycle (Chân bước so le, tay vung)
      else if (dogState === 'WALKING' || dogState === 'RUNNING') {
        const isRun = dogState === 'RUNNING'
        const freq = isRun ? 12 : 7.5
        walkPhase.current += delta * freq

        const legAmp = isRun ? 0.72 : 0.44
        const armAmp = isRun ? 0.62 : 0.36
        const sinWalk = Math.sin(walkPhase.current)

        // Tay và chân bước so le nhịp nhàng
        targetLeftLeg = sinWalk * legAmp
        targetRightLeg = -sinWalk * legAmp
        targetLeftArm = -sinWalk * armAmp
        targetRightArm = sinWalk * armAmp

        const bounceY = Math.abs(sinWalk) * (isRun ? 0.08 : 0.04)
        const swayZ = Math.sin(walkPhase.current * 0.5) * (isRun ? 0.06 : 0.03)

        mesh.position.set(0, bounceY, 0)
        mesh.rotation.set(isRun ? 0.16 : 0.06, 0, swayZ)
      }
      // ── 5. Idle Breathing Stance ───────────────────────────────
      else {
        const t = state.clock.elapsedTime
        targetLeftArm = Math.sin(t * 2.0) * 0.05
        targetRightArm = -Math.sin(t * 2.0) * 0.05
        const breathe = Math.sin(t * 2.5) * 0.015
        mesh.position.set(0, breathe, 0)
        mesh.rotation.set(Math.sin(t * 1.5) * 0.02, 0, 0)
      }
    }

    // Smoothly apply limb angles to shader uniforms
    const lerpSpeed = 0.28
    uniforms.uLeftLegAngle.value += (targetLeftLeg - uniforms.uLeftLegAngle.value) * lerpSpeed
    uniforms.uRightLegAngle.value += (targetRightLeg - uniforms.uRightLegAngle.value) * lerpSpeed
    uniforms.uLeftArmAngle.value += (targetLeftArm - uniforms.uLeftArmAngle.value) * lerpSpeed
    uniforms.uRightArmAngle.value += (targetRightArm - uniforms.uRightArmAngle.value) * lerpSpeed
    uniforms.uLeftArmPunch.value += (targetLeftPunch - uniforms.uLeftArmPunch.value) * 0.48
    uniforms.uRightArmPunch.value += (targetRightPunch - uniforms.uRightArmPunch.value) * 0.48
    uniforms.uKickAngle.value += (targetKick - uniforms.uKickAngle.value) * 0.38
    uniforms.uSlamPose.value += (targetSlam - uniforms.uSlamPose.value) * 0.38
  })

  return (
    <group ref={rootGroupRef}>
      {/* Mesh offset & procedural animation container */}
      <group ref={meshGroupRef}>
        {/* Humanoid Dog Warrior Mesh with GPU Limb Deformation */}
        <primitive
          object={clonedScene}
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
