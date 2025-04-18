import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Edit, 
  User, 
  DollarSign, 
  ClipboardList,
  SquareArrowOutUpRight
} from "lucide-react";

interface UnitDetailsProps {
  unitId: string;
  trigger?: React.ReactNode;
}

interface UnitData {
  id: string;
  number: string;
  building: string;
  size: string;
  climateControlled: boolean;
  price: number;
  status: "rented" | "available" | "reserved" | "maintenance";
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  rentalInfo?: {
    startDate: string;
    endDate: string | null;
    nextPayment: string | null;
    balance: number;
  };
  rentalHistory: Array<{
    id: string;
    date: string;
    action: string;
    amount?: number;
    notes: string;
  }>;
}

export function UnitDetails({ unitId, trigger }: UnitDetailsProps) {
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && unitId) {
      fetchUnitData();
    }
  }, [open, unitId]);

  const fetchUnitData = async () => {
    try {
      setLoading(true);
      
      setUnit({
        id: unitId,
        number: "A101",
        building: "Building A",
        size: "10x10",
        climateControlled: true,
        price: 120,
        status: "available",
        customer: {
          id: "1",
          name: "Alex Johnson",
          email: "alex@example.com",
          phone: "(555) 123-4567",
        },
        rentalInfo: {
          startDate: "2023-06-01",
          endDate: "2023-12-31",
          nextPayment: "2023-07-01",
          balance: 0,
        },
        rentalHistory: [
          {
            id: "1",
            date: "2023-06-01",
            action: "Rental Start",
            notes: "Initial rental agreement signed",
          },
          {
            id: "2",
            date: "2023-06-01",
            action: "Payment",
            amount: 120,
            notes: "First month payment",
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching unit data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        setUnit(null);
        setLoading(true);
      }, 200);
    }
  };

  if (loading && open) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild onClick={() => setOpen(true)}>
          {trigger || <Button variant="outline">View Details</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p>Loading unit information...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger || <Button variant="outline">View Details</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]" onEscapeKeyDown={() => setOpen(false)}>
        {unit && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Unit {unit.number}</span>
                <StatusBadge status={unit.status} />
              </DialogTitle>
              <DialogDescription>
                {unit.building} • {unit.size} • ${unit.price}/month
                {unit.climateControlled && " • Climate Controlled"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="flex justify-between mt-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Status</h4>
                    <StatusBadge status={unit.status} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Size</h4>
                    <p>{unit.size}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Building</h4>
                    <p>{unit.building}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Climate Control</h4>
                    <p>{unit.climateControlled ? "Yes" : "No"}</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 mt-4 bg-muted/20">
                  <h3 className="font-medium mb-2">Rental Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Start Date</h4>
                      <p>{unit.rentalInfo.startDate}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">End Date</h4>
                      <p>{unit.rentalInfo.endDate}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Next Payment</h4>
                      <p>{unit.rentalInfo.nextPayment}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Current Balance</h4>
                      <p>${unit.rentalInfo.balance}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <ClipboardList className="mr-2 h-4 w-4" /> Generate Invoice
                  </Button>
                  <Button>
                    <Edit className="mr-2 h-4 w-4" /> Edit Unit
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="customer">
                {unit.customer ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{unit.customer.name}</h3>
                        <p className="text-sm text-muted-foreground">Customer ID: {unit.customer.id}</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <SquareArrowOutUpRight className="mr-2 h-4 w-4" /> View Profile
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Email</h4>
                        <p>{unit.customer.email}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Phone</h4>
                        <p>{unit.customer.phone}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No customer assigned to this unit</p>
                    <Button className="mt-4">
                      <User className="mr-2 h-4 w-4" /> Assign Customer
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="payments">
                <div className="flex justify-between items-center py-4">
                  <h3 className="font-medium">Payment Schedule</h3>
                  <Button>
                    <DollarSign className="mr-2 h-4 w-4" /> Record Payment
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
                
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-medium mb-2">Recent Payments</h3>
                  {unit.rentalHistory
                    .filter((item) => item.action === "Payment")
                    .map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">{payment.date}</p>
                          <p className="text-sm text-muted-foreground">{payment.notes}</p>
                        </div>
                        <div className="font-medium">${payment.amount}</div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="history">
                <div className="py-4">
                  <h3 className="font-medium mb-4">Unit Activity History</h3>
                  <div className="space-y-4">
                    {unit.rentalHistory.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b">
                        <div className="w-24 shrink-0 font-medium">{item.date}</div>
                        <div>
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                          {item.amount && (
                            <p className="text-sm">${item.amount}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
