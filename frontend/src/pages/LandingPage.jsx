/**
 * pages/LandingPage.jsx
 * --------------------------------------------------
 * Public landing page composed of all marketing sections.
 *
 * Components:
 *   Navbar → Hero → Stats → Features → HowItWorks → Download → Footer
 *
 * Accessible at: / (root)
 * --------------------------------------------------
 */

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Download from "../components/Download";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Download />
      <Footer />
    </div>
  );
}
