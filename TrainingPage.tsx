import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Training, Personnel } from "@shared/schema";
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
import { Calendar } from "@/components/ui/calendar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

// Training form schema
const trainingFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  training_type: z.string().min(2, { message: "Type is required." }),
  priority: z.string(),
  status: z.string(),
  description: z.string().min(2, { message: "Description is required." }),
  date: z.string().min(2, { message: "Date is required." }),
  start_time: z.string().min(2, { message: "Start time is required." }),
  end_time: z.string().min(2, { message: "End time is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  instructor: z.string().min(2, { message: "Instructor name is required." }),
  participants: z.array(z.string()).optional(),
  required_equipment: z.array(z.string()).optional(),
  training_objectives: z.array(z.string()).optional(),
});

type TrainingFormValues = z.infer<typeof trainingFormSchema>;

export default function TrainingPage() {
  const { agencyId } = useParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [participantInput, setParticipantInput] = useState("");
  const [equipmentInput, setEquipmentInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch trainings for the agency
  const { data: trainings, isLoading } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'trainings'],
    enabled: !!agencyId,
  });

  // Fetch personnel for participant selection
  const { data: personnel } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'personnel'],
    enabled: !!agencyId,
  });

  // Add new training mutation
  const addTrainingMutation = useMutation({
    mutationFn: async (data: any) => {
      // Process data for API
      const formattedData = {
        ...data,
        start_date: data.date,
        end_date: data.date,
        participants: JSON.stringify(data.participants || []),
        required_equipment: JSON.stringify(data.required_equipment || []),
        training_objectives: JSON.stringify(data.training_objectives || []),
      };

      return apiRequest(`/api/agencies/${agencyId}/trainings`, {
        method: "POST",
        body: JSON.stringify(formattedData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'trainings'] });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Training session added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add training session",
        variant: "destructive",
      });
    },
  });

  // Filter trainings based on active tab
  const filteredTrainings = trainings?.filter((training: Training) => {
    const today = new Date();
    const startDate = new Date(training.start_date);
    
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return startDate >= today && training.status !== "completed";
    if (activeTab === "completed") return training.status === "completed";
    if (activeTab === "canceled") return training.status === "canceled";
    return training.training_type === activeTab;
  });

  // Get unique training types for tabs
  const trainingTypes = trainings
    ? [...new Set(trainings.map((training: Training) => training.training_type).filter(Boolean))]
    : [];

  // Form hook
  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      training_type: "",
      date: "",
      start_time: "09:00",
      end_time: "17:00",
      location: "",
      instructor: "",
      participants: [],
      required_equipment: [],
      training_objectives: [],
      priority: "medium",
      status: "scheduled",
    },
  });

  // Handle form submission
  function onSubmit(data: TrainingFormValues) {
    addTrainingMutation.mutate(data);
  }

  function viewTrainingDetails(training: Training) {
    // Convert string JSON to arrays where needed
    let processedTraining = {
      ...training,
      participants: typeof training.participants === 'string' 
        ? JSON.parse(training.participants)
        : training.participants,
      required_equipment: typeof training.required_equipment === 'string'
        ? JSON.parse(training.required_equipment)
        : training.required_equipment,
      training_objectives: typeof training.training_objectives === 'string'
        ? JSON.parse(training.training_objectives)
        : training.training_objectives,
    };
    
    setSelectedTraining(processedTraining);
  }

  function getParticipantNames(participantIds: string[]) {
    if (!personnel || !participantIds || !participantIds.length) return "None";
    
    const participantNames = participantIds.map(id => {
      const person = personnel.find((p: Personnel) => p.id === id);
      return person ? `${person.firstName} ${person.lastName}` : "Unknown";
    });
    
    if (participantNames.length <= 2) return participantNames.join(" and ");
    return `${participantNames.slice(0, 2).join(", ")} and ${participantNames.length - 2} more`;
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Training Management</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>Schedule Training</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>SWAT Team Trainings</CardTitle>
            <CardDescription>
              Schedule, track, and manage training sessions for your SWAT team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="upcoming" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 flex flex-wrap">
                <TabsTrigger value="all">All Trainings</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="canceled">Canceled</TabsTrigger>
                {trainingTypes.map((type) => type && (
                  <TabsTrigger key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Icons.spinner className="h-8 w-8 animate-spin" />
                  </div>
                ) : !filteredTrainings || filteredTrainings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No training sessions found</p>
                    <Button 
                      onClick={() => setIsAddModalOpen(true)}
                      variant="outline" 
                      className="mt-4"
                    >
                      Schedule your first training
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Training</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrainings.map((training: Training) => (
                        <TableRow key={training.id}>
                          <TableCell className="font-medium">{training.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {training.training_type ? (
                                training.training_type.charAt(0).toUpperCase() + training.training_type.slice(1)
                              ) : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(training.start_date).toLocaleDateString()}
                            {training.start_date !== training.end_date && 
                              ` - ${new Date(training.end_date).toLocaleDateString()}`
                            }
                          </TableCell>
                          <TableCell>{training.location}</TableCell>
                          <TableCell>{training.instructor}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                training.status === "scheduled" ? "default" :
                                training.status === "completed" ? "secondary" :
                                training.status === "canceled" ? "destructive" :
                                "outline"
                              }
                            >
                              {training.status ? (
                                training.status.charAt(0).toUpperCase() + training.status.slice(1)
                              ) : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewTrainingDetails(training)}
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

      {/* Add Training Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule New Training</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter training title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="training_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Type *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tactical">Tactical</SelectItem>
                          <SelectItem value="firearms">Firearms</SelectItem>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="scenario">Scenario</SelectItem>
                          <SelectItem value="classroom">Classroom</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="communications">Communications</SelectItem>
                          <SelectItem value="teambuilding">Team Building</SelectItem>
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <FormDescription className="text-xs text-muted-foreground">
                        (Option Priority)
                      </FormDescription>
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
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <FormDescription className="text-xs text-muted-foreground">
                        (Change status)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter training description and details" 
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                      <FormLabel>Location *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="headquarters">Headquarters</SelectItem>
                          <SelectItem value="training_range">Training Range</SelectItem>
                          <SelectItem value="field_site">Field Site</SelectItem>
                          <SelectItem value="tactical_house">Tactical House</SelectItem>
                          <SelectItem value="shooting_range">Shooting Range</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter instructor's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormLabel>Participants</FormLabel>
                <div className="flex flex-row gap-2 mt-1">
                  <Input placeholder="Enter participant name" className="flex-grow" />
                  <Button type="button" variant="default" size="sm" className="shrink-0">+ Add</Button>
                </div>
              </div>
              
              <div>
                <FormLabel>Required Equipment</FormLabel>
                <div className="flex flex-row gap-2 mt-1">
                  <Input placeholder="Enter required equipment" className="flex-grow" />
                  <Button type="button" variant="default" size="sm" className="shrink-0">+ Add</Button>
                </div>
              </div>
              
              <div>
                <FormLabel>Training Objectives</FormLabel>
                <div className="flex flex-row gap-2 mt-1">
                  <Input placeholder="Enter training objective" className="flex-grow" />
                  <Button type="button" variant="default" size="sm" className="shrink-0">+ Add</Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this training session" 
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
                  disabled={addTrainingMutation.isPending}
                >
                  {addTrainingMutation.isPending ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Schedule Training"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Training Details Modal */}
      {selectedTraining && (
        <Dialog open={!!selectedTraining} onOpenChange={() => setSelectedTraining(null)}>
          <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle>Training Details</DialogTitle>
              <DialogDescription>
                Complete information about this training session.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-muted p-2 rounded-md">
                  <Badge 
                    variant={
                      selectedTraining.priority === "high" || selectedTraining.priority === "critical" ? "default" :
                      selectedTraining.priority === "medium" ? "secondary" :
                      "outline"
                    }
                    className="text-xs"
                  >
                    {selectedTraining.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold">{selectedTraining.title}</h3>
                  <p className="text-muted-foreground">
                    {selectedTraining.training_type ? (
                      `${selectedTraining.training_type.charAt(0).toUpperCase() + selectedTraining.training_type.slice(1)} Training`
                    ) : 'Unknown Training Type'}
                  </p>
                  <Badge 
                    variant={
                      selectedTraining.status === "scheduled" ? "default" :
                      selectedTraining.status === "completed" ? "secondary" :
                      selectedTraining.status === "canceled" ? "destructive" :
                      "outline"
                    }
                  >
                    {selectedTraining.status ? (
                      selectedTraining.status.charAt(0).toUpperCase() + selectedTraining.status.slice(1)
                    ) : 'Unknown'}
                  </Badge>
                </div>
              </div>

              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="whitespace-pre-wrap">{selectedTraining.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Date</h4>
                  <p>
                    {new Date(selectedTraining.start_date).toLocaleDateString()}
                    {selectedTraining.start_date !== selectedTraining.end_date && 
                      ` - ${new Date(selectedTraining.end_date).toLocaleDateString()}`
                    }
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Time</h4>
                  <p>{selectedTraining.start_time} - {selectedTraining.end_time}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Location</h4>
                  <p>{selectedTraining.location}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Instructor</h4>
                  <p>{selectedTraining.instructor}</p>
                </div>
              </div>
              
              {selectedTraining.training_objectives && selectedTraining.training_objectives.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Training Objectives</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {Array.isArray(selectedTraining.training_objectives) && selectedTraining.training_objectives.map((objective: string, index: number) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              
              {selectedTraining.required_equipment && selectedTraining.required_equipment.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Required Equipment</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {Array.isArray(selectedTraining.required_equipment) && selectedTraining.required_equipment.map((equipment: string, index: number) => (
                        <li key={index}>{equipment}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              
              {selectedTraining.participants && selectedTraining.participants.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Participants</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedTraining.participants) && personnel && selectedTraining.participants.map((id: string) => {
                        const person = personnel.find((p: Personnel) => p.id === id);
                        return person ? (
                          <Badge key={id} variant="outline">
                            {person.firstName} {person.lastName}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </>
              )}

              {selectedTraining.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="whitespace-pre-wrap">{selectedTraining.notes}</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTraining(null)}>Close</Button>
              {/* Additional action buttons can be added here */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}