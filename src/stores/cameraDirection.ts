/**
 * Shared camera direction state.
 * Updated by ThirdPersonCamera every frame.
 * Read by DogController for camera-relative movement.
 *
 * Separated from ThirdPersonCamera.tsx to avoid Vite Fast Refresh
 * warnings about mixing component exports with non-component exports.
 */
export const cameraDirection = {
  azimuth: 0,
}
