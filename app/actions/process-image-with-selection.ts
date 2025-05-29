'use server'

import { AnalysisType } from '@/app/actions/process-image'
import { processImageWithOllama } from '@/app/actions/process-image'
import { processImageWithMoondream, processImageWithMoondreamMultipleTypes } from '@/app/services/moondream'
import { processImageWithMoondreamLocal, processImageWithMoondreamLocalMultipleTypes } from '@/app/services/moondream-local'
import { getVisionConfig, getBestProvider, VisionProvider, VisionConfig } from '@/app/config/vision-providers'

/**
 * Process image with user-selected provider (overrides environment config)
 */
export async function processImageWithUserSelection(
  imageData: string, 
  analysisType: AnalysisType = 'emotion',
  userSelectedProvider?: VisionProvider
) {
  try {
    const config = getVisionConfig()
    let primaryProvider: VisionProvider

    // Use user selection if provided, otherwise fall back to config
    if (userSelectedProvider && userSelectedProvider !== 'auto') {
      primaryProvider = userSelectedProvider
    } else {
      try {
        primaryProvider = getBestProvider(config)
      } catch (error) {
        console.error('[Vision] No providers available:', error)
        return {
          success: false,
          error: 'No vision analysis providers are available. Please configure a provider.',
          timestamp: new Date().toISOString(),
          analysisType,
        }
      }
    }

    console.log(`[Vision] Using user-selected provider: ${primaryProvider}`)

    // Check if the selected provider is actually available
    const isAvailable = checkProviderAvailability(primaryProvider, config)
    if (!isAvailable) {
      return {
        success: false,
        error: `Selected provider '${primaryProvider}' is not available or properly configured.`,
        timestamp: new Date().toISOString(),
        analysisType,
        provider: primaryProvider
      }
    }

    // Try primary provider
    let result
    if (primaryProvider === 'ollama') {
      result = await processImageWithOllama(imageData, analysisType)
    } else if (primaryProvider === 'moondream') {
      result = await processImageWithMoondream(imageData, analysisType)
    } else if (primaryProvider === 'moondream_local') {
      result = await processImageWithMoondreamLocal(imageData, analysisType)
    } else {
      throw new Error(`Unknown provider: ${primaryProvider}`)
    }

    // If primary provider failed and fallback is enabled, try other providers
    if (!result.success && config.enableFallback && !userSelectedProvider) {
      const fallbackOrder: VisionProvider[] = ['ollama', 'moondream_local', 'moondream']
      const availableFallbacks = fallbackOrder.filter(p => 
        p !== primaryProvider && checkProviderAvailability(p, config)
      )
      
      for (const fallbackProvider of availableFallbacks) {
        console.warn(`[Vision] Primary provider '${primaryProvider}' failed, trying fallback '${fallbackProvider}'`)
        
        let fallbackResult
        if (fallbackProvider === 'ollama') {
          fallbackResult = await processImageWithOllama(imageData, analysisType)
        } else if (fallbackProvider === 'moondream') {
          fallbackResult = await processImageWithMoondream(imageData, analysisType)
        } else if (fallbackProvider === 'moondream_local') {
          fallbackResult = await processImageWithMoondreamLocal(imageData, analysisType)
        }
        
        if (fallbackResult && fallbackResult.success) {
          console.log(`[Vision] Fallback to '${fallbackProvider}' successful`)
          result = fallbackResult
          break
        }
      }
    }

    return result
  } catch (error) {
    console.error('[Vision] Process image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      analysisType,
    }
  }
}

/**
 * Process multiple analysis types with user-selected provider
 */
