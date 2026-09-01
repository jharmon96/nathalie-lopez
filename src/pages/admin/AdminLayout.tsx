import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { adminApi, ApiError } from '@/lib/adminApi'

import { ApertureMark } from '@/components/ApertureMark'

const groups = [
  {
    label: 'Bookings',
    items: [
      { to: '/admin', label: 'CRM', end: true },
      { to: '/admin/invoices', label: 'Invoices', end: false },
      { to: '/admin/galleries', label: 'Galleries', end: false },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/admin/photos', label: 'Photos', end: false },
      { to: '/admin/carousel', label: 'Carousel', end: false },
      { to: '/admin/sessions', label: 'Pricing', end: false },
      { to: '/admin/faq', label: 'FAQ', end: false },
      { to: '/admin/reviews', label: 'Reviews', end: false },
      { to: '/admin/instagram', label: 'Instagram', end: false },
      { to: '/admin/site-text', label: 'Page text', end: false },
    ],
  },
]

function GroupedNav() {
  return (
    <nav aria-label="Admin" className="flex flex-wrap items-end gap-x-6 gap-y-2">
      {groups.map((group, gi) => (
        <div key={group.label} className={`flex flex-col gap-1 ${gi > 0 ? 'sm:border-l sm:border-paper/15 sm:pl-6' : ''}`}>
          <span className="eyebrow text-paper/40">{group.label}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm transition-colors hover:text-paper ${isActive ? 'text-safelight' : 'text-paper/70'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const [checked, setChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    adminApi
      .me()
      .then(() => setChecked(true))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          navigate('/admin/login', { replace: true })
          return
        }
        setChecked(true)
      })
  }, [])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <ApertureMark className="h-10 w-10 text-ink" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-darkroom">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <NavLink to="/admin" className="flex items-center gap-3">
            <ApertureMark className="h-8 w-8 text-paper" animate={false} />
            <span className="flex flex-col leading-none">
              <span className="wordmark text-xl text-paper">Studio admin</span>
              <span className="eyebrow mt-1 text-paper/50">Nathalie Lopez</span>
            </span>
          </NavLink>
          <GroupedNav />
          <button
            type="button"
            onClick={async () => {
              await adminApi.logout().catch(() => undefined)
              navigate('/admin/login', { replace: true })
            }}
            className="border border-paper/30 px-3 py-1 text-sm text-paper/80 transition-colors hover:border-safelight hover:text-safelight"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
