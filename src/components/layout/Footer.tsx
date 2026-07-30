export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border px-4 py-8 text-sm text-muted-foreground">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 sm:flex-row">
        <small>&copy; {year} GreenShift. All rights reserved.</small>
        <span>Platform MRV untuk Pembiayaan Hijau</span>
      </div>
    </footer>
  )
}
