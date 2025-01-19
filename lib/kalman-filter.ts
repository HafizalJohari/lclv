/**
 * A simple Kalman filter implementation for motion tracking
 * State vector: [x, y, dx, dy] (position and velocity)
 */
export class KalmanFilter {
  private state: number[]; // State vector [x, y, dx, dy]
  private covariance: number[][]; // State covariance matrix
  private processNoise: number; // Process noise
  private measurementNoise: number; // Measurement noise

  constructor(initialX = 0, initialY = 0, processNoise = 0.1, measurementNoise = 1) {
    // Initialize state vector [x, y, dx, dy]
    this.state = [initialX, initialY, 0, 0];

    // Initialize covariance matrix with high uncertainty
    this.covariance = [
      [100, 0, 0, 0],
      [0, 100, 0, 0],
      [0, 0, 100, 0],
      [0, 0, 0, 100]
    ];

    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
  }

  /**
   * Predict the next state based on constant velocity model
   * @param dt Time step in seconds
   */
  predict(dt: number): { x: number; y: number; dx: number; dy: number } {
    // State transition matrix
    const F = [
      [1, 0, dt, 0],
      [0, 1, 0, dt],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    // Predict state
    const predictedState = this.matrixMultiply(F, this.state) as number[];
    this.state = predictedState;

    // Update covariance
    // P = F*P*F' + Q
    const Q = this.createProcessNoiseMatrix(dt);
    this.covariance = this.matrixAdd(
      this.matrixMultiply(
        this.matrixMultiply(F, this.covariance) as number[][],
        this.transpose(F)
      ) as number[][],
      Q
    );

    return {
      x: this.state[0],
      y: this.state[1],
      dx: this.state[2],
      dy: this.state[3]
    };
  }

  /**
   * Update the filter with a new measurement
   * @param measurement The measured position {x, y}
   */
  update(measurement: { x: number; y: number }): void {
    // Measurement matrix (we only measure position, not velocity)
    const H = [
      [1, 0, 0, 0],
      [0, 1, 0, 0]
    ];

    // Measurement noise matrix
    const R = [
      [this.measurementNoise, 0],
      [0, this.measurementNoise]
    ];

    // Calculate Kalman gain
    // K = P*H'*(H*P*H' + R)^-1
    const PHt = this.matrixMultiply(this.covariance, this.transpose(H)) as number[][];
    const S = this.matrixAdd(
      this.matrixMultiply(
        this.matrixMultiply(H, this.covariance) as number[][],
        this.transpose(H)
      ) as number[][],
      R
    );
    const K = this.matrixMultiply(PHt, this.inverse2x2(S)) as number[][];

    // Update state
    const measurementVector = [measurement.x, measurement.y];
    const innovation = this.vectorSubtract(
      measurementVector,
      this.matrixMultiply(H, this.state) as number[]
    );
    this.state = this.vectorAdd(this.state, this.matrixMultiply(K, innovation) as number[]);

    // Update covariance
    // P = (I - K*H)*P
    const I = this.identity(4);
    const KH = this.matrixMultiply(K, H) as number[][];
    this.covariance = this.matrixMultiply(
      this.matrixSubtract(I, KH),
      this.covariance
    ) as number[][];
  }

  private createProcessNoiseMatrix(dt: number): number[][] {
    const q = this.processNoise;
    const dt2 = dt * dt;
    const dt3 = dt2 * dt;
    const dt4 = dt3 * dt;

    return [
      [dt4/4*q, 0, dt3/2*q, 0],
      [0, dt4/4*q, 0, dt3/2*q],
      [dt3/2*q, 0, dt2*q, 0],
      [0, dt3/2*q, 0, dt2*q]
    ];
  }

  private isVector(arr: number[] | number[][]): arr is number[] {
    return !Array.isArray(arr[0]);
  }

  private isMatrix(arr: number[] | number[][]): arr is number[][] {
    return Array.isArray(arr[0]);
  }

  private matrixMultiply(a: number[] | number[][], b: number[] | number[][]): number[] | number[][] {
    // Case 1: vector * matrix
    if (this.isVector(a) && this.isMatrix(b)) {
      const result = new Array(b[0].length).fill(0);
      for (let i = 0; i < b[0].length; i++) {
        for (let j = 0; j < a.length; j++) {
          result[i] += a[j] * b[j][i];
        }
      }
      return result;
    }

    // Case 2: matrix * vector
    if (this.isMatrix(a) && this.isVector(b)) {
      const result = new Array(a.length).fill(0);
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
          result[i] += a[i][j] * b[j];
        }
      }
      return result;
    }

    // Case 3: matrix * matrix
    if (this.isMatrix(a) && this.isMatrix(b)) {
      const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b[0].length; j++) {
          for (let k = 0; k < b.length; k++) {
            result[i][j] += a[i][k] * b[k][j];
          }
        }
      }
      return result;
    }

    throw new Error('Invalid matrix multiplication input types');
  }

  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }

  private matrixAdd(a: number[][], b: number[][]): number[][] {
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
  }

  private matrixSubtract(a: number[][], b: number[][]): number[][] {
    return a.map((row, i) => row.map((val, j) => val - b[i][j]));
  }

  private vectorAdd(a: number[], b: number[]): number[] {
    return a.map((val, i) => val + b[i]);
  }

  private vectorSubtract(a: number[], b: number[]): number[] {
    return a.map((val, i) => val - b[i]);
  }

  private identity(size: number): number[][] {
    return Array(size).fill(0).map((_, i) => 
      Array(size).fill(0).map((_, j) => i === j ? 1 : 0)
    );
  }

  private inverse2x2(matrix: number[][]): number[][] {
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det]
    ];
  }
} 