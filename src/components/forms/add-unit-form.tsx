
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddUnitFormProps {
  onUnitAdded?: () => void;
}

export function AddUnitForm({ onUnitAdded }: AddUnitFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    unitNumber: "",
    size: "10x10",
    building: "Building A",
    price: "",
    status: "available",
    climateControlled: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First get the building ID
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('name', formData.building)
        .single();
      
      if (buildingError) {
        throw buildingError;
      }
      
      // Insert the new unit
      const { data, error } = await supabase
        .from('units')
        .insert([
          {
            number: formData.unitNumber,
            size: formData.size,
            building_id: buildingData.id,
            price_per_month: parseFloat(formData.price),
            is_climate_controlled: formData.climateControlled,
            status: formData.status as "available" | "rented" | "reserved" | "maintenance",
          }
        ]);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: `Unit ${formData.unitNumber} has been added.`,
      });
      
      // Reset form and close dialog
      setFormData({
        unitNumber: "",
        size: "10x10",
        building: "Building A",
        price: "",
        status: "available",
        climateControlled: false,
      });
      setOpen(false);
      
      if (onUnitAdded) {
        onUnitAdded();
      }
    } catch (error: any) {
      console.error("Error creating unit:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create unit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>
              Create a new storage unit. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitNumber">Unit Number</Label>
                <Input
                  id="unitNumber"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  placeholder="e.g., A101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => handleSelectChange("size", value)}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5x5">5x5</SelectItem>
                    <SelectItem value="5x10">5x10</SelectItem>
                    <SelectItem value="10x10">10x10</SelectItem>
                    <SelectItem value="10x15">10x15</SelectItem>
                    <SelectItem value="10x20">10x20</SelectItem>
                    <SelectItem value="15x15">15x15</SelectItem>
                    <SelectItem value="15x20">15x20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Select
                value={formData.building}
                onValueChange={(value) => handleSelectChange("building", value)}
              >
                <SelectTrigger id="building">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Building A">Building A</SelectItem>
                  <SelectItem value="Building B">Building B</SelectItem>
                  <SelectItem value="Building C">Building C</SelectItem>
                  <SelectItem value="Building D">Building D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Monthly Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 120.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="climateControlled"
                checked={formData.climateControlled}
                onCheckedChange={(checked) =>
                  handleSwitchChange("climateControlled", checked)
                }
              />
              <Label htmlFor="climateControlled">Climate Controlled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
