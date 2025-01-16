import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Add basic system checks here
    const healthCheck = {
      uptime: process.uptime(),
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }

    console.log('[Health Check]', JSON.stringify(healthCheck, null, 2))
    return NextResponse.json(healthCheck)
  } catch (error) {
    console.error('[Health Check Error]', {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 