'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVisionProvider } from '@/app/context/vision-provider-context'
import { VisionProvider } from '@/app/config/vision-providers'
import { testVisionProviders } from '@/app/utils/vision-test'

const PROVIDER_INFO = {
  auto: {
    name: 'Auto Select',
    description: 'Automatically choose the best available provider',
    icon: '🤖',
    color: 'bg-blue-500'
  },
  ollama: {
    name: 'Ollama',
    description: 'Local Ollama installation with Moondream model',
    icon: '🦙',
    color: 'bg-green-500'
  },
  moondream_local: {
    name: 'Moondream Station',
    description: 'Local Moondream Station (localhost:2020)',
    icon: '🌙',
    color: 'bg-purple-500'
  },
  moondream: {
    name: 'Moondream Cloud',
    description: 'Moondream Cloud API (requires API key)',
    icon: '☁️',
    color: 'bg-cyan-500'
  }
}

export function VisionProviderSelector() {
  const { 
    selectedProvider, 
    setSelectedProvider, 
    availableProviders, 
    isProviderWorking,
    setProviderStatus 
  } = useVisionProvider()
  
  const [testing, setTesting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleProviderChange = (provider: VisionProvider) => {
    setSelectedProvider(provider)
    // Reset working status when provider changes
    Object.keys(isProviderWorking).forEach(p => {
      setProviderStatus(p, null)
    })
  }

  const handleTestProvider = async (provider: VisionProvider) => {
    if (provider === 'auto') {
      // Test all providers
      await handleTestAll()
      return
    }

    setTesting(true)
    setProviderStatus(provider, null) // Set to testing state
    
    try {
      const results = await testVisionProviders()
      const result = results[provider as keyof typeof results]
      setProviderStatus(provider, result?.success || false)
    } catch (error) {
      console.error(`Test failed for ${provider}:`, error)
      setProviderStatus(provider, false)
    } finally {
      setTesting(false)
    }
  }

  const handleTestAll = async () => {
    setTesting(true)
    
    // Reset all statuses
    Object.keys(isProviderWorking).forEach(p => {
      setProviderStatus(p, null)
    })

    try {
      const results = await testVisionProviders()
      
      // Update status for each provider
      setProviderStatus('ollama', results.ollama?.success || false)
      setProviderStatus('moondream_local', results.moondream_local?.success || false)
      setProviderStatus('moondream', results.moondream?.success || false)
    } catch (error) {
      console.error('Test all providers failed:', error)
      Object.keys(isProviderWorking).forEach(p => {
        setProviderStatus(p, false)
      })
    } finally {
      setTesting(false)
    }
  }

  const getProviderStatus = (provider: VisionProvider) => {
    if (provider === 'auto') return null
    const status = isProviderWorking[provider]
    if (status === null) return 'unknown'
    return status ? 'working' : 'failed'
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'working': return '✅'
      case 'failed': return '❌'
      case 'unknown': return '❓'
      default: return '⚪'
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'working': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Provider Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Active Provider:</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'}
          </Button>
        </div>
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{PROVIDER_INFO[selectedProvider].icon}</span>
                <span>{PROVIDER_INFO[selectedProvider].name}</span>
                {selectedProvider !== 'auto' && (
                  <span className={getStatusColor(getProviderStatus(selectedProvider))}>
                    {getStatusIcon(getProviderStatus(selectedProvider))}
                  </span>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableProviders.map((provider) => (
              <SelectItem key={provider} value={provider}>
                <div className="flex items-center gap-2">
                  <span>{PROVIDER_INFO[provider].icon}</span>
                  <span>{PROVIDER_INFO[provider].name}</span>
                  {provider !== 'auto' && (
                    <span className={getStatusColor(getProviderStatus(provider))}>
                      {getStatusIcon(getProviderStatus(provider))}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {PROVIDER_INFO[selectedProvider].description}
        </p>
      </div>

      {/* Test Button */}
      <div className="flex gap-2">
        <Button 
          onClick={() => handleTestProvider(selectedProvider)}
          disabled={testing}
          size="sm"
          variant="outline"
        >
          {testing ? 'Testing...' : `Test ${PROVIDER_INFO[selectedProvider].name}`}
        </Button>
        
        {selectedProvider !== 'auto' && (
          <Button 
            onClick={handleTestAll}
            disabled={testing}
            size="sm"
            variant="ghost"
          >
            Test All
          </Button>
        )}
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-sm font-medium">All Providers:</h4>
          {availableProviders.filter(p => p !== 'auto').map((provider) => (
            <div key={provider} className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${PROVIDER_INFO[provider].color}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {PROVIDER_INFO[provider].icon} {PROVIDER_INFO[provider].name}
                    </span>
                    <span className={getStatusColor(getProviderStatus(provider))}>
                      {getStatusIcon(getProviderStatus(provider))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PROVIDER_INFO[provider].description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedProvider === provider && (
                  <Badge variant="default" className="text-xs">Active</Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleProviderChange(provider)}
                  disabled={selectedProvider === provider}
                >
                  {selectedProvider === provider ? 'Selected' : 'Select'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Summary */}
      {Object.values(isProviderWorking).some(status => status !== null) && (
        <div className="text-xs space-y-1 pt-2 border-t">
          <h5 className="font-medium">Test Results:</h5>
          {Object.entries(isProviderWorking).map(([provider, status]) => (
            status !== null && (
              <div key={provider} className={`flex items-center gap-2 ${getStatusColor(status ? 'working' : 'failed')}`}>
                <span>{getStatusIcon(status ? 'working' : 'failed')}</span>
                <span>{PROVIDER_INFO[provider as VisionProvider].name}: </span>
                <span>{status ? 'Working' : 'Failed'}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
} 