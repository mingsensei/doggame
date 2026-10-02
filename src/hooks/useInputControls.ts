import { useEffect, useRef } from 'react'
import { useInputStore } from '@/stores/useInputStore'
import { useMultiplayerStore } from '@/stores/useMultiplayerStore'

const CODE_MAP: Record<string, keyof ReturnType<typeof useInputStore.getState>> = {
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

const KEY_FALLBACKS: Record<string, keyof ReturnType<typeof useInputStore.getState>> = {
  w: 'forward',
  s: 'backward',
  a: 'left',
  d: 'right',
  ' ': 'jump',
  spacebar: 'jump',
  e: 'interact',
  f: 'collect',
  q: 'ultimate',
  shift: 'run',
}

function resolveKey(e: KeyboardEvent): keyof ReturnType<typeof useInputStore.getState> | undefined {
  if (CODE_MAP[e.code]) return CODE_MAP[e.code]
  return KEY_FALLBACKS[e.key.toLowerCase()]
}

/**
 * Registers keyboard and mouse drag listeners to sync with useInputStore.
 * Left-click or right-click drag orbits camera, scroll zooms.
 */
export function useInputControls(): void {
  const { setKey, setMouseDelta, setScroll } = useInputStore()
  const isDraggingRef = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      // Don't intercept refresh / devtools
      if (e.code === 'F5' || e.code === 'F12' || (e.ctrlKey && e.code === 'KeyR')) return

      const target = e.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      // Press Enter to open chat when not typing
      if ((e.code === 'Enter' || e.key === 'Enter') && !isTyping) {
        e.preventDefault()
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
        useMultiplayerStore.getState().setChatOpen(true)
        return
      }

      // Press Tab or L to toggle Pointer Lock (free look camera)
      if ((e.code === 'Tab' || e.code === 'KeyL') && !isTyping) {
        e.preventDefault()
        useInputStore.getState().togglePointerLock()
        return
      }

      // Ignore game controls while typing in input/textarea
      if (isTyping) return

      const mapped = resolveKey(e)
      if (mapped) {
        if (mapped === 'jump') e.preventDefault()
        setKey(mapped as Parameters<typeof setKey>[0], true)
      }
    }

    const onKeyUp = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if (isTyping) return

      const mapped = resolveKey(e)
      if (mapped) {
        setKey(mapped as Parameters<typeof setKey>[0], false)
      }
    }

    const onMouseDown = (e: MouseEvent): void => {
      // In pointer lock mode: left-click immediately attacks in Form 2
      if (document.pointerLockElement) {
        if (e.button === 0) {
          setKey('attack', true)
        }
        return
      }

      // Ignore clicks on HUD buttons, inputs, or chat container
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.closest('button') ||
          target.tagName === 'INPUT' ||
          target.closest('.chat-container'))
      ) {
        return
      }

      // Left click triggers combat attack in Form 2
      if (e.button === 0) {
        setKey('attack', true)
      }

      // Drag with left or right click
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true
        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseMove = (e: MouseEvent): void => {
      // In pointer lock mode: screen rotates automatically as mouse moves, no drag needed!
      if (document.pointerLockElement) {
        setMouseDelta(e.movementX, e.movementY)
        return
      }

      if (!isDraggingRef.current) return
      const dx = e.clientX - lastMousePos.current.x
      const dy = e.clientY - lastMousePos.current.y
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      setMouseDelta(dx, dy)
    }

    const onMouseUp = (e: MouseEvent): void => {
      isDraggingRef.current = false
      if (e.button === 0) {
        setKey('attack', false)
      }
    }

    const onWheel = (e: WheelEvent): void => {
      setScroll(e.deltaY)
    }

    const onContextMenu = (e: MouseEvent): void => {
      // Prevent context menu when right clicking to orbit
      e.preventDefault()
    }

    const onPointerLockChange = (): void => {
      useInputStore.getState().setPointerLocked(!!document.pointerLockElement)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [setKey, setMouseDelta, setScroll])
}
