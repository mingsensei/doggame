import { create } from 'zustand'

export interface InteractableObject {
  id: string
  type: 'hydrant' | 'tree' | 'bush' | 'bone' | 'stranger'
  position: [number, number, number]
}

interface InteractionStore {
  nearby: InteractableObject[]
  activeTarget: InteractableObject | null
  addNearby: (obj: InteractableObject) => void
  removeNearby: (id: string) => void
  setActiveTarget: (obj: InteractableObject | null) => void
}

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  nearby: [],
  activeTarget: null,

  addNearby: (obj) => {
    const already = get().nearby.find((o) => o.id === obj.id)
    if (!already) set((s) => ({ nearby: [...s.nearby, obj] }))
  },

  removeNearby: (id) => {
    set((s) => ({
      nearby: s.nearby.filter((o) => o.id !== id),
      activeTarget: s.activeTarget?.id === id ? null : s.activeTarget,
    }))
  },

  setActiveTarget: (obj) => set({ activeTarget: obj }),
}))
