import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white px-container-margin-mobile py-16 md:px-container-margin-desktop md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/10 px-3 py-1 font-label-caps text-label-caps text-primary">
           <MdVerified />
            OFFICIAL DTI MONITORING SYSTEM
          </div>
          <h2 className="font-h1-desktop text-h1-desktop leading-tight text-on-surface">
            Monitor Commodity Prices in <span className="text-primary">Real-Time</span>
          </h2>
          <p className="max-w-lg font-body-lg text-body-lg text-on-surface-variant">
            Empowering consumers and retailers in Catanduanes with transparent Suggested Retail Price (SRP) monitoring and market trend forecasting.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/commodity-list"
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-h3-desktop text-h3-desktop text-on-primary transition-all hover:shadow-lg active:scale-95"
            >
              View Commodity Prices
              <FaArrowRight />
            </Link>
          </div>
        </div>
        <div className="w-full max-w-lg flex-1">
          <div className="relative overflow-hidden rounded-3xl bg-surface-container-low p-4 data-card-shadow">
            <img
              alt="Data Visualization"
              className="h-auto w-full rounded-2xl object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4l2XNNWDJVMlZ3nduFfQ7vc8UXlsMAfU6KvCLyE3h1LsI1j-NkhybqjK5cSv7_RgnqELg35go9bgGzoRLM98w3MGd4x79ku1eSiG9S0hs0xu_aOgq05_yZ28lvJyjCx72F5VBW0nGUz8I4GgJ-Wy6U2agjumOA_akrx_zs2H6I7GpXOq4tKH1vBtBCiHsHb4VESVPerb1W63JY527ndOmhcIA5yB7XPFJnzy4h4xRQzVZNe2d9epOcB7nJCGBFWjS0zA8SP9s-VI"
            />
          </div>
        </div>
      </div>
      <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-secondary/5 blur-3xl"></div>
    </section>
  );
}
