"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"

interface AnalyticsMarker {
  id: string
  location: [number, number]
  visitors: number
  trend: number
}

interface GlobeAnalyticsProps {
  markers?: AnalyticsMarker[]
  className?: string
  speed?: number
}

const defaultMarkers: AnalyticsMarker[] = [
  { id: "hyderabad", location: [17.3850, 78.4867], visitors: 5420, trend: 18 },
  { id: "bengaluru", location: [12.9716, 77.5946], visitors: 4890, trend: 14 },
  { id: "mumbai", location: [19.0760, 72.8777], visitors: 3840, trend: 9 },
  { id: "delhi", location: [28.6139, 77.2090], visitors: 2950, trend: 6 },
  { id: "chennai", location: [13.0827, 80.2707], visitors: 2340, trend: 11 },
  { id: "pune", location: [18.5204, 73.8567], visitors: 1890, trend: 8 },
]

const arcPairs: Array<Array<{ from: [number, number]; to: [number, number] }>> = [
  [
    { from: [17.3850, 78.4867] as [number, number], to: [12.9716, 77.5946] as [number, number] },
    { from: [17.3850, 78.4867] as [number, number], to: [19.0760, 72.8777] as [number, number] },
  ],
  [
    { from: [12.9716, 77.5946] as [number, number], to: [13.0827, 80.2707] as [number, number] },
    { from: [12.9716, 77.5946] as [number, number], to: [18.5204, 73.8567] as [number, number] },
  ],
  [
    { from: [28.6139, 77.2090] as [number, number], to: [12.9716, 77.5946] as [number, number] },
    { from: [28.6139, 77.2090] as [number, number], to: [19.0760, 72.8777] as [number, number] },
  ],
  [
    { from: [19.0760, 72.8777] as [number, number], to: [13.0827, 80.2707] as [number, number] },
    { from: [19.0760, 72.8777] as [number, number], to: [18.5204, 73.8567] as [number, number] },
  ],
]

export function GlobeAnalytics({
  markers: initialMarkers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobeAnalyticsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)
  const [data, setData] = useState(initialMarkers)
  const [currentArcIndex, setCurrentArcIndex] = useState(0)
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null)
  const currentArcIndexRef = useRef(0)

  useEffect(() => {
    const dataInterval = setInterval(() => {
      setData((prev) =>
        prev.map((m) => ({
          ...m,
          visitors: m.visitors + Math.floor(Math.random() * 11) - 3,
          trend: Math.max(-20, Math.min(20, m.trend + Math.floor(Math.random() * 5) - 2)),
        }))
      )
    }, 3000)

    const arcInterval = setInterval(() => {
      setCurrentArcIndex((prev) => (prev + 1) % arcPairs.length)
    }, 4000)

    return () => {
      clearInterval(dataInterval)
      clearInterval(arcInterval)
    }
  }, [])

  useEffect(() => {
    currentArcIndexRef.current = currentArcIndex
  }, [currentArcIndex])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let animationId: number
    let phi = 0

    function init() {
      const width = canvas.offsetWidth
      if (width === 0 || globeRef.current) return

      globeRef.current = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width, height: width,
        phi: -1.36, theta: 0.2, dark: 0, diffuse: 1.5,
        mapSamples: 16000, mapBrightness: 10,
        baseColor: [1, 1, 1],
        markerColor: [0.8, 0.47, 0.36],
        glowColor: [0.94, 0.93, 0.91],
        markerElevation: 0,
        markers: initialMarkers.map((m) => ({ location: m.location, size: 0.04 })),
        arcs: arcPairs[currentArcIndexRef.current], arcColor: [0.8, 0.47, 0.36],
        arcWidth: 0.5, arcHeight: 0.25, opacity: 0.7,
      })
      function animate() {
        if (!isPausedRef.current) phi += speed
        globeRef.current!.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
          arcs: arcPairs[currentArcIndexRef.current],
        })
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => { if (canvas) canvas.style.opacity = "1" })
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globeRef.current) globeRef.current.destroy()
    }
  }, [initialMarkers, speed])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%", height: "100%", cursor: "grab", opacity: 0,
          transition: "opacity 1.2s ease", borderRadius: "50%", touchAction: "none",
        }}
      />
      {hoveredMarkerId && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            translate: "-50% 0",
            display: "flex",
            alignItems: "baseline",
            gap: "0.35rem",
            padding: "0.3rem 0.5rem",
            background: "rgba(0,0,0,0.85)",
            borderRadius: 4,
            pointerEvents: "none" as const,
            whiteSpace: "nowrap" as const,
            opacity: 1,
            transition: "opacity 0.2s",
            zIndex: 10,
          }}
        >
          <span style={{
            fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600,
            color: "#fff", letterSpacing: "-0.02em",
          }}>
            {data.find(m => m.id === hoveredMarkerId)?.visitors}
          </span>
          <span style={{
            fontFamily: "monospace", fontSize: "0.55rem", fontWeight: 500,
            letterSpacing: "0.02em",
            color: (data.find(m => m.id === hoveredMarkerId)?.trend ?? 0) >= 0 ? "#34d399" : "#f87171",
          }}>
            {(data.find(m => m.id === hoveredMarkerId)?.trend ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(data.find(m => m.id === hoveredMarkerId)?.trend ?? 0)}%
          </span>
        </div>
      )}
    </div>
  )
}
