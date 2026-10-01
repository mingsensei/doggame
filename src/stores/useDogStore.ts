import { create } from 'zustand'

export type DogState =
  | 'IDLE'
  | 'WALKING'
  | 'RUNNING'
  | 'BARKING'
  | 'PEEING'
  | 'SNIFFING'
  | 'JUMPING'

interface DogStore {
  state: DogState
  position: [number, number, number]
  rotation: number // Y-axis angle in radians
  speed: number
  bonesCollected: number
  collectBone: () => void
  setState: (next: DogState) => void
  setPosition: (pos: [number, number, number]) => void
  setRotation: (angle: number) => void
  setSpeed: (speed: number) => void
  /** Whether FSM is in a locked state (action playing, no movement input) */
  isLocked: () => boolean
}

export const useDogStore = create<DogStore>((set, get) => ({
  state: 'IDLE',
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

  isLocked: () => {
    const { state } = get()
    // Only PEEING is hard-locked; BARKING and SNIFFING immediately cancel when player moves
    return state === 'PEEING'
  },
}))
