# GreenShift Project Context

## Stack
- React 19 + TypeScript
- TanStack Router (file-based)
- Tailwind CSS v4
- shadcn/ui components
- Vite 8

## Project Structure
```
src/
  features/
    home/
      components/
        atoms/
          FloatingPill.tsx    — animated pill (glassmorphism)
          GlassCard.tsx       — glassmorphism container
        molecules/
          DashboardShowcase.tsx — dashboard with glass + pills
        organisms/
          HeroSection.tsx     — full hero with parallax
          CaraKerjaSection.tsx — how it works section
  components/
    layout/
      Header.tsx              — transparent on home, sticky on others
      Footer.tsx
    ui/                       — shadcn primitives
```

## Design Decisions
- Hero: parallax with Green 1 (foreground) and Green 2 (background)
- Dashboard: glassmorphism (backdrop-blur-xl, bg-white/5)
- Floating pills: glassmorphism, animated, positioned outside dashboard
- Cara Kerja: horizontal timeline, glassmorphism cards, white background
- Fade-to-white bridge between hero and Cara Kerja sections
- Fraunces for display, IBM Plex Sans for headings, DM Sans for body

## Assets (public/)
- logo-white.png — white logo for transparent header
- logo-long.svg — full logo
- green 1.png — foreground grass/hills
- green 2.png — background sky
- CompanyProjectSubmissionDashboard.png — dashboard screenshot

## Active Design Patterns
- Glassmorphism: `backdrop-blur-xl`, `bg-white/5` or `bg-[#014A2F]/90`, `border-white/10`
- Parallax: scroll-based transforms on background layers
- Floating animations: custom keyframes in styles.css
- Buttons: shadcn Button with `rounded-[10px]`, `cursor-pointer`

## Color Palette
- Primary: #00712D (green)
- Accent: #03442C (dark green)
- Light: #F8F9F7
- Description box: #014A2F
