import NavBar from '@/components/ui/NavBar'
import Footer from '@/components/ui/Footer'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
