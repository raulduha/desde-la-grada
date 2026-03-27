import NavBar from '@/components/ui/NavBar'
import Footer from '@/components/ui/Footer'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </>
  )
}
