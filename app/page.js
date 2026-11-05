import { About } from "@/components/landing/About";
import { Contact } from "@/components/landing/Contact";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Gallery } from "@/components/landing/Gallery";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ProcessSteps } from "@/components/landing/ProcessSteps";
import { Services } from "@/components/landing/Services";
import { StatsBar } from "@/components/landing/StatsBar";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyUs } from "@/components/landing/WhyUs";

/**
 * Company profile publik Dian Motor untuk peran Pengunjung.
 * Akses internal staf/kasir/owner dilindungi melalui verifikasi 2 pola di footer.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground" id="atas">
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <About />
        <Services />
        <ProcessSteps />
        <WhyUs />
        <Testimonials />
        <Gallery />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
