import Link from "next/link";
import { MdOpenInNew } from "react-icons/md";

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex w-full lg:ml-72 lg:max-w-[calc(100%-18rem)] flex-col items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-highest px-container-margin-mobile py-stack-lg md:flex-row md:px-container-margin-desktop">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h2 className="font-sans text-h3-desktop font-bold text-on-surface">PresyoSerbisyo</h2>
        <p className="font-sans text-body-sm text-on-surface-variant">
          © {currentYear} DTI Catanduanes. Government of the Philippines.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <Link href="/report-a-concern" className="font-sans text-on-surface-variant transition-colors hover:text-primary">
          Report a Concern
        </Link>
        <a
          href="https://www.dti.gov.ph/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-sans text-on-surface-variant transition-colors hover:text-primary"
        >
          Official DTI Website
          <MdOpenInNew size={14} />
        </a>
      </div>
    </footer>
  );
}
