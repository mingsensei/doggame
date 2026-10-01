import { useSettingsStore } from '@/stores/useSettingsStore'

class SoundManager {
  private ctx: AudioContext | null = null
  private ambientGain: GainNode | null = null
  private isAmbientPlaying = false
  private birdTimer: number | null = null
  private barkBuffer: AudioBuffer | null = null

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
      this.loadBarkAudio()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  private async loadBarkAudio() {
    if (this.barkBuffer || !this.ctx) return
    try {
      const res = await fetch('/assets/audio/bark.mp3')
      const arrayBuf = await res.arrayBuffer()
      this.barkBuffer = await this.ctx.decodeAudioData(arrayBuf)
    } catch (e) {
      console.warn('Could not load bark.mp3 audio, will use synthetic fallback', e)
    }
  }

  private getMasterGain(): number {
    return useSettingsStore.getState().masterVolume
  }

  private getSfxGain(): number {
    return useSettingsStore.getState().sfxVolume * this.getMasterGain()
  }

  private getMusicGain(): number {
    return useSettingsStore.getState().musicVolume * this.getMasterGain()
  }

  /**
   * Energetic Dog Jump Sound (paw launch + airy whoosh)
   */
  public playJump() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime

    // 1. Springy launch tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.14)

    gain.gain.setValueAtTime(0.18 * volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.17)

