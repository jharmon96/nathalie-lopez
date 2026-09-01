export type Category = 'portrait' | 'wedding' | 'editorial'

export interface Photo {
  /** Real photograph, when one exists. Falls back to the darkroom placeholder. */
  src?: string
  alt: string
  caption?: string
  /** EXIF line rendered under the frame in mono, the way contact sheets are labelled. */
  exif?: string
  category: Category
  /** Two hex tones the placeholder is washed with until a real print is scanned. */
  tones: [string, string]
  aspect?: string
}

export const categories: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All work' },
  { id: 'portrait', label: 'Portraits' },
  { id: 'wedding', label: 'Weddings' },
  { id: 'editorial', label: 'Editorial' },
]

export const photos: Photo[] = [
  {
    src: '/photos/nat-lopez-portrait-photo-sample.jpg',
    alt: 'Golden-hour portrait on the dunes, white lace against low sun',
    caption: 'Golden hour, on the dunes',
    exif: 'f/1.8 · 1/500 · ISO 100 · 50mm',
    category: 'portrait',
    tones: ['#d9c6ad', '#6f5b4a'],
    aspect: '4/5',
  },
  {
    src: '/photos/nat-lopez-couple-photo-sample.jpg',
    alt: 'A couple kissing beside a vintage car on the lakeshore at sunset',
    caption: 'The lake house, first look',
    exif: 'f/2 · 1/1000 · ISO 200 · 35mm',
    category: 'wedding',
    tones: ['#c8b39a', '#3f3a33'],
    aspect: '4/5',
  },
  {
    src: '/photos/nat-lopez-wedding-photo-sample.jpg',
    alt: 'A newly married couple walking a coastal path through tall grass',
    caption: 'After the ceremony, on the coast',
    exif: 'f/4 · 1/500 · ISO 100 · 85mm',
    category: 'wedding',
    tones: ['#b9b2a6', '#54504a'],
    aspect: '3/2',
  },
  {
    alt: 'Ceramicist’s hands centred over the wheel, clay mid-turn',
    caption: 'For Craft Quarterly',
    exif: 'f/2.8 · 1/250 · ISO 400 · 85mm',
    category: 'editorial',
    tones: ['#b9b2a6', '#54504a'],
    aspect: '4/5',
  },
  {
    alt: 'Bride lacing her own shoes, dress pooled on the floor',
    caption: 'Getting ready, 7:40 am',
    exif: 'f/2.2 · 1/200 · ISO 800 · 50mm',
    category: 'wedding',
    tones: ['#e3d6c4', '#8a7c6a'],
    aspect: '4/5',
  },
  {
    alt: 'Chef framed by the kitchen pass, steam crossing the light',
    caption: 'Service, for Palate',
    exif: 'f/2 · 1/160 · ISO 3200 · 35mm',
    category: 'editorial',
    tones: ['#9a8f83', '#2e2822'],
    aspect: '3/2',
  },
]

export interface Session {
  name: string
  price: string
  blurb: string
  includes: string[]
  featured?: boolean
}

export const sessions: Session[] = [
  {
    name: 'Portrait sitting',
    price: 'from £300',
    blurb: 'One hour, one or two locations, film and digital. For people, couples, and small families.',
    includes: ['60–90 minutes', '20+ finished frames', 'Private online gallery', 'Print-ready files'],
  },
  {
    name: 'Weddings',
    price: 'from £2,400',
    blurb: 'Full-day coverage with a second shooter. Documented the way the day actually felt.',
    includes: ['8–10 hours coverage', 'Second photographer', '600+ finished frames', 'Heirloom album option'],
    featured: true,
  },
  {
    name: 'Editorial & commercial',
    price: 'day rate',
    blurb: 'Assignments and commissions for magazines, makers, and brands. Licencing handled simply.',
    includes: ['Half or full day', 'Usage licencing', 'Retouching included', 'Fast turnaround'],
  },
]
