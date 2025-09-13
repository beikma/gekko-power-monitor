import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
};

type ToastContextType = {
  toasts: ToasterToast[];
  addToast: (toast: Omit<ToasterToast, "id">) => string;
  dismissToast: (toastId?: string) => void;
  removeToast: (toastId: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

let toastCount = 0;

function generateId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const addToast = useCallback((toast: Omit<ToasterToast, "id">) => {
    const id = generateId();
    const newToast: ToasterToast = {
      ...toast,
      id,
      open: true,
    };

    setToasts((prevToasts) => [newToast, ...prevToasts].slice(0, TOAST_LIMIT));

    // Auto-dismiss after delay
    setTimeout(() => {
      removeToast(id);
    }, TOAST_REMOVE_DELAY);

    return id;
  }, []);

  const dismissToast = useCallback((toastId?: string) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        !toastId || toast.id === toastId
          ? { ...toast, open: false }
          : toast
      )
    );
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}