    // 2. Soft air whoosh
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < buffer.length; i++) data[i] = (Math.random() * 2 - 1) * 0.12
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(800, now)
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.12)
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.12 * volume, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)
  }

  /**
   * Play realistic bark sound from audio asset (with fallback)
   */
  public playBark(_pitchVariant = 0) {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    if (this.barkBuffer) {
      const source = ctx.createBufferSource()
      source.buffer = this.barkBuffer
      // Subtle pitch variation for natural barks
      source.playbackRate.value = 0.95 + Math.random() * 0.1
      const gain = ctx.createGain()
      gain.gain.value = 0.7 * volume
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)
      return
    }

    // Fallback if audio buffer is still decoding
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12)
    gain.gain.setValueAtTime(0.4 * volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Surface-Aware Footstep Sound (Grass vs Concrete Road)
   */
  public playFootstep(surface: 'grass' | 'road' = 'grass', isRunning = false) {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime
    const runMul = isRunning ? 1.3 : 1.0

    if (surface === 'road') {
      // Concrete tap: higher pitch impact + click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(180 + Math.random() * 40, now)
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.05)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(800, now)

      gain.gain.setValueAtTime(0.16 * volume * runMul, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.06)
    } else {
      // Turf / Grass: soft earthy low thump + foliage brush
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(85 + Math.random() * 25, now)
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.07)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(350, now)

      gain.gain.setValueAtTime(0.14 * volume * runMul, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.08)
    }
  }

  /**
   * Scent Sniffing SFX (Dual nostril in-breath)
   */
  public playSniff() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime
    const duration = 0.12

    const playInhale = (time: number) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < buffer.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1600, time)
      filter.Q.setValueAtTime(4.0, time)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.01, time)
      gain.gain.linearRampToValueAtTime(0.2 * volume, time + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start(time)
    }

    playInhale(now)
    playInhale(now + 0.15)
  }

  /**
   * Pee Trickling Sound
   */
  public playPee() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime
    const duration = 2.2

    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1350, now)
    filter.Q.setValueAtTime(7, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.18 * volume, now + 0.2)
    gain.gain.setValueAtTime(0.18 * volume, now + duration - 0.4)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + duration)
  }

  /**
   * Sparkle Chime when picking up a Bone
   */
  public playBoneCollect() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 chord arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.08)

      gain.gain.setValueAtTime(0, now + idx * 0.08)
      gain.gain.linearRampToValueAtTime(0.25 * volume, now + idx * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.08)
      osc.stop(now + idx * 0.08 + 0.4)
    })
  }

  /**
   * Rich Multi-Layer Outdoor Soundscape:
   * 1. Wind ambience with dynamic breathing filter
   * 2. Distant urban city hum (GTA V background depth)
   * 3. Natural bird chirps at semi-random intervals
   */
  public startAmbient() {
    if (this.isAmbientPlaying) return
    const ctx = this.initContext()
    this.isAmbientPlaying = true

    // ── Layer 1: Pink Noise Wind ──
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      data[i] = (b0 + b1 + b2) * 0.09
    }

    const wind = ctx.createBufferSource()
    wind.buffer = buffer
    wind.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(320, ctx.currentTime)

    this.ambientGain = ctx.createGain()
    this.ambientGain.gain.setValueAtTime(0.09 * this.getMusicGain(), ctx.currentTime)

    wind.connect(filter)
    filter.connect(this.ambientGain)
    this.ambientGain.connect(ctx.destination)
    wind.start()

    // ── Layer 2: Distant Urban City Rumble (60Hz Sub-drone) ──
    const cityOsc = ctx.createOscillator()
    const cityGain = ctx.createGain()
    cityOsc.type = 'sine'
    cityOsc.frequency.setValueAtTime(62, ctx.currentTime)
    cityGain.gain.setValueAtTime(0.02 * this.getMusicGain(), ctx.currentTime)
    cityOsc.connect(cityGain)
    cityGain.connect(ctx.destination)
    cityOsc.start()

    // ── Layer 3: Natural Bird Song Interval Engine ──
    const scheduleNextBird = () => {
      const delay = 4000 + Math.random() * 6000
      this.birdTimer = window.setTimeout(() => {
        this.playBirdChirp()
        scheduleNextBird()
      }, delay)
    }
    scheduleNextBird()
  }

  /**
   * Procedural Songbird Chirp
   */
  private playBirdChirp() {
    if (!this.ctx || this.ctx.state === 'suspended') return
    const volume = this.getMusicGain()
    if (volume <= 0.001) return

    const now = this.ctx.currentTime
    const noteCount = 2 + Math.floor(Math.random() * 3)
    const baseFreq = 2800 + Math.random() * 800

    for (let i = 0; i < noteCount; i++) {
      const startTime = now + i * 0.09
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq + Math.random() * 400, startTime)
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, startTime + 0.04)
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, startTime + 0.08)

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.04 * volume, startTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.09)
    }
  }

  public updateVolumes() {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0.09 * this.getMusicGain(), this.ctx.currentTime)
    }
  }

  /**
   * Ultimate Skill "Territory Expansion" Activation SFX
   * Cinematic Sub-Bass Impact + Rising Mystic Resonator
   */
  public playUltimateActivation() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime

    // 1. Deep Sub-Bass Domain Shockwave Boom
    const subOsc = ctx.createOscillator()
    const subGain = ctx.createGain()
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(130, now)
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.8)

    subGain.gain.setValueAtTime(0.45 * volume, now)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95)

    subOsc.connect(subGain)
    subGain.connect(ctx.destination)
    subOsc.start(now)
    subOsc.stop(now + 1.0)

    // 2. Rising Mystic Energy Surge
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99] // C Major celestial chord
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.08
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq * 0.8, startTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.45)

      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.08 * volume, startTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.55)
    })

    // Also play main dog's proud bark!
    this.playBark()
  }

  /**
   * Playful Mini Dog Puppy Yip
   */
  public playPuppyYip() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    const pitch = 1100 + (Math.random() - 0.5) * 200
    osc.frequency.setValueAtTime(pitch, now)
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.65, now + 0.1)

    gain.gain.setValueAtTime(0.12 * volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)
  }

  /**
   * Territory Domain Collapse SFX
   */
  public playDomainCollapse() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5)

    gain.gain.setValueAtTime(0.18 * volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.6)
  }

  /**
   * Skill Cooldown Finished Ready Chime
   */
  public playSkillReady() {
    const ctx = this.initContext()
    const volume = this.getSfxGain()
    if (volume <= 0.001) return

    const now = ctx.currentTime
    const chord = [523.25, 659.25, 1046.5] // C5, E5, C6
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)

      gain.gain.setValueAtTime(0, now + idx * 0.06)
      gain.gain.linearRampToValueAtTime(0.08 * volume, now + idx * 0.06 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.06)
      osc.stop(now + idx * 0.06 + 0.45)
    })
  }
}

export const soundManager = new SoundManager()

