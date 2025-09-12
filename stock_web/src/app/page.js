import Image from "next/image";
import Home from "@/app/(frontend)/components/HOME";
import Header from "@/app/(frontend)/components/HEADER";
import Footer from "@/app/(frontend)/components/FOOTER";
import About from "@/app/(frontend)/components/about";
import Services from "@/app/(frontend)/components/services";
import RoadMap from "@/app/(frontend)/components/about/RoadMap";
import FAQPage from "@/app/(frontend)/components/FAQ";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#00150f] min-h-screen flex flex-col">
      <Header />
      <Home />
      <About />
      <Services />
      <RoadMap />
      <FAQPage />
      <Footer />
    </div>
  );
}
