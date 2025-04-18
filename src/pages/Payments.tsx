import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
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
  Plus,
  MoreHorizontal,
  Search,
  FilterX,
  Download,
  Calendar,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PaymentForm } from "@/components/payment/payment-form";

interface Payment {
  id: string;
  customer: string;
  unit: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  invoiceNumber: string;
  rentalId: string;
}

const statusOptions = ["All", "Completed", "Upcoming", "Overdue"];
const methodOptions = ["All", "Credit Card", "Bank Transfer", "Cash"];

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All");
  
  const { data: paymentsData = [], isLoading, refetch } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          date,
          method,
          is_late,
          rental_id,
          rentals (
            id,
            customer_id (id, name),
            unit_id (id, number)
          )
        `);
        
      if (error) {
        console.error("Error fetching payments:", error);
        throw new Error(error.message);
      }
      
      const formattedPayments = data.map((payment, index) => {
        const isLate = payment.is_late;
        const status = isLate ? "overdue" : "completed";
        
        return {
          id: payment.id,
          customer: payment.rentals?.customer_id?.name || "Unknown Customer",
          unit: payment.rentals?.unit_id?.number || "Unknown Unit",
          amount: Number(payment.amount),
          date: payment.date || new Date().toISOString().split('T')[0],
          method: payment.method || "credit_card",
          status: status,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          rentalId: payment.rental_id,
        };
      });
      
      return formattedPayments;
    },
  });
  
  const filteredPayments = paymentsData.filter((payment) => {
    const matchesSearch = 
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = status === "All" || 
                        payment.status.toLowerCase() === status.toLowerCase();
    
    const formattedMethod = method.toLowerCase().replace(" ", "_");
    const matchesMethod = method === "All" || 
                        payment.method === formattedMethod;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });
  
  const resetFilters = () => {
    setSearchTerm("");
    setStatus("All");
    setMethod("All");
  };
  
  const getMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="h-4 w-4 mr-2" />;
      case "bank_transfer":
        return <CreditCard className="h-4 w-4 mr-2" />;
      case "cash":
        return <CreditCard className="h-4 w-4 mr-2" />;
      default:
        return <CreditCard className="h-4 w-4 mr-2" />;
    }
  };
  
  const getMethodLabel = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Credit Card";
      case "bank_transfer":
        return "Bank Transfer";
      case "cash":
        return "Cash";
      default:
        return "Unknown";
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const handlePaymentSuccess = () => {
    refetch();
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <PaymentForm onSuccess={handlePaymentSuccess} />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
            <CardDescription>
              Track and manage all payments for rental units
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search payments..."
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
                  
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {methodOptions.map((option) => (
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
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Loading payments...
                        </TableCell>
                      </TableRow>
                    ) : filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No payments found. Add a payment to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.invoiceNumber}</TableCell>
                          <TableCell>{payment.customer}</TableCell>
                          <TableCell>{payment.unit}</TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {payment.date}
                          </TableCell>
                          <TableCell className="flex items-center">
                            {getMethodIcon(payment.method)}
                            {getMethodLabel(payment.method)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                                <DropdownMenuItem>Send to Customer</DropdownMenuItem>
                                <DropdownMenuItem>Edit Payment</DropdownMenuItem>
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
    </DashboardLayout>
  );
};

export default Payments;
