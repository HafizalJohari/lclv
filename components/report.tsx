import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AnalysisType } from '@/app/actions/process-image'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Report {
  analysis: string
  timestamp: string
  success: boolean
  error?: string
  analysisType: AnalysisType
}

interface ReportProps {
  reports: Report[]
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
  crowd: 'Crowd Analysis'
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
  crowd: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
} as const

function CurrentTime() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    // Set initial time
    setTime(new Date().toLocaleTimeString())
    
    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return time
}

export function ReportComponent({ reports }: ReportProps) {
  return (
    <Card className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Analysis Reports</CardTitle>
        <Badge variant="outline" className="font-mono">
          <Clock className="w-3 h-3 mr-1" />
          <CurrentTime />
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {reports.map((report, index) => (
              <Card 
                key={index} 
                className={`transition-all hover:shadow-md ${
                  report.success 
                    ? 'border-l-4 border-l-green-500 dark:border-l-green-400' 
                    : 'border-l-4 border-l-red-500 dark:border-l-red-400'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={ANALYSIS_COLORS[report.analysisType as keyof typeof ANALYSIS_COLORS]}
                        >
                          {ANALYSIS_LABELS[report.analysisType as keyof typeof ANALYSIS_LABELS]}
                        </Badge>
                        {report.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={`text-sm whitespace-pre-line ${
                      report.success ? '' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {report.success ? report.analysis : report.error}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

