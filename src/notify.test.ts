import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toast,
  getToasts,
  confirmDialog,
  answerConfirm,
  registerHost,
  getConfirm,
} from './notify'

let unregister: (() => void) | null = null

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  // wyczyść stan modułu: zakończ oczekujące pytanie i wszystkie toasty
  answerConfirm(false)
  unregister?.()
  unregister = null
  vi.advanceTimersByTime(10000)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('confirmDialog bez hosta', () => {
  it('woła window.confirm i zwraca jego wynik', async () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await expect(confirmDialog('Na pewno?')).resolves.toBe(true)
    expect(spy).toHaveBeenCalledWith('Na pewno?')
  })
})

describe('toast', () => {
  it('toast.success dodaje toast, a po 3500 ms znika', () => {
    toast.success('Zapisano')
    expect(getToasts().some(t => t.type === 'success' && t.message === 'Zapisano')).toBe(true)

    vi.advanceTimersByTime(3500)
    expect(getToasts().some(t => t.message === 'Zapisano')).toBe(false)
  })
})

describe('confirmDialog z hostem', () => {
  it('zwraca Promise, a answerConfirm(true) rozwiązuje go na true', async () => {
    unregister = registerHost()
    const spy = vi.spyOn(window, 'confirm')

    const promise = confirmDialog('Usunąć?')
    expect(promise).toBeInstanceOf(Promise)
    expect(getConfirm()?.message).toBe('Usunąć?')

    answerConfirm(true)
    await expect(promise).resolves.toBe(true)
    expect(spy).not.toHaveBeenCalled()
  })

  it('drugie pytanie anuluje pierwsze (false)', async () => {
    unregister = registerHost()

    const first = confirmDialog('Pierwsze?')
    const second = confirmDialog('Drugie?')

    await expect(first).resolves.toBe(false)
    expect(getConfirm()?.message).toBe('Drugie?')

    answerConfirm(true)
    await expect(second).resolves.toBe(true)
  })
})
