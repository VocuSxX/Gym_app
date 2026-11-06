// Konfiguracja profilu siłowni

export const AMENITIES = [
  'Sauna',
  'Basen',
  'Parking',
  'Prysznice',
  'Szatnie z szafkami',
  'Strefa cardio',
  'Wolne ciężary',
  'Strefa funkcjonalna',
  'Zajęcia grupowe',
  'Klimatyzacja',
  'Dostęp 24/7',
]

export const EQUIPMENT = [
  'Wyciąg górny',
  'Wyciąg dolny',
  'Bramy / wyciągi podwójne',
  'Suwnica',
  'Leg press',
  'Maszyna Smitha',
  'Hack squat',
  'Maszyna do prostowania nóg',
  'Maszyna do uginania nóg',
  'Wyciskanie na maszynie',
  'Pec deck',
  'Maszyna do wiosłowania',
  'Hip thrust',
  'Hantle',
  'Sztangi',
  'Ławki regulowane',
  'Klatki / stojaki',
  'Drążki i poręcze',
  'Bieżnie',
  'Rowery',
  'Wioślarz',
  'Kettlebells',
]

export type GymForm = {
  name: string
  city: string
  address: string
  phone: string
  contact_email: string
  website: string
  opening_hours: string
  description: string
  amenities: string[]
  equipment: string[]
  is_public: boolean
}

export const emptyGymForm: GymForm = {
  name: '',
  city: '',
  address: '',
  phone: '',
  contact_email: '',
  website: '',
  opening_hours: '',
  description: '',
  amenities: [],
  equipment: [],
  is_public: true,
}
