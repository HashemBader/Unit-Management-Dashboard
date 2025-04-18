
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Define validation schema for the payment form
const paymentFormSchema = z.object({
  rentalId: z.string().uuid({ message: "Please select a rental" }),
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  method: z.string().min(1, { message: "Please select a payment method" }),
  date: z.date(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  onSuccess?: () => void;
  initialRentalId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PaymentForm({ onSuccess, initialRentalId, isOpen, onOpenChange }: PaymentFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Update internal open state when isOpen prop changes
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  // Handle dialog open state changes
  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if (onOpenChange) {
      onOpenChange(newOpenState);
    }
  };
  
  // Load available rentals from the database
  const { data: rentals = [], isLoading: isLoadingRentals } = useQuery({
    queryKey: ["rentals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select(`
          id,
          start_date,
          end_date,
          total_amount,
          customer_id (name),
          unit_id (number)
        `)
        .eq("status", "active");
        
      if (error) {
        console.error("Error fetching rentals:", error);
        throw new Error(error.message);
      }
      
      return data.map(rental => ({
        id: rental.id,
        customerName: rental.customer_id?.name || "Unknown Customer",
        unitNumber: rental.unit_id?.number || "Unknown Unit",
        label: `${rental.customer_id?.name || "Unknown"} - Unit ${rental.unit_id?.number || "Unknown"}`,
        startDate: rental.start_date,
        endDate: rental.end_date,
        totalAmount: rental.total_amount
      }));
    }
  });

  // Initialize form with default values
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      rentalId: initialRentalId || "",
      amount: 0,
      method: "credit_card",
      date: new Date(),
    },
  });

  // Handle rental selection
  const handleRentalChange = (rentalId: string) => {
    form.setValue("rentalId", rentalId);
    
    // Find the selected rental
    const selectedRental = rentals.find(rental => rental.id === rentalId);
    if (selectedRental) {
      // Set the amount to the total amount from the rental
      form.setValue("amount", Number(selectedRental.totalAmount));
    }
  };

  // Set initial rental information when the form loads or initialRentalId changes
  useEffect(() => {
    if (initialRentalId && rentals.length > 0) {
      handleRentalChange(initialRentalId);
    }
  }, [initialRentalId, rentals]);

  // Submit handler for the form
  const onSubmit = async (values: PaymentFormValues) => {
    try {
      // Insert the payment into the database
      const { data, error } = await supabase
        .from("payments")
        .insert({
          rental_id: values.rentalId,
          amount: values.amount,
          method: values.method,
          date: format(values.date, "yyyy-MM-dd"),
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Show success notification
      toast({
        title: "Payment recorded",
        description: `Payment of $${values.amount} has been successfully recorded.`,
      });
      
      // Close the dialog and reset the form
      handleOpenChange(false);
      form.reset();
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine if we should show the trigger button
  const showTriggerButton = isOpen === undefined;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTriggerButton && (
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start px-2">
            Record Payment
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record a Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details below to record a new payment.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Rental Selection */}
            <FormField
              control={form.control}
              name="rentalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rental</FormLabel>
                  <Select 
                    onValueChange={(value) => handleRentalChange(value)} 
                    defaultValue={field.value}
                    disabled={isLoadingRentals || rentals.length === 0 || !!initialRentalId}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rental" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rentals.map((rental) => (
                        <SelectItem key={rental.id} value={rental.id}>
                          {rental.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Amount Input */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0.01" 
                      step="0.01" 
                      placeholder="Enter amount" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Payment Method Selection */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
