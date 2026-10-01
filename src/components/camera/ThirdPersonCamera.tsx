import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDogStore } from '@/stores/useDogStore'
import { useInputStore } from '@/stores/useInputStore'
import {
  CAMERA_DEFAULT_OFFSET,
  CAMERA_LERP,
  CAMERA_MIN_ZOOM,
  CAMERA_MAX_ZOOM,
  CAMERA_MIN_ELEVATION,
  CAMERA_MAX_ELEVATION,
  CAMERA_FOV_DEFAULT,
  CAMERA_FOV_RUN,
  CAMERA_FOV_LERP,
} from '@/utils/constants'
import { degToRad, lerp, clamp } from '@/utils/math'
import { cameraDirection } from '@/stores/cameraDirection'

export function ThirdPersonCamera(): null {
  const { camera } = useThree()
  const targetLookAt = useRef(new THREE.Vector3())
  const currentLookAt = useRef(new THREE.Vector3())
  const desiredPosition = useRef(new THREE.Vector3())

  // Spherical orbit angles
  const orbit = useRef({
    radius: Math.sqrt(
      CAMERA_DEFAULT_OFFSET[0] ** 2 +
      CAMERA_DEFAULT_OFFSET[1] ** 2 +
      CAMERA_DEFAULT_OFFSET[2] ** 2
    ),
    theta: 0, // Azimuth angle around Y axis
    phi: Math.PI / 4, // Elevation angle from ground plane
  })

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 3, 6)
  }, [camera])

  useFrame((_, delta) => {
    const { position: dogPos, state: dogState } = useDogStore.getState()
    const { mouseDeltaX, mouseDeltaY, mouseScrollDelta, clearFrame } = useInputStore.getState()

    // 1. Update orbit angles based on mouse drag
    if (mouseDeltaX !== 0 || mouseDeltaY !== 0) {
      const sensitivity = 0.005
      orbit.current.theta -= mouseDeltaX * sensitivity
      orbit.current.phi = clamp(
        orbit.current.phi + mouseDeltaY * sensitivity,
        degToRad(CAMERA_MIN_ELEVATION),
        degToRad(CAMERA_MAX_ELEVATION)
      )
    }

    // 2. Update zoom based on scroll wheel
    if (mouseScrollDelta !== 0) {
      orbit.current.radius = clamp(
        orbit.current.radius + mouseScrollDelta * 0.005,
        CAMERA_MIN_ZOOM,
        CAMERA_MAX_ZOOM
      )
    }

    // Share azimuth for character movement direction
    cameraDirection.azimuth = orbit.current.theta

    // Reset per-frame mouse deltas
    clearFrame()

    // 3. Compute target look-at (dog head)
    targetLookAt.current.set(dogPos[0], dogPos[1] + 0.6, dogPos[2])
    currentLookAt.current.lerp(targetLookAt.current, 0.15)

    // 4. Compute spherical camera position relative to look-at
    const r = orbit.current.radius
    const phi = orbit.current.phi
    const theta = orbit.current.theta

    const offsetX = r * Math.cos(phi) * Math.sin(theta)
    const offsetY = r * Math.sin(phi)
    const offsetZ = r * Math.cos(phi) * Math.cos(theta)

    desiredPosition.current.set(
      targetLookAt.current.x + offsetX,
      targetLookAt.current.y + offsetY,
      targetLookAt.current.z + offsetZ
    )

    // Ensure camera stays above ground
    if (desiredPosition.current.y < 0.5) {
      desiredPosition.current.y = 0.5
    }

    // Smoothly interpolate camera position
    const t = 1 - Math.exp(-CAMERA_LERP * 60 * delta)
    camera.position.lerp(desiredPosition.current, t)
    camera.lookAt(currentLookAt.current)

    // 5. Dynamic FOV during RUNNING
    const targetFov = dogState === 'RUNNING' ? CAMERA_FOV_RUN : CAMERA_FOV_DEFAULT
    if ('fov' in camera && typeof camera.fov === 'number') {
      camera.fov = lerp(camera.fov, targetFov, CAMERA_FOV_LERP)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
