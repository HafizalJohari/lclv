# Vision Analysis Setup Guide

This application supports three vision analysis providers: **Ollama** (local), **Moondream Local Station** (local), and **Moondream Cloud API** (cloud). You can use any one or configure multiple with automatic fallback.

## Quick Start

### Option 1: Moondream Local Station (Local - Recommended if you have it installed)

1. **Make sure Moondream Station is running** on `http://localhost:2020/v1`

2. **Set Environment Variables**:
   ```bash
   export VISION_PROVIDER=moondream_local
   export MOONDREAM_LOCAL_URL=http://localhost:2020/v1
   ```

3. **Ready to use!** The application will automatically use your local Moondream Station.

### Option 2: Ollama (Local - Best for Development)

1. **Install Ollama**: 
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Pull the Moondream model**:
   ```bash
   ollama pull moondream:latest
   ```

3. **Start Ollama server**:
   ```bash
   ollama serve
   ```

4. **Set Environment Variables**:
   ```bash
   export VISION_PROVIDER=ollama
   export OLLAMA_BASE_URL=http://localhost:11434
   export OLLAMA_MODEL=moondream:latest
   ```

## Environment Configuration

Create a `.env.local` file in your project root:

```env
# Vision Analysis Configuration
# Choose your preferred provider: 'ollama', 'moondream_local', 'moondream', or 'auto'
VISION_PROVIDER=moondream_local

# Ollama Configuration (for local deployment)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=moondream:latest

# Moondream Local Station Configuration (for local deployment)
MOONDREAM_LOCAL_URL=http://localhost:2020/v1

# Moondream Cloud API Configuration (for cloud API)
MOONDREAM_API_KEY=your_moondream_api_key_here
MOONDREAM_BASE_URL=https://api.moondream.ai/v1

# Fallback Configuration
# Set to true to automatically fallback to other providers if primary fails
ENABLE_FALLBACK=true
```

## Provider Options

### `VISION_PROVIDER` Options:

- **`ollama`**: Use local Ollama installation only
- **`moondream_local`**: Use local Moondream Station only
- **`moondream`**: Use Moondream Cloud API only  
- **`auto`**: Automatically choose the best available provider (prefers local providers first)

### Fallback Behavior

When `ENABLE_FALLBACK=true` (default):
- If primary provider fails, automatically try the other provider
- Provides better reliability and user experience
- Useful for development (Ollama) → production (Moondream) transitions

## Comparison: Ollama vs Moondream AI Station

| Feature | Ollama (Local) | Moondream AI Station (Cloud) |
|---------|----------------|-------------------------------|
| **Setup** | Requires local installation | Just need API key |
| **Cost** | Free | Free tier: 5,000 requests/day |
| **Speed** | Depends on hardware | Consistently fast |
| **Privacy** | Complete local processing | Data sent to cloud |
| **Reliability** | Depends on local setup | High availability |
| **Internet** | Not required | Required |
| **Best for** | Development, privacy-focused | Production, scaling |

## Supported Analysis Types

Both providers support all analysis types:

- `emotion` - Facial emotion analysis
- `fatigue` - Fatigue level detection
- `gender` - Gender presentation analysis
- `description` - Detailed person description
- `accessories` - Accessories and jewelry detection
- `gaze` - Gaze direction analysis
- `hair` - Hair characteristics analysis
- `crowd` - Group/crowd analysis
- `general` - General scene analysis
- `hydration` - Hydration level indicators
- `item_extraction` - Extract items and text
- `text_detection` - Text and number detection
- `video_motion` - Motion analysis (video frames)
- `video_scene` - Scene composition analysis
- `video_speaking` - Speech activity detection
- `hand_gesture` - Hand gesture recognition

## API Usage

### Single Analysis
```typescript
import { processImage } from '@/app/actions/process-image'

const result = await processImage(imageData, 'emotion')
```

### Multiple Analysis Types
```typescript
import { processImageWithMultipleTypes } from '@/app/actions/process-image'

const results = await processImageWithMultipleTypes(
  imageData, 
  ['emotion', 'fatigue', 'gender']
)
```

### Provider-Specific Functions
```typescript
// Force Ollama
import { processImageWithOllama } from '@/app/actions/process-image'
const result = await processImageWithOllama(imageData, 'emotion')

// Force Moondream
import { processImageWithMoondream } from '@/app/services/moondream'
const result = await processImageWithMoondream(imageData, 'emotion')
```

## Troubleshooting

### Common Issues

1. **"No vision providers are available"**
   - Check that either `MOONDREAM_API_KEY` is set OR Ollama is running
   - Verify environment variables are loaded correctly

2. **Ollama connection failed**
   - Ensure Ollama is running: `ollama serve`
   - Check if the model is pulled: `ollama list`
   - Verify the correct port (default: 11434)

3. **Moondream API errors**
   - Verify API key is correct and active
   - Check rate limits (free tier: 5,000 requests/day)
   - Ensure internet connectivity

4. **Model not found (Ollama)**
   - Pull the model: `ollama pull moondream:latest`
   - Check available models: `ollama list`

### Performance Tips

1. **Caching**: Results are cached for 3 seconds to avoid redundant requests
2. **Batch Processing**: Use `processImageWithMultipleTypes` for multiple analyses
3. **Fallback**: Enable fallback for better reliability
4. **Provider Selection**: 
   - Use Ollama for development (free, private)
   - Use Moondream for production (reliable, scalable)

## Migration Guide

### From Ollama-only to Hybrid Setup

1. Get Moondream API key from [console.moondream.ai](https://console.moondream.ai)
2. Add to environment:
   ```env
   MOONDREAM_API_KEY=your_key_here
   ENABLE_FALLBACK=true
   ```
3. Keep existing Ollama setup as primary
4. Moondream will automatically be used as fallback

### From Ollama to Moondream Only

1. Get Moondream API key
2. Update environment:
   ```env
   VISION_PROVIDER=moondream
   MOONDREAM_API_KEY=your_key_here
   ```
3. Can safely stop Ollama service

## Support

- **Ollama**: [Documentation](https://ollama.ai/docs)
- **Moondream**: [Documentation](https://docs.moondream.ai)
- **Issues**: Check the application logs for detailed error messages 