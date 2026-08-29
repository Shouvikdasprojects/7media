import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-0">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-9xl md:text-[200px] font-black text-accent/20 leading-none">404</div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 -mt-12">
              Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Sorry, the page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
            <Link
              href="/movies"
              className="px-6 py-3 border border-accent text-accent font-medium rounded-lg hover:bg-accent/10 transition-colors"
            >
              Browse Movies
            </Link>
          </div>

          {/* Decorative */}
          <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto opacity-50">
            <div className="aspect-video bg-secondary rounded-lg"></div>
            <div className="aspect-video bg-secondary rounded-lg"></div>
            <div className="aspect-video bg-secondary rounded-lg"></div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
