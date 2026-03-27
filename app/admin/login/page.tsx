'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminLoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const origin = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=/admin`,
      },
    })
  }

  return (
    <div className="bg-[#0e0e0e] min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="text-3xl font-black uppercase tracking-widest text-white hover:text-[#00FF00] transition-colors"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            DLG
          </Link>
          <div className="mt-6 inline-block border border-[#00FF00]/30 px-4 py-1">
            <p className="text-[#00FF00] text-xs tracking-[0.3em] uppercase font-bold">
              Admin Panel
            </p>
          </div>
          <h1
            className="text-2xl font-black uppercase mt-4 tracking-wide"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Acceso Restringido
          </h1>
          <p className="text-white/30 text-sm mt-2">
            Solo para administradores de DLG
          </p>
        </div>

        {/* Divider */}
        <div className="border border-white/10 p-8">
          <p className="text-white/50 text-xs uppercase tracking-widest text-center mb-6">
            Autentícate con tu cuenta Google autorizada
          </p>
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-white/30 text-white font-bold uppercase tracking-wider py-4 px-4 text-sm hover:border-[#00FF00] hover:text-[#00FF00] transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-white/20 text-xs uppercase tracking-widest hover:text-white/50 transition-colors"
          >
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  )
}
