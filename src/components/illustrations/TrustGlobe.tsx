'use client'

import { useEffect, useState, type ComponentType } from 'react'

export function TrustGlobe() {
  const [SceneComponent, setSceneComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    let cancelled = false
    import('./TrustGlobeScene').then((mod) => {
      if (!cancelled) setSceneComponent(() => mod.TrustGlobeScene)
    })
    return () => { cancelled = true }
  }, [])

  if (!SceneComponent) {
    return <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f8f9fc] to-[#eef1f8]" />
  }

  return <SceneComponent />
}
