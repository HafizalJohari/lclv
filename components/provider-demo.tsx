'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useVisionProvider } from '@/app/context/vision-provider-context'
import { processImageWithUserSelection } from '@/app/actions/process-image-with-selection'

export function ProviderDemo() {
  const { selectedProvider } = useVisionProvider()
  const [testResult, setTestResult] = useState<{
    success: boolean
    analysis?: string
    error?: string
    timestamp: string
    provider?: string
  } | null>(null)
  const [testing, setTesting] = useState(false)

  const runQuickTest = async () => {
    setTesting(true)
    setTestResult(null)

    // Simple 1x1 pixel test image
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    try {
      const result = await processImageWithUserSelection(testImage, 'general', selectedProvider)
      setTestResult(result)
    } catch (error) {
      console.error('Test failed:', error)
      setTestResult({
        success: false,
        error: 'Test failed with exception',
        timestamp: new Date().toISOString()
      })
    } finally {
      setTesting(false)
    }
  }

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'ollama': return '🦙 Ollama'
      case 'moondream_local': return '🌙 Moondream Station'
      case 'moondream': return '☁️ Moondream Cloud'
      case 'auto': return '🤖 Auto Select'
      default: return provider
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Provider Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Current Provider:</span>
          <Badge variant="outline">
            {getProviderDisplayName(selectedProvider)}
          </Badge>
        </div>

        <Button 
          onClick={runQuickTest} 
          disabled={testing}
          size="sm"
          className="w-full"
        >
          {testing ? 'Testing...' : 'Run Quick Test'}
        </Button>

        {testResult && (
          <div className="text-xs p-2 bg-muted rounded">
            <div className={`font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.success ? '✅ Success' : '❌ Failed'}
            </div>
            {testResult.error && (
              <div className="text-red-600 mt-1">{testResult.error}</div>
            )}
            {testResult.analysis && (
              <div className="mt-1 text-muted-foreground">{testResult.analysis.slice(0, 100)}...</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Provider: {testResult.provider || selectedProvider}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 