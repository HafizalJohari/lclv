import type { AnalysisType } from '@/app/actions/process-image'

export const ANALYSIS_OPTIONS = [
  {
    value: 'general' as AnalysisType,
    label: 'General Analysis',
    description: 'Comprehensive analysis of all visual aspects'
  },
  // ... rest of the options
] as const;

export const TIME_INTERVALS = {
  0: 'Live feedback',
  1000: '1 second',
  3000: '3 seconds',
  5000: '5 seconds',
  7000: '7 seconds',
  10000: '10 seconds',
} as const;

export type TimeInterval = keyof typeof TIME_INTERVALS; 