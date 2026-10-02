"use client";

import { useState } from "react";
import PageShell from "@/shared/components/PageShell";
import Button from "@/shared/components/Button";
import Card from "@/shared/components/Card";
import Badge from "@/shared/components/Badge";
import Modal from "@/shared/components/Modal";
import Alert from "@/shared/components/Alert";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import FormGroup from "@/shared/components/FormGroup";
import Logo from "@/shared/components/Logo";
import { useToast } from "@/shared/components/Toast";
import { SrpHistoryModal } from "@/features/commodity/components/SrpHistoryModal";
import { mockSrpProjection, SAMPLE_SINGLE_SRP_HISTORY, SAMPLE_SRP_HISTORY } from "@/shared/mocks/srp-history.mock";
import type { SrpHistoryEntry } from "@/shared/types/srp-history.types";

type SrpHistoryDemo = "full" | "single" | "empty" | "loading" | "error" | "outlookLoading" | "outlookError";

const SRP_HISTORY_DEMOS: Record<SrpHistoryDemo, { label: string; entries: SrpHistoryEntry[] }> = {
  full: { label: "With revisions", entries: SAMPLE_SRP_HISTORY },
  single: { label: "Single SRP", entries: SAMPLE_SINGLE_SRP_HISTORY },
  empty: { label: "Empty", entries: [] },
  loading: { label: "Loading", entries: [] },
  error: { label: "Error", entries: [] },
  outlookLoading: { label: "Outlook loading", entries: SAMPLE_SRP_HISTORY },
  outlookError: { label: "Outlook error", entries: SAMPLE_SRP_HISTORY },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-sans text-h2-desktop text-on-surface">{title}</h2>
      <Card className="p-6">{children}</Card>
    </section>
  );
}

export default function ComponentGalleryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [srpDemo, setSrpDemo] = useState<SrpHistoryDemo | null>(null);
  const [galleryNow] = useState(() => Date.now());
  const { showToast } = useToast();

  return (
    <PageShell className="space-y-10 px-container-margin-mobile py-stack-lg md:px-container-margin-desktop">
      <div>
        <h1 className="font-sans text-h1-mobile text-on-surface md:font-sans md:text-h1-desktop">
          Component Gallery
        </h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Every shared UI primitive in every variant — the reference for Phase 1.1.
        </p>
      </div>

      <Section title="Logo">
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col items-center gap-2">
            <Logo size={56} />
            <span className="font-sans text-body-sm text-on-surface-variant">primary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl bg-primary p-3">
              <Logo size={56} variant="inverse" />
            </div>
            <span className="font-sans text-body-sm text-on-surface-variant">inverse</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo size={56} variant="mono" className="text-on-surface" />
            <span className="font-sans text-body-sm text-on-surface-variant">mono</span>
          </div>
          <div className="flex items-end gap-4">
            {[16, 24, 32, 48].map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Logo size={size} />
                <span className="font-sans text-body-sm text-on-surface-variant">{size}px</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-sans text-h3-desktop text-on-surface">Card title</h3>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              The canonical card recipe — rounded-xl border, lowest-container background, standard shadow.
            </p>
          </Card>
          <Card className="animate-stats p-6">
            <p className="text-label-caps font-sans uppercase text-on-surface-variant">Stat card</p>
            <p className="mt-1 text-price-display font-bold text-on-surface">₱ 45.00</p>
          </Card>
        </div>
      </Section>

      <Section title="Alerts">
        <div className="space-y-3">
          <Alert variant="neutral">This is a neutral informational alert.</Alert>
          <Alert variant="error">This is an error alert — something went wrong.</Alert>
        </div>
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => showToast("Saved successfully.", "success")}>
            Show success toast
          </Button>
          <Button variant="secondary" onClick={() => showToast("Heads up — here's an update.", "primary")}>
            Show primary toast
          </Button>
          <Button variant="danger" onClick={() => showToast("Something went wrong.", "error")}>
            Show error toast
          </Button>
          <Button variant="secondary" onClick={() => showToast("Heads up — this is informational.", "neutral")}>
            Show neutral toast
          </Button>
        </div>
      </Section>

      <Section title="Modal">
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example Modal"
          description="Replaces the 5 duplicated overlay copies across the app."
        >
          <p className="text-body-sm text-on-surface-variant">
            Press Escape, click outside, or use the close button to dismiss.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </Modal>
      </Section>

      <Section title="Form fields">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormGroup label="Full Name" htmlFor="gallery-name">
            <Input
              id="gallery-name"
              placeholder="Jane Dela Cruz"
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
            />
          </FormGroup>
          <FormGroup label="Full Name (error)" htmlFor="gallery-name-error" error="Name is required">
            <Input id="gallery-name-error" placeholder="Jane Dela Cruz" hasError />
          </FormGroup>
          <FormGroup label="Role" htmlFor="gallery-role">
            <Select id="gallery-role" defaultValue="OFFICER">
              <option value="ADMIN">Administrator</option>
              <option value="OFFICER">Officer</option>
            </Select>
          </FormGroup>
          <FormGroup label="Role (error)" htmlFor="gallery-role-error" error="Select a role">
            <Select id="gallery-role-error" hasError defaultValue="">
              <option value="" disabled>
                Select role
              </option>
              <option value="ADMIN">Administrator</option>
              <option value="OFFICER">Officer</option>
            </Select>
          </FormGroup>
        </div>
      </Section>

      <Section title="SRP history modal">
        <p className="mb-4 text-body-sm text-on-surface-variant">
          Every state of the pop-up opened from the Commodity List. Mock data only.
        </p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(SRP_HISTORY_DEMOS) as SrpHistoryDemo[]).map((demo) => (
            <Button key={demo} variant="secondary" size="sm" onClick={() => setSrpDemo(demo)}>
              {SRP_HISTORY_DEMOS[demo].label}
            </Button>
          ))}
        </div>
        <SrpHistoryModal
          open={srpDemo !== null}
          onClose={() => setSrpDemo(null)}
          commodityName="Rice, Well-milled (per kg)"
          category="Rice"
          entries={srpDemo ? SRP_HISTORY_DEMOS[srpDemo].entries : []}
          isLoading={srpDemo === "loading"}
          error={srpDemo === "error" ? "Unable to load the SRP history. Please try again." : null}
          onRetry={() => setSrpDemo("full")}
          projection={{
            projection: srpDemo ? mockSrpProjection(SRP_HISTORY_DEMOS[srpDemo].entries, galleryNow) : null,
            isLoading: srpDemo === "outlookLoading",
            error: srpDemo === "outlookError" ? "Unable to load the SRP outlook. Please try again." : null,
            onRetry: () => setSrpDemo("full"),
          }}
        />
      </Section>
    </PageShell>
  );
}
