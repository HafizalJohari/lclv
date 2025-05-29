'use server'

import { AnalysisType } from '@/app/actions/process-image'
import { ANALYSIS_PROMPTS } from '@/app/prompts/analysis-prompts'

// Types for Moondream Local Station responses
interface MoondreamLocalResponse {
  output?: string
  answer?: string
  caption?: string
  objects?: Array<{
    label: string
    confidence: number
    bbox?: [number, number, number, number]
  }>
  points?: Array<{
    x: number
    y: number
    label: string
  }>
}

// Cache for storing recent analysis results
const moondreamLocalCache = new Map<string, { result: any; timestamp: number }>()
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

// Map analysis types to appropriate Moondream Local endpoints
function getEndpointForAnalysisType(analysisType: AnalysisType): string {
  const detectionTypes = ['accessories', 'item_extraction', 'hand_gesture']
  const pointingTypes = ['gaze'] 
  
  if (detectionTypes.includes(analysisType)) {
    return 'detect'
  } else if (pointingTypes.includes(analysisType)) {
    return 'point'
  } else if (analysisType === 'description') {
    return 'caption'
  } else {
    return 'query'
  }
}

// Get the appropriate prompt/question for the endpoint
function getPromptForEndpoint(analysisType: AnalysisType, endpoint: string, customPrompt?: string): string {
  // If it's a custom analysis type and custom prompt is provided, use it
  if (analysisType === 'custom' && customPrompt) {
    return customPrompt
  }
  
  if (endpoint === 'caption') {
    return 'long' // Use long captions for detailed descriptions
  } else if (endpoint === 'detect') {
    // For detection, extract key objects to detect from the prompt
    if (analysisType === 'accessories') {
      return 'accessories, glasses, jewelry, piercings'
    } else if (analysisType === 'item_extraction') {
      return 'text, numbers, items, products'
    } else if (analysisType === 'hand_gesture') {
      return 'hands, gestures'
    }
    return 'objects'
  } else if (endpoint === 'point') {
    return 'eyes, face, gaze direction'
  } else {
    return ANALYSIS_PROMPTS[analysisType]
  }
}

export async function processImageWithMoondreamLocal(
  imageData: string, 
  analysisType: AnalysisType = 'emotion',
  customPrompt?: string
) {
  try {
    const baseUrl = process.env.MOONDREAM_LOCAL_URL || 'http://localhost:2020/v1'
    
    // Check cache first
    const imageHash = generateImageHash(imageData)
    const cacheKey = `moondream-local-${imageHash}-${analysisType}-${customPrompt || ''}`
    const cached = moondreamLocalCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Moondream Local] Using cached result for', { analysisType })
      return cached.result
    }

    console.log('[Moondream Local] Attempting to process image...', { analysisType, baseUrl })

    const endpoint = getEndpointForAnalysisType(analysisType)
    const prompt = getPromptForEndpoint(analysisType, endpoint, customPrompt)

    const result = await retryWithBackoff(async () => {
      // Prepare the request body based on endpoint
      let requestBody: any = {
        image_url: imageData, // Moondream Local accepts data URLs directly
        stream: false
      }

      if (endpoint === 'query') {
        requestBody.question = prompt
      } else if (endpoint === 'caption') {
        requestBody.length = prompt
      } else if (endpoint === 'detect') {
        requestBody.object = prompt
      } else if (endpoint === 'point') {
        requestBody.object = prompt
      }

      console.log(`[Moondream Local] Making request to ${baseUrl}/${endpoint}`)

      const response = await fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: Local station doesn't need API key authentication
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 404) {
          throw new Error('Moondream Local Station endpoint not found. Check if the station is running and the URL is correct.')
        } else if (response.status >= 500) {
          throw new Error('Moondream Local Station server error. Please check the station logs.')
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`)
      }

      const data: MoondreamLocalResponse = await response.json()
      
      // Format response to match Ollama's structure
      let analysis = ''
      
      if (data.output) {
        analysis = data.output
      } else if (data.answer) {
        analysis = data.answer
      } else if (data.caption) {
        analysis = data.caption
      } else if (data.objects && data.objects.length > 0) {
        analysis = data.objects.map(obj => 
          `Found ${obj.label} (confidence: ${(obj.confidence * 100).toFixed(1)}%)`
        ).join(', ')
      } else if (data.points && data.points.length > 0) {
        analysis = data.points.map(point => 
          `${point.label} at coordinates (${point.x}, ${point.y})`
        ).join(', ')
      } else {
        analysis = 'Analysis completed successfully but no specific results returned.'
      }

      return {
        success: true,
        analysis,
        timestamp: new Date().toISOString(),
        analysisType,
        provider: 'moondream_local',
        rawResponse: data
      }
    })

    // Cache the successful result
    moondreamLocalCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    })

    console.log('[Moondream Local] Successfully processed image:', {
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
      provider: 'moondream_local'
    }
    
    console.error('[Moondream Local Error]', errorDetails)
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Could not connect to Moondream Local Station. Please ensure it is running on the configured port.',
          timestamp: new Date().toISOString(),
          analysisType,
          provider: 'moondream_local'
        }
      } else if (error.message.includes('404')) {
        return {
          success: false,
          error: 'Moondream Local Station endpoint not found. Check the station configuration.',
          timestamp: new Date().toISOString(),
          analysisType,
          provider: 'moondream_local'
        }
      }
    }

    return {
      success: false,
      error: 'Failed to process image with Moondream Local Station. Check console for details.',
      timestamp: new Date().toISOString(),
      analysisType,
      provider: 'moondream_local'
    }
  }
}

export async function processImageWithMoondreamLocalMultipleTypes(
  imageData: string,
  analysisTypes: AnalysisType[] = ['emotion', 'fatigue', 'gender'],
  customPrompt?: string
) {
  try {
    console.log('[Moondream Local] Processing multiple analysis types:', analysisTypes)
    
    const results = await Promise.all(
      analysisTypes.map(type => processImageWithMoondreamLocal(imageData, type, type === 'custom' ? customPrompt : undefined))
    )

    return results.reduce((acc, result, index) => {
      acc[analysisTypes[index]] = result
      return acc
    }, {} as Record<AnalysisType, any>)
  } catch (error) {
    console.error('[Moondream Local] Multiple analysis error:', error)
    throw error
  }
} 