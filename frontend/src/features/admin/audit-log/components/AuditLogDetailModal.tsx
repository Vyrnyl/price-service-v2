"use client";

import Modal from "@/shared/components/Modal";
import Badge from "@/shared/components/Badge";
import { ACTION_BADGE_VARIANT, ACTION_LABELS } from "../constants/audit-log.constants";
import type { AuditLogEntry } from "../types/audit-log.types";

type AuditLogDetailModalProps = {
  entry: AuditLogEntry | null;
  onClose: () => void;
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "full",
    timeStyle: "medium",
  });
}

export default function AuditLogDetailModal({ entry, onClose }: AuditLogDetailModalProps) {
  return (
    <Modal open={entry !== null} onClose={onClose} title="Audit Log Entry" maxWidth="max-w-lg">
      {entry ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-label-caps uppercase text-outline">Action</span>
            <Badge variant={ACTION_BADGE_VARIANT[entry.action]}>{ACTION_LABELS[entry.action]}</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-label-caps uppercase text-outline">Actor</p>
            <p className="text-body-sm font-semibold text-on-surface">{entry.actorName}</p>
            <p className="text-body-xs text-on-surface-variant">
              {entry.actorEmail} · {entry.actorRole}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-label-caps uppercase text-outline">Timestamp</p>
            <p className="text-body-sm text-on-surface">{formatTimestamp(entry.createdAt)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-label-caps uppercase text-outline">Target</p>
            <p className="break-all font-mono text-body-sm text-on-surface">{entry.targetId ?? "None"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-label-caps uppercase text-outline">Details</p>
            {entry.metadata ? (
              <pre className="overflow-x-auto rounded-lg bg-surface-container-low p-3 text-body-xs text-on-surface-variant">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-body-sm text-on-surface-variant">No additional details recorded.</p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
