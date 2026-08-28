import Link from "next/link";
import { MdInfoOutline, MdOutlineReportProblem, MdPriceCheck } from "react-icons/md";
import Badge from "./Badge";
import Card from "./Card";

interface SrpExplainerCardProps {
  className?: string;
  showReportLink?: boolean;
}

export default function SrpExplainerCard({ className = "", showReportLink = true }: SrpExplainerCardProps) {
  return (
    <Card className={`p-6 md:p-8 ${className}`.trim()}>
      <h3 className="font-sans text-h3-desktop text-on-surface">Understanding SRP</h3>
      <p className="mt-1 font-sans text-sm text-on-surface-variant">
        A plain-language guide to what these prices mean and what to do if something looks wrong.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div className="flex gap-3">
          <MdPriceCheck className="mt-0.5 shrink-0 text-primary" size={22} />
          <div>
            <p className="font-sans text-sm font-semibold text-on-surface">What is an SRP?</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              The Suggested Retail Price is the maximum price DTI recommends for a commodity, based on production and
              distribution costs.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <MdInfoOutline className="mt-0.5 shrink-0 text-primary" size={22} />
          <div>
            <p className="font-sans text-sm font-semibold text-on-surface">
              What does <Badge variant="error">Above SRP</Badge> mean?
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              A store is charging more than the recommended price for that commodity — a pricing concern DTI
              Catanduanes tracks and can act on.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <MdOutlineReportProblem className="mt-0.5 shrink-0 text-primary" size={22} />
          <div>
            <p className="font-sans text-sm font-semibold text-on-surface">Noticed a violation?</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              You can report it directly to DTI Consumer Care.
              {showReportLink ? (
                <>
                  {" "}
                  <Link href="/report-a-concern" className="font-semibold text-primary hover:underline">
                    Learn how →
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
