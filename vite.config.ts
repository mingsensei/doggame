import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { WebSocketServer, WebSocket } from 'ws'

function multiplayerWebSocketPlugin(): Plugin {
  return {
    name: 'multiplayer-ws',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true })
      const players = new Map<string, { ws: WebSocket; data: Record<string, unknown> }>()
      let nextPlayerId = 1

      server.httpServer?.on('upgrade', (request, socket, head) => {
        if (request.url === '/ws') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
          })
        }
      })

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

              const currentPlayers: Record<string, unknown> = {}
              for (const [id, p] of players.entries()) {
                if (id !== playerId) currentPlayers[id] = p.data
              }

              ws.send(JSON.stringify({ type: 'welcome', id: playerId, players: currentPlayers }))

              const joinPayload = JSON.stringify({ type: 'player_joined', player: playerData })
              for (const [id, p] of players.entries()) {
                if (id !== playerId && p.ws.readyState === WebSocket.OPEN) p.ws.send(joinPayload)
              }
            } else if (msg.type === 'update') {
              const player = players.get(playerId)
              if (player) {
                player.data.position = msg.position
                player.data.rotation = msg.rotation
                player.data.state = msg.state
                player.data.speed = msg.speed

                const updatePayload = JSON.stringify({
                  type: 'player_updated',
                  id: playerId,
                  position: msg.position,
                  rotation: msg.rotation,
                  state: msg.state,
                  speed: msg.speed,
                })
                for (const [id, p] of players.entries()) {
                  if (id !== playerId && p.ws.readyState === WebSocket.OPEN) p.ws.send(updatePayload)
                }
              }
            } else if (msg.type === 'action') {
              const actionPayload = JSON.stringify({
                type: 'player_action',
                id: playerId,
                action: msg.action,
              })
              for (const [id, p] of players.entries()) {
                if (id !== playerId && p.ws.readyState === WebSocket.OPEN) p.ws.send(actionPayload)
              }
            }
          } catch (e) {
            console.error('WS Error:', e)
          }
        })

        ws.on('close', () => {
          players.delete(playerId)
          const leftPayload = JSON.stringify({ type: 'player_left', id: playerId })
          for (const [, p] of players.entries()) {
            if (p.ws.readyState === WebSocket.OPEN) p.ws.send(leftPayload)
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), multiplayerWebSocketPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@react-three/rapier'],
  },
})
