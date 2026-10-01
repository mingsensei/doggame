import { create } from 'zustand'
import { soundManager } from '@/game/audio/SoundManager'

export type UltimatePhase = 'READY' | 'ACTIVATING' | 'CHAOS' | 'CLEANUP' | 'COOLDOWN'

export interface MiniDogState {
  id: number
  position: [number, number, number]
  rotation: number
  speed: number
  targetOffset: [number, number]
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
    const angle = (i / MINI_DOG_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const dist = 1.5 + Math.random() * 4.5
    const x = center[0] + Math.cos(angle) * dist
    const z = center[2] + Math.sin(angle) * dist

    dogs.push({
      id: i,
      position: [x, 0, z],
      rotation: Math.random() * Math.PI * 2,
      speed: 6.5 + Math.random() * 3.0,
      targetOffset: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8],
      action: Math.random() > 0.4 ? 'Gallop' : 'Gallop_Jump',
      scale: 0.10 + Math.random() * 0.03, // Cute mini puppies!
      jumpTimer: Math.random() * 2.0,
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
    const { phase, activeTimer, cooldownTimer, domainCenter } = state

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

    // 2. Handling Activation (Initial Expansion)
    if (phase === 'ACTIVATING') {
      const nextTimer = activeTimer - delta
      const progress = Math.min(1.0, 1.0 - nextTimer / ACTIVATION_DURATION)

      if (nextTimer <= 0) {
        // Transition to CHAOS
        const miniDogs = generateMiniDogs(domainCenter)
        soundManager.playPuppyYip()
        set({
          phase: 'CHAOS',
          activeTimer: CHAOS_DURATION,
          expansionProgress: 1.0,
          miniDogs,
        })
      } else {
        set({
          activeTimer: nextTimer,
          expansionProgress: progress,
        })
      }
      return
    }

    // 3. Handling 7 Seconds Chaos
    if (phase === 'CHAOS') {
      const nextTimer = activeTimer - delta

      // Update Mini Dogs chaotic AI
      const updatedDogs = state.miniDogs.map((dog) => {
        let { position, rotation, speed, targetOffset, action, jumpTimer } = dog

        jumpTimer -= delta
        if (jumpTimer <= 0) {
          jumpTimer = 1.2 + Math.random() * 2.0
          action = Math.random() > 0.35 ? 'Gallop_Jump' : 'Gallop'
          if (Math.random() < 0.25) {
            soundManager.playPuppyYip()
          }
        }

        // Orbit & chaotic wander around domain center / player
        const targetX = domainCenter[0] + targetOffset[0]
        const targetZ = domainCenter[2] + targetOffset[1]
        const dx = targetX - position[0]
        const dz = targetZ - position[2]
        const dist = Math.sqrt(dx * dx + dz * dz)

        if (dist < 2.0 || Math.random() < 0.02) {
          // Pick new random wander target within domain
          const angle = Math.random() * Math.PI * 2
          const r = Math.random() * (DOMAIN_MAX_RADIUS * 0.8)
          targetOffset = [Math.cos(angle) * r, Math.sin(angle) * r]
        }

        const desiredAngle = Math.atan2(dx, dz)
        let angleDiff = desiredAngle - rotation
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        rotation += angleDiff * Math.min(1.0, 8.0 * delta)

        // Move forward in facing direction
        const nextX = position[0] + Math.sin(rotation) * speed * delta
        const nextZ = position[2] + Math.cos(rotation) * speed * delta

        // Keep inside domain boundary
        const fromCenterX = nextX - domainCenter[0]
        const fromCenterZ = nextZ - domainCenter[2]
        const distFromCenter = Math.sqrt(fromCenterX * fromCenterX + fromCenterZ * fromCenterZ)
        let finalX = nextX
        let finalZ = nextZ

        if (distFromCenter > DOMAIN_MAX_RADIUS - 0.8) {
          const clamped = (DOMAIN_MAX_RADIUS - 1.0) / distFromCenter
          finalX = domainCenter[0] + fromCenterX * clamped
          finalZ = domainCenter[2] + fromCenterZ * clamped
          rotation += Math.PI * 0.8
        }

        return {
          ...dog,
          position: [finalX, 0, finalZ] as [number, number, number],
          rotation,
          targetOffset,
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
          miniDogs: updatedDogs,
        })
      } else {
        set({
          activeTimer: nextTimer,
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
        })
      }
    }
  },
}))
