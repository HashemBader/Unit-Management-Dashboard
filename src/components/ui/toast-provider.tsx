
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useContext, createContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProviderProps {
  children: ReactNode;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: ToastProviderProps) {
  const { toast } = useToast();

  const showToast = (message: string, type: ToastType = "info", duration: number = 3000) => {
    let variant: "default" | "destructive" = "default";
    
    if (type === "error") {
      variant = "destructive";
    }
    
    toast({
      description: message,
      variant: variant,
      duration: duration,
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastMessage() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error("useToastMessage must be used within a ToastProvider");
  }
  
  return context;
}

// Example toast button component
export function ToastButton() {
  const { showToast } = useToastMessage();
  
  return (
    <div className="flex gap-2">
      <Button onClick={() => showToast("Success message", "success")}>Success Toast</Button>
      <Button onClick={() => showToast("Error message", "error")}>Error Toast</Button>
      <Button onClick={() => showToast("Warning message", "warning")}>Warning Toast</Button>
      <Button onClick={() => showToast("Info message", "info")}>Info Toast</Button>
    </div>
  );
}
