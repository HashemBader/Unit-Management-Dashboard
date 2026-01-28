
import { useState } from "react";
import { toast } from "sonner";
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
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Search, Building as BuildingIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddBuildingForm } from "@/components/forms/add-building-form";

// Type for our building data
interface Building {
  id: string;
  name: string;
  address: string;
  is_climate_controlled: boolean;
  floors: number;
  totalUnits?: number;
  availableUnits?: number;
  occupancyRate?: number;
}

const Buildings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  
  // Fetch buildings from Supabase
  const { data: buildingsData = [], isLoading, error } = useQuery({
    queryKey: ["buildings"],
    queryFn: async (): Promise<Building[]> => {
      const { data: buildings, error: buildingsError } = await supabase
        .from("buildings")
        .select("*");
        
      if (buildingsError) {
        throw new Error(buildingsError.message);
      }
      
      // Fetch units data to calculate statistics for each building
      const buildingsWithStats = await Promise.all(buildings.map(async (building) => {
        const { data: units, error: unitsError } = await supabase
          .from("units")
          .select("id, status")
          .eq("building_id", building.id);
          
        if (unitsError) {
          console.error("Error fetching units for building:", unitsError);
          return {
            ...building,
            totalUnits: 0,
            availableUnits: 0,
            occupancyRate: 0
          };
        }
        
        const totalUnits = units?.length || 0;
        const availableUnits = units?.filter(unit => unit.status === 'available')?.length || 0;
        const occupancyRate = totalUnits > 0 ? Math.round(((totalUnits - availableUnits) / totalUnits) * 100) : 0;
        
        return {
          ...building,
          totalUnits,
          availableUnits,
          occupancyRate
        };
      }));
      
      return buildingsWithStats;
    },
  });
  
  const filteredBuildings = buildingsData.filter((building) => {
    return (
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="text-red-500">Error loading buildings: {(error as Error).message}</div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Buildings</h1>
          <AddBuildingForm onBuildingAdded={() => queryClient.invalidateQueries({ queryKey: ["buildings"] })} />
        </div>
        
        {/* Building cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(3).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-36"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 bg-muted rounded-full"></div>
                    <div className="h-4 bg-muted rounded w-32"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-muted rounded w-12"></div>
                      <div className="h-4 bg-muted rounded w-8"></div>
                    </div>
                    <div className="h-2 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
                <CardFooter className="pt-1">
                  <div className="flex justify-between w-full">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : filteredBuildings.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                <BuildingIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Buildings Available</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Add your first building to get started with managing your storage units.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBuildings.map((building) => (
              <Card key={building.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{building.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Building</DropdownMenuItem>
                        <DropdownMenuItem>Manage Units</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-1">{building.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <BuildingIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {building.floors} {building.floors === 1 ? "floor" : "floors"}
                      {building.is_climate_controlled && ", Climate Controlled"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Occupancy</span>
                      <span className="font-medium">{building.occupancyRate}%</span>
                    </div>
                    <Progress value={building.occupancyRate} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="pt-1">
                  <div className="flex justify-between w-full text-sm">
                    <span>Total Units: {building.totalUnits}</span>
                    <span>Available: {building.availableUnits}</span>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Building Management</CardTitle>
            <CardDescription>
              View and manage all buildings in your storage facility
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
                    placeholder="Search buildings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:max-w-xs"
                  />
                </div>
              </div>
              
              {/* Buildings table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Climate Controlled</TableHead>
                      <TableHead>Total Units</TableHead>
                      <TableHead>Available Units</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Floors</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(4).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={8} className="h-16">
                            <div className="flex items-center space-x-4">
                              <div className="h-4 bg-muted rounded w-24"></div>
                              <div className="h-4 bg-muted rounded w-36"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredBuildings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No buildings found. Use the "Add New Building" button to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBuildings.map((building) => (
                        <TableRow key={building.id}>
                          <TableCell className="font-medium">{building.name}</TableCell>
                          <TableCell>{building.address}</TableCell>
                          <TableCell>{building.is_climate_controlled ? "Yes" : "No"}</TableCell>
                          <TableCell>{building.totalUnits}</TableCell>
                          <TableCell>{building.availableUnits}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={building.occupancyRate} className="h-2 w-24" />
                              <span>{building.occupancyRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{building.floors}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit Building</DropdownMenuItem>
                                <DropdownMenuItem>Manage Units</DropdownMenuItem>
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

export default Buildings;
