import { Scene } from '../types'
import { GRID_SIZE } from '../constants'

export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  width: number,
  height: number,
  backgroundColor: string,
  showGrid: boolean = true
) {
  // Clear the canvas
  ctx.clearRect(0, 0, width, height)

  // Draw background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)

  // Draw grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()

    // Vertical lines
    for (let x = 0; x <= width; x += GRID_SIZE) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += GRID_SIZE) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }

    ctx.stroke()
  }

  // Draw elements (stub for now)
  if (scene.elements && scene.elements.length > 0) {
    ctx.fillStyle = 'white'
    ctx.font = '14px Inter, sans-serif'
    ctx.fillText(`Scene has ${scene.elements.length} elements`, 20, 30)
  }
}
