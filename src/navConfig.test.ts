import { describe, it, expect } from 'vitest'
import { navFor, bottomFor } from './navConfig'

const allTabs = (role: string) => navFor(role).flatMap(g => g.items.map(i => i.tab))

describe('navFor', () => {
  it('rola gym nie ma zakładki fridge', () => {
    expect(allTabs('gym')).not.toContain('fridge')
  })

  it('trainer ma intake_questions i clients', () => {
    expect(allTabs('trainer')).toEqual(expect.arrayContaining(['intake_questions', 'clients']))
  })

  it('user ma fridge, trening, trenera i postępy', () => {
    expect(allTabs('user')).toEqual(expect.arrayContaining(['fridge', 'training', 'trainer', 'progress']))
  })

  it('stare osobne zakładki zostały scalone w sekcje', () => {
    const tabs = allTabs('user')
    for (const old of ['journal', 'plan_creator', 'plan_templates', 'my_trainer', 'search', 'friends', 'chat', 'challenges', 'stats', 'body', 'achievements']) {
      expect(tabs).not.toContain(old)
    }
  })

  it('nieznana rola dostaje menu usera', () => {
    expect(navFor('unknown_role')).toEqual(navFor('user'))
    expect(navFor(undefined)).toEqual(navFor('user'))
  })

  it('w żadnej roli nie ma zduplikowanych tab', () => {
    for (const role of ['user', 'trainer', 'gym', 'admin']) {
      const tabs = allTabs(role)
      expect(new Set(tabs).size).toBe(tabs.length)
    }
  })
})

describe('bottomFor', () => {
  it('każda zakładka z bottomFor istnieje w navFor (ta sama rola)', () => {
    for (const role of ['user', 'trainer', 'gym']) {
      const tabs = allTabs(role)
      for (const item of bottomFor(role)) {
        expect(tabs).toContain(item.tab)
      }
    }
  })
})
