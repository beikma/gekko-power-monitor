import { useCallback } from "react";
import { useToastContext, type ToasterToast } from "@/components/ui/toast-provider";

export function useToast() {
  const context = useToastContext();

  const toast = useCallback((props: Omit<ToasterToast, "id">) => {
    const id = context.addToast(props);
    return {
      id,
      dismiss: () => context.dismissToast(id),
      update: (newProps: Partial<ToasterToast>) => {
        // For simplicity, we'll just dismiss and create a new toast
        context.dismissToast(id);
        return context.addToast({ ...props, ...newProps });
      },
    };
  }, [context]);

  return {
    toasts: context.toasts,
    toast,
    dismiss: context.dismissToast,
  };
}

// Export a standalone toast function for convenience
export const toast = (props: Omit<ToasterToast, "id">) => {
  console.warn("toast() called outside ToastProvider context. Use useToast().toast() instead.");
};