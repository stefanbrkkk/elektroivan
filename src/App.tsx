import { site } from './config/site';
import { SmoothScroll } from './components/SmoothScroll';
import { MainLine } from './motion/MainLine';
import { IntroReveal } from './sections/IntroReveal';
import { Nav } from './sections/Nav';
import { Hero } from './sections/Hero';
import { Trust } from './sections/Trust';
import { Anatomy } from './sections/Anatomy';
import { Services } from './sections/Services';
import { Process } from './sections/Process';
import { BeforeAfter } from './sections/BeforeAfter';
import { Testimonials } from './sections/Testimonials';
import { Faq } from './sections/Faq';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';

// Section order, ids and data-testid values are locked in docs/CONTRACT.md.
export function App() {
  return (
    <SmoothScroll>
      <a href="#sadrzaj" data-testid="skip-link" className="skip-link">
        {site.nav.skipLink}
      </a>
      <MainLine />
      <IntroReveal />
      <Nav />
      <main id="sadrzaj" className="pt-16">
        <Hero />
        <Trust />
        <Anatomy />
        <Services />
        <Process />
        <BeforeAfter />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
