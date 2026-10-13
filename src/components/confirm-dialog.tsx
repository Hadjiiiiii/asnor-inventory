"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const OFFLINE = "We couldn't reach the server. Nothing was changed; check your connection and try again.";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Label while the request runs, e.g. "Deleting...". */
  pendingLabel: string;
  destructive?: boolean;
  /** Resolves to an error message to show in the dialog, or null when the action succeeded. */
  onConfirm: () => Promise<string | null>;
}

/** A confirmation that keeps its error beside the button and cannot be dismissed mid-request. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  // Mounted only while open, so the error and pending state start clean every time.
  if (!props.open) return null;
  return <ConfirmDialogBody {...props} />;
}

function ConfirmDialogBody({
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  function close() {
    if (!inFlight.current) onOpenChange(false);
  }

  async function confirm() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const failure = await onConfirm();
      if (failure) setError(failure);
      else {
        inFlight.current = false;
        onOpenChange(false);
      }
    } catch {
      setError(OFFLINE);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && close()}>
      <DialogContent onClose={close} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">{description}</div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            {/* Focus lands on the safe choice, so a stray Enter never confirms a deletion */}
            <Button type="button" variant="outline" onClick={close} disabled={pending} autoFocus>
              Cancel
            </Button>
            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              onClick={confirm}
              disabled={pending}
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
