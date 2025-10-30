import { useState } from 'react'
import { useAuthContext } from '../utils/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthContext()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#8338EC] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-12 w-full max-w-md">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/1d604418de2df6ec7ad2d703a6dad53e7d94b206?width=332"
          alt="dibs!"
          className="w-40 h-auto"
        />

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-600 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 border border-gray-300 border-opacity-30 rounded-lg focus:ring-2 focus:ring-[#8338EC] focus:border-transparent outline-none transition placeholder:text-gray-400 placeholder:opacity-60"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-600 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 border border-gray-300 border-opacity-30 rounded-lg focus:ring-2 focus:ring-[#8338EC] focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8338EC] hover:bg-[#6619DA] text-white font-semibold py-3.5 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
