import { useRef } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useDogMovement } from './DogController'
import { DogModel } from './DogModel'

export function Dog(): JSX.Element {
  const rigidBodyRef = useRef<RapierRigidBody>(null)

  // Hook handles physics velocity, rotation, and FSM updates
  useDogMovement(rigidBodyRef)

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      position={[0, 1, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={4}
      mass={20}
      name="dog"
    >
      {/* Box / Capsule collider for dog physics */}
      <CuboidCollider args={[0.3, 0.35, 0.45]} position={[0, 0.35, 0]} />

      {/* Animated Dog Model */}
      <DogModel />
    </RigidBody>
  )
}
