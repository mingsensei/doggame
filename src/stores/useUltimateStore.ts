import { create } from 'zustand'
import { soundManager } from '@/game/audio/SoundManager'

export type UltimatePhase = 'READY' | 'ACTIVATING' | 'CHAOS' | 'CLEANUP' | 'COOLDOWN'

export interface MiniDogState {
  id: number
  position: [number, number, number]
  rotation: number
  speed: number
  orbitAngle: number
  orbitRadius: number
  orbitSpeed: number
  noiseFreq: number
  action: 'Gallop' | 'Gallop_Jump' | 'Attack'
  scale: number
  jumpTimer: number
}

interface UltimateStore {
  phase: UltimatePhase
  activeTimer: number
  cooldownTimer: number
  cooldownDuration: number
  domainCenter: [number, number, number]
  domainRadius: number
  expansionProgress: number // 0..1
  miniDogs: MiniDogState[]

  triggerUltimate: (dogPos: [number, number, number]) => boolean
  tick: (delta: number, currentDogPos: [number, number, number]) => void
}

const ACTIVATION_DURATION = 1.1 // seconds for initial dog roar/barrier expansion
const CHAOS_DURATION = 7.0     // 7 seconds of full mini-dog chaos
const CLEANUP_DURATION = 0.8   // seconds for domain collapse
const COOLDOWN_DURATION = 20.0 // 20s cooldown
const DOMAIN_MAX_RADIUS = 8.5  // ~10 paces around the dog

const MINI_DOG_COUNT = 7

function generateMiniDogs(center: [number, number, number]): MiniDogState[] {
  const dogs: MiniDogState[] = []
  for (let i = 0; i < MINI_DOG_COUNT; i++) {
    // Spread around the player in orbit slots (some clockwise, some counter-clockwise)
    const baseAngle = (i / MINI_DOG_COUNT) * Math.PI * 2
    const orbitRadius = 2.2 + (i % 3) * 1.5 // 2.2m to 5.2m from player
    const isClockwise = i % 2 === 0 ? 1 : -1
    const orbitSpeed = (1.8 + (i % 4) * 0.4) * isClockwise

    const x = center[0] + Math.cos(baseAngle) * orbitRadius
    const z = center[2] + Math.sin(baseAngle) * orbitRadius

    dogs.push({
      id: i,
      position: [x, 0, z],
      rotation: baseAngle + Math.PI / 2,
      speed: 10.0 + Math.random() * 3.0,
      orbitAngle: baseAngle,
      orbitRadius,
      orbitSpeed,
      noiseFreq: 2.0 + Math.random() * 2.0,
      action: Math.random() > 0.4 ? 'Gallop' : 'Gallop_Jump',
      scale: 0.10 + Math.random() * 0.03, // Cute mini puppies!
      jumpTimer: 0.8 + Math.random() * 1.5,
    })
  }
  return dogs
}

