'use client'

import { VisionProviderSelector } from '@/components/vision-provider-selector'
import { ProviderDemo } from '@/components/provider-demo'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Zap, TestTube } from 'lucide-react'

export function SettingsPanel() {
  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>
      
      {/* Vision Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4" />
            Vision Provider Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VisionProviderSelector />
        </CardContent>
      </Card>
      
      {/* Provider Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TestTube className="w-4 h-4" />
            Provider Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderDemo />
        </CardContent>
      </Card>
      
      {/* Future Settings Sections */}
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Additional Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More configuration options will be available here in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 