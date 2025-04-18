
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { UnitStatusChart } from "@/components/dashboard/unit-status-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentRentals } from "@/components/dashboard/recent-rentals";
import { OverduePayments } from "@/components/dashboard/overdue-payments";
import { Box, Building, CreditCard, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { data: unitStatusData = [], isLoading: isLoadingUnitStatus } = useQuery({
    queryKey: ["unitStatus"],
    queryFn: async () => {
      const { data: unitStatusResult, error: unitStatusError } = await supabase
        .from('units')
        .select('status');

      if (unitStatusError) {
        console.error("Error fetching unit status:", unitStatusError);
        throw new Error(unitStatusError.message);
      }

      const statusCounts = {
        available: 0,
        rented: 0,
        reserved: 0,
        maintenance: 0
      };

      if (unitStatusResult && unitStatusResult.length > 0) {
        unitStatusResult.forEach(unit => {
          statusCounts[unit.status]++;
        });
      }

      return [
        { name: "Available", value: statusCounts.available, color: "#10b981" }, // Use direct hex value
        { name: "Rented", value: statusCounts.rented, color: "#8b5cf6" },      // Use direct hex value
        { name: "Reserved", value: statusCounts.reserved, color: "#f59e0b" },  // Use direct hex value
        { name: "Maintenance", value: statusCounts.maintenance, color: "#ef4444" }, // Use direct hex value
      ];
    }
  });

  const { data: recentRentals = [], isLoading: isLoadingRentals } = useQuery({
    queryKey: ["recentRentals"],
    queryFn: async () => {
      const { data: rentalsResult, error: rentalsError } = await supabase
        .from('rentals')
        .select(`
          id,
          customer_id (id, name, email),
          unit_id (id, number, building_id, size),
          status,
          start_date,
          end_date,
          total_amount
        `)
        .order('start_date', { ascending: false })
        .limit(4);

      if (rentalsError) {
        console.error("Error fetching rentals:", rentalsError);
        throw new Error(rentalsError.message);
      }

      if (!rentalsResult || rentalsResult.length === 0) {
        return [];
      }

      // Get building names for units
      const buildingIds = rentalsResult
        .map(rental => rental.unit_id?.building_id)
        .filter(id => id);
        
      const { data: buildingsData } = await supabase
        .from('buildings')
        .select('id, name')
        .in('id', buildingIds);

      const buildingsMap = {};
      if (buildingsData && buildingsData.length > 0) {
        buildingsData.forEach(building => {
          buildingsMap[building.id] = building.name;
        });
      }

      return rentalsResult.map(rental => ({
        id: rental.id,
        customer: {
          name: rental.customer_id?.name || 'Unknown',
          email: rental.customer_id?.email || 'Unknown'
        },
        unit: {
          number: rental.unit_id?.number || 'Unknown',
          building: buildingsMap[rental.unit_id?.building_id] || 'Unknown Building',
          size: rental.unit_id?.size || 'Unknown'
        },
        // Ensure we map to a valid status type
        status: (() => {
          const status = rental.status || 'available';
          return ['available', 'rented', 'reserved', 'maintenance'].includes(status) 
            ? status 
            : 'available';
        })() as 'available' | 'rented' | 'reserved' | 'maintenance',
        startDate: rental.start_date,
        endDate: rental.end_date,
        amount: rental.total_amount
      }));
    }
  });

  const { data: overduePayments = [], isLoading: isLoadingOverduePayments } = useQuery({
    queryKey: ["overduePayments"],
    queryFn: async () => {
      const { data: paymentsResult, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          rental_id,
          amount,
          date,
          is_late
        `)
        .eq('is_late', true)
        .order('date', { ascending: true })
        .limit(3);

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
        throw new Error(paymentsError.message);
      }

      if (!paymentsResult || paymentsResult.length === 0) {
        return [];
      }

      // For each payment, get customer and unit info
      const rentalIds = paymentsResult.map(payment => payment.rental_id);
      const { data: rentalsData } = await supabase
        .from('rentals')
        .select(`
          id,
          customer_id (name),
          unit_id (number)
        `)
        .in('id', rentalIds);

      const rentalsMap = {};
      if (rentalsData && rentalsData.length > 0) {
        rentalsData.forEach(rental => {
          rentalsMap[rental.id] = {
            customerName: rental.customer_id?.name || 'Unknown',
            unitNumber: rental.unit_id?.number || 'Unknown'
          };
        });
      }

      return paymentsResult.map(payment => {
        const rental = rentalsMap[payment.rental_id] || { customerName: 'Unknown', unitNumber: 'Unknown' };
        const dueDate = new Date(payment.date);
        const today = new Date();
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: payment.id,
          customer: rental.customerName,
          unit: rental.unitNumber,
          dueDate: payment.date,
          amount: payment.amount,
          daysOverdue: daysOverdue > 0 ? daysOverdue : 1
        };
      });
    }
  });

  const { data: revenueData = [], isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["revenueData"],
    queryFn: async () => {
      const monthlyRevenueData = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        
        const monthName = month.toLocaleString('default', { month: 'short' });
        
        const { data: monthPayments, error: monthPaymentsError } = await supabase
          .from('payments')
          .select('amount')
          .gte('date', month.toISOString())
          .lte('date', monthEnd.toISOString());
        
        if (monthPaymentsError) {
          console.error(`Error fetching payments for ${monthName}:`, monthPaymentsError);
          monthlyRevenueData.push({ name: monthName, revenue: 0 });
        } else {
          const monthlyRevenue = monthPayments?.reduce((sum, payment) => {
            return sum + Number(payment.amount);
          }, 0) || 0;
          
          monthlyRevenueData.push({ name: monthName, revenue: monthlyRevenue });
        }
      }
      
      return monthlyRevenueData;
    }
  });

  const { data: stats = {
    totalUnits: 0,
    occupiedUnits: 0,
    totalCustomers: 0,
    monthlyRevenue: 0
  }, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      try {
        // Get total units count
        const { count: totalUnits, error: totalUnitsError } = await supabase
          .from('units')
          .select('*', { count: 'exact', head: true });

        if (totalUnitsError) {
          console.error("Error fetching total units:", totalUnitsError);
          throw new Error(totalUnitsError.message);
        }

        // Get occupied units count
        const { count: occupiedUnits, error: occupiedUnitsError } = await supabase
          .from('units')
          .select('*', { count: 'exact', head: true })
          .in('status', ['rented', 'reserved']);

        if (occupiedUnitsError) {
          console.error("Error fetching occupied units:", occupiedUnitsError);
          throw new Error(occupiedUnitsError.message);
        }

        // Get total customers count
        const { count: totalCustomers, error: totalCustomersError } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        if (totalCustomersError) {
          console.error("Error fetching total customers:", totalCustomersError);
          throw new Error(totalCustomersError.message);
        }
        
        // Calculate current month's revenue
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        const { data: currentMonthPayments, error: currentMonthPaymentsError } = await supabase
          .from('payments')
          .select('amount')
          .gte('date', startOfMonth.toISOString())
          .lte('date', endOfMonth.toISOString());
        
        if (currentMonthPaymentsError) {
          console.error("Error fetching current month payments:", currentMonthPaymentsError);
          throw new Error(currentMonthPaymentsError.message);
        }
        
        const currentMonthRevenue = currentMonthPayments?.reduce((sum, payment) => {
          return sum + Number(payment.amount);
        }, 0) || 0;

        return {
          totalUnits: totalUnits || 0,
          occupiedUnits: occupiedUnits || 0,
          totalCustomers: totalCustomers || 0,
          monthlyRevenue: Math.round(currentMonthRevenue)
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }
    }
  });

  const calculateTrend = () => {
    if (revenueData.length < 2) return { value: "0%", direction: "up" as const };
    
    const currentMonth = revenueData[revenueData.length - 1].revenue;
    const previousMonth = revenueData[revenueData.length - 2].revenue;
    
    if (previousMonth === 0) return { value: "100%", direction: "up" as const };
    
    const percentChange = ((currentMonth - previousMonth) / previousMonth) * 100;
    const direction = percentChange >= 0 ? "up" as const : "down" as const;
    
    return {
      value: `${Math.abs(Math.round(percentChange))}%`,
      direction
    };
  };

  const revenueTrend = calculateTrend();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Units"
            value={isLoadingStats ? "..." : stats.totalUnits.toString()}
            icon={<Box className="h-full w-full" />}
            description="All storage units"
          />
          <StatCard
            title="Occupied Units"
            value={isLoadingStats ? "..." : stats.occupiedUnits.toString()}
            icon={<Building className="h-full w-full" />}
            description={isLoadingStats 
              ? "Loading..." 
              : `${stats.totalUnits ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0}% occupancy rate`}
            trend="up"
            trendValue="5%"
          />
          <StatCard
            title="Total Customers"
            value={isLoadingStats ? "..." : stats.totalCustomers.toString()}
            icon={<Users className="h-full w-full" />}
            description="Active renters"
            trend="up"
            trendValue="12%"
          />
          <StatCard
            title="Monthly Revenue"
            value={isLoadingStats ? "..." : `$${stats.monthlyRevenue}`}
            icon={<DollarSign className="h-full w-full" />}
            description={`${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
            trend={revenueTrend.direction}
            trendValue={revenueTrend.value}
          />
        </div>
        
        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <UnitStatusChart data={unitStatusData} />
          <RevenueChart data={revenueData} />
        </div>
        
        {/* Recent Activity & Alerts */}
        <div className="grid gap-4 md:grid-cols-2">
          <RecentRentals rentals={recentRentals} />
          <OverduePayments payments={overduePayments} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
