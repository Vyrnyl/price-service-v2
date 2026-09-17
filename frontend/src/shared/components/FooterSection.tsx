import Link from "next/link";
import { MdOpenInNew } from "react-icons/md";
import Logo from "@/shared/components/Logo";

export default function FooterSection({ offsetForSidebar = true }: { offsetForSidebar?: boolean }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`flex ${
        // The drawer is `fixed`, so it occupies no layout space and pushes
        // nothing aside -- `ml-72` is a manual compensation, and so it may only
        // apply when the drawer is actually rendered (it is not, on /login).
        //
        // Note there is no `w-full` here. A percentage width resolves against
        // the *parent*, which spans the whole viewport, so `w-full` plus the
        // margin would push the footer 18rem past the right edge and cause
        // horizontal scroll. As a block-level flex container it already fills
        // whatever the margin leaves, which is exactly the content width.
        offsetForSidebar ? "lg:ml-72" : ""
      } flex-col items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-highest px-container-margin-mobile py-stack-lg md:flex-row md:px-container-margin-desktop`}
    >
      <div className="flex flex-col gap-2 text-center md:text-left">
        <div className="flex items-center justify-center gap-2.5 md:justify-start">
          <Logo className="shrink-0" size={24} />
          <h2 className="font-sans text-h3-desktop font-bold text-on-surface">PresyoSerbisyo</h2>
        </div>
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
