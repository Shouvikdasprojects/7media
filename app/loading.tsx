import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { TitleDetailsSkeleton } from '@/components/title-skeleton'

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <TitleDetailsSkeleton />
      </main>
      <Footer />
    </div>
  )
}
