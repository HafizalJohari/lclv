import { getVisionConfig, getBestProvider, isProviderAvailable } from '@/app/config/vision-providers'
import { processImageWithOllama } from '@/app/actions/process-image'
import { processImageWithMoondream } from '@/app/services/moondream'
import { processImageWithMoondreamLocal } from '@/app/services/moondream-local'

export interface ProviderStatus {
  name: string
  available: boolean
  configured: boolean
  error?: string
}

export interface VisionTestResult {
  providers: ProviderStatus[]
  activeProvider: string | null
  config: any
}

/**
 * Test the availability and configuration of vision providers
 */
export function getVisionProviderStatus(): VisionTestResult {
  const config = getVisionConfig()
  
  const providers: ProviderStatus[] = [
    {
      name: 'ollama',
      available: isProviderAvailable('ollama', config),
      configured: !!config.ollama.baseUrl,
      error: !config.ollama.baseUrl ? 'Base URL not configured' : undefined
    },
    {
      name: 'moondream_local',
      available: isProviderAvailable('moondream_local', config),
      configured: !!config.moondreamLocal.baseUrl,
      error: !config.moondreamLocal.baseUrl ? 'Base URL not configured' : undefined
    },
    {
      name: 'moondream',
      available: isProviderAvailable('moondream', config),
      configured: !!config.moondream.apiKey,
      error: !config.moondream.apiKey ? 'API key not configured' : undefined
    }
  ]

  let activeProvider: string | null = null
  try {
    activeProvider = getBestProvider(config)
  } catch (error) {
    console.error('No active provider available:', error)
  }

  return {
    providers,
    activeProvider,
    config: {
      provider: config.provider,
      enableFallback: config.enableFallback,
      ollama: {
        baseUrl: config.ollama.baseUrl,
        model: config.ollama.model
      },
      moondream: {
        baseUrl: config.moondream.baseUrl,
        hasApiKey: !!config.moondream.apiKey
      },
      moondreamLocal: {
        baseUrl: config.moondreamLocal.baseUrl
      }
    }
  }
}

/**
 * Test both providers with a simple test image (if available)
 * This is useful for debugging and setup verification
 */
export async function testVisionProviders(testImageData?: string): Promise<{
  ollama?: any
  moondream?: any
  moondream_local?: any
  errors: string[]
}> {
  const errors: string[] = []
  const results: any = {}
  
  // Use a simple 1x1 pixel test image if none provided
  const defaultTestImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  const imageData = testImageData || defaultTestImage
  
  const config = getVisionConfig()
  
  // Test Ollama if available
  if (isProviderAvailable('ollama', config)) {
    try {
      console.log('[Test] Testing Ollama provider...')
      results.ollama = await processImageWithOllama(imageData, 'general')
      console.log('[Test] Ollama test result:', results.ollama.success ? 'SUCCESS' : 'FAILED')
    } catch (error) {
      const errorMsg = `Ollama test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      console.error('[Test]', errorMsg)
    }
  } else {
    errors.push('Ollama provider not available or configured')
  }
  
  // Test Moondream Local if available
  if (isProviderAvailable('moondream_local', config)) {
    try {
      console.log('[Test] Testing Moondream Local provider...')
      results.moondream_local = await processImageWithMoondreamLocal(imageData, 'general')
      console.log('[Test] Moondream Local test result:', results.moondream_local.success ? 'SUCCESS' : 'FAILED')
    } catch (error) {
      const errorMsg = `Moondream Local test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      console.error('[Test]', errorMsg)
    }
  } else {
    errors.push('Moondream Local provider not available or configured')
  }
  
  // Test Moondream Cloud if available
  if (isProviderAvailable('moondream', config)) {
    try {
      console.log('[Test] Testing Moondream Cloud provider...')
      results.moondream = await processImageWithMoondream(imageData, 'general')
      console.log('[Test] Moondream Cloud test result:', results.moondream.success ? 'SUCCESS' : 'FAILED')
    } catch (error) {
      const errorMsg = `Moondream Cloud test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMsg)
      console.error('[Test]', errorMsg)
    }
  } else {
    errors.push('Moondream Cloud provider not available or configured')
  }
  
  return { ...results, errors }
}

/**
 * Get a human-readable status summary
 */
export function getStatusSummary(): string {
  const status = getVisionProviderStatus()
  const available = status.providers.filter(p => p.available)
  
  if (available.length === 0) {
    return '❌ No vision providers configured. Please set up Ollama, Moondream Local Station, or Moondream Cloud.'
  }
  
  const providerDisplayNames = available.map(p => {
    switch (p.name) {
      case 'ollama': return 'Ollama'
      case 'moondream_local': return 'Moondream Local'
      case 'moondream': return 'Moondream Cloud'
      default: return p.name
    }
  }).join(' and ')
  
  const primary = status.activeProvider
  const primaryDisplayName = primary ? 
    (primary === 'ollama' ? 'Ollama' : 
     primary === 'moondream_local' ? 'Moondream Local' :
     primary === 'moondream' ? 'Moondream Cloud' : primary) : 'Unknown'
  
  if (available.length === 1) {
    return `✅ ${providerDisplayNames} configured and active`
  } else {
    return `✅ Multiple providers available (${providerDisplayNames}). Using ${primaryDisplayName} as primary.`
  }
} 