import { useFrame } from '@react-three/fiber'
import { useMultiplayerStore } from '@/stores/useMultiplayerStore'
import { useDogStore } from '@/stores/useDogStore'
import { RemoteDog } from './RemoteDog'

export function RemotePlayers(): JSX.Element {
  const players = useMultiplayerStore((s) => s.players)
  const sendUpdate = useMultiplayerStore((s) => s.sendUpdate)

  // Continuously sync local dog position/rotation/state/speed to server
  useFrame(() => {
    const { position, rotation, state, speed, form } = useDogStore.getState()
    sendUpdate(position, rotation, state, speed, form)
  })

  return (
    <group>
      {Object.values(players).map((player) => (
        <RemoteDog key={player.id} player={player} />
      ))}
    </group>
  )
}
