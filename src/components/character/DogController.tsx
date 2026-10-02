import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useDogStore } from '@/stores/useDogStore'
import { useInputStore } from '@/stores/useInputStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { useMultiplayerStore } from '@/stores/useMultiplayerStore'
import { cameraDirection } from '@/stores/cameraDirection'
import {
  WALK_SPEED,
  RUN_SPEED,
  ROTATION_LERP,
  BARK_DURATION,
  PEE_DURATION,
} from '@/utils/constants'
import { lerp } from '@/utils/math'

import { soundManager } from '@/game/audio/SoundManager'

// Reusable scratch vectors to avoid GC in useFrame
const inputDir = new THREE.Vector3()
const moveDir = new THREE.Vector3()

export function useDogMovement(rigidBodyRef: React.RefObject<RapierRigidBody>) {
  const currentRotation = useRef(0)
  const currentSpeed = useRef(0)
  const actionTimeoutRef = useRef<number | null>(null)
  const lastPeeTime = useRef(0)
  const idleTimer = useRef(0)

  useFrame((_, delta) => {
    const rb = rigidBodyRef.current
    if (!rb) return

    const {
      state,
      form,
      isLocked,
      setState,
      setPosition,
      setRotation,
      setSpeed,
      toggleForm,
      triggerAttack,
    } = useDogStore.getState()
    const { forward, backward, left, right, run, jump, interact, ultimate, attack } =
      useInputStore.getState()
    const { activeTarget } = useInteractionStore.getState()

    // Read current physics translation & linear velocity
    const pos = rb.translation()
    const curLinvel = rb.linvel()
    setPosition([pos.x, pos.y, pos.z])

    // Ground contact check (taller in Form 2)
    const groundThreshold = form === 2 ? 0.75 : 0.45
    const isGrounded = pos.y < groundThreshold && Math.abs(curLinvel.y) < 3.0

    // Calculate raw input vector
    inputDir.set(0, 0, 0)
    if (forward) inputDir.z -= 1
    if (backward) inputDir.z += 1
    if (left) inputDir.x -= 1
    if (right) inputDir.x += 1

    const isMoving = inputDir.lengthSq() > 0.001

    // When the dog starts moving, automatically stop barking or sniffing immediately
    if (isMoving && (state === 'BARKING' || state === 'SNIFFING')) {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current)
        actionTimeoutRef.current = null
      }
      setState(run ? 'RUNNING' : 'WALKING')
    }

    // ── Handle Form Transformation (Q key) ─────────────────────
    if (ultimate && !isLocked()) {
      useInputStore.getState().setKey('ultimate', false)
      const nextForm = toggleForm()
      soundManager.playTransform()
      useMultiplayerStore.getState().sendAction('transform')
    }

    // ── Handle Combat Attack Combo (Left Mouse Click in Form 2) ───
    if (attack && !isLocked()) {
      useInputStore.getState().setKey('attack', false)
      if (form === 2) {
        const step = triggerAttack()
        if (step > 0) {
          soundManager.playPunch(step)
          useMultiplayerStore.getState().sendAction('attack')
        }
      }
    }

    // Handle Jump Trigger (Space key)
    if (jump && isGrounded && !isLocked()) {
      useInputStore.getState().setKey('jump', false)
      useMultiplayerStore.getState().sendAction('jump')
      const JUMP_IMPULSE = form === 2 ? 9.5 : 8.5
      rb.setLinvel({ x: curLinvel.x, y: JUMP_IMPULSE, z: curLinvel.z }, true)
      setState('JUMPING')
      soundManager.playJump()
    }

    // Detect Landing from JUMPING
    if (state === 'JUMPING' && isGrounded && curLinvel.y <= 0.1) {
      setState(isMoving ? (run ? 'RUNNING' : 'WALKING') : 'IDLE')
    }

    // Handle Interaction Trigger (E key)
    if (interact && !isLocked()) {
      useInputStore.getState().setKey('interact', false)
      const now = Date.now()
      const PEE_COOLDOWN_MS = 6000

      if (
        activeTarget &&
        (activeTarget.type === 'hydrant' ||
          activeTarget.type === 'tree' ||
          activeTarget.type === 'bush') &&
        now - lastPeeTime.current > PEE_COOLDOWN_MS
      ) {
        lastPeeTime.current = now
        setState('PEEING')
        if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current)
        actionTimeoutRef.current = window.setTimeout(() => {
          useDogStore.getState().setState('IDLE')
        }, PEE_DURATION)
      } else {
        useMultiplayerStore.getState().sendAction('bark')
        setState('BARKING')
        if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current)
        actionTimeoutRef.current = window.setTimeout(() => {
          useDogStore.getState().setState('IDLE')
        }, BARK_DURATION)
      }
    }

    // If dog is currently peeing: smoothly brake to zero
    if (isLocked()) {
      currentSpeed.current = lerp(currentSpeed.current, 0, 1 - Math.exp(-10 * delta))
      const curLinvel = rb.linvel()
      rb.setLinvel({ x: 0, y: curLinvel.y, z: 0 }, true)
      setSpeed(0)
      return
    }

    if (isMoving) {
      idleTimer.current = 0
      inputDir.normalize()

      // Transform input vector by camera azimuth
      const camAngle = cameraDirection.azimuth
      moveDir
        .set(
          inputDir.x * Math.cos(camAngle) + inputDir.z * Math.sin(camAngle),
          0,
          -inputDir.x * Math.sin(camAngle) + inputDir.z * Math.cos(camAngle)
        )
        .normalize()

      // Target Movement Speed with Smooth Acceleration Curve (Form 2 has 1.2x warrior agility)
      const speedMultiplier = form === 2 ? 1.2 : 1.0
      const targetSpeed = (run ? RUN_SPEED : WALK_SPEED) * speedMultiplier
      const accelRate = run ? 6.5 : 8.5
      currentSpeed.current = lerp(
        currentSpeed.current,
        targetSpeed,
        1 - Math.exp(-accelRate * delta)
      )

      const targetState = run ? 'RUNNING' : 'WALKING'
      if (state !== targetState) {
        setState(targetState)
      }

      // Preserve vertical velocity (gravity / falling)
      const currentLinvel = rb.linvel()
      rb.setLinvel(
        {
          x: moveDir.x * currentSpeed.current,
          y: currentLinvel.y,
          z: moveDir.z * currentSpeed.current,
        },
        true
      )

      // Smoothly rotate character to face direction of movement
      const targetAngle = Math.atan2(moveDir.x, moveDir.z)
      let diff = targetAngle - currentRotation.current
      while (diff < -Math.PI) diff += Math.PI * 2
      while (diff > Math.PI) diff -= Math.PI * 2

      const rotFactor = 1 - Math.exp(-ROTATION_LERP * 60 * delta)
      currentRotation.current += diff * rotFactor

      setSpeed(currentSpeed.current)
      setRotation(currentRotation.current)
    } else {
      // Not moving — smooth deceleration to full stop
      currentSpeed.current = lerp(currentSpeed.current, 0, 1 - Math.exp(-10 * delta))
      if (currentSpeed.current < 0.05) currentSpeed.current = 0

      const currentLinvel = rb.linvel()
      rb.setLinvel(
        {
          x: moveDir.x * currentSpeed.current,
          y: currentLinvel.y,
          z: moveDir.z * currentSpeed.current,
        },
        true
      )
      setSpeed(currentSpeed.current)

      if (state !== 'IDLE' && state !== 'SNIFFING' && !isLocked()) {
        setState('IDLE')
      }

      // Natural Idle Sniffing Engine
      if (state === 'IDLE') {
        idleTimer.current += delta
        if (idleTimer.current > 4.5) {
          idleTimer.current = 0
          if (Math.random() < 0.35) {
            setState('SNIFFING')
            if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current)
            actionTimeoutRef.current = window.setTimeout(() => {
              if (useDogStore.getState().state === 'SNIFFING') {
                useDogStore.getState().setState('IDLE')
              }
            }, 2200)
          }
        }
      }
    }
  })

  return { currentRotation }
}
