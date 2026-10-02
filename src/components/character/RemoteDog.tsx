import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import type { RemotePlayer } from '@/stores/useMultiplayerStore'

interface RemoteDogProps {
  player: RemotePlayer
}

export function RemoteDog({ player }: RemoteDogProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)

  // Target values for smooth network interpolation
  const targetPos = useRef(new THREE.Vector3(...player.position))
  const targetRot = useRef(player.rotation)

  const { scene, animations } = useGLTF('/assets/models/dog.glb')

  // Clone skeletal hierarchy independently for each remote player
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

  // Map state to animation
  const getActionForState = (state: string): THREE.AnimationAction | null => {
    if (!actions) return null
    switch (state) {
      case 'WALKING':
        return actions['Walk'] || actions['AnimalArmature|Walk'] || null
      case 'RUNNING':
        return actions['Gallop'] || actions['AnimalArmature|Gallop'] || null
      case 'JUMPING':
        return actions['Gallop_Jump'] || actions['AnimalArmature|Gallop_Jump'] || null
      case 'BARKING':
        return actions['Attack'] || actions['AnimalArmature|Attack'] || null
      case 'SNIFFING':
        return actions['Idle_2_HeadLow'] || actions['AnimalArmature|Idle_2_HeadLow'] || null
      case 'PEEING':
        return actions['Idle_2'] || actions['AnimalArmature|Idle_2'] || null
      case 'IDLE':
      default:
        return actions['Idle'] || actions['AnimalArmature|Idle'] || null
    }
  }

  // Handle animation crossfades
  useEffect(() => {
    const nextAction = getActionForState(player.state)
    const prevAction = currentActionRef.current

    if (nextAction && nextAction !== prevAction) {
      if (prevAction) prevAction.fadeOut(0.18)
      nextAction.reset().fadeIn(0.18).play()
      currentActionRef.current = nextAction
    }
  }, [actions, player.state])

  // Update interpolation targets when props change
  useEffect(() => {
    targetPos.current.set(player.position[0], player.position[1], player.position[2])
    targetRot.current = player.rotation
  }, [player.position, player.rotation])

  // Smooth dead reckoning interpolation
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Position interpolation (lerp)
    groupRef.current.position.lerp(targetPos.current, 1 - Math.exp(-14 * delta))

    // Shortest-path angle interpolation
    let diff = targetRot.current - groupRef.current.rotation.y
    while (diff < -Math.PI) diff += Math.PI * 2
    while (diff > Math.PI) diff -= Math.PI * 2
    groupRef.current.rotation.y += diff * (1 - Math.exp(-14 * delta))
  })

  // Bark bubble state with auto-dismissing timer
  const [showBarkBubble, setShowBarkBubble] = useState(false)

  useEffect(() => {
    if (player.state === 'BARKING' || player.lastAction === 'bark') {
      setShowBarkBubble(true)
      const timer = setTimeout(() => {
        setShowBarkBubble(false)
      }, 1300)
      return () => clearTimeout(timer)
    } else {
      setShowBarkBubble(false)
    }
  }, [player.state, player.lastAction, player.lastActionTimestamp])

  const isUltimate =
    player.lastAction === 'ultimate' && Date.now() - (player.lastActionTimestamp || 0) < 7000

  const isBot = player.name === 'mingsensei'

  return (
    <group ref={groupRef} position={player.position} rotation={[0, player.rotation, 0]}>
      {/* Shiba Inu Model */}
      <primitive object={clonedScene} scale={[0.26, 0.26, 0.26]} />

      {/* Ultimate Golden Aura */}
      {isUltimate && (
        <group position={[0, 0.35, 0]}>
          <pointLight color="#fbc531" intensity={3} distance={4} />
          <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.45, 0.85, 32]} />
            <meshBasicMaterial color="#fbc531" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Floating 3D Name Tag & Emotes */}
      <Html position={[0, 1.15, 0]} center distanceFactor={14}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          {/* Bark speech bubble (automatically hides when barking finishes) */}
          {showBarkBubble && (
            <div className="mb-1.5 px-3 py-1 bg-white text-black font-extrabold text-xs rounded-xl shadow-lg border border-black/10 animate-bounce">
              🔊 Gâu! Gâu!
            </div>
          )}

          {/* Ultimate title badge */}
          {isUltimate && (
            <div className="mb-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-[10px] rounded-full shadow-lg border border-yellow-200 animate-pulse">
              👑 LÃNH ĐỊA!
            </div>
          )}

          {/* Player Name Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white font-semibold text-xs rounded-full border border-white/20 shadow-md">
            <span className="text-[10px]">{isBot ? '🤖' : '🐾'}</span>
            <span className={isBot ? 'text-yellow-300 font-extrabold' : 'text-amber-300 font-bold'}>
              {player.name}
            </span>
            {isBot && (
              <span className="px-1 py-0.2 rounded bg-yellow-400 text-black text-[9px] font-black uppercase tracking-wider">
                BOT
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  )
}
