interface GazeDetectionResult {
  points: Array<{
    x: number;
    y: number;
    confidence: number;
  }>;
  objects: Array<{
    label: string;
    confidence: number;
    box: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }>;
}

export async function detectGaze(imageData: string): Promise<GazeDetectionResult> {
  try {
    // Remove data URL prefix and convert to base64
    const base64Image = imageData.split(',')[1]

    // Detect faces first
    const detectResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moondream:latest',
        images: [base64Image],
        prompt: 'Detect all faces in the image and return their positions'
      })
    })

    const detectResult = await detectResponse.json()

    // Point at eyes for each detected face
    const pointResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moondream:latest',
        images: [base64Image],
        prompt: 'Point at the eyes of each person in the image'
      })
    })

    const pointResult = await pointResponse.json()

    return {
      points: pointResult.points || [],
      objects: detectResult.objects || []
    }
  } catch (error) {
    console.error('Error in gaze detection:', error)
    return { points: [], objects: [] }
  }
} 