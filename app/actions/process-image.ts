'use server'

export type AnalysisType = 'emotion' | 'fatigue' | 'gender' | 'description' | 'accessories' | 'gaze' | 'hair' | 'crowd' | 'general' | 'hydration' | 'item_extraction' | 'text_detection'

const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  hydration: `Analyze facial indicators of hydration levels. Look for:
1. Skin appearance (dry, flaky, dull vs plump, glowing)
2. Under-eye appearance (dark circles, sunken)
3. Lip condition (dry, cracked vs moisturized)
4. Overall skin elasticity
5. Signs of dehydration (sunken cheeks, dull complexion)

Provide specific advice for improving hydration if needed.

Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any feature is unclear or not visible, state that it cannot be determined.

`,
  emotion: 'Analyze the facial expressions in this image with short sentences. What is the main emotion being expressed? What facial features indicate this emotion (eyes, mouth, eyebrows)? Are there any mixed or subtle emotions present? How confident are you about this analysis (high/medium/low)? If multiple faces are present, analyze each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If emotions cannot be determined clearly, state so.',
  fatigue: 'Analyze facial fatigue indicators in this image with short sentences. Rate the overall fatigue level on a scale of 1-10. For the eyes, assess droopiness/heaviness, presence of eye bags, and any visible redness or strain. Look for facial muscle strain and areas of tension. Note any signs of exhaustion or stress in their expression. Consider skin appearance (paleness/dullness) and posture (head position and alertness). Provide an overall assessment of fatigue indicators. If multiple people are present, analyze each person separately. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If fatigue levels cannot be determined clearly, state so.',
  gender: 'Analyze the apparent gender presentation in this image in point form with short sentences. What gender presentation is observed? What features inform this observation? How confident are you about this analysis (high/medium/low)? If multiple people are present, analyze each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If gender presentation cannot be determined clearly, state so.',
  description: 'Provide a detailed description of the person(s) in this image with short sentences. Include physical features like height, build, and hair color/style. Describe their clothing. If they wearing a nametag on his chest, please include it in the description. Note any distinctive characteristics. If multiple people are present, describe each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any feature cannot be determined clearly, state so.',
  accessories: 'List all accessories and additional items visible in this image with short sentences. Include facial accessories like glasses and piercings, jewelry like necklaces, rings, and earrings, and any other notable accessories. If multiple people are present, list items for each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. Only list items that are clearly visible.',
  general: 'Analyze the overall scene in this image with short sentences. Describe the setting, lighting, and any notable details. If multiple people are present, describe the group as a whole. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any aspect cannot be determined clearly, state so.',
  gaze: `Analyze the gaze direction and attention in this image. For each face detected:
1. Describe the relative position in the frame (e.g., "left side", "center", "top right")
2. Identify where they are looking (e.g., "at camera", "at person on left", "at person on right" "downward", "upward")
3. Rate their attention level (1-10)
4. Note any eye contact between people
5. Their position in the frame
6. Where they are looking
7. Their attention level (1-10)
8. Any eye contact or gaze interactions with others

Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If gaze direction or attention cannot be determined clearly, state so.

Summarize the overall gaze patterns and interactions between people.`,
  hair: 'Analyze the hair characteristics in detail and Describe: 1) Hair color (grayed hair, natural or dyed, including any highlights or variations), 2) Hair length (e.g., short, medium, long, with approximate measurements), 3) Hair texture (straight, wavy, curly, coily), 4) Hair style (how it is worn/styled), 5) Hair volume and thickness, 6) Any notable hair treatments or conditions visible. If multiple people are present, analyze each person\'s hair separately. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any hair characteristic cannot be determined clearly, state so.',
  crowd: 'Analyze the crowd or group in this image with short sentences. Provide: 1) Group Size: Exact count or estimate of people visible, 2) Demographics: Age ranges, gender distribution, and any notable diversity patterns, 3) Engagement Level: Rate overall group engagement (1-10) and describe interaction patterns, 4) Spatial Distribution: How people are positioned/grouped, 5) Behavioral Patterns: Common activities, attention focus, or shared behaviors, 6) Majority Demographic: Identify the predominant audience type (e.g., families, professionals, students). Include confidence level for each observation. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any aspect cannot be determined clearly, state so.',
  item_extraction: `Extract the following information from the image and format it as JSON:
  {
    "items": [
      {
        "name": "Name or description of the item",
        "quantity": "Number of items (if applicable)",
        "price": "Price in any format (if shown)",
        "details": "Any additional details about the item",
        "location": "Where the item appears in the image"
      }
    ]
  }
  
  Avoid pareidolia. Do not hallucinate or make up information that is not present in the image. If any information is unclear or not visible, return null for that field.`,
  text_detection: `Analyze and extract all text and numbers visible in the image, you only focus on text or numbers, Only return the text and numbers that are clearly visible in the image, if there is no text or numbers, return as NO TEXT OR NUMBERS FOUND.



  Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any feature is unclear or not visible, state that it cannot be determined.
  `
}

// Cache for storing recent analysis results
const analysisCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_DURATION = 5000 // 5 seconds cache duration

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

