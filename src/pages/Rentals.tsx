import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, MoreHorizontal, Search, FilterX, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddRentalForm } from "@/components/forms/add-rental-form";
import { UnitDetails } from "@/components/unit/unit-details";
import { PaymentForm } from "@/components/payment/payment-form";

interface Rental {
  id: string;
  customer: {
    name: string;
  };
  unit: {
    number: string;
    buildings: {
      name: string;
    };
    id: string;
  };
  start_date: string;
  end_date: string | null;
  status: string;
  total_amount: number;
  next_payment?: string | null;
}

const statusOptions = ["All Statuses", "Active", "Upcoming", "Completed"];

const Rentals = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [building, setBuilding] = useState("All Buildings");
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showRentalDetails, setShowRentalDetails] = useState(false);
  const [showEditRental, setShowEditRental] = useState(false);
  const [showEndRental, setShowEndRental] = useState(false);
  const [showRemoveRental, setShowRemoveRental] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();
  
  const fetchRentals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_amount,
          customer:customer_id(name),
          unit:unit_id(
            id,
            number,
            buildings:building_id(name)
          )
        `);
        
      if (error) throw error;
      
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('name');
        
      if (buildingsError) throw buildingsError;
      
      setBuildings(["All Buildings", ...buildingsData.map((b: any) => b.name)]);
      
      const today = new Date().toISOString().split('T')[0];
      const rentalsToUpdate = [];
      
      for (const rental of data || []) {
        if (rental.status === 'active' && rental.end_date && rental.end_date < today) {
          rentalsToUpdate.push(rental);
        }
      }
      
      if (rentalsToUpdate.length > 0) {
        for (const rental of rentalsToUpdate) {
          await completeRentalAndUpdateUnit(rental.id, rental.unit.id);
        }
        
        const { data: updatedData, error: refetchError } = await supabase
          .from('rentals')
          .select(`
            id,
            start_date,
            end_date,
            status,
            total_amount,
            customer:customer_id(name),
            unit:unit_id(
              id,
              number,
              buildings:building_id(name)
            )
          `);
          
        if (!refetchError) {
          setRentals(updatedData || []);
          toast({
            title: "Rentals Updated",
            description: `${rentalsToUpdate.length} rental(s) automatically marked as completed.`,
          });
        }
      } else {
        setRentals(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching rentals:", error);
      toast({
        title: "Error",
        description: "Failed to load rentals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRentals();
    
    const interval = setInterval(() => {
      fetchRentals();
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch = 
      rental.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.unit.number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = status === "All Statuses" || 
                        rental.status.toLowerCase() === status.toLowerCase();
    
    const matchesBuilding = building === "All Buildings" || 
                          rental.unit.buildings.name === building;
    
    return matchesSearch && matchesStatus && matchesBuilding;
  });
  
  const resetFilters = () => {
    setSearchTerm("");
    setStatus("All Statuses");
    setBuilding("All Buildings");
  };
  
  const getStatusBadgeType = (status: string): StatusType => {
    switch (status.toLowerCase()) {
      case "active":
        return "rented";
      case "upcoming":
        return "reserved";
      case "completed":
        return "available";
      default:
        return "available";
    }
  };

  const handleViewDetails = (rental: Rental) => {
    setSelectedRental(rental);
    setShowRentalDetails(true);
  };

  const handleEditRental = (rental: Rental) => {
    setSelectedRental(rental);
    setShowEditRental(true);
    toast({
      title: "Edit Functionality",
      description: "Edit rental feature will be implemented soon.",
    });
  };

  const handleEndRental = (rental: Rental) => {
    setSelectedRental(rental);
    setShowEndRental(true);
  };

  const handleRemoveRental = (rental: Rental) => {
    setSelectedRental(rental);
    setShowRemoveRental(true);
  };
  
  const completeRentalAndUpdateUnit = async (rentalId: string, unitId: string) => {
    try {
      const { error: rentalError } = await supabase
        .from('rentals')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', rentalId);
        
      if (rentalError) throw rentalError;
      
      const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'available' })
        .eq('id', unitId);
        
      if (unitError) throw unitError;
      
      return true;
    } catch (error) {
      console.error("Error updating rental and unit status:", error);
      throw error;
    }
  };

  const confirmEndRental = async () => {
    if (!selectedRental) return;
    
    try {
      await completeRentalAndUpdateUnit(selectedRental.id, selectedRental.unit.id);
      
      toast({
        title: "Rental Ended",
        description: `Rental has been successfully marked as completed and unit is now available.`,
      });
      
      setShowEndRental(false);
      fetchRentals();
    } catch (error: any) {
      console.error("Error ending rental:", error);
      toast({
        title: "Error",
        description: "Failed to end rental. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmRemoveRental = async () => {
    if (!selectedRental) return;
    
    try {
      if (selectedRental.status === 'active') {
        const { error: unitError } = await supabase
          .from('units')
          .update({ status: 'available' })
          .eq('id', selectedRental.unit.id);
          
        if (unitError) throw unitError;
      }
      
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('rental_id', selectedRental.id);
      
      if (paymentsError) throw paymentsError;
      
      const { error: rentalError } = await supabase
        .from('rentals')
        .delete()
        .eq('id', selectedRental.id);
        
      if (rentalError) throw rentalError;
      
      toast({
        title: "Rental Removed",
        description: "The rental has been successfully removed from the system.",
      });
      
      setShowRemoveRental(false);
      fetchRentals();
    } catch (error: any) {
      console.error("Error removing rental:", error);
      toast({
        title: "Error",
        description: "Failed to remove rental. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvoice = (rental: Rental) => {
    toast({
      title: "Invoice Generated",
      description: `Invoice for ${rental.customer.name} has been generated and sent.`,
    });
  };

  const handleRecordPayment = (rental: Rental) => {
    setSelectedRental(rental);
    setShowPaymentForm(true);
  };
  
  const handleRentalDetailsClose = (open: boolean) => {
    setShowRentalDetails(open);
    if (!open && !showEditRental && !showEndRental && !showPaymentForm && !showRemoveRental) {
      setTimeout(() => {
        setSelectedRental(null);
      }, 100);
    }
  };

  const handleEndRentalClose = (open: boolean) => {
    setShowEndRental(open);
    if (!open && !showRentalDetails && !showPaymentForm && !showEditRental && !showRemoveRental) {
      setTimeout(() => {
        setSelectedRental(null);
      }, 100);
    }
  };

  const handleRemoveRentalClose = (open: boolean) => {
    setShowRemoveRental(open);
    if (!open && !showRentalDetails && !showEndRental && !showPaymentForm && !showEditRental) {
      setTimeout(() => {
        setSelectedRental(null);
      }, 100);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Rentals</h1>
          <AddRentalForm onRentalAdded={fetchRentals} />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Rental Management</CardTitle>
            <CardDescription>
              View and manage all active, upcoming, and past rentals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search rentals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:max-w-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={building} onValueChange={setBuilding}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="icon" onClick={resetFilters}>
                    <FilterX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading rentals...
                        </TableCell>
                      </TableRow>
                    ) : filteredRentals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No rentals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRentals.map((rental) => (
                        <TableRow key={rental.id}>
                          <TableCell className="font-medium">{rental.customer.name}</TableCell>
                          <TableCell>{rental.unit.number} ({rental.unit.buildings.name})</TableCell>
                          <TableCell>{new Date(rental.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>{rental.end_date ? new Date(rental.end_date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>${rental.total_amount}</TableCell>
                          <TableCell>
                            <StatusBadge status={getStatusBadgeType(rental.status)} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(rental)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRecordPayment(rental)}>
                                  Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleGenerateInvoice(rental)}>
                                  Generate Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveRental(rental)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  Remove Rental
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRentalDetails} onOpenChange={handleRentalDetailsClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Rental Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected rental
            </DialogDescription>
          </DialogHeader>
          
          {selectedRental && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Customer</h3>
                  <p>{selectedRental.customer.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Unit</h3>
                  <p>{selectedRental.unit.number} ({selectedRental.unit.buildings.name})</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Start Date</h3>
                  <p>{new Date(selectedRental.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">End Date</h3>
                  <p>{selectedRental.end_date ? new Date(selectedRental.end_date).toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Total Amount</h3>
                  <p>${selectedRental.total_amount}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <StatusBadge status={getStatusBadgeType(selectedRental.status)} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEndRental} onOpenChange={handleEndRentalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>End Rental</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this rental? This will mark the rental as completed and set today as the end date.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEndRental(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEndRental} variant="destructive">
              End Rental
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveRental} onOpenChange={handleRemoveRentalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Rental</DialogTitle>
            <DialogDescription>
              Are you sure you want to completely remove this rental? This action cannot be undone and will delete all records associated with this rental.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowRemoveRental(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRemoveRental} variant="destructive">
              Remove Rental
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedRental && (
        <PaymentForm 
          onSuccess={fetchRentals} 
          initialRentalId={selectedRental.id}
          isOpen={showPaymentForm}
          onOpenChange={(open) => {
            setShowPaymentForm(open);
            if (!open) {
              if (!showRentalDetails && !showEndRental && !showEditRental && !showRemoveRental) {
                setTimeout(() => {
                  setSelectedRental(null);
                }, 100);
              }
            }
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default Rentals;
