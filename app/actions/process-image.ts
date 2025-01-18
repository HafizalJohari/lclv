'use server'

import { ANALYSIS_PROMPTS } from '@/app/prompts/analysis-prompts'

export type AnalysisType = 'emotion' | 'fatigue' | 'gender' | 'description' | 'accessories' | 'gaze' | 'hair' | 'crowd' | 'general' | 'hydration' | 'item_extraction' | 'text_detection' | 'video_motion' | 'video_scene' | 'video_speaking'

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

export async function processImageWithOllama(imageData: string, analysisType: AnalysisType = 'emotion') {
  try {
    // Check cache first
    const imageHash = generateImageHash(imageData)
    const cacheKey = `${imageHash}-${analysisType}`
    const cached = analysisCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Ollama] Using cached result for', { analysisType })
      return cached.result
    }

    console.log('[Ollama] Attempting to process image...', { analysisType })

    const result = await retryWithBackoff(async () => {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moondream:latest',
          prompt: ANALYSIS_PROMPTS[analysisType],
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
    }
    
    console.error('[Ollama Error]', errorDetails)
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return {
        success: false,
        error: 'Could not connect to Ollama server. Please ensure Ollama is running on port 11434.',
        timestamp: new Date().toISOString(),
        analysisType,
      }
    }

    return {
      success: false,
      error: 'Failed to process image. Check console for details.',
      timestamp: new Date().toISOString(),
      analysisType,
    }
  }
}

export async function processImageWithMultipleTypes(
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

