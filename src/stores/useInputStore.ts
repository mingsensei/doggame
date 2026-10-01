import { create } from 'zustand'

interface InputStore {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  run: boolean
  jump: boolean
  interact: boolean
  collect: boolean
  ultimate: boolean
  /** Camera mouse delta this frame */
  mouseDeltaX: number
  mouseDeltaY: number
  mouseScrollDelta: number
  setKey: (key: keyof Omit<InputStore, 'setKey' | 'setMouseDelta' | 'setScroll' | 'clearFrame'>, value: boolean) => void
  setMouseDelta: (dx: number, dy: number) => void
  setScroll: (delta: number) => void
  /** Called at end of frame to reset per-frame values */
  clearFrame: () => void
}

export const useInputStore = create<InputStore>((set) => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  interact: false,
  collect: false,
  ultimate: false,
  mouseDeltaX: 0,
  mouseDeltaY: 0,
  mouseScrollDelta: 0,

  setKey: (key, value) => set({ [key]: value }),
  setMouseDelta: (dx, dy) => set({ mouseDeltaX: dx, mouseDeltaY: dy }),
  setScroll: (delta) => set({ mouseScrollDelta: delta }),
  clearFrame: () => set({ mouseDeltaX: 0, mouseDeltaY: 0, mouseScrollDelta: 0 }),
}))
