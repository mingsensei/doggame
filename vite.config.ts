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

      // ── Bot "mingsensei" setup ─────────────────────────────────
      const bot = {
        id: 'bot-mingsensei',
        name: 'mingsensei',
        position: [2.5, 0, 2.5] as [number, number, number],
        rotation: 0,
        state: 'IDLE',
        speed: 0,
      }

      let botTarget = [3, 0, 3]
      let botIdleUntil = Date.now() + 2000
      let botNextBarkTime = Date.now() + 10000 + Math.random() * 10000 // 10s - 20s
      let botBarkingUntil = 0

      const pickTarget = () => {
        // Wanders randomly around spawn [0, 0, 0] within radius 3m - 12m
        const angle = Math.random() * Math.PI * 2
        const r = 3 + Math.random() * 9
        return [Math.sin(angle) * r, 0, Math.cos(angle) * r]
      }

      botTarget = pickTarget()

      const broadcastToAll = (payload: string) => {
        for (const [, p] of players.entries()) {
          if (p.ws.readyState === WebSocket.OPEN) p.ws.send(payload)
        }
      }

      // 20Hz Bot Wander & Bark Loop
      const botInterval = setInterval(() => {
        if (players.size === 0) return

        const now = Date.now()
        const dt = 0.05

        if (now < botBarkingUntil) {
          bot.state = 'BARKING'
          bot.speed = 0
        } else if (bot.state === 'BARKING') {
          bot.state = 'IDLE'
          bot.speed = 0
          botIdleUntil = now + 1500 + Math.random() * 2000
          broadcastToAll(
            JSON.stringify({
              type: 'player_updated',
              id: bot.id,
              position: bot.position,
              rotation: bot.rotation,
              state: 'IDLE',
              speed: 0,
            })
          )
        } else if (now >= botNextBarkTime) {
          // Time to bark: random every 10 - 20s
          botNextBarkTime = now + 10000 + Math.random() * 10000
          bot.state = 'BARKING'
          bot.speed = 0
          botBarkingUntil = now + 1300

          broadcastToAll(
            JSON.stringify({
              type: 'player_action',
              id: bot.id,
              action: 'bark',
            })
          )
          broadcastToAll(
            JSON.stringify({
              type: 'player_updated',
              id: bot.id,
              position: bot.position,
              rotation: bot.rotation,
              state: 'BARKING',
              speed: 0,
            })
          )
        } else if (now < botIdleUntil) {
          bot.state = 'IDLE'
          bot.speed = 0
        } else {
          // Wander towards random target
          const dx = botTarget[0] - bot.position[0]
          const dz = botTarget[2] - bot.position[2]
          const dist = Math.hypot(dx, dz)

          if (dist < 0.6) {
            bot.state = 'IDLE'
            bot.speed = 0
            botIdleUntil = now + 2500 + Math.random() * 3000
            botTarget = pickTarget()
          } else {
            const targetRot = Math.atan2(dx, dz)
            let diff = targetRot - bot.rotation
            while (diff < -Math.PI) diff += Math.PI * 2
            while (diff > Math.PI) diff -= Math.PI * 2
            bot.rotation += diff * Math.min(1, 6 * dt)

            const walkSpeed = 1.8
            bot.position[0] += Math.sin(bot.rotation) * walkSpeed * dt
            bot.position[2] += Math.cos(bot.rotation) * walkSpeed * dt
            bot.state = 'WALKING'
            bot.speed = walkSpeed
          }
        }

        // Broadcast bot update
        broadcastToAll(
          JSON.stringify({
            type: 'player_updated',
            id: bot.id,
            position: bot.position,
            rotation: bot.rotation,
            state: bot.state,
            speed: bot.speed,
          })
        )
      }, 50)

      server.httpServer?.on('close', () => clearInterval(botInterval))

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
              // Always include mingsensei bot
              currentPlayers[bot.id] = bot

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
                player.data.form = msg.form || 1

                const updatePayload = JSON.stringify({
                  type: 'player_updated',
                  id: playerId,
                  position: msg.position,
                  rotation: msg.rotation,
                  state: msg.state,
                  speed: msg.speed,
                  form: msg.form || 1,
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
