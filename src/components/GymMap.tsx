import { useEffect, useRef } from 'react'
import { directionsUrl } from '../geocode'

export type MapGym = { id: string; name: string; address?: string | null; opening_hours?: string | null; lat: number; lng: number; mine?: boolean }

// Płaski, ciemny styl mapy zgodny z aplikacją (kafelki wektorowe OpenStreetMap z OpenFreeMap)
const STYLE: any = {
  version: 8,
  sources: { osm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#14171b' } },
    { id: 'landuse', type: 'fill', source: 'osm', 'source-layer': 'landuse', paint: { 'fill-color': '#181c21' } },
    { id: 'landcover', type: 'fill', source: 'osm', 'source-layer': 'landcover', paint: { 'fill-color': '#16241f' } },
    { id: 'park', type: 'fill', source: 'osm', 'source-layer': 'park', paint: { 'fill-color': '#173325' } },
    { id: 'water', type: 'fill', source: 'osm', 'source-layer': 'water', paint: { 'fill-color': '#1b3566' } },
    { id: 'building', type: 'fill', source: 'osm', 'source-layer': 'building', minzoom: 13, paint: { 'fill-color': '#2a3038' } },
    {
      id: 'roads-minor', type: 'line', source: 'osm', 'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track', 'path', 'tertiary']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#4a515b', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 2, 18, 9] },
    },
    {
      id: 'roads-major', type: 'line', source: 'osm', 'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#7b8390', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 14, 3.5, 18, 14] },
    },
  ],
}

const COLOR_GYM = '#3b6bf5'
const COLOR_MINE = '#4ade80'

// Mapa siłowni. Biblioteka ładuje się dopiero, gdy mapa jest potrzebna.
export default function GymMap({ gyms, height = 320 }: { gyms: MapGym[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: any
    let cancelled = false
    const init = async () => {
      const maplibregl = await import('maplibre-gl')
      if (cancelled || !ref.current) return
      map = new maplibregl.Map({
        container: ref.current,
        style: STYLE,
        center: [gyms[0].lng, gyms[0].lat],
        zoom: 14,
        attributionControl: { compact: true },
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      gyms.forEach(g => {
        const el = document.createElement('button')
        el.type = 'button'
        el.setAttribute('aria-label', g.name)
        el.style.cssText = `width:18px;height:18px;border-radius:9999px;border:3px solid #0b0c0e;background:${g.mine ? COLOR_MINE : COLOR_GYM};cursor:pointer;`

        const box = document.createElement('div')
        box.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:160px;color:#0b0c0e;font:14px system-ui,sans-serif'
        const title = document.createElement('strong')
        title.textContent = g.name
        box.appendChild(title)
        if (g.address) { const a = document.createElement('span'); a.textContent = g.address; box.appendChild(a) }
        if (g.opening_hours) { const h = document.createElement('span'); h.textContent = g.opening_hours; h.style.opacity = '0.7'; box.appendChild(h) }
        const link = document.createElement('a')
        link.href = directionsUrl(g.lat, g.lng)
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.textContent = 'Wyznacz trasę'
        link.style.cssText = 'color:#2f56d6;font-weight:700'
        box.appendChild(link)

        new maplibregl.Marker({ element: el })
          .setLngLat([g.lng, g.lat])
          .setPopup(new maplibregl.Popup({ offset: 14, closeButton: false }).setDOMContent(box))
          .addTo(map)
      })

      if (gyms.length > 1) {
        const b = new maplibregl.LngLatBounds()
        gyms.forEach(g => b.extend([g.lng, g.lat]))
        map.fitBounds(b, { padding: 50, maxZoom: 14, duration: 0 })
      }
    }
    init().catch(e => console.error('[GymMap]', e))
    return () => { cancelled = true; map?.remove() }
  }, [gyms])

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-2xl border border-zinc-800" />
}
