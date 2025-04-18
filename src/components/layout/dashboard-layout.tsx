
import { ReactNode, useState } from "react";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        <DashboardHeader 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen}
        />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
