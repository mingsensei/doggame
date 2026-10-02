import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

const PORT = process.env.PORT || 3001

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok', server: 'Dog World Multiplayer Server' }))
})

const wss = new WebSocketServer({ server, path: '/ws' })

/**
 * Connected players map: id -> { ws, data: { id, name, position, rotation, state, speed } }
 */
const players = new Map()
let nextPlayerId = 1

wss.on('connection', (ws) => {
  const playerId = `dog-${nextPlayerId++}-${Math.random().toString(36).slice(2, 6)}`

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString())

      if (msg.type === 'join') {
        const playerData = {
          id: playerId,
          name: msg.name || `Cún ${playerId.slice(-4)}`,
          position: msg.position || [0, 0, 0],
          rotation: msg.rotation || 0,
          state: msg.state || 'IDLE',
          speed: 0,
        }

        players.set(playerId, { ws, data: playerData })

        // Send welcome packet with current players list
        const currentPlayers = {}
        for (const [id, p] of players.entries()) {
          if (id !== playerId) {
            currentPlayers[id] = p.data
          }
        }

        ws.send(
          JSON.stringify({
            type: 'welcome',
            id: playerId,
            players: currentPlayers,
          })
        )

        // Broadcast new player joined to all other clients
        broadcast(
          {
            type: 'player_joined',
            player: playerData,
          },
          playerId
        )

        console.log(`🐾 Player joined: ${playerData.name} (${playerId}). Total online: ${players.size}`)
      } else if (msg.type === 'update') {
        const player = players.get(playerId)
        if (player) {
          player.data.position = msg.position
          player.data.rotation = msg.rotation
          player.data.state = msg.state
          player.data.speed = msg.speed

          // Broadcast movement update to all other players
          broadcast(
            {
              type: 'player_updated',
              id: playerId,
              position: msg.position,
              rotation: msg.rotation,
              state: msg.state,
              speed: msg.speed,
            },
            playerId
          )
        }
      } else if (msg.type === 'action') {
        // Player triggered an action (bark, jump, ultimate)
        broadcast(
          {
            type: 'player_action',
            id: playerId,
            action: msg.action,
          },
          playerId
        )
      }
    } catch (e) {
      console.error('Error handling message:', e)
    }
  })

  ws.on('close', () => {
    const player = players.get(playerId)
    const name = player ? player.data.name : playerId
    players.delete(playerId)
    broadcast({
      type: 'player_left',
      id: playerId,
    })
    console.log(`👋 Player left: ${name} (${playerId}). Total online: ${players.size}`)
  })
})

function broadcast(msg, excludeId = null) {
  const payload = JSON.stringify(msg)
  for (const [id, p] of players.entries()) {
    if (id !== excludeId && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload)
    }
  }
}

server.listen(PORT, () => {
  console.log(`🐕 Dog World WebSocket Server running on ws://localhost:${PORT}/ws`)
})
