import { vi } from 'vitest'

type Result = { data?: any; error?: any; count?: number | null }
export const results: Record<string, Result> = {}
export const calls: { table: string; method: string; args: any[] }[] = []

export const setResult = (table: string, r: Result) => { results[table] = r }
export const resetMock = () => {
  Object.keys(results).forEach(k => delete results[k])
  calls.length = 0
}
export const callsOf = (table: string, method: string) =>
  calls.filter(c => c.table === table && c.method === method)

function builder(table: string) {
  const b: any = new Proxy({}, {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: any) => resolve({ data: null, error: null, count: null, ...(results[table] || {}) })
      }
      return (...args: any[]) => { calls.push({ table, method: prop, args }); return b }
    },
  })
  return b
}

const chan: any = { on: vi.fn(() => chan), subscribe: vi.fn(() => chan) }

export const supabaseMock = {
  from: vi.fn((table: string) => builder(table)),
  channel: vi.fn(() => chan),
  removeChannel: vi.fn(),
  auth: { signOut: vi.fn() },
}
