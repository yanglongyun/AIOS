import { useEffect, useRef, useCallback, useState, type ReactNode } from 'react'
import {
  MessageCircle,
  ListChecks,
  NotebookPen,
  Wallet,
  BookOpen,
  Rss,
  TrendingUp,
  Rocket,
  Layers,
  Shield,
  Sparkles,
  Bot,
  Brain,
  Github,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from './i18n'

/* ── Smooth scroll helper ── */
function smoothScrollTo(href: string) {
  if (!href.startsWith('#')) return
  const el = document.getElementById(href.slice(1))
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

/* ── Smooth anchor link ── */
function SmoothA({
  href,
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (href?.startsWith('#')) {
        e.preventDefault()
        smoothScrollTo(href)
      }
    },
    [href],
  )
  return (
    <a href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}

/* ── Scroll Reveal ── */
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
      },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}s, transform 0.7s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

/* ── Data ── */
const iconProps = { className: 'w-6 h-6 text-muted-foreground', strokeWidth: 1.5 } as const

const featureIcons: LucideIcon[] = [
  MessageCircle,
  Layers,
  Shield,
  Sparkles,
  Bot,
  Brain,
]

const appIcons: LucideIcon[] = [
  MessageCircle,
  ListChecks,
  NotebookPen,
  Wallet,
  BookOpen,
  Rss,
  TrendingUp,
  Rocket,
]

const installCmd = `git clone https://github.com/valueriver/aios.git
cd aios
npm install
npm run dev`

const serif = { fontFamily: "'Instrument Serif', serif" }

