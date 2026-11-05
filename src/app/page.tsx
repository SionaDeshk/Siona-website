import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Mission } from "@/components/mission";
import { Pathways } from "@/components/pathways";
import { Vision } from "@/components/vision";
import { FounderNote } from "@/components/founder-note";
import { Contact } from "@/components/contact";
import { ResearchPreview } from "@/components/research-preview";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div id="top" className="site-shell">
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Mission />
        <Pathways />
        <Vision />
        <FounderNote />
        <ResearchPreview />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
