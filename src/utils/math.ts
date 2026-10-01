import * as THREE from 'three'

/** Linear interpolation — works on numbers */
export const lerp = THREE.MathUtils.lerp

/** Clamp a value between min and max */
export const clamp = THREE.MathUtils.clamp

/** Convert degrees to radians */
export const degToRad = THREE.MathUtils.degToRad

/** Seeded pseudo-random: generates a float in [min, max] based on integer seed */
export function seededRandom(seed: number, min = 0, max = 1): number {
  const x = Math.sin(seed + 1) * 10000
  return min + (x - Math.floor(x)) * (max - min)
}

/** Scatter N objects randomly across a square area avoiding the centre */
export function scatterPositions(
  count: number,
  halfExtent: number,
  minDistFromCenter = 5,
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = []
  for (let i = 0; i < count; i++) {
    let x: number, z: number
    do {
      x = seededRandom(i * 2, -halfExtent, halfExtent)
      z = seededRandom(i * 2 + 1, -halfExtent, halfExtent)
    } while (Math.sqrt(x * x + z * z) < minDistFromCenter)
    positions.push(new THREE.Vector3(x, 0, z))
  }
  return positions
}
