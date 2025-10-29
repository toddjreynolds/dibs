import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../utils/AuthContext'

export function Layout({ children, currentSection, onSectionChange }) {
  const { user, profile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getUserFirstName = () => {
    if (profile?.first_name) return profile.first_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0]
    return 'User'
  }

  const navSections = [
    { id: 'browse', label: 'Browse', icon: 'grid_view' },
    { id: 'dibbed', label: 'Dibbed', icon: 'favorite' },
    { id: 'passed', label: 'Passed', icon: 'delete' },
    { id: 'conflicts', label: 'Conflicts', icon: 'warning' },
  ]


  return (
    <div className="min-h-screen bg-white">
      {/* Floating Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 sm:pt-14 px-4">
        <nav className="floating-nav">
          {/* Logo */}
          <Link to="/" onClick={() => onSectionChange?.('browse')}>
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F227ffd57fced4c2795d6b1f922cd2cd1%2Feedd43e9a69144418fbd2f659bd59105"
              alt="Dibs"
              className="dibs-logo-nav"
            />
          </Link>

          {/* Navigation Items */}
          <div className="nav-items">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange?.(section.id)}
                className={`nav-item ${currentSection === section.id ? 'nav-item-active' : ''}`}
              >
                <span className="material-symbols-rounded nav-icon">
                  {section.icon}
                </span>
                <span className="nav-label">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="nav-right">
            {/* User Menu */}
            <div className="user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="user-btn"
              >
                <span className="material-symbols-rounded nav-icon">account_circle</span>
                <span className="nav-label">{getUserFirstName()}</span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="user-menu-overlay"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="user-menu-dropdown">
                    <button onClick={handleSignOut} className="sign-out-btn">
                      <span className="material-symbols-rounded text-lg">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="pt-24 sm:pt-48 px-4 pb-12 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
