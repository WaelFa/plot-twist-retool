import React, { FC, useEffect, useRef, useState } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import { renderScene } from './canvas/renderer'
import { Scene, ToolType, BaseElement, PenElement, RectElement, EllipseElement, LineElement } from './types'
import { DEFAULT_BG_COLOR, DEFAULT_STROKE_COLOR, DEFAULT_FILL_COLOR, DEFAULT_STROKE_WIDTH } from './constants'
import { generateId, addElement, updateElement } from './state/scene'
import styles from './PlotTwist.module.css'

export const PlotTwist: FC = () => {
  // Set default dimensions for Retool
  Retool.useComponentSettings({ defaultWidth: 800, defaultHeight: 600 })

  // Retool Model Props
  const [backgroundColor] = Retool.useStateString({
    name: 'backgroundColor',
    label: 'Background Color',
    initialValue: '#1E1E1E'
  })

  // Local State
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState<ToolType>('pen')
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentElementId, setCurrentElementId] = useState<string | null>(null)
  const [scene, setScene] = useState<Scene>({
    version: 1,
    elements: [],
    viewportX: 0,
    viewportY: 0,
    zoom: 1
  })

  // Handle resizing and High-DPI (Retina) display support
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Use the body size to ensure we fill the available Retool space
        const { width, height } = entry.contentRect
        const dpr = window.devicePixelRatio || 1

        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = width * dpr
        canvas.height = height * dpr

        // Set logical size in CSS
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Normalize coordinate system to use css pixels
          ctx.scale(dpr, dpr)
          renderScene(ctx, scene, width, height, backgroundColor || DEFAULT_BG_COLOR)
        }
      }
    })

    resizeObserver.observe(document.body)

    return () => {
      resizeObserver.disconnect()
    }
  }, []) // Empty dependency array because we manually trigger render when scene changes

  // Trigger manual render when scene or background changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Dimensions are logically canvas.width / dpr, but we can just read from CSS
      const rect = canvas.getBoundingClientRect()
      renderScene(ctx, scene, rect.width, rect.height, backgroundColor || DEFAULT_BG_COLOR)
    }
  }, [scene, backgroundColor])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'select' || activeTool === 'text') return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    // Always capture pointer so we track outside canvas
    e.currentTarget.setPointerCapture(e.pointerId)
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    const id = generateId()
    setCurrentElementId(id)

    const baseEl: BaseElement = {
      id,
      type: activeTool,
      x,
      y,
      strokeColor: DEFAULT_STROKE_COLOR,
      fillColor: DEFAULT_FILL_COLOR,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      opacity: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    if (activeTool === 'pen') {
      const el: PenElement = { ...baseEl, type: 'pen', points: [[x, y, e.pressure]] }
      setScene(prev => addElement(prev, el))
    } else if (activeTool === 'rectangle' || activeTool === 'ellipse') {
      const el = { ...baseEl, type: activeTool, width: 0, height: 0 } as RectElement | EllipseElement
      setScene(prev => addElement(prev, el))
    } else if (activeTool === 'line') {
      const el: LineElement = { ...baseEl, type: 'line', points: [[x, y], [x, y]] }
      setScene(prev => addElement(prev, el))
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !currentElementId) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setScene(prev => {
      const el = prev.elements.find(e => e.id === currentElementId)
      if (!el) return prev

      if (el.type === 'pen') {
        return updateElement(prev, currentElementId, {
          points: [...el.points, [x, y, e.pressure]]
        })
      } else if (el.type === 'rectangle' || el.type === 'ellipse') {
        return updateElement(prev, currentElementId, {
          width: x - el.x,
          height: y - el.y
        })
      } else if (el.type === 'line') {
        return updateElement(prev, currentElementId, {
          points: [el.points[0], [x, y]]
        })
      }
      return prev
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false)
    setCurrentElementId(null)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        {(['select', 'pen', 'rectangle', 'ellipse', 'line'] as ToolType[]).map(tool => (
          <button 
            key={tool} 
            className={`${styles.toolBtn} ${activeTool === tool ? styles.toolBtnActive : ''}`}
            onClick={() => setActiveTool(tool)}
          >
            {tool.charAt(0).toUpperCase() + tool.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.canvasContainer} ref={containerRef}>
        <canvas 
          className={styles.canvas} 
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  )
}