export async function processImageWithUserSelectionMultipleTypes(
  imageData: string,
  analysisTypes: AnalysisType[] = ['emotion', 'fatigue', 'gender'],
  userSelectedProvider?: VisionProvider,
  customPrompt?: string
) {
  try {
    const config = getVisionConfig()
    let primaryProvider: VisionProvider

    // Use user selection if provided, otherwise fall back to config
    if (userSelectedProvider && userSelectedProvider !== 'auto') {
      primaryProvider = userSelectedProvider
    } else {
      try {
        primaryProvider = getBestProvider(config)
      } catch (error) {
        console.error('[Vision] No providers available for multiple analysis:', error)
        return analysisTypes.reduce((acc, type) => {
          acc[type] = {
            success: false,
            error: 'No vision analysis providers are available. Please configure a provider.',
            timestamp: new Date().toISOString(),
            analysisType: type,
          }
          return acc
        }, {} as Record<AnalysisType, any>)
      }
    }

    console.log(`[Vision] Processing multiple analysis types with user-selected provider: ${primaryProvider}`, analysisTypes)
    
    // Add custom analysis type if custom prompt is provided
    let finalAnalysisTypes = [...analysisTypes]
    if (customPrompt && customPrompt.trim()) {
      finalAnalysisTypes.push('custom')
    }
    
    // Check if the selected provider is actually available
    const isAvailable = checkProviderAvailability(primaryProvider, config)
    if (!isAvailable) {
      return finalAnalysisTypes.reduce((acc, type) => {
        acc[type] = {
          success: false,
          error: `Selected provider '${primaryProvider}' is not available or properly configured.`,
          timestamp: new Date().toISOString(),
          analysisType: type,
          provider: primaryProvider
        }
        return acc
      }, {} as Record<AnalysisType, any>)
    }
    
    let results: any[]
    if (primaryProvider === 'ollama') {
      results = await Promise.all(
        finalAnalysisTypes.map(type => processImageWithOllama(imageData, type, type === 'custom' ? customPrompt : undefined))
      )
    } else if (primaryProvider === 'moondream') {
      const moondreamResults = await processImageWithMoondreamMultipleTypes(imageData, finalAnalysisTypes, customPrompt)
      results = finalAnalysisTypes.map(type => moondreamResults[type])
    } else if (primaryProvider === 'moondream_local') {
      const moondreamLocalResults = await processImageWithMoondreamLocalMultipleTypes(imageData, finalAnalysisTypes, customPrompt)
      results = finalAnalysisTypes.map(type => moondreamLocalResults[type])
    } else {
      throw new Error(`Unknown provider: ${primaryProvider}`)
    }

    // Only use fallback if no specific provider was selected by user
    if (config.enableFallback && !userSelectedProvider) {
      const failedIndices = results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => !result.success)
        .map(({ index }) => index)

      if (failedIndices.length > 0) {
        const fallbackOrder: VisionProvider[] = ['ollama', 'moondream_local', 'moondream']
        const availableFallbacks = fallbackOrder.filter(p => 
          p !== primaryProvider && checkProviderAvailability(p, config)
        )
        
        for (const fallbackProvider of availableFallbacks) {
          const stillFailedIndices = failedIndices.filter(i => !results[i].success)
          if (stillFailedIndices.length === 0) break
          
          console.warn(`[Vision] Some analyses failed with '${primaryProvider}', trying fallback '${fallbackProvider}' for ${stillFailedIndices.length} failed analyses`)
          
          const failedTypes = stillFailedIndices.map(i => finalAnalysisTypes[i])
          let fallbackResults: any[]
          
          if (fallbackProvider === 'ollama') {
            fallbackResults = await Promise.all(
              failedTypes.map(type => processImageWithOllama(imageData, type, type === 'custom' ? customPrompt : undefined))
            )
          } else if (fallbackProvider === 'moondream') {
            const fallbackResultsObj = await processImageWithMoondreamMultipleTypes(imageData, failedTypes, customPrompt)
            fallbackResults = failedTypes.map(type => fallbackResultsObj[type])
          } else if (fallbackProvider === 'moondream_local') {
            const fallbackResultsObj = await processImageWithMoondreamLocalMultipleTypes(imageData, failedTypes, customPrompt)
            fallbackResults = failedTypes.map(type => fallbackResultsObj[type])
          } else {
            continue
          }
          
          stillFailedIndices.forEach((originalIndex, fallbackIndex) => {
            if (fallbackResults[fallbackIndex] && fallbackResults[fallbackIndex].success) {
              results[originalIndex] = fallbackResults[fallbackIndex]
              console.log(`[Vision] Fallback successful for analysis type: ${finalAnalysisTypes[originalIndex]}`)
            }
          })
        }
      }
    }

    return results.reduce((acc, result, index) => {
      acc[finalAnalysisTypes[index]] = result
      return acc
    }, {} as Record<AnalysisType, any>)
  } catch (error) {
    console.error('[Vision] Multiple analysis error:', error)
    throw error
  }
}

/**
 * Helper function to check if a provider is available
 */
function checkProviderAvailability(provider: VisionProvider, config: VisionConfig): boolean {
  switch (provider) {
    case 'ollama':
      return !!config.ollama.baseUrl
    case 'moondream':
      return !!config.moondream.apiKey
    case 'moondream_local':
      return !!config.moondreamLocal.baseUrl
    case 'auto':
      return true // Auto is always available, it will find the best provider
    default:
      return false
  }
} 