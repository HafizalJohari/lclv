'use client'

import { useState } from 'react'
import { CameraComponent } from '@/components/camera'
import { Report } from '@/components/report'
import { InfoSection } from '@/components/info-section'
import { ImageUpload } from '@/components/image-upload'
import { SettingsPanel } from '@/components/settings-panel'
import { processImageWithUserSelectionMultipleTypes } from './actions/process-image-with-selection'
import { AnalysisType } from './actions/process-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useVisionProvider } from '@/app/context/vision-provider-context'
import { Camera, Upload, Settings } from 'lucide-react'

interface Report {
  analysis: string
  timestamp: string
  success: boolean
  error?: string
  analysisType: AnalysisType
}

interface AnalysisResult {
  success: boolean
  analysis: string
  error?: string
  timestamp: string
}

export default function Home() {
  const [reports, setReports] = useState<Report[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [latestAnalysis, setLatestAnalysis] = useState<string>('')
  const { selectedProvider } = useVisionProvider()

  const handleAnalysis = async (imageData: string, analysisTypes: AnalysisType[], customPrompt?: string) => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      const results = await processImageWithUserSelectionMultipleTypes(imageData, analysisTypes, selectedProvider, customPrompt)
      const newReports = Object.entries(results)
        .filter(([, result]) => (result as AnalysisResult).success)
        .map(([type, result]) => ({
          ...(result as AnalysisResult),
          analysisType: type as AnalysisType
        }))

      setReports(prev => [...newReports, ...prev])

      // Combine all successful analyses for context
      const context = newReports
        .map(report => `${report.analysisType.toUpperCase()} ANALYSIS:\n${report.analysis}`)
        .join('\n\n')

      setLatestAnalysis(context)
    } catch (error) {
      console.error('Error processing frame:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12">
      <div className="z-10 max-w-7xl w-full items-center justify-between text-sm">
        <div className="flex justify-between items-start mb-8 w-full">
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Local Computer Vision (LCLV)</h1>
            <p className="text-lg text-muted-foreground mt-2">Real-time computer vision analysis powered by Moondream</p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-7xl space-y-8">
        <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Media</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="camera">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <CameraComponent
                  onFrame={handleAnalysis}
                  isProcessing={isProcessing}
                  latestAnalysis={latestAnalysis}
                />
              </div>
              <div>
                <Report reports={reports} isProcessing={isProcessing} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="upload">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ImageUpload
                  onAnalyze={async (image: File, analysisTypes: AnalysisType[]) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      const imageData = e.target?.result as string;
                      await handleAnalysis(imageData, analysisTypes);
                    };
                    reader.readAsDataURL(image);
                  }}
                  isProcessing={isProcessing}
                />
              </div>
              <div>
                <Report reports={reports} isProcessing={isProcessing} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="max-w-4xl mx-auto">
              <SettingsPanel />
            </div>
          </TabsContent>
        </Tabs>
        
        <InfoSection />
      </div>
    </main>
  )
}

