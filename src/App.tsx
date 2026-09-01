import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { CustomerGalleryPage } from '@/pages/CustomerGalleryPage'
import { FaqPage } from '@/pages/FaqPage'
import { HomePage } from '@/pages/HomePage'
import { InvestmentPage } from '@/pages/InvestmentPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { PrivacyPage } from '@/pages/PrivacyPage'

import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminCarouselPage } from '@/pages/admin/AdminCarouselPage'
import { AdminCrmPage } from '@/pages/admin/AdminCrmPage'
import { AdminFaqPage } from '@/pages/admin/AdminFaqPage'
import { AdminGalleriesPage } from '@/pages/admin/AdminGalleriesPage'
import { AdminInstagramPage } from '@/pages/admin/AdminInstagramPage'
import { AdminInvoicesPage } from '@/pages/admin/AdminInvoicesPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminPhotosPage } from '@/pages/admin/AdminPhotosPage'
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage'
import { AdminSessionsPage } from '@/pages/admin/AdminSessionsPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/portfolio', element: <PortfolioPage /> },
      { path: '/investment', element: <InvestmentPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/gallery/:slug', element: <CustomerGalleryPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminCrmPage /> },
      { path: 'invoices', element: <AdminInvoicesPage /> },
      { path: 'galleries', element: <AdminGalleriesPage /> },
      { path: 'reviews', element: <AdminReviewsPage /> },
      { path: 'carousel', element: <AdminCarouselPage /> },
      { path: 'instagram', element: <AdminInstagramPage /> },
      { path: 'faq', element: <AdminFaqPage /> },
      { path: 'photos', element: <AdminPhotosPage /> },
      { path: 'sessions', element: <AdminSessionsPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
