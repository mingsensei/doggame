import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useInteractionStore, type InteractableObject } from '@/stores/useInteractionStore'
import { useDogStore } from '@/stores/useDogStore'
import { INTERACTION_RADIUS } from '@/utils/constants'

interface InteractableZoneProps {
  id: string
  type: InteractableObject['type']
  position: [number, number, number]
  radius?: number
}

/**
 * Reusable proximity trigger zone that computes distance to the dog each frame.
 * When inside radius, registers itself as activeTarget in useInteractionStore.
 */
export function InteractableZone({
  id,
  type,
  position,
  radius = INTERACTION_RADIUS,
}: InteractableZoneProps): null {
  const isInside = useRef(false)
  const { addNearby, removeNearby, setActiveTarget } = useInteractionStore()

  useEffect(() => {
    return () => {
      removeNearby(id)
    }
  }, [id, removeNearby])

  useFrame(() => {
    const [dx, dy, dz] = useDogStore.getState().position
    const distSq =
      (dx - position[0]) ** 2 +
      (dy - position[1]) ** 2 +
      (dz - position[2]) ** 2

    const insideNow = distSq <= radius * radius

    if (insideNow && !isInside.current) {
      isInside.current = true
      const obj: InteractableObject = { id, type, position }
      addNearby(obj)
      setActiveTarget(obj)
    } else if (!insideNow && isInside.current) {
      isInside.current = false
      removeNearby(id)
    }
  })

  return null
}
