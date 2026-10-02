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
  form?: 1 | 2
  lastAction?: 'bark' | 'jump' | 'transform' | 'attack'
  lastActionTimestamp?: number
}

interface MultiplayerStore {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'OFFLINE'
  myId: string | null
  myName: string
  players: Record<string, RemotePlayer>
  connect: (playerName: string) => void
  disconnect: () => void
  sendUpdate: (
    pos: [number, number, number],
    rot: number,
    state: DogState,
    speed: number,
    form?: 1 | 2
  ) => void
  sendAction: (action: 'bark' | 'jump' | 'transform' | 'attack') => void
}

let socket: WebSocket | null = null
let lastUpdateSent = 0
const UPDATE_INTERVAL_MS = 40 // 25 updates per second

let localBotInterval: ReturnType<typeof setInterval> | null = null

function startLocalBot(set: any, get: any) {
  if (localBotInterval) return

  let botTarget = [3, 0, 3]
  let botIdleUntil = Date.now() + 2000
  let botNextBarkTime = Date.now() + 10000 + Math.random() * 10000
  let botBarkingUntil = 0

  const pickTarget = () => {
    const angle = Math.random() * Math.PI * 2
    const r = 3 + Math.random() * 9
    return [Math.sin(angle) * r, 0, Math.cos(angle) * r]
  }

  // Initial bot state
  set((state: any) => ({
    players: {
      ...state.players,
      'bot-mingsensei': {
        id: 'bot-mingsensei',
        name: 'mingsensei',
        position: [2.5, 0, 2.5],
        rotation: 0,
        state: 'IDLE',
        speed: 0,
      },
    },
  }))

  localBotInterval = setInterval(() => {
    if (get().status === 'CONNECTED') {
      if (localBotInterval) clearInterval(localBotInterval)
      localBotInterval = null
      return
    }

    const now = Date.now()
    const dt = 0.05
    const existing = get().players['bot-mingsensei']
    if (!existing) return

    let nextState = existing.state
    let nextSpeed = existing.speed
    let nextPos = [...existing.position] as [number, number, number]
    let nextRot = existing.rotation
    let nextAction = existing.lastAction
    let nextActionTimestamp = existing.lastActionTimestamp

    if (now < botBarkingUntil) {
      nextState = 'BARKING'
      nextSpeed = 0
    } else if (existing.state === 'BARKING') {
      nextState = 'IDLE'
      nextSpeed = 0
      nextAction = undefined
      botIdleUntil = now + 1500 + Math.random() * 2000
    } else if (now >= botNextBarkTime) {
      botNextBarkTime = now + 10000 + Math.random() * 10000
      nextState = 'BARKING'
      nextSpeed = 0
      botBarkingUntil = now + 1300
      nextAction = 'bark'
      nextActionTimestamp = now
      soundManager.playBark()
    } else if (now < botIdleUntil) {
      nextState = 'IDLE'
      nextSpeed = 0
    } else {
      const dx = botTarget[0] - nextPos[0]
      const dz = botTarget[2] - nextPos[2]
      const dist = Math.hypot(dx, dz)

      if (dist < 0.6) {
        nextState = 'IDLE'
        nextSpeed = 0
        botIdleUntil = now + 2500 + Math.random() * 3000
        botTarget = pickTarget()
      } else {
        const targetRot = Math.atan2(dx, dz)
        let diff = targetRot - nextRot
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        nextRot += diff * Math.min(1, 6 * dt)

        const walkSpeed = 1.8
        nextPos[0] += Math.sin(nextRot) * walkSpeed * dt
        nextPos[2] += Math.cos(nextRot) * walkSpeed * dt
        nextState = 'WALKING'
        nextSpeed = walkSpeed
      }
    }

    set((state: any) => ({
      players: {
        ...state.players,
        'bot-mingsensei': {
          ...existing,
          position: nextPos,
          rotation: nextRot,
          state: nextState,
          speed: nextSpeed,
          lastAction: nextAction,
          lastActionTimestamp: nextActionTimestamp,
        },
      },
    }))
  }, 50)
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  status: 'DISCONNECTED',
  myId: null,
  myName: '',
  players: {},

  connect: (playerName: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) return

    set({ status: 'CONNECTING', myName: playerName })

    // Determine WebSocket endpoint
    const envWs = (import.meta.env.VITE_WS_URL as string | undefined)?.trim()
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const defaultUrl = `${proto}//${window.location.host}/ws`
    const devUrl = envWs || defaultUrl
    const fallbackUrl = envWs || `ws://${window.location.hostname}:3001/ws`

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
                const clearBark = data.state !== 'BARKING' && existing.lastAction === 'bark'
                return {
                  players: {
                    ...state.players,
                    [data.id]: {
                      ...existing,
                      position: data.position,
                      rotation: data.rotation,
                      state: data.state,
                      speed: data.speed,
                      form: data.form ?? existing.form ?? 1,
                      lastAction: clearBark ? undefined : existing.lastAction,
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
              } else if (data.action === 'transform') {
                soundManager.playTransform()
              } else if (data.action === 'attack') {
                soundManager.playPunch(Math.floor(Math.random() * 4) + 1)
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
            startLocalBot(set, get)
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
          startLocalBot(set, get)
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

  sendUpdate: (position, rotation, state, speed, form = 1) => {
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
          form,
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
