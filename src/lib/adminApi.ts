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

export const publicApi = {
  reviews: () => request<{ reviews: ReviewData[] }>('/public/reviews', 'GET'),
  slides: () => request<{ slides: SlideData[] }>('/public/slides', 'GET'),
  instagram: () => request<{ posts: InstagramPostData[] }>('/public/instagram', 'GET'),
}

export interface AdminReview extends ReviewData {
  id: number
  sort_order: number
}

export const reviewsApi = {
  list: () => request<{ reviews: AdminReview[] }>('/admin/reviews', 'GET'),
  create: (body: Omit<AdminReview, 'id'>) => request<AdminReview>('/admin/reviews', 'POST', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/reviews/${id}`, 'DELETE'),
}

export interface AdminSlide extends SlideData {
  id: number
  sort_order: number
}

export const slidesApi = {
  list: () => request<{ slides: AdminSlide[] }>('/admin/slides', 'GET'),
  create: (body: Omit<AdminSlide, 'id'>) => request<AdminSlide>('/admin/slides', 'POST', body),
  remove: (id: number) => request<{ ok: boolean }>(`/admin/slides/${id}`, 'DELETE'),
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
