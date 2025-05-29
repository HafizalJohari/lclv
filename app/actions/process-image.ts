'use server'

import { ANALYSIS_PROMPTS } from '@/app/prompts/analysis-prompts'
import { processImageWithMoondream, processImageWithMoondreamMultipleTypes } from '@/app/services/moondream'
import { processImageWithMoondreamLocal, processImageWithMoondreamLocalMultipleTypes } from '@/app/services/moondream-local'
import { getVisionConfig, getBestProvider, VisionProvider } from '@/app/config/vision-providers'

export type AnalysisType = 'emotion' | 'fatigue' | 'gender' | 'description' | 'accessories' | 'gaze' | 'hair' | 'crowd' | 'general' | 'hydration' | 'item_extraction' | 'text_detection' | 'video_motion' | 'video_scene' | 'video_speaking' | 'hand_gesture' | 'custom'

// Cache for storing recent analysis results
const analysisCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_DURATION = 3000 // 3 seconds cache duration

// Helper function to generate a simple hash for the image data
function generateImageHash(imageData: string): string {
  return imageData.slice(0, 100) // Simple hash using first 100 chars
}

async function retryWithBackoff(
  fn: () => Promise<any>,
  retries = 3,
  backoff = 1000
): Promise<any> {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await new Promise(resolve => setTimeout(resolve, backoff))
    return retryWithBackoff(fn, retries - 1, backoff * 2)
  }
}

