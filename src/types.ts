export interface Point {
  x: number
  y: number
}

export type Unit = 'mm' | 'cm' | 'm' | 'in'

export interface MeasureLine {
  id: string
  a: Point
  b: Point
  color: string
}

export interface Calibration {
  lineId: string
  realLength: number
  unit: Unit
}
