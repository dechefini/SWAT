import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Equipment } from "@shared/schema";
import { useParams } from "wouter";
// SWAT pages now use SwatLayout from App.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { QrScanner } from "@/components/qr/QrScanner";

// Equipment form schema
const equipmentFormSchema = z.object({
  name: z.string().min(2, { message: "Equipment name must be at least 2 characters." }),
  serialNumber: z.string().min(2, { message: "Serial number is required." }),
  category: z.string().min(2, { message: "Category is required." }),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  location: z.string().optional(),
  assignedToId: z.string().optional(),
  purchaseDate: z.string().optional(),
  condition: z.string(),
  lastMaintenance: z.string().optional(),
  nextMaintenance: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export default function EquipmentPage() {
  const { agencyId } = useParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const { toast } = useToast();

  // Fetch equipment for the agency
  const { data: equipment, isLoading } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'equipment'],
    enabled: !!agencyId,
  });

  // Fetch personnel for assignment dropdown
  const { data: personnel } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'personnel'],
    enabled: !!agencyId,
  });

  // Add new equipment mutation
  const addEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      return apiRequest(`/api/agencies/${agencyId}/equipment`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'equipment'] });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Equipment added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add equipment",
        variant: "destructive",
      });
    },
  });

  // Filter equipment based on active tab
  const filteredEquipment = equipment?.filter((item: Equipment) => {
    if (activeTab === "all") return true;
    if (activeTab === "assigned") return !!item.assignedToId;
    if (activeTab === "unassigned") return !item.assignedToId;
    if (activeTab === "maintenance") return item.status === "maintenance";
    return item.category && item.category.toLowerCase() === activeTab.toLowerCase();
  });

  // Get unique categories for tabs
  const categories = equipment
    ? [...new Set(equipment.map((item: Equipment) => item.category).filter(Boolean))]
    : [];

  // Form hook
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: "",
      serialNumber: "",
      category: "",
      manufacturer: "",
      model: "",
      location: "",
      assignedToId: "",
      purchaseDate: "",
      condition: "excellent",
      lastMaintenance: "",
      nextMaintenance: "",
      status: "operational",
      notes: "",
    },
  });

  // Handle form submission
  function onSubmit(data: EquipmentFormValues) {
    // Convert "unassigned" value back to empty string for the API
    if (data.assignedToId === "unassigned") {
      data.assignedToId = "";
    }
    addEquipmentMutation.mutate(data);
  }

  function viewEquipmentDetails(equipment: Equipment) {
    setSelectedEquipment(equipment);
  }

  function getAssignedPersonName(personnelId: string) {
    if (!personnel) return "Unknown";
    const person = personnel.find((p: any) => p.id === personnelId);
    return person ? `${person.firstName} ${person.lastName}` : "Unknown";
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsQrScannerOpen(true)}
              className="flex items-center"
            >
              <Icons.qrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>Add Equipment</Button>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-6">
          <Input
            placeholder="Search equipment..."
            className="pl-10 pr-10"
          />
          <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Inventory Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Items</span>
                    <span className="text-2xl font-bold">{equipment?.length || 0}</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Categories</span>
                    <span className="text-2xl font-bold">{categories?.length || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Due for Service</span>
                    <span className="text-2xl font-bold text-amber-500">
                      {equipment?.filter((item: any) => item.status === "service_due")?.length || 0}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Under Repair</span>
                    <span className="text-2xl font-bold text-red-500">
                      {equipment?.filter((item: any) => item.status === "repair")?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-red-600">Critical</p>
                      <p className="text-sm text-muted-foreground">
                        {equipment?.filter((item: any) => item.status === "repair")?.length || 0} items require immediate attention
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-amber-500">Upcoming</p>
                      <p className="text-sm text-muted-foreground">
                        {equipment?.filter((item: any) => item.status === "service_due")?.length || 0} maintenance appointments due
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SWAT Team Equipment</CardTitle>
            <CardDescription>
              Track and manage all equipment, maintenance, and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 flex flex-wrap">
                <TabsTrigger value="all">All Equipment</TabsTrigger>
                <TabsTrigger value="assigned">Assigned</TabsTrigger>
                <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
                <TabsTrigger value="maintenance">In Maintenance</TabsTrigger>
                {categories.map((category) => category && (
                  <TabsTrigger key={category} value={category.toLowerCase()}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Icons.spinner className="h-8 w-8 animate-spin" />
                  </div>
                ) : !filteredEquipment || filteredEquipment.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No equipment found</p>
                    <Button 
                      onClick={() => setIsAddModalOpen(true)}
                      variant="outline" 
                      className="mt-4"
                    >
                      Add your first equipment item
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Serial #</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipment.map((item: Equipment) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.serialNumber}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                item.status === "operational" ? "default" :
                                item.status === "maintenance" ? "secondary" :
                                item.status === "repair" || item.status === "service_due" ? "destructive" :
                                "outline"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.assignedToId ? getAssignedPersonName(item.assignedToId) : "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                item.condition === "excellent" ? "default" :
                                item.condition === "good" ? "secondary" :
                                item.condition === "fair" ? "outline" :
                                "destructive"
                              }
                            >
                              {item.condition}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewEquipmentDetails(item)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Equipment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>
              Enter the details of the new equipment item.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tactical Rifle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="AR-123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Firearms">Firearms</SelectItem>
                          <SelectItem value="Protection">Protection</SelectItem>
                          <SelectItem value="Communication">Communication</SelectItem>
                          <SelectItem value="Tactical">Tactical</SelectItem>
                          <SelectItem value="Breaching">Breaching</SelectItem>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Medical">Medical</SelectItem>
                          <SelectItem value="Clothing">Clothing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="Colt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="M4A1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Armory" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {personnel?.map((person: any) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.firstName} {person.lastName} ({person.badgeNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="maintenance">In Maintenance</SelectItem>
                          <SelectItem value="service_due">Service Due</SelectItem>
                          <SelectItem value="repair">Needs Repair</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lastMaintenance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Maintenance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nextMaintenance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Maintenance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about this equipment" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addEquipmentMutation.isPending}
                >
                  {addEquipmentMutation.isPending ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Equipment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Equipment Details Modal */}
      {selectedEquipment && (
        <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Equipment Details</DialogTitle>
              <DialogDescription>
                Complete information about this equipment item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {selectedEquipment.category.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold">{selectedEquipment.name}</h3>
                  <p className="text-muted-foreground">{selectedEquipment.category}</p>
                  <Badge 
                    variant={
                      selectedEquipment.status === "operational" ? "default" :
                      selectedEquipment.status === "maintenance" ? "secondary" :
                      selectedEquipment.status === "repair" || selectedEquipment.status === "service_due" ? "destructive" :
                      "outline"
                    }
                  >
                    {selectedEquipment.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Serial Number</h4>
                  <p>{selectedEquipment.serialNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Manufacturer/Model</h4>
                  <p>{selectedEquipment.manufacturer} {selectedEquipment.model}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Location</h4>
                  <p>{selectedEquipment.location || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Assigned To</h4>
                  <p>
                    {selectedEquipment.assignedToId 
                      ? getAssignedPersonName(selectedEquipment.assignedToId) 
                      : "Unassigned"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Condition</h4>
                  <Badge 
                    variant={
                      selectedEquipment.condition === "excellent" ? "default" :
                      selectedEquipment.condition === "good" ? "secondary" :
                      selectedEquipment.condition === "fair" ? "outline" :
                      "destructive"
                    }
                  >
                    {selectedEquipment.condition}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Purchase Date</h4>
                  <p>{selectedEquipment.purchaseDate ? new Date(selectedEquipment.purchaseDate).toLocaleDateString() : "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Last Maintenance</h4>
                  <p>{selectedEquipment.lastMaintenance ? new Date(selectedEquipment.lastMaintenance).toLocaleDateString() : "Not recorded"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Next Maintenance</h4>
                  <p>{selectedEquipment.nextMaintenance ? new Date(selectedEquipment.nextMaintenance).toLocaleDateString() : "Not scheduled"}</p>
                </div>
              </div>

              {selectedEquipment.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="whitespace-pre-wrap">{selectedEquipment.notes}</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEquipment(null)}>Close</Button>
              {/* Additional action buttons can be added here */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Scan Equipment QR Code</DialogTitle>
            <DialogDescription>
              Use your camera to scan a QR code on equipment to quickly find or update it.
            </DialogDescription>
          </DialogHeader>
          <QrScanner 
            onScan={(decodedText) => {
              // Handle the QR code scan result
              // Expected format: serialNumber or some equipment identifier
              if (decodedText) {
                // Find equipment by serial number
                const foundEquipment = equipment?.find((item: Equipment) => 
                  item.serialNumber === decodedText || item.id === decodedText
                );
                
                if (foundEquipment) {
                  // Show equipment details
                  setSelectedEquipment(foundEquipment);
                  setIsQrScannerOpen(false);
                } else {
                  // Equipment not found
                  toast({
                    title: "Equipment Not Found",
                    description: `No equipment found with identifier: ${decodedText}`,
                    variant: "destructive",
                  });
                }
              }
            }}
            onClose={() => setIsQrScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}