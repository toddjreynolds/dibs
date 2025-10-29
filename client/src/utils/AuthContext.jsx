import { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'

const AuthContext = createContext({})

export const useAuthContext = () => {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

