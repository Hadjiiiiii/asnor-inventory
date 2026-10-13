"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 4;
// A failure has to outlive a glance away from the screen; a confirmation does not.
const DURATION_MS: Record<ToastType, number> = { success: 4000, info: 4000, error: 8000 };

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const addToast = React.useCallback((message: string, type: ToastType = "info") => {
    setToasts((prev) => {
      // A repeated click or retry must not stack the same message.
      if (prev.some((t) => t.message === message && t.type === type)) return prev;
      const id = String(nextId.current++);
      return [...prev, { id, message, type }].slice(-MAX_TOASTS);
    });
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Always mounted so screen readers are already listening when a message arrives */}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [paused, setPaused] = React.useState(false);
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Hovering or focusing a toast stops its clock so there is time to read it.
  React.useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onCloseRef.current(), DURATION_MS[toast.type]);
    return () => clearTimeout(timer);
  }, [paused, toast.type]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />,
    info: <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />,
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg animate-in slide-in-from-right-full",
        "sm:min-w-[300px] max-w-[400px]"
      )}
    >
      {icons[toast.type]}
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded-sm opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
