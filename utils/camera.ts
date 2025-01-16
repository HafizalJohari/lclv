export async function captureVideoFrame(videoElement: HTMLVideoElement): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  
  ctx.drawImage(videoElement, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.8)
}

