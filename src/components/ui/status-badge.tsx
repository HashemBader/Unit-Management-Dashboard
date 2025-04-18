
import { cn } from "@/lib/utils";

export type StatusType = "available" | "rented" | "reserved" | "maintenance";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  available: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    label: "Available"
  },
  rented: {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    label: "Rented"
  },
  reserved: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    label: "Reserved"
  },
  maintenance: {
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    label: "Maintenance"
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Ensure we have a valid status by defaulting to "available" if the status is invalid
  const validStatus = (statusConfig[status] ? status : "available") as StatusType;
  const config = statusConfig[validStatus];
  
  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.color,
      className
    )}>
      {config.label}
    </span>
  );
}
