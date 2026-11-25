import About from "@/components/About";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Work from "@/components/Work";

export default function Home() {
  return (
    // clip, not hidden: nothing can widen the page sideways, and sticky/scroll still behave
    <main className="overflow-x-clip">
      <Hero />
      <Work />
      <About />
      <Footer />
    </main>
  );
}
