import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Certification, Personnel } from "@shared/schema";
import { useParams } from "wouter";
// SWAT pages now use SwatLayout from App.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Certification schema
const certificationFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().min(2, { message: "Description is required." }),
  issuing_authority: z.string().min(2, { message: "Issuing authority is required." }),
  validity_period: z.number().min(1, { message: "Validity period is required." }),
  required_training: z.string(),
  renewal_requirements: z.string().optional(),
});

type CertificationFormValues = z.infer<typeof certificationFormSchema>;

// Personnel Certification schema
const personnelCertificationFormSchema = z.object({
  personnel_id: z.string().min(1, { message: "Personnel is required." }),
  certification_id: z.string().min(1, { message: "Certification is required." }),
  issue_date: z.string().min(1, { message: "Issue date is required." }),
  expiry_date: z.string().min(1, { message: "Expiry date is required." }),
  status: z.string(),
  notes: z.string().optional(),
});

type PersonnelCertificationFormValues = z.infer<typeof personnelCertificationFormSchema>;

export default function CertificationPage() {
  const { agencyId } = useParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Fetch certifications for the agency
  const { data: certifications, isLoading } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'certifications'],
    enabled: !!agencyId,
  });

  // Fetch personnel for assignment
  const { data: personnel } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'personnel'],
    enabled: !!agencyId,
  });

  // Add new certification mutation
  const addCertificationMutation = useMutation({
    mutationFn: async (data: any) => {
      // Process data for API
      const formattedData = {
        ...data,
        required_training: data.required_training ? JSON.parse(data.required_training) : {},
      };

      return apiRequest(`/api/agencies/${agencyId}/certifications`, {
        method: "POST",
        body: JSON.stringify(formattedData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'certifications'] });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Certification added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add certification",
        variant: "destructive",
      });
    },
  });

  // Assign certification to personnel mutation
  const assignCertificationMutation = useMutation({
    mutationFn: async (data: PersonnelCertificationFormValues) => {
      return apiRequest(`/api/personnel/${data.personnel_id}/certifications`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // We would need to refresh personnel certifications if we had that query
      setIsAssignModalOpen(false);
      toast({
        title: "Success",
        description: "Certification assigned successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign certification",
        variant: "destructive",
      });
    },
  });

  // Certification form hook
  const certificationForm = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      issuing_authority: "",
      validity_period: 12,
      required_training: JSON.stringify({
        hours: 40,
        courses: []
      }),
      renewal_requirements: "",
    },
  });

  // Personnel certification form hook
  const assignForm = useForm<PersonnelCertificationFormValues>({
    resolver: zodResolver(personnelCertificationFormSchema),
    defaultValues: {
      personnel_id: "",
      certification_id: "",
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      status: "active",
      notes: "",
    },
  });

  // Handle certification form submission
  function onSubmitCertification(data: CertificationFormValues) {
    addCertificationMutation.mutate(data);
  }

  // Handle assign certification form submission
  function onSubmitAssign(data: PersonnelCertificationFormValues) {
    assignCertificationMutation.mutate(data);
  }

  function viewCertificationDetails(certification: Certification) {
    setSelectedCertification(certification);
  }

  function openAssignModal(certificationId?: string) {
    if (certificationId) {
      assignForm.setValue("certification_id", certificationId);
    }
    setIsAssignModalOpen(true);
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Certification Management</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => openAssignModal()}>
              Assign Certification
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              Add Certification
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SWAT Team Certifications</CardTitle>
            <CardDescription>
              Manage certifications, track qualifications, and monitor expiration dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Icons.spinner className="h-8 w-8 animate-spin" />
              </div>
            ) : !certifications || certifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No certifications found</p>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline" 
                  className="mt-4"
                >
                  Add your first certification
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certification</TableHead>
                    <TableHead>Issuing Authority</TableHead>
                    <TableHead>Validity (Months)</TableHead>
                    <TableHead>Required Training</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certifications.map((cert: Certification) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.name}</TableCell>
                      <TableCell>{cert.issuing_authority}</TableCell>
                      <TableCell>{cert.validity_period}</TableCell>
                      <TableCell>
                        {typeof cert.required_training === 'string' 
                          ? JSON.parse(cert.required_training).hours + " hours"
                          : cert.required_training?.hours + " hours"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => viewCertificationDetails(cert)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openAssignModal(cert.id)}
                          >
                            Assign
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

      {/* Add Certification Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Certification</DialogTitle>
            <DialogDescription>
              Enter the details of the new certification.
            </DialogDescription>
          </DialogHeader>
          <Form {...certificationForm}>
            <form onSubmit={certificationForm.handleSubmit(onSubmitCertification)} className="space-y-4">
              <FormField
                control={certificationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Advanced Tactical Operations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={certificationForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the certification..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={certificationForm.control}
                  name="issuing_authority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuing Authority</FormLabel>
                      <FormControl>
                        <Input placeholder="National Tactical Officers Association" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={certificationForm.control}
                  name="validity_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity Period (Months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="12" 
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={certificationForm.control}
                name="required_training"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Training (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{"hours": 40, "courses": ["Basic SWAT", "Advanced Tactics"]}' 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter JSON object with hours and courses array
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={certificationForm.control}
                name="renewal_requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Requirements to renew this certification..." 
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
                  disabled={addCertificationMutation.isPending}
                >
                  {addCertificationMutation.isPending ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Certification"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Certification Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assign Certification to Personnel</DialogTitle>
            <DialogDescription>
              Assign a certification to a team member.
            </DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onSubmitAssign)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="personnel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Member</FormLabel>
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
                        {personnel?.map((person: Personnel) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName} ({person.badge_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignForm.control}
                name="certification_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select certification" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {certifications?.map((cert: Certification) => (
                          <SelectItem key={cert.id} value={cert.id}>
                            {cert.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assignForm.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={assignForm.control}
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes..." 
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
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={assignCertificationMutation.isPending}
                >
                  {assignCertificationMutation.isPending ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Assign Certification"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Certification Details Modal */}
      {selectedCertification && (
        <Dialog open={!!selectedCertification} onOpenChange={() => setSelectedCertification(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Certification Details</DialogTitle>
              <DialogDescription>
                Complete information about this certification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {selectedCertification.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold">{selectedCertification.name}</h3>
                  <p className="text-muted-foreground">{selectedCertification.issuing_authority}</p>
                  <Badge variant="outline">
                    {selectedCertification.validity_period} months validity
                  </Badge>
                </div>
              </div>

              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="whitespace-pre-wrap">{selectedCertification.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Required Training</h4>
                {(() => {
                  let requiredTraining;
                  
                  if (typeof selectedCertification.required_training === 'string') {
                    requiredTraining = JSON.parse(selectedCertification.required_training);
                  } else {
                    requiredTraining = selectedCertification.required_training;
                  }
                  
                  return (
                    <div>
                      <p><strong>Hours:</strong> {requiredTraining?.hours || 'N/A'}</p>
                      {requiredTraining?.courses && requiredTraining.courses.length > 0 && (
                        <>
                          <p className="mt-2"><strong>Courses:</strong></p>
                          <ul className="list-disc pl-5 space-y-1">
                            {requiredTraining.courses.map((course: string, index: number) => (
                              <li key={index}>{course}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {selectedCertification.renewal_requirements && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Renewal Requirements</h4>
                    <p className="whitespace-pre-wrap">{selectedCertification.renewal_requirements}</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCertification(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedCertification(null);
                  openAssignModal(selectedCertification.id);
                }}
              >
                Assign to Personnel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}