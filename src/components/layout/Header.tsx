export function Header() {
  return (
    <header className="w-full py-6 px-4 md:px-8 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold font-sans">
            Education Loan Assessment
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#" className="text-foreground hover:text-primary transition-colors">Home</a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">Start Assessment</a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">Help</a>
        </nav>
      </div>
    </header>
  )
}
