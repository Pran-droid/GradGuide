const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="w-full py-8 px-4 md:px-8 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {CURRENT_YEAR} Education Loan Assessment Tool. For decision-support only.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Terms</a>
        </div>
      </div>
    </footer>
  )
}
