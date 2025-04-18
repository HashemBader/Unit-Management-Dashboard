
import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Building, 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield,
  CreditCard,
  Mail,
  Plus
} from "lucide-react";

const Settings = () => {
  const [companyName, setCompanyName] = useState("Storage Solutions Inc.");
  const [email, setEmail] = useState("admin@storagesolutions.com");
  const [phone, setPhone] = useState("(555) 123-4567");
  const [address, setAddress] = useState("123 Storage Ln, Anytown, CA 94568");
  const [taxRate, setTaxRate] = useState("7.5");
  const [lateFeeAmount, setLateFeeAmount] = useState("25");
  const [lateFeeGracePeriod, setLateFeeGracePeriod] = useState("5");
  
  // Toggle states
  const [sendPaymentReminders, setSendPaymentReminders] = useState(true);
  const [sendOverdueNotices, setSendOverdueNotices] = useState(true);
  const [autoAssignUnits, setAutoAssignUnits] = useState(false);
  const [autoGenerateInvoices, setAutoGenerateInvoices] = useState(true);
  
  // Users for user management tab
  const users = [
    {
      id: "1",
      name: "Admin User",
      email: "admin@storagesolutions.com",
      role: "Administrator",
      lastLogin: "Today at 9:45 AM",
    },
    {
      id: "2",
      name: "Staff User",
      email: "staff@storagesolutions.com",
      role: "Staff",
      lastLogin: "Yesterday at 3:20 PM",
    },
    {
      id: "3",
      name: "View Only",
      email: "viewer@storagesolutions.com",
      role: "Viewer",
      lastLogin: "June 12, 2023 at 11:30 AM",
    },
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" /> Company Information
                </CardTitle>
                <CardDescription>
                  Update your company details and facility information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input 
                      id="taxRate" 
                      value={taxRate} 
                      onChange={(e) => setTaxRate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" /> System Settings
                </CardTitle>
                <CardDescription>
                  Configure general system behavior and automations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Auto-assign Units</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign units based on customer preferences
                    </p>
                  </div>
                  <Switch
                    checked={autoAssignUnits}
                    onCheckedChange={setAutoAssignUnits}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Auto-generate Invoices</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate monthly invoices for active rentals
                    </p>
                  </div>
                  <Switch
                    checked={autoGenerateInvoices}
                    onCheckedChange={setAutoGenerateInvoices}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Payment Settings
                </CardTitle>
                <CardDescription>
                  Configure payment methods, late fees, and billing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lateFeeAmount">Late Fee Amount ($)</Label>
                    <Input 
                      id="lateFeeAmount" 
                      value={lateFeeAmount} 
                      onChange={(e) => setLateFeeAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lateFeeGracePeriod">Grace Period (Days)</Label>
                    <Input 
                      id="lateFeeGracePeriod" 
                      value={lateFeeGracePeriod} 
                      onChange={(e) => setLateFeeGracePeriod(e.target.value)}
                    />
                  </div>
                </div>
                <div className="pt-4 space-y-4">
                  <h4 className="text-sm font-medium">Accepted Payment Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="creditCard" defaultChecked />
                      <Label htmlFor="creditCard">Credit/Debit Cards</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="bankTransfer" defaultChecked />
                      <Label htmlFor="bankTransfer">Bank Transfer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="cash" defaultChecked />
                      <Label htmlFor="cash">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="check" />
                      <Label htmlFor="check">Check</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" /> Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure when and how notifications are sent to customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Payment Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      Send reminders 3 days before payment is due
                    </p>
                  </div>
                  <Switch
                    checked={sendPaymentReminders}
                    onCheckedChange={setSendPaymentReminders}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-medium">Overdue Notices</h4>
                    <p className="text-sm text-muted-foreground">
                      Send notifications when payments are overdue
                    </p>
                  </div>
                  <Switch
                    checked={sendOverdueNotices}
                    onCheckedChange={setSendOverdueNotices}
                  />
                </div>
                <div className="pt-4 space-y-2">
                  <Label htmlFor="emailFrom">Send Emails From</Label>
                  <Input 
                    id="emailFrom" 
                    placeholder="noreply@yourdomain.com" 
                    defaultValue="notifications@storagesolutions.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailTemplate">Email Signature</Label>
                  <Textarea 
                    id="emailTemplate" 
                    placeholder="Email signature text"
                    defaultValue="Thank you for choosing Storage Solutions Inc."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" /> Test Email
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* User Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" /> User Management
                    </CardTitle>
                    <CardDescription>
                      Manage users and their access permissions
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "Administrator" 
                                ? "default" 
                                : user.role === "Staff" 
                                  ? "secondary" 
                                  : "outline"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">
                              <Shield className="h-4 w-4 mr-1" /> Permissions
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
