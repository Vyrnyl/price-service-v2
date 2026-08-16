import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-surface-container-lowest px-container-margin-mobile py-16 md:px-container-margin-desktop md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/10 px-3 py-1 font-sans text-label-caps text-primary">
           <MdVerified />
            OFFICIAL DTI MONITORING SYSTEM
          </div>
          <h2 className="font-sans text-h1-desktop leading-tight text-on-surface">
            Monitor Commodity Prices in <span className="text-primary">Real-Time</span>
          </h2>
          <p className="max-w-lg font-sans text-body-lg text-on-surface-variant">
            Empowering consumers and retailers in Catanduanes with transparent Suggested Retail Price (SRP) monitoring and market trend forecasting.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/commodity-list"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-sans text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              View Commodity Prices
              <FaArrowRight />
            </Link>
          </div>
        </div>
        <div className="w-full max-w-lg flex-1">
          <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-4 data-card-shadow">
            <img
              alt="Rice being measured at a market stall, one of the commodities DTI Catanduanes monitors for SRP compliance"
              className="h-auto w-full rounded-lg object-cover"
              src="/images.webp"
            />
          </div>
        </div>
      </div>
      <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-secondary/5 blur-3xl"></div>
    </section>
  );
}
