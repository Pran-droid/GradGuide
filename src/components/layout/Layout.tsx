import { Header } from "./Header"
import { Footer } from "./Footer"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
