import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Personnel } from "@shared/schema";
import { useParams } from "wouter";
// SWAT pages now use SwatLayout from App.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Search, X, Trash2, Plus, QrCode } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

// Emergency contact schema
const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

// Personnel form schema
const personnelFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  badgeNumber: z.string().min(2, { message: "Badge number is required." }),
  team: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  phone: z.string().optional(),
  role: z.string().min(2, { message: "Primary role is required." }),
  secondaryRole: z.string().optional(),
  status: z.string(),
  startDate: z.string().optional(),
  // Qualifications
  certifications: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  fitnessScore: z.number().optional(),
  lastEvaluation: z.string().optional(),
  nextEvaluation: z.string().optional(),
  // Equipment
  assignedEquipment: z.array(z.string()).optional(),
  // Emergency Contacts
  emergencyContacts: z.array(emergencyContactSchema).optional(),
  notes: z.string().optional(),
});

type PersonnelFormValues = z.infer<typeof personnelFormSchema>;

export default function PersonnelPage() {
  const { agencyId } = useParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEmergencyContactModalOpen, setIsEmergencyContactModalOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [newEmergencyContact, setNewEmergencyContact] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    address: "",
    isPrimary: false
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch personnel for the agency
  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'personnel'],
    enabled: !!agencyId,
  });
  
  // Fetch equipment for the agency (needed for equipment assignment)
  const { data: equipment = [] } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'equipment'],
    enabled: !!agencyId,
  });

  // Add new personnel mutation
  const addPersonnelMutation = useMutation({
    mutationFn: async (data: PersonnelFormValues) => {
      return apiRequest("POST", `/api/agencies/${agencyId}/personnel`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'personnel'] });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    },
  });

  // Form hook
  const form = useForm<PersonnelFormValues>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      badgeNumber: "",
      team: "",
      role: "",
      secondaryRole: "",
      status: "available",
      email: "",
      phone: "",
      startDate: "",
      // New fields from schema
      certifications: [],
      specialties: [],
      fitnessScore: undefined,
      lastEvaluation: "",
      nextEvaluation: "",
      assignedEquipment: [],
      emergencyContacts: [],
      notes: "",
    },
  });

  // Handle form submission
  function onSubmit(data: PersonnelFormValues) {
    addPersonnelMutation.mutate(data);
  }

  function viewPersonnelDetails(personnel: Personnel) {
    setSelectedPersonnel(personnel);
  }

  // Filter personnel based on search query
  const filteredPersonnel = Array.isArray(personnel) 
    ? personnel.filter(person => 
        person.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        person.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.badgeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.role?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Personnel Management</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>Add Operator</Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search Personnel..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <X
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground"
              size={16}
              onClick={() => setSearchQuery("")}
            />
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Icons.spinner className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No personnel found</p>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline" 
                  className="mt-4"
                >
                  Add your first team member
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BADGE #</TableHead>
                    <TableHead>NAME</TableHead>
                    <TableHead>TEAM</TableHead>
                    <TableHead>CERTIFICATIONS</TableHead>
                    <TableHead>DUTY STATUS</TableHead>
                    <TableHead>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.map((person: Personnel) => (
                    <TableRow key={person.id}>
                      <TableCell>{person.badgeNumber}</TableCell>
                      <TableCell>
                        {person.firstName} {person.lastName}
                      </TableCell>
                      <TableCell>{person.team || "—"}</TableCell>
                      <TableCell>
                        {Array.isArray(person.certifications) && person.certifications.length > 0
                          ? person.certifications.join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            person.status === "available" ? "default" : 
                            person.status === "off-duty" ? "outline" : 
                            person.status === "training" ? "secondary" : "destructive"
                          }
                        >
                          {person.status || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => viewPersonnelDetails(person)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Personnel Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Operator</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="basicInfo" className="w-full">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="basicInfo">Basic Info</TabsTrigger>
                  <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basicInfo" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="badgeNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Badge Number</FormLabel>
                          <FormControl>
                            <Input placeholder="B-123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="team"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Team" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Alpha">Alpha</SelectItem>
                              <SelectItem value="Bravo">Bravo</SelectItem>
                              <SelectItem value="Charlie">Charlie</SelectItem>
                              <SelectItem value="Delta">Delta</SelectItem>
                              <SelectItem value="Echo">Echo</SelectItem>
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="qualifications" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Team Leader">Team Leader</SelectItem>
                              <SelectItem value="Assistant Team Leader">Assistant Team Leader</SelectItem>
                              <SelectItem value="Tactical Operator">Tactical Operator</SelectItem>
                              <SelectItem value="Sniper">Sniper</SelectItem>
                              <SelectItem value="Breacher">Breacher</SelectItem>
                              <SelectItem value="Negotiator">Negotiator</SelectItem>
                              <SelectItem value="Medic">Medic</SelectItem>
                              <SelectItem value="K9 Handler">K9 Handler</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondaryRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="Sniper">Sniper</SelectItem>
                              <SelectItem value="Breacher">Breacher</SelectItem>
                              <SelectItem value="Negotiator">Negotiator</SelectItem>
                              <SelectItem value="Medic">Medic</SelectItem>
                              <SelectItem value="Instructor">Instructor</SelectItem>
                              <SelectItem value="Drone Operator">Drone Operator</SelectItem>
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
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="on-duty">On Duty</SelectItem>
                              <SelectItem value="off-duty">Off Duty</SelectItem>
                              <SelectItem value="leave">On Leave</SelectItem>
                              <SelectItem value="training">In Training</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "MM/dd/yyyy")
                                  ) : (
                                    <span>MM/DD/YYYY</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Certifications Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Certifications</CardTitle>
                      <CardDescription>Add certifications achieved by the team member</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="certifications"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(field.value) && field.value.map((cert, index) => (
                                  <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                    {cert}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-0 pl-1 text-muted-foreground"
                                      onClick={() => {
                                        const newCerts = [...(field.value || [])];
                                        newCerts.splice(index, 1);
                                        field.onChange(newCerts);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Select
                                  onValueChange={(value) => {
                                    if (value && !field.value?.includes(value)) {
                                      field.onChange([...(field.value || []), value]);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Add certification" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Basic SWAT">Basic SWAT</SelectItem>
                                    <SelectItem value="Advanced SWAT">Advanced SWAT</SelectItem>
                                    <SelectItem value="Sniper I">Sniper I</SelectItem>
                                    <SelectItem value="Sniper II">Sniper II</SelectItem>
                                    <SelectItem value="Tactical Breacher">Tactical Breacher</SelectItem>
                                    <SelectItem value="Crisis Negotiator">Crisis Negotiator</SelectItem>
                                    <SelectItem value="Tactical Medic">Tactical Medic</SelectItem>
                                    <SelectItem value="Less Lethal Instructor">Less Lethal Instructor</SelectItem>
                                    <SelectItem value="Firearms Instructor">Firearms Instructor</SelectItem>
                                    <SelectItem value="Tactical K9 Handler">Tactical K9 Handler</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button 
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Custom certification
                                    const customCert = prompt("Enter custom certification:");
                                    if (customCert && !field.value?.includes(customCert)) {
                                      field.onChange([...(field.value || []), customCert]);
                                    }
                                  }}
                                >
                                  Custom
                                </Button>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Specialties Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Specialties</CardTitle>
                      <CardDescription>Add special skills and qualifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="specialties"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(field.value) && field.value.map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="mr-1 mb-1">
                                    {specialty}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-0 pl-1 text-muted-foreground"
                                      onClick={() => {
                                        const newSpecialties = [...(field.value || [])];
                                        newSpecialties.splice(index, 1);
                                        field.onChange(newSpecialties);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Select
                                  onValueChange={(value) => {
                                    if (value && !field.value?.includes(value)) {
                                      field.onChange([...(field.value || []), value]);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Add specialty" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Rappelling">Rappelling</SelectItem>
                                    <SelectItem value="Drone Operations">Drone Operations</SelectItem>
                                    <SelectItem value="Tactical Driving">Tactical Driving</SelectItem>
                                    <SelectItem value="Explosive Recognition">Explosive Recognition</SelectItem>
                                    <SelectItem value="Technical Surveillance">Technical Surveillance</SelectItem>
                                    <SelectItem value="Night Operations">Night Operations</SelectItem>
                                    <SelectItem value="Water Operations">Water Operations</SelectItem>
                                    <SelectItem value="Chemical Munitions">Chemical Munitions</SelectItem>
                                    <SelectItem value="Foreign Language">Foreign Language</SelectItem>
                                    <SelectItem value="Close Protection">Close Protection</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button 
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Custom specialty
                                    const customSpecialty = prompt("Enter custom specialty:");
                                    if (customSpecialty && !field.value?.includes(customSpecialty)) {
                                      field.onChange([...(field.value || []), customSpecialty]);
                                    }
                                  }}
                                >
                                  Custom
                                </Button>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Fitness Score */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Physical Fitness</CardTitle>
                      <CardDescription>Record fitness evaluation results</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="fitnessScore"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fitness Score</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Score (0-100)" 
                                  min={0} 
                                  max={100} 
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    field.onChange(isNaN(value) ? undefined : value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>Assessment score (0-100)</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastEvaluation"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Last Evaluation Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), "MM/dd/yyyy")
                                      ) : (
                                        <span>MM/DD/YYYY</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nextEvaluation"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Next Scheduled Evaluation</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), "MM/dd/yyyy")
                                      ) : (
                                        <span>MM/DD/YYYY</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="equipment" className="pt-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Assigned Equipment</CardTitle>
                      <CardDescription>Manage equipment assigned to this operator</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="assignedEquipment"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                {Array.isArray(field.value) && field.value.length > 0 ? (
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Item</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead className="w-[80px]">Action</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {field.value.map((equipmentId, index) => {
                                          const equipItem = Array.isArray(equipment) 
                                            ? equipment.find(e => e.id === equipmentId) 
                                            : null;
                                          
                                          return (
                                            <TableRow key={index}>
                                              <TableCell>{equipItem?.name || equipmentId}</TableCell>
                                              <TableCell>{equipItem?.category || "Unknown"}</TableCell>
                                              <TableCell>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    const newEquipment = [...(field.value || [])];
                                                    newEquipment.splice(index, 1);
                                                    field.onChange(newEquipment);
                                                  }}
                                                  className="h-8 w-8 p-0 text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 border rounded-md border-dashed">
                                    <p className="text-sm text-muted-foreground">No equipment assigned</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-3">
                                <Label>Add Equipment</Label>
                                <div className="flex gap-2">
                                  <Select
                                    onValueChange={(value) => {
                                      if (value && !field.value?.includes(value)) {
                                        field.onChange([...(field.value || []), value]);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="flex-1">
                                      <SelectValue placeholder="Select equipment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.isArray(equipment) ? (
                                        equipment
                                          .filter(item => !field.value?.includes(item.id))
                                          .map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                              {item.name} ({item.category})
                                            </SelectItem>
                                          ))
                                      ) : (
                                        <SelectItem value="no-equipment">No equipment available</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    className="shrink-0"
                                    size="sm"
                                    onClick={() => {
                                      // QR Code scanner placeholder
                                      toast({
                                        title: "QR Scanning",
                                        description: "QR scanning functionality will be available after creating the operator.",
                                      });
                                    }}
                                  >
                                    <QrCode className="h-4 w-4 mr-2" />
                                    Scan QR
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="emergency" className="pt-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Emergency Contacts</CardTitle>
                      <CardDescription>Add emergency contact information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="emergencyContacts"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-4">
                              {Array.isArray(field.value) && field.value.length > 0 ? (
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Relationship</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead className="w-[80px]">Primary</TableHead>
                                        <TableHead className="w-[80px]">Action</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {field.value.map((contact, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{contact.name}</TableCell>
                                          <TableCell>{contact.relationship}</TableCell>
                                          <TableCell>{contact.phone}</TableCell>
                                          <TableCell>
                                            {contact.isPrimary && (
                                              <Badge variant="default">Primary</Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const newContacts = [...(field.value || [])];
                                                newContacts.splice(index, 1);
                                                field.onChange(newContacts);
                                              }}
                                              className="h-8 w-8 p-0 text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="text-center py-4 border rounded-md border-dashed">
                                  <p className="text-sm text-muted-foreground">No emergency contacts added</p>
                                </div>
                              )}
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  // Reset form and open modal
                                  setNewEmergencyContact({
                                    name: "",
                                    relationship: "",
                                    phone: "",
                                    email: "",
                                    address: "",
                                    isPrimary: false
                                  });
                                  setIsEmergencyContactModalOpen(true);
                                  
                                  // Store the update function for the emergency contacts field
                                  form.setValue('_tempFieldRef', field);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Emergency Contact
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Add any additional notes here..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addPersonnelMutation.isPending}
                >
                  {addPersonnelMutation.isPending ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Operator"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Personnel Details Modal */}
      {selectedPersonnel && (
        <Dialog open={!!selectedPersonnel} onOpenChange={() => setSelectedPersonnel(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Personnel Details</DialogTitle>
              <DialogDescription>
                Complete information about the team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {selectedPersonnel.firstName?.charAt(0)}
                    {selectedPersonnel.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold">
                    {selectedPersonnel.firstName} {selectedPersonnel.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedPersonnel.role}</p>
                  <Badge 
                    variant={
                      selectedPersonnel.status === "available" ? "default" : 
                      selectedPersonnel.status === "off-duty" ? "outline" : 
                      selectedPersonnel.status === "training" ? "secondary" : "destructive"
                    }
                  >
                    {selectedPersonnel.status}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Badge Number</h4>
                  <p>{selectedPersonnel.badgeNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Team</h4>
                  <p>{selectedPersonnel.team || "—"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Email</h4>
                  <p>{selectedPersonnel.email || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Phone</h4>
                  <p>{selectedPersonnel.phone || "—"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Primary Role</h4>
                  <p>{selectedPersonnel.role || "—"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Secondary Role</h4>
                  <p>{selectedPersonnel.secondaryRole || "—"}</p>
                </div>
              </div>
              
              {/* Emergency Contacts */}
              {Array.isArray(selectedPersonnel.emergencyContacts) && selectedPersonnel.emergencyContacts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Emergency Contacts</h4>
                    <div className="space-y-2">
                      {selectedPersonnel.emergencyContacts.map((contact, index) => (
                        <div key={index} className="rounded-md border p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">
                                {contact.name} 
                                {contact.isPrimary && <Badge className="ml-2" variant="default">Primary</Badge>}
                              </h5>
                              <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Phone:</span> {contact.phone}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span> {contact.email || "—"}
                            </div>
                            {contact.address && (
                              <div className="col-span-2">
                                <span className="font-medium">Address:</span> {contact.address}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Notes */}
              {selectedPersonnel.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="whitespace-pre-wrap">{selectedPersonnel.notes}</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPersonnel(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Emergency Contact Modal */}
      <Dialog open={isEmergencyContactModalOpen} onOpenChange={setIsEmergencyContactModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Enter emergency contact information for this team member.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="name">Name*</Label>
                <Input 
                  id="name" 
                  placeholder="Full name" 
                  value={newEmergencyContact.name}
                  onChange={(e) => setNewEmergencyContact({...newEmergencyContact, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="relationship">Relationship*</Label>
                <Input 
                  id="relationship" 
                  placeholder="e.g. Spouse, Parent, Sibling" 
                  value={newEmergencyContact.relationship}
                  onChange={(e) => setNewEmergencyContact({...newEmergencyContact, relationship: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number*</Label>
                <Input 
                  id="phone" 
                  placeholder="Phone number" 
                  value={newEmergencyContact.phone}
                  onChange={(e) => setNewEmergencyContact({...newEmergencyContact, phone: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Email address" 
                  value={newEmergencyContact.email}
                  onChange={(e) => setNewEmergencyContact({...newEmergencyContact, email: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input 
                  id="address" 
                  placeholder="Home address" 
                  value={newEmergencyContact.address}
                  onChange={(e) => setNewEmergencyContact({...newEmergencyContact, address: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="isPrimary" 
                  checked={newEmergencyContact.isPrimary}
                  onCheckedChange={(checked) => 
                    setNewEmergencyContact({...newEmergencyContact, isPrimary: !!checked})
                  }
                />
                <Label htmlFor="isPrimary" className="cursor-pointer">Set as primary emergency contact</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEmergencyContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Validate required fields
                if (!newEmergencyContact.name || !newEmergencyContact.relationship || !newEmergencyContact.phone) {
                  toast({
                    title: "Missing information",
                    description: "Please fill in all required fields.",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Get the current field value and fieldRef from form context
                const fieldRef = form.getValues('_tempFieldRef');
                const currentContacts = fieldRef?.value || [];
                
                // Make a copy of the current contacts
                const updatedContacts = [...currentContacts];
                
                // If this is a primary contact, set all others to non-primary
                if (newEmergencyContact.isPrimary) {
                  updatedContacts.forEach(contact => {
                    contact.isPrimary = false;
                  });
                }
                
                // Add the new contact
                updatedContacts.push(newEmergencyContact);
                
                // Update the form field
                fieldRef.onChange(updatedContacts);
                
                // Close the modal
                setIsEmergencyContactModalOpen(false);
              }}
            >
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}