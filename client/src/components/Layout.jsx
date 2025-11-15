import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../utils/AuthContext'
import { useRole, useIsOrganizer, useIsAdmin } from '../hooks/useRole'
import { EditDisplayNameModal } from './EditDisplayNameModal'
import { EditEmailModal } from './EditEmailModal'
import { ChangePasswordModal } from './ChangePasswordModal'

export function Layout({ children, currentSection, onSectionChange }) {
  const { user, profile, signOut } = useAuthContext()
  const role = useRole()
  const isOrganizer = useIsOrganizer()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getUserFirstName = () => {
    if (profile?.first_name) return profile.first_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0]
    return 'User'
  }

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-red-100 text-red-800 border-red-300' }
      case 'organizer':
        return { label: 'Organizer', color: 'bg-blue-100 text-blue-800 border-blue-300' }
      default:
        return null
    }
  }

  const roleBadge = getRoleBadge()

  // Main nav items displayed in the navigation bar
  const mainNavSections = [
    { id: 'browse', label: 'Up for Grabs', icon: 'grid_view' },
    { id: 'dibbed', label: 'My Dibs', icon: 'favorite' },
    { id: 'passed', label: 'My Passes', icon: 'delete' },
    { id: 'conflicts', label: 'My Bids', icon: 'loyalty' },
  ]

  // Overflow items shown in dropdown menu
  const overflowSections = [
    { id: 'mystuff', label: 'My Stuff', icon: 'inventory_2' },
    { id: 'donation', label: 'Donation Pile', icon: 'move_item' },
  ]

  // Role-based pages (not sections, separate routes)
  const rolePages = []
  if (isOrganizer) {
    rolePages.push({ path: '/organizer', label: 'Organizer', icon: 'local_shipping', active: currentSection === 'organizer' })
  }


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
            
            {/* Role-based pages */}
            {rolePages.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className={`nav-item ${page.active ? 'nav-item-active' : ''}`}
              >
                <span className="material-symbols-rounded nav-icon">
                  {page.icon}
                </span>
                <span className="nav-label">{page.label}</span>
              </Link>
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
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    {/* Admin link in overflow (admin only) */}
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setShowOverflowMenu(false)}
                          className="overflow-menu-item"
                        >
                          <span className="material-symbols-rounded">admin_panel_settings</span>
                          <span>Admin Settings</span>
                        </Link>
                        
                        <div className="border-t border-gray-200 my-2"></div>
                      </>
                    )}
                    
                    {/* User Info with Role Badge */}
                    <div className="px-4 py-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getUserFirstName()}
                          </p>
                          {roleBadge && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadge.color}`}>
                              {roleBadge.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200"></div>
                    
                    <button 
                      onClick={() => {
                        setShowDisplayNameModal(true)
                        setShowOverflowMenu(false)
                      }} 
                      className="overflow-menu-item"
                    >
                      <span className="material-symbols-rounded">badge</span>
                      <span>Edit Display Name...</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowEmailModal(true)
                        setShowOverflowMenu(false)
                      }} 
                      className="overflow-menu-item"
                    >
                      <span className="material-symbols-rounded">alternate_email</span>
                      <span>Edit Email Address...</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowPasswordModal(true)
                        setShowOverflowMenu(false)
                      }} 
                      className="overflow-menu-item"
                    >
                      <span className="material-symbols-rounded">lock</span>
                      <span>Change Password...</span>
                    </button>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button onClick={handleSignOut} className="overflow-menu-item">
                      <span className="material-symbols-rounded">logout</span>
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

      {/* Modals */}
      <EditDisplayNameModal 
        isOpen={showDisplayNameModal} 
        onClose={() => setShowDisplayNameModal(false)} 
      />
      <EditEmailModal 
        isOpen={showEmailModal} 
        onClose={() => setShowEmailModal(false)} 
      />
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </div>
  )
}
