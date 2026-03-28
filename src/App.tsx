import { Link } from "react-router-dom";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import BentoGridThirdDemo from "@/components/bento-grid-demo-3";
import FeaturesSectionDemo from "@/components/features-section-demo-1";

export default function App() {
  return (
    <div className="bg-[#060d1f]">

      {/* ── Hero with Ripple ── */}
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
        <BackgroundRippleEffect cellSize={80} rows={12} cols={20} />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            Interactive Background{" "}
            <span className="text-blue-400">Ripple Effect</span>
          </h1>
          <p className="max-w-lg text-base text-neutral-400 md:text-lg">
            Hover over the boxes and click to trigger a ripple. Built for hero
            sections and call-to-action backgrounds.
          </p>
          <Link
            to="/enter"
            className="mt-2 inline-flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/10 px-8 py-3.5 text-base font-semibold text-blue-300 backdrop-blur-sm transition hover:bg-blue-500/20 hover:text-white hover:border-blue-400 active:scale-95"
          >
            Enter <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* ── Scroll Animation ── */}
      <ContainerScroll
        titleComponent={
          <h1 className="text-4xl font-semibold text-white">
            Unleash the power of <br />
            <span className="mt-1 block text-4xl font-bold leading-none md:text-[6rem]">
              Scroll Animations
            </span>
          </h1>
        }
      >
        <img
          src="/dashboard.png"
          alt="AI Financial Dashboard"
          height={720}
          width={1400}
          className="mx-auto h-full rounded-2xl object-cover object-left-top"
          draggable={false}
        />
      </ContainerScroll>

      {/* ── Bento Grid ── */}
      <section className="px-4 py-20">
        <BentoGridThirdDemo />
      </section>

      {/* ── Features Grid ── */}
      <section className="px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Everything you need
          </h2>
          <p className="mt-3 text-neutral-400">
            A full suite of tools to power your workflow.
          </p>
        </div>
        <FeaturesSectionDemo />
      </section>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-white/10 px-6 py-12 text-neutral-500">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="text-lg font-bold text-white">ai-shit</span>
            <span className="text-sm">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">Blog</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>

          {/* Tagline */}
          <p className="text-sm">
            Built with{" "}
            <span className="text-blue-400">Tailwind v4</span>{" "}
            &amp;{" "}
            <span className="text-blue-400">shadcn/ui</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
