import { useEffect } from 'react'
import { soundManager } from '@/game/audio/SoundManager'

/**
 * Mutes all audio when the browser tab is hidden (alt-tab, switch tabs).
 * Resumes when returning to the tab.
 */
export function usePageVisibility(): void {
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        soundManager.updateVolumes() // will compute near-zero gain
      } else {
        soundManager.updateVolumes()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])
}
