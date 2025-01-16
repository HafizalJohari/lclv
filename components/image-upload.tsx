'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalysisType } from '@/app/actions/process-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

interface ImageUploadProps {
  onAnalyze: (image: File, analysisTypes: AnalysisType[]) => void
  isProcessing: boolean
}

export function ImageUpload({ onAnalyze, isProcessing }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'general' | 'item_extraction'>('general')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = () => {
    if (selectedImage) {
      onAnalyze(selectedImage, [analysisMode])
    }
  }

  return (
    <Card className="w-full max-w-3xl p-6 bg-background/50 backdrop-blur-lg">
      <div className="space-y-4">
        <Tabs defaultValue="general" onValueChange={(value) => setAnalysisMode(value as 'general' | 'item_extraction')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Analysis</TabsTrigger>
            <TabsTrigger value="item_extraction">Extract Items</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image for comprehensive visual analysis including emotions, features, and context.
            </p>
          </TabsContent>
          <TabsContent value="item_extraction">
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image to extract item names, quantities, and unit prices in JSON format.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">Click or drag to upload an image</p>
                <p className="text-xs text-muted-foreground mt-2">Supports: JPG, PNG, WebP</p>
              </div>
            )}
          </label>
          <Button
            onClick={handleAnalyze}
            disabled={!selectedImage || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {analysisMode === 'general' ? 'Analyzing...' : 'Extracting...'}
              </>
            ) : (
              analysisMode === 'general' ? 'Analyze Image' : 'Extract Items'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
} 