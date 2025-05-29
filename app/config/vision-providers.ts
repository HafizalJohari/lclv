export type VisionProvider = 'ollama' | 'moondream' | 'moondream_local' | 'auto'

export interface VisionConfig {
  provider: VisionProvider
  enableFallback: boolean
  ollama: {
    baseUrl: string
    model: string
  }
  moondream: {
    apiKey?: string
    baseUrl: string
  }
  moondreamLocal: {
    baseUrl: string
  }
}

// Default configuration
export const DEFAULT_VISION_CONFIG: VisionConfig = {
  provider: 'moondream_local', // Default to Moondream Local Station
  enableFallback: true, // Enable fallback by default
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'moondream:latest'
  },
  moondream: {
    apiKey: process.env.MOONDREAM_API_KEY,
    baseUrl: process.env.MOONDREAM_BASE_URL || 'https://api.moondream.ai/v1'
  },
  moondreamLocal: {
    baseUrl: process.env.MOONDREAM_LOCAL_URL || 'http://localhost:2020/v1'
  }
}

/**
 * Get the current vision configuration
 */
export function getVisionConfig(): VisionConfig {
  const envProvider = process.env.VISION_PROVIDER as VisionProvider
  const enableFallback = process.env.ENABLE_FALLBACK !== 'false'
  
  return {
    ...DEFAULT_VISION_CONFIG,
    provider: envProvider || DEFAULT_VISION_CONFIG.provider,
    enableFallback,
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || DEFAULT_VISION_CONFIG.ollama.baseUrl,
      model: process.env.OLLAMA_MODEL || DEFAULT_VISION_CONFIG.ollama.model
    },
    moondream: {
      apiKey: process.env.MOONDREAM_API_KEY || DEFAULT_VISION_CONFIG.moondream.apiKey,
      baseUrl: process.env.MOONDREAM_BASE_URL || DEFAULT_VISION_CONFIG.moondream.baseUrl
    },
    moondreamLocal: {
      baseUrl: process.env.MOONDREAM_LOCAL_URL || DEFAULT_VISION_CONFIG.moondreamLocal.baseUrl
    }
  }
}

/**
 * Check if a provider is available/configured
 */
export function isProviderAvailable(provider: VisionProvider, config: VisionConfig): boolean {
  switch (provider) {
    case 'ollama':
      return !!config.ollama.baseUrl
    case 'moondream':
      return !!config.moondream.apiKey
    case 'moondream_local':
      return !!config.moondreamLocal.baseUrl
    case 'auto':
      return isProviderAvailable('ollama', config) || isProviderAvailable('moondream', config) || isProviderAvailable('moondream_local', config)
    default:
      return false
  }
}

/**
 * Get the best available provider based on configuration
 */
export function getBestProvider(config: VisionConfig): VisionProvider {
  if (config.provider === 'auto') {
    // Auto mode: prefer local providers first (Ollama, then local Moondream), then cloud
    if (isProviderAvailable('ollama', config)) {
      return 'ollama'
    } else if (isProviderAvailable('moondream_local', config)) {
      return 'moondream_local'
    } else if (isProviderAvailable('moondream', config)) {
      return 'moondream'
    } else {
      throw new Error('No vision providers are available. Please configure Ollama, local Moondream Station, or cloud Moondream.')
    }
  }
  
  if (!isProviderAvailable(config.provider, config)) {
    if (config.enableFallback) {
      // Try fallback providers in order of preference
      const fallbackOrder: VisionProvider[] = ['ollama', 'moondream_local', 'moondream']
      const availableFallbacks = fallbackOrder.filter(p => p !== config.provider && isProviderAvailable(p, config))
      
      if (availableFallbacks.length > 0) {
        const fallbackProvider = availableFallbacks[0]
        console.warn(`[Vision] Primary provider '${config.provider}' not available, falling back to '${fallbackProvider}'`)
        return fallbackProvider
      }
    }
    throw new Error(`Vision provider '${config.provider}' is not available or properly configured.`)
  }
  
  return config.provider
} 