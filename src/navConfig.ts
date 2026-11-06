// Konfiguracja nawigacji: jedno miejsce, w którym ustala się co widzi każda rola.
// Dodanie zakładki = jedna linia tutaj (+ obsługa w App.tsx).
// Pole icon to nazwa ikony z components/Icon.tsx.
// Tab może mieć podzakładkę po dwukropku, np. "trainer:search" (obsługuje to App.tsx).

export type NavItem = { tab: string; icon: string; label: string }
export type NavGroup = { label: string; items: NavItem[] }

export const ROLE_LABELS: Record<string, string> = {
  user: 'Ćwiczący',
  trainer: 'Trener',
  gym: 'Siłownia',
  admin: 'Administrator',
}

const settings: NavGroup = { label: 'Ustawienia', items: [{ tab: 'settings', icon: 'settings', label: 'Ustawienia' }] }

const community: NavItem = { tab: 'community', icon: 'message', label: 'Społeczność' }
const gymTab: NavItem = { tab: 'my_gym', icon: 'building', label: 'Siłownia' }

const userNav: NavGroup[] = [
  { label: 'Profil', items: [{ tab: 'home', icon: 'user', label: 'Mój Profil' }] },
  { label: 'Trening', items: [
    { tab: 'training', icon: 'dumbbell', label: 'Trening' },
    { tab: 'progress', icon: 'chart', label: 'Postępy' },
    { tab: 'trainer', icon: 'users', label: 'Trener' },
  ] },
  { label: 'Dieta', items: [
    { tab: 'fridge', icon: 'utensils', label: 'Lodówka' },
    { tab: 'pantry', icon: 'box', label: 'Spiżarnia i zakupy' },
  ] },
  { label: 'Społeczność', items: [community, gymTab] },
  settings,
]

const trainerNav: NavGroup[] = [
  { label: 'Profil', items: [{ tab: 'home', icon: 'user', label: 'Mój Profil' }] },
  { label: 'Podopieczni', items: [
    { tab: 'clients_overview', icon: 'alert', label: 'Przegląd podopiecznych' },
    { tab: 'clients', icon: 'users', label: 'Moi Podopieczni' },
    { tab: 'client_sessions', icon: 'folder', label: 'Sesje Podopiecznych' },
    { tab: 'intake_questions', icon: 'clipboard', label: 'Ankieta dla podopiecznych' },
    { tab: 'comments', icon: 'message', label: 'Komentarze' },
  ] },
  { label: 'Trening', items: [
    { tab: 'training', icon: 'dumbbell', label: 'Trening' },
    { tab: 'progress', icon: 'chart', label: 'Postępy' },
  ] },
  { label: 'Dieta', items: [
    { tab: 'fridge', icon: 'utensils', label: 'Lodówka' },
    { tab: 'pantry', icon: 'box', label: 'Spiżarnia i zakupy' },
  ] },
  { label: 'Społeczność', items: [community, gymTab] },
  settings,
]

const gymNav: NavGroup[] = [
  { label: 'Siłownia', items: [
    { tab: 'home', icon: 'building', label: 'Moja Siłownia' },
    { tab: 'gym_trainers', icon: 'graduation', label: 'Trenerzy' },
    { tab: 'gym_members', icon: 'users', label: 'Członkowie' },
    { tab: 'gym_announcements', icon: 'megaphone', label: 'Ogłoszenia' },
    { tab: 'gym_checkin', icon: 'qr', label: 'Check-in i statystyki' },
  ] },
  { label: 'Społeczność', items: [community] },
  settings,
]

// Administrator na razie widzi to samo co ćwiczący (osobne narzędzia admina to przyszły pakiet)
export function navFor(role?: string): NavGroup[] {
  if (role === 'gym') return gymNav
  if (role === 'trainer') return trainerNav
  return userNav
}

// Dolny pasek na telefonie: 4 najczęstsze akcje + przycisk Menu
export function bottomFor(role?: string): NavItem[] {
  if (role === 'gym') return [
    { tab: 'home', icon: 'building', label: 'Siłownia' },
    { tab: 'gym_members', icon: 'users', label: 'Członkowie' },
    { tab: 'gym_announcements', icon: 'megaphone', label: 'Ogłoszenia' },
    { tab: 'community', icon: 'message', label: 'Czat' },
  ]
  if (role === 'trainer') return [
    { tab: 'home', icon: 'user', label: 'Profil' },
    { tab: 'clients', icon: 'users', label: 'Podopieczni' },
    { tab: 'training', icon: 'dumbbell', label: 'Trening' },
    { tab: 'community', icon: 'message', label: 'Czat' },
  ]
  return [
    { tab: 'home', icon: 'user', label: 'Profil' },
    { tab: 'training', icon: 'dumbbell', label: 'Trening' },
    { tab: 'fridge', icon: 'utensils', label: 'Dieta' },
    { tab: 'community', icon: 'message', label: 'Czat' },
  ]
}
