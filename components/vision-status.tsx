'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getVisionProviderStatus, testVisionProviders, getStatusSummary, type VisionTestResult } from '@/app/utils/vision-test'

export function VisionStatus() {
  const [status, setStatus] = useState<VisionTestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    setStatus(getVisionProviderStatus())
  }, [])

  const handleTest = async () => {
    setTesting(true)
    try {
      const results = await testVisionProviders()
      setTestResults(results)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setTesting(false)
    }
  }

  if (!status) return null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Vision Provider Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          {getStatusSummary()}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {status.providers.map((provider) => (
            <Badge 
              key={provider.name} 
              variant={provider.available ? "default" : "secondary"}
              className="text-xs"
            >
              {provider.name}
              {provider.name === status.activeProvider && " (active)"}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleTest} 
            disabled={testing || status.providers.every(p => !p.available)}
            size="sm"
            variant="outline"
          >
            {testing ? 'Testing...' : 'Test Providers'}
          </Button>
        </div>

        {testResults && (
          <div className="text-xs space-y-1">
            {testResults.ollama && (
              <div className={testResults.ollama.success ? "text-green-600" : "text-red-600"}>
                Ollama: {testResults.ollama.success ? '✅ Working' : '❌ Failed'}
              </div>
            )}
            {testResults.moondream_local && (
              <div className={testResults.moondream_local.success ? "text-green-600" : "text-red-600"}>
                Moondream Local: {testResults.moondream_local.success ? '✅ Working' : '❌ Failed'}
              </div>
            )}
            {testResults.moondream && (
              <div className={testResults.moondream.success ? "text-green-600" : "text-red-600"}>
                Moondream Cloud: {testResults.moondream.success ? '✅ Working' : '❌ Failed'}
              </div>
            )}
            {testResults.errors.length > 0 && (
              <div className="text-red-600">
                {testResults.errors.map((error: string, i: number) => (
                  <div key={i}>⚠️ {error}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 