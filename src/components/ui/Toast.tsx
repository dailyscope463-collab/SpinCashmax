import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

type LogType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: LogType;
}

interface ToastContextType {
  toast: (message: string, type?: LogType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: LogType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md pointer-events-auto",
                t.type === "success" && "bg-green-500/10 border-green-500/20 text-green-500",
                t.type === "error" && "bg-red-500/10 border-red-500/20 text-red-500",
                t.type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                t.type === "warning" && "bg-orange-500/10 border-orange-500/20 text-orange-500"
              )}
            >
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
              {t.type === "error" && <XCircle className="w-5 h-5 flex-shrink-0" />}
              {t.type === "info" && <Info className="w-5 h-5 flex-shrink-0" />}
              {t.type === "warning" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <p className="text-sm font-medium">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
