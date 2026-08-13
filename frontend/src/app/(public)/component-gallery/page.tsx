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
import { useToast } from "@/shared/components/Toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-h2-desktop text-h2-desktop text-on-surface">{title}</h2>
      <Card className="p-6">{children}</Card>
    </section>
  );
}

export default function ComponentGalleryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const { showToast } = useToast();

  return (
    <PageShell className="space-y-10 px-container-margin-mobile py-stack-lg md:px-container-margin-desktop">
      <div>
        <h1 className="font-h1-mobile text-h1-mobile text-on-surface md:font-h1-desktop md:text-h1-desktop">
          Component Gallery
        </h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Every shared UI primitive in every variant — the reference for Phase 1.1.
        </p>
      </div>

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
          <Badge variant="neutral">Neutral</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-h3-desktop text-h3-desktop text-on-surface">Card title</h3>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              The canonical card recipe — rounded-xl border, lowest-container background, standard shadow.
            </p>
          </Card>
          <Card className="animate-stats p-6">
            <p className="text-label-caps font-label-caps uppercase text-on-surface-variant">Stat card</p>
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
          <Button variant="primary" onClick={() => showToast("Saved successfully.", "primary")}>
            Show success toast
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
    </PageShell>
  );
}