export const useUltimateStore = create<UltimateStore>((set, get) => ({
  phase: 'READY',
  activeTimer: 0,
  cooldownTimer: 0,
  cooldownDuration: COOLDOWN_DURATION,
  domainCenter: [0, 0, 0],
  domainRadius: DOMAIN_MAX_RADIUS,
  expansionProgress: 0,
  miniDogs: [],

  triggerUltimate: (dogPos) => {
    const { phase, cooldownTimer } = get()
    // Cannot trigger if already running or on cooldown
    if (phase !== 'READY' || cooldownTimer > 0) {
      return false
    }

    soundManager.playUltimateActivation()

    set({
      phase: 'ACTIVATING',
      activeTimer: ACTIVATION_DURATION,
      domainCenter: [dogPos[0], 0, dogPos[2]],
      expansionProgress: 0,
      miniDogs: [],
    })

    return true
  },

  tick: (delta, currentDogPos) => {
    const state = get()
    const { phase, activeTimer, cooldownTimer } = state

    // 1. Handling Cooldown
    if (phase === 'COOLDOWN') {
      const nextCd = Math.max(0, cooldownTimer - delta)
      if (nextCd <= 0) {
        soundManager.playSkillReady()
        set({ phase: 'READY', cooldownTimer: 0 })
      } else {
        set({ cooldownTimer: nextCd })
      }
      return
    }

    // 2. Handling Activation (Initial Expansion) - follows the dog
    if (phase === 'ACTIVATING') {
      const nextTimer = activeTimer - delta
      const progress = Math.min(1.0, 1.0 - nextTimer / ACTIVATION_DURATION)

      if (nextTimer <= 0) {
        // Transition to CHAOS - spawn puppies around current dog position
        const miniDogs = generateMiniDogs(currentDogPos)
        soundManager.playPuppyYip()
        set({
          phase: 'CHAOS',
          activeTimer: CHAOS_DURATION,
          expansionProgress: 1.0,
          domainCenter: [currentDogPos[0], 0, currentDogPos[2]],
          miniDogs,
        })
      } else {
        set({
          activeTimer: nextTimer,
          expansionProgress: progress,
          domainCenter: [currentDogPos[0], 0, currentDogPos[2]],
        })
      }
      return
    }

    // 3. Handling 7 Seconds Chaos - puppies swarm dynamically around the player dog!
    if (phase === 'CHAOS') {
      const nextTimer = activeTimer - delta

      // Update Mini Dogs swarming & orbiting AI around player dog
      const updatedDogs = state.miniDogs.map((dog) => {
        let {
          position,
          rotation,
          speed,
          orbitAngle,
          orbitRadius,
          orbitSpeed,
          noiseFreq,
          action,
          jumpTimer,
        } = dog

        jumpTimer -= delta
        if (jumpTimer <= 0) {
          jumpTimer = 1.0 + Math.random() * 1.8
          action = Math.random() > 0.35 ? 'Gallop_Jump' : 'Gallop'
          if (Math.random() < 0.25) {
            soundManager.playPuppyYip()
          }
        }

        // Advance orbit angle around the player
        orbitAngle += orbitSpeed * delta

        // Dynamic organic wobble in distance
        const currentDist =
          orbitRadius + Math.sin(activeTimer * noiseFreq + dog.id * 1.5) * 0.9

        // Target position centered directly around player dog
        const targetX = currentDogPos[0] + Math.cos(orbitAngle) * currentDist
        const targetZ = currentDogPos[2] + Math.sin(orbitAngle) * currentDist

        // Steer toward target
        const dx = targetX - position[0]
        const dz = targetZ - position[2]
        const distToTarget = Math.sqrt(dx * dx + dz * dz)

        // Speed increases if puppy gets further away to stay in pack formation
        const moveSpeed = Math.max(speed, distToTarget * 7.5)
        const step = Math.min(distToTarget, moveSpeed * delta)

        const finalX = distToTarget > 0.05 ? position[0] + (dx / distToTarget) * step : targetX
        const finalZ = distToTarget > 0.05 ? position[2] + (dz / distToTarget) * step : targetZ

        // Face movement direction
        if (distToTarget > 0.1) {
          const desiredAngle = Math.atan2(dx, dz)
          let angleDiff = desiredAngle - rotation
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
          rotation += angleDiff * Math.min(1.0, 10.0 * delta)
        }

        return {
          ...dog,
          position: [finalX, 0, finalZ] as [number, number, number],
          rotation,
          orbitAngle,
          action,
          jumpTimer,
        }
      })

      if (nextTimer <= 0) {
        // Transition to CLEANUP
        soundManager.playDomainCollapse()
        set({
          phase: 'CLEANUP',
          activeTimer: CLEANUP_DURATION,
          domainCenter: [currentDogPos[0], 0, currentDogPos[2]],
          miniDogs: updatedDogs,
        })
      } else {
        set({
          activeTimer: nextTimer,
          domainCenter: [currentDogPos[0], 0, currentDogPos[2]],
          miniDogs: updatedDogs,
        })
      }
      return
    }

    // 4. Handling Cleanup (Collapsing domain)
    if (phase === 'CLEANUP') {
      const nextTimer = activeTimer - delta
      const progress = Math.max(0.0, nextTimer / CLEANUP_DURATION)

      if (nextTimer <= 0) {
        // Transition to COOLDOWN
        set({
          phase: 'COOLDOWN',
          activeTimer: 0,
          cooldownTimer: COOLDOWN_DURATION,
          expansionProgress: 0,
          miniDogs: [],
        })
      } else {
        set({
          activeTimer: nextTimer,
          expansionProgress: progress,
          domainCenter: [currentDogPos[0], 0, currentDogPos[2]],
        })
      }
    }
  },
}))
