import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../utils/AuthContext'

export function Layout({ children, currentSection, onSectionChange }) {
  const { user, profile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getUserFirstName = () => {
    if (profile?.first_name) return profile.first_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0]
    return 'User'
  }

  // Main nav items displayed in the navigation bar
  const mainNavSections = [
    { id: 'browse', label: 'All Items', icon: 'grid_view' },
    { id: 'dibbed', label: 'My Dibs', icon: 'favorite' },
    { id: 'passed', label: 'My Passes', icon: 'delete' },
    { id: 'conflicts', label: 'My Bids', icon: 'loyalty' },
  ]

  // Overflow items shown in dropdown menu
  const overflowSections = [
    { id: 'mystuff', label: 'My Stuff', icon: 'inventory_2' },
    { id: 'donation', label: 'Donation Pile', icon: 'move_item' },
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
            {mainNavSections.map((section) => (
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
            
            {/* Overflow Menu */}
            <div className="overflow-menu-container">
              <button
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                className="nav-item overflow-btn"
              >
                <span className="material-symbols-rounded nav-icon">
                  more_horiz
                </span>
              </button>

              {/* Dropdown Menu */}
              {showOverflowMenu && (
                <>
                  <div
                    className="user-menu-overlay"
                    onClick={() => setShowOverflowMenu(false)}
                  />
                  <div className="user-menu-dropdown">
                    {overflowSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          onSectionChange?.(section.id)
                          setShowOverflowMenu(false)
                        }}
                        className="overflow-menu-item"
                      >
                        <span className="material-symbols-rounded">
                          {section.icon}
                        </span>
                        <span>{section.label}</span>
                      </button>
                    ))}
                    <button onClick={handleSignOut} className="overflow-menu-item">
                      <span className="material-symbols-rounded" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
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
