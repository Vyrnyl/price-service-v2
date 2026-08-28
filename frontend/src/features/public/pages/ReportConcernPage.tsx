import { MdArrowBack, MdChecklist, MdOpenInNew } from "react-icons/md";
import Link from "next/link";
import Card from "@/shared/components/Card";
import DataProvenanceStrip from "@/shared/components/DataProvenanceStrip";
import PageShell from "@/shared/components/PageShell";
import SrpExplainerCard from "@/shared/components/SrpExplainerCard";

const REPORT_CHECKLIST = [
  "The name and location of the store",
  "The commodity and the price you were charged",
  "The date and approximate time of the purchase or observation",
  "A photo of the price tag or receipt, if you have one",
];

export default function ReportConcernPage() {
  return (
    <PageShell className="p-container-margin-mobile md:p-container-margin-desktop">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/commodity-list"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <MdArrowBack size={16} />
          Back to commodity prices
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">Report a Concern</h1>
          <p className="mt-2 text-sm text-on-surface-variant md:text-base">
            If you believe a store is charging more than the Suggested Retail Price, DTI Catanduanes wants to know.
            Reports are handled by DTI Consumer Care, not by this website.
          </p>
        </div>

        <DataProvenanceStrip />

        <SrpExplainerCard showReportLink={false} />

        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-2">
            <MdChecklist className="text-primary" size={22} />
            <h3 className="font-sans text-h3-desktop text-on-surface">Before you report, have these ready</h3>
          </div>
          <ul className="mt-4 space-y-2">
            {REPORT_CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-on-surface-variant">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col items-start gap-4 bg-primary-container/10 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h3 className="font-sans text-h3-desktop text-on-surface">Ready to report?</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              DTI Consumer Care handles pricing complaints for the whole province. Reach them through the official
              DTI website.
            </p>
          </div>
          <a
            href="https://www.dti.gov.ph/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 font-sans text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            Go to DTI Consumer Care
            <MdOpenInNew size={18} />
          </a>
        </Card>
      </div>
    </PageShell>
  );
}
