import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Wordmark } from './components/brand'
import { useAuth } from './lib/auth'
import { AuthPage } from './pages/Auth'
import { CustomersPage } from './pages/Customers'
import { OverviewPage } from './pages/Overview'
import { ProductsPage } from './pages/Products'
import { SalesPage } from './pages/Sales'

function RequireSession({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'checking') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-carbon-900" role="status" aria-label="Loading">
        <span className="animate-pulse">
          <Wordmark />
        </span>
      </div>
    )
  }
  if (status === 'signed-out') {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}

function NotFound() {
  return (
    <div className="py-16">
      <p className="numero text-lg">N° 404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">This page isn't in the book</h1>
      <p className="mt-2 text-ink-2">The address may be mistyped, or the page has moved.</p>
      <Link to="/" className="mt-5 inline-flex font-semibold text-carbon-700 underline">
        Back to the overview
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<AuthPage mode="signin" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        element={
          <RequireSession>
            <Shell />
          </RequireSession>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
