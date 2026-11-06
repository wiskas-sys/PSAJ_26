import { About } from "@/components/landing/About";
import { AiDiagnosticSection } from "@/components/landing/AiDiagnosticSection";
import { Contact } from "@/components/landing/Contact";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Gallery } from "@/components/landing/Gallery";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ProcessSteps } from "@/components/landing/ProcessSteps";
import { Services } from "@/components/landing/Services";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyUs } from "@/components/landing/WhyUs";

/**
 * Company profile publik Dian Motor untuk peran Pengunjung.
 * Fitur Konsultasi & Diagnosa Kerusakan Suku Cadang (Bahasa Indonesia, Jawa, Ngapak).
 * Akses internal staf/kasir/owner dilindungi melalui verifikasi di footer.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground" id="atas">
      <Header />
      <main className="flex-1">
        <Hero />
        <AiDiagnosticSection />
        <Services />
        <ProcessSteps />
        <WhyUs />
        <About />
        <Testimonials />
        <Gallery />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
