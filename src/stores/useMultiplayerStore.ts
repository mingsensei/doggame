import { create } from 'zustand'
import type { DogState } from '@/stores/useDogStore'
import { soundManager } from '@/game/audio/SoundManager'

export interface RemotePlayer {
  id: string
  name: string
  position: [number, number, number]
  rotation: number
  state: DogState
  speed: number
  lastAction?: 'bark' | 'jump' | 'ultimate'
  lastActionTimestamp?: number
}

interface MultiplayerStore {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'OFFLINE'
  myId: string | null
  myName: string
  players: Record<string, RemotePlayer>
  connect: (playerName: string) => void
  disconnect: () => void
  sendUpdate: (pos: [number, number, number], rot: number, state: DogState, speed: number) => void
  sendAction: (action: 'bark' | 'jump' | 'ultimate') => void
}

let socket: WebSocket | null = null
let lastUpdateSent = 0
const UPDATE_INTERVAL_MS = 40 // 25 updates per second

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  status: 'DISCONNECTED',
  myId: null,
  myName: '',
  players: {},

  connect: (playerName: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) return

    set({ status: 'CONNECTING', myName: playerName })

    // Determine WebSocket endpoint
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const devUrl = `${proto}//${window.location.host}/ws`
    const fallbackUrl = `ws://${window.location.hostname}:3001/ws`

    const tryConnect = (url: string, isFallback = false) => {
      try {
        const ws = new WebSocket(url)
        socket = ws

        ws.onopen = () => {
          set({ status: 'CONNECTED' })
          ws.send(
            JSON.stringify({
              type: 'join',
              name: playerName,
              position: [0, 0, 0],
              rotation: 0,
              state: 'IDLE',
            })
          )
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'welcome') {
              set({
                myId: data.id,
                players: data.players || {},
              })
            } else if (data.type === 'player_joined') {
              set((state) => ({
                players: {
                  ...state.players,
                  [data.player.id]: data.player,
                },
              }))
            } else if (data.type === 'player_updated') {
              set((state) => {
                const existing = state.players[data.id]
                if (!existing) return state
                return {
                  players: {
                    ...state.players,
                    [data.id]: {
                      ...existing,
                      position: data.position,
                      rotation: data.rotation,
                      state: data.state,
                      speed: data.speed,
                    },
                  },
                }
              })
            } else if (data.type === 'player_action') {
              set((state) => {
                const existing = state.players[data.id]
                if (!existing) return state
                return {
                  players: {
                    ...state.players,
                    [data.id]: {
                      ...existing,
                      lastAction: data.action,
                      lastActionTimestamp: Date.now(),
                    },
                  },
                }
              })

              // Play spatial audio for other player's actions
              if (data.action === 'bark') {
                soundManager.playBark()
              } else if (data.action === 'jump') {
                soundManager.playJump()
              } else if (data.action === 'ultimate') {
                soundManager.playUltimateActivation()
              }
            } else if (data.type === 'player_left') {
              set((state) => {
                const updated = { ...state.players }
                delete updated[data.id]
                return { players: updated }
              })
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }

        ws.onerror = () => {
          if (!isFallback) {
            console.log('Main WS connection failed, trying standalone port 3001 fallback...')
            tryConnect(fallbackUrl, true)
          } else {
            console.warn('Multiplayer server unavailable, continuing in offline singleplayer mode.')
            set({ status: 'OFFLINE' })
          }
        }

        ws.onclose = () => {
          set({ status: 'DISCONNECTED', myId: null, players: {} })
        }
      } catch (err) {
        if (!isFallback) {
          tryConnect(fallbackUrl, true)
        } else {
          set({ status: 'OFFLINE' })
        }
      }
    }

    tryConnect(devUrl)
  },

  disconnect: () => {
    if (socket) {
      socket.close()
      socket = null
    }
    set({ status: 'DISCONNECTED', myId: null, players: {} })
  },

  sendUpdate: (position, rotation, state, speed) => {
    const now = Date.now()
    if (now - lastUpdateSent < UPDATE_INTERVAL_MS) return
    lastUpdateSent = now

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'update',
          position,
          rotation,
          state,
          speed,
        })
      )
    }
  },

  sendAction: (action) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'action',
          action,
        })
      )
    }
  },
}))
