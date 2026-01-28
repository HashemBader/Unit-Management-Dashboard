
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Building {
  id: string;
  name: string;
  address: string;
  is_climate_controlled: boolean;
  floors: number;
}

interface AddBuildingFormProps {
  onBuildingAdded?: () => void;
}

export function AddBuildingForm({ onBuildingAdded }: AddBuildingFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    floors: 1,
    is_climate_controlled: false,
  });
  
  const queryClient = useQueryClient();
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_climate_controlled: checked }));
  };
  
  const createBuildingMutation = useMutation({
    mutationFn: async (building: Omit<Building, 'id'>) => {
      const { data, error } = await supabase
        .from("buildings")
        .insert([building])
        .select();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data[0];
    },
    onSuccess: () => {
      // Reset form and close dialog
      setFormData({
        name: "",
        address: "",
        floors: 1,
        is_climate_controlled: false,
      });
      setOpen(false);
      
      // Invalidate and refetch buildings query
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      
      // Show success toast
      toast.success("Building added successfully");
      
      if (onBuildingAdded) {
        onBuildingAdded();
      }
    },
    onError: (error) => {
      toast.error(`Failed to add building: ${error.message}`);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBuildingMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Building
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Building</DialogTitle>
            <DialogDescription>
              Add a new building to your storage facility. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="floors" className="text-right">
                Floors
              </Label>
              <Input
                id="floors"
                name="floors"
                type="number"
                min="1"
                value={formData.floors}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="climate" className="text-right">
                Climate Controlled
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="climate"
                  checked={formData.is_climate_controlled}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createBuildingMutation.isPending}>
              {createBuildingMutation.isPending ? "Adding..." : "Save Building"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
