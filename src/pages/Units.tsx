
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
import { StatusBadge } from "@/components/ui/status-badge";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Plus,
  MoreHorizontal,
  Search,
  FilterX
} from "lucide-react";
import { AddUnitForm } from "@/components/forms/add-unit-form";
import { UnitDetails } from "@/components/unit/unit-details";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Unit {
  id: string;
  number: string;
  building: {
    name: string;
  };
  size: string;
  is_climate_controlled: boolean;
  price_per_month: number;
  status: "available" | "rented" | "reserved" | "maintenance";
}

// Only showing available and rented in the filter
const statusOptions = ["All Statuses", "Available", "Rented", "Reserved", "Maintenance"];
const sizeOptions = ["All Sizes", "5x5", "5x10", "10x10", "10x15", "10x20", "15x15", "15x20"];

const Units = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [building, setBuilding] = useState("All Buildings");
  const [status, setStatus] = useState("All Statuses");
  const [size, setSize] = useState("All Sizes");
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<string[]>(["All Buildings"]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<"available" | "rented" | "reserved" | "maintenance">("available");
  const { toast } = useToast();
  
  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      // Get units with building information
      const { data, error } = await supabase
        .from('units')
        .select(`
          id,
          number,
          size,
          is_climate_controlled,
          price_per_month,
          status,
          buildings (
            name
          )
        `);
        
      if (error) throw error;
      
      // Transform data to match Unit interface
      const transformedUnits: Unit[] = data.map(unit => ({
        ...unit,
        building: { name: unit.buildings.name }
      }));
      
      // Get buildings for filter
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('name');
        
      if (buildingsError) throw buildingsError;
      
      setUnits(transformedUnits);
      setBuildings(["All Buildings", ...buildingsData.map((b: any) => b.name)]);
    } catch (error: any) {
      console.error("Error fetching units:", error);
      toast({
        title: "Error",
        description: "Failed to load units. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUnits();
  }, []);
  
  const filteredUnits = units.filter((unit) => {
    // Search filter
    const matchesSearch = unit.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.building.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Building filter
    const matchesBuilding = building === "All Buildings" || unit.building.name === building;
    
    // Status filter
    let matchesStatus = true;
    if (status === "All Statuses") {
      matchesStatus = unit.status === "available" || unit.status === "rented";
    } else {
      matchesStatus = unit.status.toLowerCase() === status.toLowerCase();
    }
    
    // Size filter
    const matchesSize = size === "All Sizes" || unit.size === size;
    
    return matchesSearch && matchesBuilding && matchesStatus && matchesSize;
  });
  
  const resetFilters = () => {
    setSearchTerm("");
    setBuilding("All Buildings");
    setStatus("All Statuses");
    setSize("All Sizes");
  };

  const handleStatusChange = async () => {
    if (!selectedUnit) return;
    
    try {
      // Update unit status in database
      const { error } = await supabase
        .from('units')
        .update({ status: newStatus })
        .eq('id', selectedUnit.id);
        
      if (error) throw error;
      
      // If changing from rented to anything else, check if there's an active rental to update
      if (selectedUnit.status === "rented" && newStatus !== "rented") {
        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select('id')
          .eq('unit_id', selectedUnit.id)
          .eq('status', 'active')
          .single();
          
        if (!rentalError && rentalData) {
          // Update rental status to completed
          await supabase
            .from('rentals')
            .update({ 
              status: 'completed',
              end_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', rentalData.id);
        }
      }
      
      toast({
        title: "Status Updated",
        description: `Unit ${selectedUnit.number} status changed to ${newStatus}.`,
      });
      
      // Refresh units list
      fetchUnits();
      
      // Close dialog
      setShowStatusDialog(false);
    } catch (error: any) {
      console.error("Error updating unit status:", error);
      toast({
        title: "Error",
        description: "Failed to update unit status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return;
    
    try {
      // Check if unit has active rentals
      const { data: rentalData, error: rentalCheckError } = await supabase
        .from('rentals')
        .select('id')
        .eq('unit_id', selectedUnit.id)
        .eq('status', 'active');
        
      if (rentalCheckError) throw rentalCheckError;
      
      if (rentalData && rentalData.length > 0) {
        toast({
          title: "Cannot Delete Unit",
          description: "This unit has active rentals. Please end the rentals first.",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
        return;
      }
      
      // Delete unit from database
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', selectedUnit.id);
        
      if (error) throw error;
      
      toast({
        title: "Unit Deleted",
        description: `Unit ${selectedUnit.number} has been deleted.`,
      });
      
      // Refresh units list
      fetchUnits();
      
      // Close dialog
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      toast({
        title: "Error",
        description: "Failed to delete unit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUnit = async (formData: any) => {
    if (!selectedUnit) return;
    
    try {
      // Update unit in database
      const { error } = await supabase
        .from('units')
        .update({
          number: formData.number,
          size: formData.size,
          price_per_month: formData.price,
          is_climate_controlled: formData.climate_controlled
        })
        .eq('id', selectedUnit.id);
        
      if (error) throw error;
      
      toast({
        title: "Unit Updated",
        description: `Unit ${formData.number} has been updated.`,
      });
      
      // Refresh units list
      fetchUnits();
      
      // Close dialog
      setShowEditDialog(false);
    } catch (error: any) {
      console.error("Error updating unit:", error);
      toast({
        title: "Error",
        description: "Failed to update unit. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Units</h1>
          <div>
            <AddUnitForm onUnitAdded={fetchUnits} />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Unit Management</CardTitle>
            <CardDescription>
              View and manage all storage units in your facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {/* Search and filters */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search units..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:max-w-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                  
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((option) => (
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
              
              {/* Units table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Climate Controlled</TableHead>
                      <TableHead>Price/Month</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading units...
                        </TableCell>
                      </TableRow>
                    ) : filteredUnits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No units found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUnits.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.number}</TableCell>
                          <TableCell>{unit.building.name}</TableCell>
                          <TableCell>{unit.size}</TableCell>
                          <TableCell>{unit.is_climate_controlled ? "Yes" : "No"}</TableCell>
                          <TableCell>${unit.price_per_month}</TableCell>
                          <TableCell>
                            <StatusBadge status={unit.status as any} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <UnitDetails 
                                  unitId={unit.id} 
                                  trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>View Details</DropdownMenuItem>} 
                                />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUnit(unit);
                                  setShowEditDialog(true);
                                }}>
                                  Edit Unit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUnit(unit);
                                  setNewStatus(unit.status);
                                  setShowStatusDialog(true);
                                }}>
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {unit.status === 'available' && (
                                  <DropdownMenuItem>Assign to Customer</DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedUnit(unit);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  Delete Unit
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

      {/* Change Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Unit Status</DialogTitle>
            <DialogDescription>
              Update the status of unit {selectedUnit?.number}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={newStatus}
              onValueChange={(value: "available" | "rented" | "reserved" | "maintenance") => setNewStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            {selectedUnit?.status === "rented" && newStatus !== "rented" && (
              <p className="text-sm text-amber-600 mt-2">
                Warning: Changing from rented will also mark any active rental as completed.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleStatusChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete unit {selectedUnit?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteUnit}>Delete Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>
              Update the details for unit {selectedUnit?.number}
            </DialogDescription>
          </DialogHeader>
          {selectedUnit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Number</label>
                <Input
                  id="number"
                  defaultValue={selectedUnit.number}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Size</label>
                <Select defaultValue={selectedUnit.size}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.filter(s => s !== "All Sizes").map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Price/Month</label>
                <Input
                  id="price"
                  type="number"
                  defaultValue={selectedUnit.price_per_month}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Climate Controlled</label>
                <div className="flex items-center space-x-2 col-span-3">
                  <input
                    type="checkbox"
                    id="climate_controlled"
                    defaultChecked={selectedUnit.is_climate_controlled}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="climate_controlled" className="text-sm">Yes</label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              // Simple form data collection, in a real app would use react-hook-form
              const formData = {
                number: (document.getElementById('number') as HTMLInputElement).value,
                size: (document.querySelector('[id^="radix-:"]') as HTMLElement)?.textContent || selectedUnit?.size,
                price: parseFloat((document.getElementById('price') as HTMLInputElement).value),
                climate_controlled: (document.getElementById('climate_controlled') as HTMLInputElement).checked
              };
              handleEditUnit(formData);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Units;
