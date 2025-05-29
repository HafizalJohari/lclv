import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AnalysisType } from '@/app/actions/process-image'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SkeletonLoader } from '@/components/ui/skeleton-loader'

interface Report {
  analysis: string
  timestamp: string
  success: boolean
  error?: string
  analysisType: AnalysisType
}

interface ReportProps {
  reports: Report[]
  isProcessing: boolean
}

const ANALYSIS_LABELS = {
  general: 'General Analysis',
  hydration: 'Hydration Level',
  emotion: 'Emotion Detection',
  fatigue: 'Fatigue Detection',
  gender: 'Gender Analysis',
  description: 'Person Description',
  accessories: 'Accessories Detection',
  gaze: 'Gaze Detection',
  hair: 'Hair Analysis',
  crowd: 'Crowd Analysis',
  text_detection: 'Character Detection',
  video_motion: 'Motion Analysis',
  video_scene: 'Scene Analysis',
  video_speaking: 'Speaking Analysis',
  item_extraction: 'Item Extraction',
  hand_gesture: 'Hand Gesture Analysis'
} as const

const ANALYSIS_COLORS = {
  general: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20',
  hydration: 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20',
  emotion: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20',
  fatigue: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  gender: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  description: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  accessories: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  gaze: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  hair: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20',
  crowd: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20',
  text_detection: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
  video_motion: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
  video_scene: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
  video_speaking: 'bg-violet-500/10 text-violet-500 hover:bg-violet-500/20',
  item_extraction: 'bg-teal-500/10 text-teal-500 hover:bg-teal-500/20',
  hand_gesture: 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
} as const

export function Report({ reports, isProcessing }: ReportProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Analysis Reports</CardTitle>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {isProcessing ? (
            <SkeletonLoader variant="analysis" count={2} />
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {report.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <h3 className="font-semibold">
                        {ANALYSIS_LABELS[report.analysisType]}
                      </h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className={ANALYSIS_COLORS[report.analysisType]}
                    >
                      {new Date(report.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.success ? report.analysis : report.error}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[500px] items-center justify-center text-center">
              <div className="max-w-[420px] space-y-2">
                <h3 className="text-lg font-medium">No analysis reports</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an image or video and start analysis to see the results here.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

