'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { VisionProvider } from '@/app/config/vision-providers'

interface VisionProviderContextType {
  selectedProvider: VisionProvider
  setSelectedProvider: (provider: VisionProvider) => void
  availableProviders: VisionProvider[]
  isProviderWorking: Record<string, boolean | null>
  setProviderStatus: (provider: string, status: boolean | null) => void
}

const VisionProviderContext = createContext<VisionProviderContextType | undefined>(undefined)

interface VisionProviderProviderProps {
  children: ReactNode
}

export function VisionProviderProvider({ children }: VisionProviderProviderProps) {
  const [selectedProvider, setSelectedProvider] = useState<VisionProvider>('auto')
  const [availableProviders] = useState<VisionProvider[]>(['auto', 'ollama', 'moondream_local', 'moondream'])
  const [isProviderWorking, setProviderWorkingState] = useState<Record<string, boolean | null>>({
    ollama: null,
    moondream_local: null,
    moondream: null
  })

  // Load saved provider preference from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('vision-provider-preference')
    if (savedProvider && availableProviders.includes(savedProvider as VisionProvider)) {
      setSelectedProvider(savedProvider as VisionProvider)
    } else {
      // Default to moondream_local if no preference saved
      setSelectedProvider('moondream_local')
    }
  }, [availableProviders])

  // Save provider preference to localStorage when changed
  useEffect(() => {
    if (selectedProvider !== 'auto') {
      localStorage.setItem('vision-provider-preference', selectedProvider)
    }
  }, [selectedProvider])

  const setProviderStatus = (provider: string, status: boolean | null) => {
    setProviderWorkingState(prev => ({
      ...prev,
      [provider]: status
    }))
  }

  const value = {
    selectedProvider,
    setSelectedProvider,
    availableProviders,
    isProviderWorking,
    setProviderStatus
  }

  return (
    <VisionProviderContext.Provider value={value}>
      {children}
    </VisionProviderContext.Provider>
  )
}

export function useVisionProvider() {
  const context = useContext(VisionProviderContext)
  if (context === undefined) {
    throw new Error('useVisionProvider must be used within a VisionProviderProvider')
  }
  return context
} 