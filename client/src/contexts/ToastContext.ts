import { createContext, useContext } from "react";

export interface Toast {
  id: number;
  title?: string;
  message: string;
  type?: "info" | "success" | "error";
}

export interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return ctx;
}