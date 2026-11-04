import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div id="top" className="site-shell">
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
