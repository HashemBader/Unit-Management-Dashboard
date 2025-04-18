
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";

interface Rental {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  unit: {
    number: string;
    building: string;
    size: string;
  };
  status: "available" | "rented" | "reserved" | "maintenance";
  startDate: string;
  endDate: string;
  amount: number;
}

interface RecentRentalsProps {
  rentals: Rental[];
  className?: string;
}

export function RecentRentals({ rentals, className }: RecentRentalsProps) {
  // Validate status to ensure it's a valid type for StatusBadge
  const getValidStatus = (status: any): "available" | "rented" | "reserved" | "maintenance" => {
    const validStatuses = ["available", "rented", "reserved", "maintenance"];
    return validStatuses.includes(status) ? status : "available";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Recent Rentals</CardTitle>
        <CardDescription>Latest rental activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rentals.map((rental) => (
            <div key={rental.id} className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={rental.customer.avatar} />
                <AvatarFallback>{rental.customer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none">{rental.customer.name}</p>
                  <StatusBadge status={getValidStatus(rental.status)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Unit {rental.unit.number}, {rental.unit.building} ({rental.unit.size})
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
