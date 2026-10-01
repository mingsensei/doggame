import { useEffect } from 'react'
import { useInputStore } from '@/stores/useInputStore'

const KEY_MAP: Record<string, keyof ReturnType<typeof useInputStore.getState>> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  Space: 'jump',
  KeyE: 'interact',
  KeyF: 'collect',
  KeyQ: 'ultimate',
}

/**
 * Registers keyboard listeners and syncs to useInputStore.
 * Must be mounted once, outside the Canvas.
 */
export function useKeyboard(): void {
  const { setKey } = useInputStore()

  useEffect(() => {
    const onDown = (e: KeyboardEvent): void => {
      const mapped = KEY_MAP[e.code]
      if (mapped) {
        e.preventDefault()
        setKey(mapped as Parameters<typeof setKey>[0], true)
      }
    }

    const onUp = (e: KeyboardEvent): void => {
      const mapped = KEY_MAP[e.code]
      if (mapped) setKey(mapped as Parameters<typeof setKey>[0], false)
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [setKey])
}
