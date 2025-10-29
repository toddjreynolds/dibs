import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './utils/AuthContext'
import { Login } from './pages/Login'
import { Browse } from './pages/Browse'
import { Upload } from './pages/Upload'
import { Layout } from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function MainApp() {
  const [currentSection, setCurrentSection] = useState('browse')

  return (
    <ProtectedRoute>
      <Layout currentSection={currentSection} onSectionChange={setCurrentSection}>
        <Browse currentSection={currentSection} />
      </Layout>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={<MainApp />}
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <Layout currentSection="browse" onSectionChange={() => {}}>
              <Upload />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
