import React, { FC, useEffect, useRef } from 'react'
import { Retool } from '@tryretool/custom-component-support'
import { renderScene } from './canvas/renderer'
import { Scene } from './types'
import { DEFAULT_BG_COLOR } from './constants'
import styles from './PlotTwist.module.css'

export const PlotTwist: FC = () => {
  // Set default dimensions for Retool
  Retool.useComponentSettings({ defaultWidth: 800, defaultHeight: 600 })

  // Retool Model Props
  const [backgroundColor] = Retool.useStateString({
    name: 'backgroundColor',
    label: 'Background Color',
    initialValue: '#1E1E1E',
  })

  const [sceneData] = Retool.useStateString({
    name: 'sceneData',
    label: 'Scene Data (JSON)',
    initialValue: '',
  })

  // Local State
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Dummy scene for Phase 1
  const scene: Scene = {
    version: 1,
    elements: [],
    viewportX: 0,
    viewportY: 0,
    zoom: 1
  }

  // Handle resizing and High-DPI (Retina) display support
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
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

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [backgroundColor, scene])

  return (
    <div className={styles.root}>
      <div className={styles.canvasContainer} ref={containerRef}>
        <canvas className={styles.canvas} ref={canvasRef} />
      </div>
    </div>
  )
}
