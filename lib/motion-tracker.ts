import { KalmanFilter } from './kalman-filter'

interface Point {
  x: number
  y: number
}

interface MotionData {
  position: Point
  velocity: Point
  acceleration: Point
  timestamp: number
}

export class MotionTracker {
  private kalmanFilter: KalmanFilter
  private lastTimestamp: number | null = null
  private lastPosition: Point | null = null
  private lastVelocity: Point | null = null
  private motionHistory: MotionData[] = []
  private readonly historySize = 10 // Keep last 10 measurements for analysis

  constructor() {
    this.kalmanFilter = new KalmanFilter()
  }

  /**
   * Track motion from a new frame
   * @param position Current position {x, y}
   * @param timestamp Current timestamp in milliseconds
   */
  track(position: Point, timestamp: number): MotionData {
    // Initialize if this is the first measurement
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp
      this.lastPosition = position
      this.lastVelocity = { x: 0, y: 0 }
      
      const initialMotion: MotionData = {
        position,
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        timestamp
      }
      
      this.motionHistory.push(initialMotion)
      return initialMotion
    }

    // Calculate time delta in seconds
    const dt = (timestamp - this.lastTimestamp) / 1000

    // Predict next state
    const prediction = this.kalmanFilter.predict(dt)

    // Update with new measurement
    this.kalmanFilter.update(position)

    // Calculate velocity and acceleration
    const velocity = {
      x: (position.x - this.lastPosition!.x) / dt,
      y: (position.y - this.lastPosition!.y) / dt
    }

    const acceleration = {
      x: (velocity.x - this.lastVelocity!.x) / dt,
      y: (velocity.y - this.lastVelocity!.y) / dt
    }

    // Create motion data
    const motionData: MotionData = {
      position: {
        x: prediction.x,
        y: prediction.y
      },
      velocity: {
        x: prediction.dx,
        y: prediction.dy
      },
      acceleration,
      timestamp
    }

    // Update history
    this.motionHistory.push(motionData)
    if (this.motionHistory.length > this.historySize) {
      this.motionHistory.shift()
    }

    // Update last values
    this.lastTimestamp = timestamp
    this.lastPosition = position
    this.lastVelocity = velocity

    return motionData
  }

  /**
   * Analyze motion patterns from recent history
   */
  analyzeMotion(): {
    averageSpeed: number
    maxSpeed: number
    isMoving: boolean
    dominantDirection: string
    motionPattern: string
  } {
    if (this.motionHistory.length < 2) {
      return {
        averageSpeed: 0,
        maxSpeed: 0,
        isMoving: false,
        dominantDirection: 'none',
        motionPattern: 'insufficient data'
      }
    }

    // Calculate speeds
    const speeds = this.motionHistory.map(motion => 
      Math.sqrt(motion.velocity.x ** 2 + motion.velocity.y ** 2)
    )

    const averageSpeed = speeds.reduce((a, b) => a + b) / speeds.length
    const maxSpeed = Math.max(...speeds)
    const isMoving = averageSpeed > 0.5 // Threshold for movement detection

    // Analyze direction
    const directions = this.motionHistory.map(motion => {
      const angle = Math.atan2(motion.velocity.y, motion.velocity.x)
      return this.getDirection(angle)
    })

    const dominantDirection = this.findDominantDirection(directions)

    // Analyze motion pattern
    const motionPattern = this.detectMotionPattern()

    return {
      averageSpeed,
      maxSpeed,
      isMoving,
      dominantDirection,
      motionPattern
    }
  }

  private getDirection(angle: number): string {
    const directions = ['east', 'northeast', 'north', 'northwest', 
                       'west', 'southwest', 'south', 'southeast']
    const index = Math.round(((angle + Math.PI) * 4) / Math.PI) % 8
    return directions[index]
  }

  private findDominantDirection(directions: string[]): string {
    const counts = directions.reduce((acc, dir) => {
      acc[dir] = (acc[dir] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0]
  }

  private detectMotionPattern(): string {
    if (this.motionHistory.length < 3) return 'insufficient data'

    const velocities = this.motionHistory.map(m => m.velocity)
    const accelerations = this.motionHistory.map(m => m.acceleration)

    // Check for constant velocity (linear motion)
    const isConstantVelocity = accelerations.every(a => 
      Math.abs(a.x) < 0.1 && Math.abs(a.y) < 0.1
    )
    if (isConstantVelocity) return 'linear'

    // Check for oscillating motion
    const isOscillating = this.detectOscillation(velocities)
    if (isOscillating) return 'oscillating'

    // Check for circular motion
    const isCircular = this.detectCircularMotion(velocities)
    if (isCircular) return 'circular'

    return 'complex'
  }

  private detectOscillation(velocities: Point[]): boolean {
    // Look for velocity direction changes
    let directionChanges = 0
    for (let i = 1; i < velocities.length; i++) {
      if (Math.sign(velocities[i].x) !== Math.sign(velocities[i-1].x) ||
          Math.sign(velocities[i].y) !== Math.sign(velocities[i-1].y)) {
        directionChanges++
      }
    }
    return directionChanges >= 2
  }

  private detectCircularMotion(velocities: Point[]): boolean {
    // Check if velocity vectors form approximately circular pattern
    let angleSum = 0
    for (let i = 1; i < velocities.length; i++) {
      const angle = Math.atan2(
        velocities[i].y - velocities[i-1].y,
        velocities[i].x - velocities[i-1].x
      )
      angleSum += angle
    }
    return Math.abs(angleSum) > Math.PI * 1.5
  }

  /**
   * Reset the tracker
   */
  reset(): void {
    this.kalmanFilter = new KalmanFilter()
    this.lastTimestamp = null
    this.lastPosition = null
    this.lastVelocity = null
    this.motionHistory = []
  }
} 