/* ── App ── */
export default function App() {
  const { t } = useI18n()
  const features = t.featuresSection.items.map((item, index) => ({
    ...item,
    icon: featureIcons[index],
  }))
  const apps = t.appsSection.items.map((item, index) => ({
    ...item,
    icon: appIcons[index],
  }))

  return (
    <div className="bg-background text-foreground font-body">
      {/* ═══════════════════ Hero ═══════════════════ */}
      <div className="relative min-h-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>

        {/* Bottom gradient blend into solid background */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-background z-[1]" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <span className="text-3xl tracking-tight text-foreground" style={serif}>
            AIOS<sup className="text-xs">®</sup>
          </span>
          <div className="hidden md:flex items-center gap-8">
            <SmoothA href="#" className="text-sm text-foreground transition-colors">
              {t.nav.home}
            </SmoothA>
            <SmoothA href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.features}
            </SmoothA>
            <SmoothA href="#apps" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.apps}
            </SmoothA>
            <SmoothA href="#open-source" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.openSource}
            </SmoothA>
            <SmoothA href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.nav.docs}
            </SmoothA>
          </div>
          <SmoothA
            href="#open-source"
            className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03] transition-transform cursor-pointer"
          >
            {t.nav.begin}
          </SmoothA>
        </nav>

        {/* Hero Content */}
        <section className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-40">
          <h1
            className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal animate-fade-rise"
            style={serif}
          >
            {t.hero.line1}{' '}
            <em className="not-italic text-muted-foreground">{t.hero.highlight1}</em>{' '}
            {t.hero.line2}{' '}
            <em className="not-italic text-muted-foreground">{t.hero.highlight2}</em>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
            {t.hero.desc}
          </p>
          <SmoothA
            href="#open-source"
            className="liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-12 hover:scale-[1.03] transition-transform cursor-pointer animate-fade-rise-delay-2"
          >
            {t.hero.cta}
          </SmoothA>
        </section>
      </div>

      {/* ═══════════════════ Features ═══════════════════ */}
      <section id="features" className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[-1.5px] text-center font-normal"
              style={serif}
            >
              {t.featuresSection.title1}{' '}
              <span className="text-muted-foreground">{t.featuresSection.title2}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto text-center mt-6 leading-relaxed">
              {t.featuresSection.desc}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={0.1 + i * 0.08} className="h-full">
                <div className="liquid-glass rounded-2xl p-8 h-full">
                  <f.icon {...iconProps} className={`${iconProps.className} mb-4`} />
                  <h3 className="text-lg font-medium text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ Apps ═══════════════════ */}
      <section id="apps" className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[-1.5px] text-center font-normal"
              style={serif}
            >
              {t.appsSection.title1}{' '}
              <span className="text-muted-foreground">{t.appsSection.title2}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto text-center mt-6 leading-relaxed">
              {t.appsSection.desc}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
            {apps.map((app, i) => (
              <Reveal key={app.name} delay={0.1 + i * 0.06} className="h-full">
                <div className="liquid-glass rounded-2xl p-6 h-full hover:scale-[1.02] transition-transform cursor-default">
                  <app.icon {...iconProps} />
                  <h3 className="text-base font-medium text-foreground mt-3 mb-1">
                    {app.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{app.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ Open Source ═══════════════════ */}
      <section id="open-source" className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[-1.5px] font-normal"
              style={serif}
            >
              {t.openSourceSection.title1}{' '}
              <span className="text-muted-foreground">{t.openSourceSection.title2}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mt-6 leading-relaxed">
              {t.openSourceSection.desc}
            </p>
          </Reveal>

          {/* Terminal */}
          <Reveal delay={0.2}>
            <div className="liquid-glass rounded-2xl mt-6 text-left overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <span className="w-3 h-3 rounded-full bg-white/10" />
                <span className="w-3 h-3 rounded-full bg-white/10" />
                <span className="w-3 h-3 rounded-full bg-white/10" />
                <span className="text-xs text-muted-foreground ml-2">{t.openSourceSection.terminal}</span>
              </div>
              <div className="p-5 font-mono text-sm text-foreground/90 overflow-x-auto whitespace-pre-wrap">
                <span className="text-muted-foreground select-none">$ </span>
                {installCmd}
              </div>
            </div>
          </Reveal>

          {/* GitHub CTA */}
          <Reveal delay={0.3}>
            <a
              href="https://github.com/valueriver/aios"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass rounded-full px-8 py-4 text-base text-foreground hover:scale-[1.03] transition-transform cursor-pointer inline-flex items-center gap-3 mt-10"
            >
              <Github className="w-5 h-5" />
              {t.openSourceSection.github}
              <ArrowRight className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════ Docs ═══════════════════ */}
      <section id="docs" className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[-1.5px] text-center font-normal"
              style={serif}
            >
              {t.docsSection.title1} <span className="text-muted-foreground">{t.docsSection.title2}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto text-center mt-6 leading-relaxed">
              {t.docsSection.desc}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {t.docsSection.steps.map((item, i) => (
              <Reveal key={item.step} delay={0.15 + i * 0.1} className="h-full">
                <div className="liquid-glass rounded-2xl p-8 h-full">
                  <span className="text-sm font-mono text-muted-foreground">{item.step}</span>
                  <h3
                    className="text-2xl sm:text-3xl font-normal text-foreground mt-3 mb-3"
                    style={serif}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA Band ═══════════════════ */}
      <section className="py-24 sm:py-32 px-6 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2
              className="text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[-1.5px] font-normal"
              style={serif}
            >
              {t.ctaSection.title1}{' '}
              <span className="text-muted-foreground">{t.ctaSection.title2}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mt-6 leading-relaxed">
              {t.ctaSection.desc}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <SmoothA
              href="#open-source"
              className="liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-10 hover:scale-[1.03] transition-transform cursor-pointer inline-block"
            >
              {t.ctaSection.cta}
            </SmoothA>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════ Footer ═══════════════════ */}
      <footer className="py-16 px-6 sm:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="text-2xl tracking-tight text-foreground" style={serif}>
            AIOS<sup className="text-[10px]">®</sup>
          </span>
          <p className="text-sm text-muted-foreground mt-3">
            {t.footer.tagline}
          </p>
          <div className="flex items-center gap-6 mt-6">
            <SmoothA href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.footer.features}
            </SmoothA>
            <SmoothA href="#apps" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.footer.apps}
            </SmoothA>
            <SmoothA href="#open-source" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.footer.install}
            </SmoothA>
            <a
              href="https://github.com/valueriver/aios"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.github}
            </a>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-8">
            &copy; {new Date().getFullYear()} AIOS. {t.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  )
}
