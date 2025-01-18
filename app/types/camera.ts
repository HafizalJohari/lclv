import type { AnalysisType } from '@/app/actions/process-image'

export interface CameraProps {
  onFrame: (imageData: string, analysisTypes: AnalysisType[]) => void;
  isProcessing: boolean;
  latestAnalysis?: string;
}

export interface EyeGazeData {
  gazeDirection: string;
  faces: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    eyePoints?: Array<{
      x: number;
      y: number;
      confidence: number;
    }>;
  }>;
  confidence: number;
}

export interface HydrationData {
  hydrationLevel: number;
  indicators: string[];
  advice: string;
  confidence: 'high' | 'medium' | 'low';
} 