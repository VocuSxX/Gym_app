const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function search(params: Record<string, string>): Promise<{ lat: number; lng: number } | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)
    const qs = new URLSearchParams({ format: 'json', limit: '1', countrycodes: 'pl', ...params })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) { console.warn('[geocode] HTTP', res.status); return null }
    const rows = await res.json()
    const lat = Number(rows?.[0]?.lat)
    const lng = Number(rows?.[0]?.lon)
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  } catch (e) {
    console.warn('[geocode] błąd', e)
    return null
  }
}

// Zamiana adresu na współrzędne (Nominatim / OpenStreetMap). Próbuje kilku zapisów adresu.
export async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const addr = address.trim()
  if (!addr) return null
  // Wyrzucamy kod pocztowy i "Polska", bo przeszkadzają wyszukiwarce
  const clean = addr.replace(/\b\d{2}-\d{3}\b/g, '').replace(/,?\s*Polska\b/i, '').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').trim().replace(/^,|,$/g, '')
  const attempts: Record<string, string>[] = [{ q: clean }]
  const cityGuess = city.trim()
  if (cityGuess && !clean.toLowerCase().includes(cityGuess.toLowerCase())) attempts.push({ q: `${clean}, ${cityGuess}` })
  // Zapis strukturalny: "ulica numer, miasto"
  const m = clean.match(/^(.*?)\s+(\d+[a-zA-Z]?(?:\/\d+)?)\s*(?:,\s*(.*))?$/)
  if (m) {
    const town = (m[3] || cityGuess).split(',')[0].trim()
    if (town) attempts.push({ street: `${m[2]} ${m[1]}`, city: town })
  }
  for (let i = 0; i < attempts.length; i++) {
    if (i > 0) await sleep(1100)
    const pos = await search(attempts[i])
    if (pos) return pos
  }
  console.warn('[geocode] brak wyniku dla:', clean, cityGuess)
  return null
}

// Link do tras w Google Maps (czas dojazdu liczy Google od lokalizacji użytkownika)
export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
