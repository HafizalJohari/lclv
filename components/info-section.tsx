'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Cpu, Lock, Sparkles } from "lucide-react"
import { AnalysisType } from "@/app/actions/process-image"

const analysisOptions: { label: string; value: AnalysisType }[] = [
  { label: "Emotion Analysis", value: "emotion" },
  { label: "Fatigue Detection", value: "fatigue" },
  { label: "Gender Analysis", value: "gender" },
  { label: "Description", value: "description" },
  { label: "Accessories", value: "accessories" },
  { label: "Gaze Analysis", value: "gaze" },
  { label: "Hair Analysis", value: "hair" },
  { label: "Crowd Analysis", value: "crowd" },
  { label: "General Analysis", value: "general" },
  { label: "Hydration Analysis", value: "hydration" },
  { label: "Item Extraction", value: "item_extraction" },
  { label: "Character Detection", value: "text_detection" },
]

export function InfoSection() {
  return (
    <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 p-6 border-b">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Info className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">How It Works</h2>
          <p className="text-sm text-muted-foreground">
            Learn about features, usage, and technical details
          </p>
        </div>
      </div>
      
      <Accordion type="single" collapsible className="p-6">
        <AccordionItem value="features" className="border-none">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-pink-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Available Features</div>
                <div className="text-sm text-muted-foreground">Explore what this app can do</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid gap-4">
              {[
                {
                  title: "Emotion Detection",
                  description: "Analyzes facial expressions and identifies primary and secondary emotions",
                  color: "bg-pink-500/10 text-pink-500"
                },
                {
                  title: "Fatigue Detection",
                  description: "Identifies signs of tiredness through eye state, facial tension, and overall appearance",
                  color: "bg-yellow-500/10 text-yellow-500"
                },
                {
                  title: "Gender Analysis",
                  description: "Detects apparent gender presentation from visual cues",
                  color: "bg-purple-500/10 text-purple-500"
                },
                {
                  title: "Person Description",
                  description: "Provides detailed physical description including features and clothing",
                  color: "bg-blue-500/10 text-blue-500"
                },
                {
                  title: "Accessories Detection",
                  description: "Lists visible accessories and items worn by the person",
                  color: "bg-green-500/10 text-green-500"
                },
                {
                  title: "Gaze Detection",
                  description: "Analyzes eye direction, attention level, and eye contact quality",
                  color: "bg-orange-500/10 text-orange-500"
                },
                {
                  title: "Hair Analysis",
                  description: "Detailed analysis of hair style, color, length, texture, and treatments",
                  color: "bg-indigo-500/10 text-indigo-500"
                },
                {
                  title: "Crowd Analysis",
                  description: "Analyzes group size, demographics, engagement levels, and behavioral patterns",
                  color: "bg-rose-500/10 text-rose-500"
                },
                {
                  title: "Character Detection",
                  description: "Identifies and extracts text, numbers, and alphanumeric sequences from images",
                  color: "bg-teal-500/10 text-teal-500"
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Badge variant="secondary" className={feature.color}>
                    {feature.title}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tech" className="border-none">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Cpu className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Technical Details</div>
                <div className="text-sm text-muted-foreground">Under the hood</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <h4 className="font-medium">Core Technologies</h4>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                      Ollama
                    </Badge>
                    <span className="text-sm text-muted-foreground">Local AI processing engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                      Moondream
                    </Badge>
                    <span className="text-sm text-muted-foreground">Advanced vision analysis model</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <h4 className="font-medium">Features</h4>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  <li>• Real-time video frame capture and analysis</li>
                  <li>• Secure local processing (no cloud services)</li>
                  <li>• Smart result caching for better performance</li>
                  <li>• Parallel analysis processing</li>
                  <li>• Multiple analysis types with customizable intervals</li>
                  <li>• Visual overlays for gaze detection</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="privacy" className="border-none">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Lock className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Privacy & Security</div>
                <div className="text-sm text-muted-foreground">Your data stays with you</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-2">Local Processing</h4>
                <p className="text-sm text-muted-foreground">
                  All analysis is performed locally on your machine. No data is sent to external servers.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-2">Data Privacy</h4>
                <p className="text-sm text-muted-foreground">
                  Images and analysis results are temporary and never stored permanently. Everything is cleared on page refresh.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-2">Camera Access</h4>
                <p className="text-sm text-muted-foreground">
                  Camera access is required but can be revoked at any time through your browser settings.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
} 