const BASE = '/api/v1'
const CSRF_HEADER = 'X-NLP-Admin'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { [CSRF_HEADER]: '1' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = (await res.json()) as { detail?: string }
      if (data.detail) detail = data.detail
    } catch {
      // non-JSON error body — statusText is all we have
    }
    throw new ApiError(res.status, detail)
  }
  return (await res.json()) as T
}

// ---- auth ----

export const adminApi = {
  login: (password: string) => request<{ ok: boolean }>('/admin/login', 'POST', { password }),
  logout: () => request<{ ok: boolean }>('/admin/logout', 'POST'),
  me: () => request<{ ok: boolean }>('/admin/me', 'GET'),
}

// ---- CRM ----

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  source: string | null
  notes: string | null
  created_at: string
}

export type CustomerBody = Omit<Customer, 'id' | 'created_at'>

export const customersApi = {
  list: () => request<{ customers: Customer[] }>('/admin/customers', 'GET'),
  create: (body: CustomerBody) => request<Customer>('/admin/customers', 'POST', body),
  update: (id: number, body: CustomerBody) => request<Customer>(`/admin/customers/${id}`, 'PATCH', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/customers/${id}`, 'DELETE'),
}

// ---- invoices ----

export interface Invoice {
  id: number
  customer_id: number | null
  number: string
  amount_cents: number
  status: 'draft' | 'sent' | 'paid' | 'void'
  issued_at: string | null
  due_at: string | null
  notes: string | null
  created_at: string
}

export type InvoiceBody = Omit<Invoice, 'id' | 'created_at'>

export const invoicesApi = {
  list: () => request<{ invoices: Invoice[] }>('/admin/invoices', 'GET'),
  create: (body: InvoiceBody) => request<Invoice>('/admin/invoices', 'POST', body),
  update: (id: number, body: InvoiceBody) => request<Invoice>(`/admin/invoices/${id}`, 'PATCH', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/invoices/${id}`, 'DELETE'),
}

// ---- galleries ----

export interface PhotoBody {
  url: string
  caption: string | null
  sort_order: number
}

export interface GalleryPhoto {
  id: number
  url: string
  caption: string | null
  sort_order: number
}

export interface Gallery {
  id: number
  customer_id: number | null
  title: string
  slug: string
  passphrase: string | null
  description: string | null
  photos: GalleryPhoto[]
}

export type GalleryBody = Omit<Gallery, 'id' | 'photos'>

export const galleriesApi = {
  list: () => request<{ galleries: Gallery[] }>('/admin/galleries', 'GET'),
  create: (body: GalleryBody) => request<Gallery>('/admin/galleries', 'POST', body),
  update: (id: number, body: GalleryBody) => request<Gallery>(`/admin/galleries/${id}`, 'PATCH', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/galleries/${id}`, 'DELETE'),
  addPhoto: (id: number, body: PhotoBody) => request<Gallery>(`/admin/galleries/${id}/photos`, 'POST', body),
  removePhoto: (id: number, photoId: number) =>
    request<Gallery>(`/admin/galleries/${id}/photos/${photoId}`, 'DELETE'),
}

// ---- public customer gallery ----

export interface PublicGallery {
  title: string
  description: string | null
  requires_password: boolean
  photos: { url: string; caption: string | null }[] | null
}

export const publicGalleryApi = {
  get: (slug: string) => request<PublicGallery>(`/public/galleries/${slug}`, 'GET'),
  unlock: (slug: string, passphrase: string) =>
    request<PublicGallery>(`/public/galleries/${slug}/unlock`, 'POST', { passphrase }),
}

// ---- public site content (reviews, carousel, instagram) ----

export interface ReviewData {
  author: string
  quote: string
  source: string | null
}

export interface SlideData {
  image_url: string
  alt: string
  caption: string | null
}

export interface InstagramPostData {
  url: string
  image_url: string
  caption: string | null
  synced: boolean
}

export interface AdminReview extends ReviewData {
  id: number
  sort_order: number
}

export interface AdminSlide extends SlideData {
  id: number
  sort_order: number
}

export const instagramApi = {
  list: () => request<{ posts: (InstagramPostData & { id: number; sort_order: number })[] }>(
    '/admin/instagram',
    'GET',
  ),
  create: (body: { url: string; image_url: string; caption: string | null; sort_order?: number }) =>
    request<{ id: number }>('/admin/instagram', 'POST', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/instagram/${id}`, 'DELETE'),
  status: () => request<ConnectionStatus>('/admin/instagram/status', 'GET'),
}

