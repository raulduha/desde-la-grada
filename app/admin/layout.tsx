import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import AdminShell from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin — DLG',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isLoginPage = pathname === '/admin/login' || pathname.endsWith('/admin/login')

  if (isLoginPage) return <>{children}</>

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <>{children}</>

  return (
    <AdminShell email={user.email ?? ''}>
      {children}
    </AdminShell>
  )
}