export async function processImageWithOllama(imageData: string, analysisType: AnalysisType = 'emotion', customPrompt?: string) {
  try {
    const config = getVisionConfig()
    
    // Check cache first
    const imageHash = generateImageHash(imageData)
    const cacheKey = `ollama-${imageHash}-${analysisType}-${customPrompt || ''}`
    const cached = analysisCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Ollama] Using cached result for', { analysisType })
      return cached.result
    }

    console.log('[Ollama] Attempting to process image...', { analysisType })

    // Use custom prompt if provided for 'custom' analysis type, otherwise use predefined prompts
    const prompt = analysisType === 'custom' && customPrompt 
      ? customPrompt 
      : ANALYSIS_PROMPTS[analysisType]

    const result = await retryWithBackoff(async () => {
      const response = await fetch(`${config.ollama.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.ollama.model,
          prompt: prompt,
          stream: false,
          images: [imageData.split(',')[1]], // Remove data URL prefix
        }),
      })

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error('Server error! Check if Ollama is running the correct model.')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        analysis: data.response,
        timestamp: new Date().toISOString(),
        analysisType,
        provider: 'ollama'
      }
    })

    // Cache the successful result
    analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    })

    console.log('[Ollama] Successfully processed image:', {
      timestamp: new Date().toISOString(),
      analysisType,
      analysis: result.analysis
    })

    return result
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
      analysisType,
      provider: 'ollama'
    }
    
    console.error('[Ollama Error]', errorDetails)
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return {
        success: false,
        error: 'Could not connect to Ollama server. Please ensure Ollama is running on port 11434.',
        timestamp: new Date().toISOString(),
        analysisType,
        provider: 'ollama'
      }
    }

    return {
      success: false,
      error: 'Failed to process image. Check console for details.',
      timestamp: new Date().toISOString(),
      analysisType,
      provider: 'ollama'
    }
  }
}

/**
 * Main function to process images with automatic provider selection and fallback
 */
export async function processImage(imageData: string, analysisType: AnalysisType = 'emotion') {
  try {
    const config = getVisionConfig()
    let primaryProvider: VisionProvider
    
    try {
      primaryProvider = getBestProvider(config)
    } catch (error) {
      console.error('[Vision] No providers available:', error)
      return {
        success: false,
        error: 'No vision analysis providers are available. Please configure Ollama or Moondream.',
        timestamp: new Date().toISOString(),
        analysisType,
      }
    }

    console.log(`[Vision] Using provider: ${primaryProvider}`)

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
    if (!result.success && config.enableFallback) {
      const fallbackOrder: VisionProvider[] = ['ollama', 'moondream_local', 'moondream']
      const availableFallbacks = fallbackOrder.filter(p => 
        p !== primaryProvider && 
        ((p === 'ollama' && config.ollama.baseUrl) || 
         (p === 'moondream' && config.moondream.apiKey) ||
         (p === 'moondream_local' && config.moondreamLocal.baseUrl))
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
 * Process multiple analysis types with automatic provider selection
 */
export async function processImageWithMultipleTypes(
  imageData: string,
  analysisTypes: AnalysisType[] = ['emotion', 'fatigue', 'gender']
) {
  try {
    const config = getVisionConfig()
    let primaryProvider: VisionProvider
    
    try {
      primaryProvider = getBestProvider(config)
    } catch (error) {
      console.error('[Vision] No providers available for multiple analysis:', error)
      // Return error for each analysis type
      return analysisTypes.reduce((acc, type) => {
        acc[type] = {
          success: false,
          error: 'No vision analysis providers are available. Please configure Ollama or Moondream.',
          timestamp: new Date().toISOString(),
          analysisType: type,
        }
        return acc
      }, {} as Record<AnalysisType, any>)
    }

    console.log(`[Vision] Processing multiple analysis types with provider: ${primaryProvider}`, analysisTypes)
    
    let results: any[]
    if (primaryProvider === 'ollama') {
      results = await Promise.all(
        analysisTypes.map(type => processImageWithOllama(imageData, type))
      )
    } else if (primaryProvider === 'moondream') {
      const moondreamResults = await processImageWithMoondreamMultipleTypes(imageData, analysisTypes)
      // Convert to array format to match expected structure
      results = analysisTypes.map(type => moondreamResults[type])
    } else if (primaryProvider === 'moondream_local') {
      const moondreamLocalResults = await processImageWithMoondreamLocalMultipleTypes(imageData, analysisTypes)
      // Convert to array format to match expected structure
      results = analysisTypes.map(type => moondreamLocalResults[type])
    } else {
      throw new Error(`Unknown provider: ${primaryProvider}`)
    }

    // Check if any results failed and try fallback if enabled
    if (config.enableFallback) {
      const failedIndices = results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => !result.success)
        .map(({ index }) => index)

      if (failedIndices.length > 0) {
        const fallbackOrder: VisionProvider[] = ['ollama', 'moondream_local', 'moondream']
        const availableFallbacks = fallbackOrder.filter(p => 
          p !== primaryProvider && 
          ((p === 'ollama' && config.ollama.baseUrl) || 
           (p === 'moondream' && config.moondream.apiKey) ||
           (p === 'moondream_local' && config.moondreamLocal.baseUrl))
        )
        
        for (const fallbackProvider of availableFallbacks) {
          const stillFailedIndices = failedIndices.filter(i => !results[i].success)
          if (stillFailedIndices.length === 0) break
          
          console.warn(`[Vision] Some analyses failed with '${primaryProvider}', trying fallback '${fallbackProvider}' for ${stillFailedIndices.length} failed analyses`)
          
          const failedTypes = stillFailedIndices.map(i => analysisTypes[i])
          let fallbackResults: any[]
          
          if (fallbackProvider === 'ollama') {
            fallbackResults = await Promise.all(
              failedTypes.map(type => processImageWithOllama(imageData, type))
            )
          } else if (fallbackProvider === 'moondream') {
            const fallbackResultsObj = await processImageWithMoondreamMultipleTypes(imageData, failedTypes)
            fallbackResults = failedTypes.map(type => fallbackResultsObj[type])
          } else if (fallbackProvider === 'moondream_local') {
            const fallbackResultsObj = await processImageWithMoondreamLocalMultipleTypes(imageData, failedTypes)
            fallbackResults = failedTypes.map(type => fallbackResultsObj[type])
          } else {
            continue
          }
          
          // Replace failed results with successful fallback results
          stillFailedIndices.forEach((originalIndex, fallbackIndex) => {
            if (fallbackResults[fallbackIndex] && fallbackResults[fallbackIndex].success) {
              results[originalIndex] = fallbackResults[fallbackIndex]
              console.log(`[Vision] Fallback successful for analysis type: ${analysisTypes[originalIndex]}`)
            }
          })
        }
      }
    }

    return results.reduce((acc, result, index) => {
      acc[analysisTypes[index]] = result
      return acc
    }, {} as Record<AnalysisType, any>)
  } catch (error) {
    console.error('[Vision] Multiple analysis error:', error)
    throw error
  }
}

// Legacy function for backward compatibility
export async function processImageWithOllamaMultipleTypes(
  imageData: string,
  analysisTypes: AnalysisType[] = ['emotion', 'fatigue', 'gender']
) {
  try {
    console.log('[Ollama] Processing multiple analysis types:', analysisTypes)
    
    const results = await Promise.all(
      analysisTypes.map(type => processImageWithOllama(imageData, type))
    )

    return results.reduce((acc, result, index) => {
      acc[analysisTypes[index]] = result
      return acc
    }, {} as Record<AnalysisType, any>)
  } catch (error) {
    console.error('[Ollama] Multiple analysis error:', error)
    throw error
  }
}

