/**
 * Detects the active WebGL graphics card and checks if the browser
 * is incorrectly running on the low-power Integrated GPU (Intel UHD / Iris)
 * instead of the Dedicated GPU (NVIDIA GeForce / AMD Radeon).
 */
export interface GpuInfo {
  name: string
  isIntegrated: boolean
  isNvidiaOrAmd: boolean
  vendor: string
}

let cachedGpuInfo: GpuInfo | null = null

export function getGpuInfo(): GpuInfo {
  if (cachedGpuInfo) return cachedGpuInfo
  if (typeof window === 'undefined') {
    return { name: 'Unknown GPU', isIntegrated: false, isNvidiaOrAmd: false, vendor: '' }
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
      canvas.getContext('webgl', { powerPreference: 'high-performance' })) as WebGLRenderingContext | null

    if (!gl) {
      cachedGpuInfo = { name: 'WebGL Unavailable', isIntegrated: true, isNvidiaOrAmd: false, vendor: '' }
      return cachedGpuInfo
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    let renderer = 'Standard WebGL'
    let vendor = ''

    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || ''
    } else {
      renderer = gl.getParameter(gl.RENDERER) || renderer
      vendor = gl.getParameter(gl.VENDOR) || ''
    }

    const lower = (renderer + ' ' + vendor).toLowerCase()
    const isNvidiaOrAmd =
      lower.includes('nvidia') ||
      lower.includes('geforce') ||
      lower.includes('rtx') ||
      lower.includes('gtx') ||
      (lower.includes('radeon') && (lower.includes('rx') || lower.includes('dedicated') || lower.includes('pro')))

    const isIntegrated =
      !isNvidiaOrAmd &&
      (lower.includes('intel') ||
        lower.includes('iris') ||
        lower.includes('uhd') ||
        lower.includes('hd graphics') ||
        lower.includes('basic render') ||
        lower.includes('swiftshader') ||
        (lower.includes('amd') && lower.includes('radeon(tm) graphics')))

    cachedGpuInfo = {
      name: renderer,
      isIntegrated,
      isNvidiaOrAmd,
      vendor,
    }
    return cachedGpuInfo
  } catch {
    cachedGpuInfo = { name: 'Dedicated GPU', isIntegrated: false, isNvidiaOrAmd: true, vendor: '' }
    return cachedGpuInfo
  }
}