export interface ConnectionStatus {
  app_configured: boolean
  connected: boolean
  token_updated_at: string | null
}

// ---- editable site content (faqs, photos, sessions, site text) ----

export interface FaqData {
  question: string
  answer: string
}

export interface PhotoData {
  category: string
  src: string
  alt: string
  caption: string | null
  exif: string | null
  aspect: string
}

export interface SessionData {
  name: string
  price: string
  blurb: string | null
  includes: string[]
  featured: boolean
}

export interface SiteContent {
  faqs: FaqData[]
  photos: PhotoData[]
  sessions: SessionData[]
  site: Record<string, string>
}

export const publicApi = {
  reviews: () => request<{ reviews: ReviewData[] }>('/public/reviews', 'GET'),
  slides: () => request<{ slides: SlideData[] }>('/public/slides', 'GET'),
  instagram: () => request<{ posts: InstagramPostData[] }>('/public/instagram', 'GET'),
  content: () => request<SiteContent>('/public/content', 'GET'),
}

export interface AdminFaq extends FaqData {
  id: number
  sort_order: number
}

export const faqsApi = {
  list: () => request<{ faqs: AdminFaq[] }>('/admin/faqs', 'GET'),
  create: (body: Omit<AdminFaq, 'id'>) => request<AdminFaq>('/admin/faqs', 'POST', body),
  update: (id: number, body: Omit<AdminFaq, 'id'>) => request<AdminFaq>(`/admin/faqs/${id}`, 'PATCH', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/faqs/${id}`, 'DELETE'),
  reorder: (ids: number[]) => request<{ ok: boolean }>('/admin/faqs/reorder', 'POST', { ids }),
}

export interface AdminPhoto {
  id: number
  category: string
  src: string
  alt: string
  caption: string | null
  exif: string | null
  aspect: string | null
  sort_order: number
}

export const photosApi = {
  list: () => request<{ photos: AdminPhoto[] }>('/admin/photos', 'GET'),
  create: (body: { category: string; src: string; alt: string; caption?: string; exif?: string; aspect?: string }) =>
    request<AdminPhoto>('/admin/photos', 'POST', body),
  update: (id: number, body: Partial<Omit<AdminPhoto, 'id' | 'sort_order'>>) =>
    request<AdminPhoto>(`/admin/photos/${id}`, 'PATCH', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/photos/${id}`, 'DELETE'),
  reorder: (ids: number[]) => request<{ ok: boolean }>('/admin/photos/reorder', 'POST', { ids }),
}

export interface AdminSession {
  id: number
  name: string
  price: string
  blurb: string | null
  includes: string | null
  featured: boolean
  sort_order: number
}

export const sessionsApi = {
  list: () => request<{ sessions: AdminSession[] }>('/admin/sessions', 'GET'),
  create: (body: { name: string; price: string; blurb: string | null; includes: string | null; featured: boolean; sort_order?: number }) =>
    request<AdminSession>('/admin/sessions', 'POST', body),
  update: (
    id: number,
    body: { name: string; price: string; blurb: string | null; includes: string | null; featured: boolean },
  ) => request<AdminSession>(`/admin/sessions/${id}`, 'PATCH', body),
  reorder: (ids: number[]) => request<{ ok: boolean }>('/admin/sessions/reorder', 'POST', { ids }),
}

export const reviewsApi = {
  list: () => request<{ reviews: AdminReview[] }>('/admin/reviews', 'GET'),
  create: (body: Omit<AdminReview, 'id'>) => request<AdminReview>('/admin/reviews', 'POST', body),
  update: (id: number, body: Omit<AdminReview, 'id'>) => request<AdminReview>(`/admin/reviews/${id}`, 'PATCH', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/reviews/${id}`, 'DELETE'),
  reorder: (ids: number[]) => request<{ ok: boolean }>('/admin/reviews/reorder', 'POST', { ids }),
}

export const slidesApi = {
  list: () => request<{ slides: AdminSlide[] }>('/admin/slides', 'GET'),
  create: (body: Omit<AdminSlide, 'id'>) => request<AdminSlide>('/admin/slides', 'POST', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/slides/${id}`, 'DELETE'),
  reorder: (ids: number[]) => request<{ ok: boolean }>('/admin/slides/reorder', 'POST', { ids }),
}
