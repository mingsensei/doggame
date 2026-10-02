import { create } from 'zustand'

export type DogState =
  | 'IDLE'
  | 'WALKING'
  | 'RUNNING'
  | 'BARKING'
  | 'PEEING'
  | 'SNIFFING'
  | 'JUMPING'
  | 'ATTACKING'

export type DogForm = 1 | 2 // 1: Shiba Quadruped, 2: Dog Warrior Humanoid

interface DogStore {
  state: DogState
  form: DogForm
  comboStep: number // 0 = not attacking, 1 = Left Jab, 2 = Right Hook, 3 = Spin Kick, 4 = Power Slam
  lastAttackTimestamp: number
  position: [number, number, number]
  rotation: number // Y-axis angle in radians
  speed: number
  bonesCollected: number
  collectBone: () => void
  setState: (next: DogState) => void
  setPosition: (pos: [number, number, number]) => void
  setRotation: (angle: number) => void
  setSpeed: (speed: number) => void
  toggleForm: () => DogForm
  triggerAttack: () => number
  setComboStep: (step: number) => void
  /** Whether FSM is in a locked state (action playing, no movement input) */
  isLocked: () => boolean
}

export const useDogStore = create<DogStore>((set, get) => ({
  state: 'IDLE',
  form: 1,
  comboStep: 0,
  lastAttackTimestamp: 0,
  position: [0, 0, 0],
  rotation: 0,
  speed: 0,
  bonesCollected: 0,

  collectBone: () => set((s) => ({ bonesCollected: s.bonesCollected + 1 })),

  setState: (next: DogState) => {
    set({ state: next })
  },

  setPosition: (position) => set({ position }),
  setRotation: (rotation) => set({ rotation }),
  setSpeed: (speed) => set({ speed }),

  toggleForm: () => {
    const current = get().form
    const nextForm: DogForm = current === 1 ? 2 : 1
    set({ form: nextForm, comboStep: 0 })
    return nextForm
  },

  triggerAttack: () => {
    const { form, comboStep, lastAttackTimestamp } = get()
    if (form !== 2) return 0

    const now = Date.now()
    // Within 850ms window to continue combo chain, otherwise reset to hit 1
    const nextStep = now - lastAttackTimestamp < 850 ? (comboStep % 4) + 1 : 1

    set({
      comboStep: nextStep,
      lastAttackTimestamp: now,
      state: 'ATTACKING',
    })
    return nextStep
  },

  setComboStep: (step) => set({ comboStep: step }),

  isLocked: () => {
    const { state } = get()
    // PEEING is hard-locked
    return state === 'PEEING'
  },
}))

