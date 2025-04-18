
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddCustomerForm } from "./add-customer-form";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Unit {
  id: string;
  building_id: string;
  number: string;
  size: string;
  price_per_month: number;
  status: string;
  building_name?: string;
}

interface AddRentalFormProps {
  onRentalAdded?: () => void;
}

export function AddRentalForm({ onRentalAdded }: AddRentalFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  
  const [formData, setFormData] = useState({
    unit_id: "",
    customer_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    total_amount: "",
  });

  // Fetch customers and available units
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email');
      
      if (customersError) throw customersError;
      setCustomers(customersData || []);
      
      // Fetch available units with building info
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select(`
          id, 
          building_id, 
          number, 
          size, 
          price_per_month, 
          status,
          buildings(name)
        `)
        .eq('status', 'available');
      
      if (unitsError) throw unitsError;
      
      // Format units with building name
      const formattedUnits = unitsData.map((unit: any) => ({
        ...unit,
        building_name: unit.buildings?.name
      }));
      
      setAvailableUnits(formattedUnits || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // If unit is selected, update total amount
    if (name === 'unit_id') {
      const selectedUnit = availableUnits.find(unit => unit.id === value);
      if (selectedUnit && formData.end_date) {
        calculateTotalAmount(selectedUnit.price_per_month, formData.start_date, formData.end_date);
      }
    }
  };
  
  const handleDateChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Recalculate total amount if we have both dates and a unit
    if ((name === 'start_date' || name === 'end_date') && 
        formData.unit_id && 
        formData.start_date && 
        (name === 'end_date' ? value : formData.end_date)) {
      const selectedUnit = availableUnits.find(unit => unit.id === formData.unit_id);
      if (selectedUnit) {
        calculateTotalAmount(
          selectedUnit.price_per_month, 
          name === 'start_date' ? value : formData.start_date,
          name === 'end_date' ? value : formData.end_date
        );
      }
    }
  };
  
  const calculateTotalAmount = (monthlyPrice: number, startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return;
    
    // Calculate months difference
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                  (end.getMonth() - start.getMonth());
    
    // Calculate days for partial month
    const daysInEndMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    const remainingDays = end.getDate() - start.getDate() + 1;
    
    // Calculate total
    const total = (months * monthlyPrice) + 
                 ((remainingDays / daysInEndMonth) * monthlyPrice);
    
    setFormData(prev => ({ 
      ...prev, 
      total_amount: Math.max(0, total).toFixed(2) 
    }));
  };

  const handleCustomerAdded = () => {
    fetchData();
    setShowCustomerForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First, check if the unit is still available
      const { data: unitCheck, error: unitCheckError } = await supabase
        .from('units')
        .select('status')
        .eq('id', formData.unit_id)
        .single();
      
      if (unitCheckError) throw unitCheckError;
      
      if (unitCheck.status !== 'available') {
        throw new Error('This unit is no longer available');
      }
      
      // Create the rental
      const { data: rentalData, error: rentalError } = await supabase
        .from('rentals')
        .insert([{
          unit_id: formData.unit_id,
          customer_id: formData.customer_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_amount: parseFloat(formData.total_amount),
          status: 'active'
        }])
        .select();
      
      if (rentalError) throw rentalError;
      
      // Update unit status to rented
      const { error: updateError } = await supabase
        .from('units')
        .update({ status: 'rented' })
        .eq('id', formData.unit_id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Success",
        description: "Rental created successfully",
      });
      
      // Reset form and close dialog
      setFormData({
        unit_id: "",
        customer_id: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        total_amount: ""
      });
      setOpen(false);
      
      if (onRentalAdded) {
        onRentalAdded();
      }
    } catch (error: any) {
      console.error("Error creating rental:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create rental. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Rental
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Rental</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new rental agreement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {isLoading ? (
                <div className="text-center py-4">Loading data...</div>
              ) : (
                <>
                  {/* Customer selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customer_id">Customer</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowCustomerForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add New
                      </Button>
                    </div>
                    <Select 
                      value={formData.customer_id} 
                      onValueChange={(value) => handleSelectChange('customer_id', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <SelectItem value="no-customers" disabled>
                            No customers available
                          </SelectItem>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Unit selection */}
                  <div className="space-y-2">
                    <Label htmlFor="unit_id">Storage Unit</Label>
                    <Select 
                      value={formData.unit_id} 
                      onValueChange={(value) => handleSelectChange('unit_id', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.length === 0 ? (
                          <SelectItem value="no-units" disabled>
                            No available units
                          </SelectItem>
                        ) : (
                          availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.building_name} - Unit {unit.number} ({unit.size}) - ${unit.price_per_month}/month
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Date range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleDateChange('start_date', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleDateChange('end_date', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Total amount */}
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Total Amount ($)</Label>
                    <Input
                      id="total_amount"
                      name="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      disabled={!formData.unit_id || !formData.end_date}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? "Creating..." : "Create Rental"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      {showCustomerForm && (
        <AddCustomerForm 
          onCustomerAdded={handleCustomerAdded} 
          triggerButton={<></>} 
          isDialogOpen={showCustomerForm}
          setIsDialogOpen={setShowCustomerForm}
        />
      )}
    </>
  );
}
