
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MoreHorizontal, Search, FilterX } from "lucide-react";
import { AddCustomerForm } from "@/components/forms/add-customer-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  activeRentals?: number;
}

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Get customers
      const { data, error } = await supabase
        .from('customers')
        .select('*');
        
      if (error) throw error;
      
      // Get active rentals count for each customer
      const customersWithRentals = await Promise.all(
        (data || []).map(async (customer) => {
          const { count, error: rentalError } = await supabase
            .from('rentals')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customer.id)
            .eq('status', 'active');
            
          if (rentalError) throw rentalError;
          
          return {
            ...customer,
            activeRentals: count || 0,
            joinDate: new Date(customer.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          };
        })
      );
      
      setCustomers(customersWithRentals);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  const filteredCustomers = customers.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  });
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <AddCustomerForm onCustomerAdded={fetchCustomers} />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Management</CardTitle>
            <CardDescription>
              View and manage all customer information and rental history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {/* Search */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:max-w-xs"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setSearchTerm("")}
                  disabled={!searchTerm}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Customers table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Active Rentals</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading customers...
                        </TableCell>
                      </TableRow>
                    ) : filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No customers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{customer.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || "—"}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{customer.address || "—"}</TableCell>
                          <TableCell>
                            {(customer.activeRentals || 0) > 0 ? (
                              <span className="inline-flex h-6 items-center rounded-full bg-green-100 px-2.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                {customer.activeRentals}
                              </span>
                            ) : (
                              <span className="inline-flex h-6 items-center rounded-full bg-gray-100 px-2.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                None
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(customer.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit Information</DropdownMenuItem>
                                <DropdownMenuItem>Rental History</DropdownMenuItem>
                                <DropdownMenuItem>Payments</DropdownMenuItem>
                                <DropdownMenuItem>Documents</DropdownMenuItem>
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

export default Customers;
