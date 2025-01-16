'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, RotateCcw } from 'lucide-react'
// import { chat, ChatResponse } from '@/app/actions/chat'
import { AIInput } from '@/components/ui/ai-input'
import { Button } from '@/components/ui/button'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatProps {
  context: string
}

export function ChatComponent({ context }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (input: string) => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await chat(input, context)
      
      if (response.success && response.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.response,
          timestamp: response.timestamp
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: response.error || 'Failed to generate response',
          timestamp: response.timestamp
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'An error occurred while processing your message',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([])
  }

  return (
    <Card className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">What I see</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="h-8 w-8"
          title="Reset chat"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <AIInput
          onSubmit={handleSubmit}
          placeholder="Ask about what I see..."
          className="p-0"
        />
      </CardFooter>
    </Card>
  )
} 