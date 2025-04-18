import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Box, Users, CreditCard, Building, CalendarClock, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
interface NavItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
}
function NavItem({
  href,
  label,
  icon,
  isActive,
  isCollapsed
}: NavItemProps) {
  return <Link to={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isCollapsed && "justify-center px-2")}>
      {icon}
      {!isCollapsed && <span>{label}</span>}
    </Link>;
}
interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}
export default function DashboardSidebar({
  isOpen,
  onToggle
}: DashboardSidebarProps) {
  const {
    pathname
  } = useLocation();
  const navItems = [{
    href: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />
  }, {
    href: "/units",
    label: "Units",
    icon: <Box className="h-5 w-5" />
  }, {
    href: "/customers",
    label: "Customers",
    icon: <Users className="h-5 w-5" />
  }, {
    href: "/rentals",
    label: "Rentals",
    icon: <CalendarClock className="h-5 w-5" />
  }, {
    href: "/payments",
    label: "Payments",
    icon: <CreditCard className="h-5 w-5" />
  }, {
    href: "/buildings",
    label: "Buildings",
    icon: <Building className="h-5 w-5" />
  }, {
    href: "/settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />
  }];
  return <div className={cn("fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out", isOpen ? "w-64" : "w-16")}>
      <div className="flex items-center justify-between p-4">
        {isOpen && <div className="font-bold text-xl text-sidebar-foreground">Unit_Storage</div>}
        <Button variant="ghost" size="icon" onClick={onToggle} className={cn("ml-auto", !isOpen && "mx-auto")}>
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-auto p-2">
        <ul className="flex flex-col gap-1">
          {navItems.map(item => <li key={item.href}>
              <NavItem href={item.href} label={item.label} icon={item.icon} isActive={pathname === item.href} isCollapsed={!isOpen} />
            </li>)}
        </ul>
      </nav>
      <div className="border-t border-border p-4">
        {isOpen && <div className="text-xs text-sidebar-foreground/70">
      </div>}
      </div>
    </div>;
}