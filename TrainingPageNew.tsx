import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";

// UI Components
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
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Form schema to match database schema fields
const trainingFormSchema = z.object({
  title: z.string().min(2, { message: "Title is required" }),
  trainingType: z.string().min(2, { message: "Type is required" }),
  priority: z.string(),
  status: z.string(),
  description: z.string().optional(),
  startDate: z.string().min(2, { message: "Start date is required" }),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  instructor: z.string().optional(),
  participants: z.array(z.string()).default([]),
  requiredEquipment: z.array(z.string()).default([]),
  trainingObjectives: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// Define the type for form values
type TrainingFormValues = z.infer<typeof trainingFormSchema>;

// Type for Personnel
interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

// Type for Training
interface Training {
  id: string;
  title: string;
  description: string | null;
  trainingType: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  instructor: string | null;
  participants: string[] | null;
  requiredEquipment: string[] | null;
  trainingObjectives: string[] | null;
  priority: "low" | "medium" | "high" | null;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | null;
  notes: string | null;
  [key: string]: any;
}

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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch trainings for the agency
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'trainings'],
    enabled: !!agencyId,
  });

  // Fetch personnel for participant selection
  const { data: personnel = [] } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'personnel'],
    enabled: !!agencyId,
  });

  // Add new training mutation
  const addTrainingMutation = useMutation({
    mutationFn: async (data: TrainingFormValues) => {
      return apiRequest(`/api/agencies/${agencyId}/trainings`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'trainings'] });
      setIsAddModalOpen(false);
      resetArrays();
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

  // Form hook
  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      title: "",
      trainingType: "",
      description: "",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      instructor: "",
      participants: [],
      requiredEquipment: [],
      trainingObjectives: [],
      priority: "medium",
      status: "scheduled",
      notes: "",
    },
  });

  // Filter trainings based on active tab
  const filteredTrainings = Array.isArray(trainings) ? trainings.filter((training: Training) => {
    const today = new Date();
    const startDate = new Date(training.startDate);
    
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return startDate >= today && training.status !== "completed";
    if (activeTab === "completed") return training.status === "completed";
    if (activeTab === "cancelled") return training.status === "cancelled";
    return training.trainingType === activeTab;
  }) : [];

  // Get unique training types for tabs
  const trainingTypes = Array.isArray(trainings) ? 
    [...new Set(trainings.map((training: Training) => training.trainingType).filter(Boolean))] : [];

  // Functions to handle array inputs
  const addParticipant = () => {
    if (participantInput) {
      setParticipants([...participants, participantInput]);
      form.setValue('participants', [...participants, participantInput]);
      setParticipantInput("");
    }
  };

  const addEquipment = () => {
    if (equipmentInput) {
      setEquipment([...equipment, equipmentInput]);
      form.setValue('requiredEquipment', [...equipment, equipmentInput]);
      setEquipmentInput("");
    }
  };

  const addObjective = () => {
    if (objectiveInput) {
      setObjectives([...objectives, objectiveInput]);
      form.setValue('trainingObjectives', [...objectives, objectiveInput]);
      setObjectiveInput("");
    }
  };

  const removeItem = (array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>, formField: 'participants' | 'requiredEquipment' | 'trainingObjectives', index: number) => {
    const newArray = array.filter((_, i) => i !== index);
    setArray(newArray);
    form.setValue(formField, newArray);
  };

  // Reset array states
  const resetArrays = () => {
    setParticipants([]);
    setEquipment([]);
    setObjectives([]);
    setParticipantInput("");
    setEquipmentInput("");
    setObjectiveInput("");
  };

  // Handle form submission
  function onSubmit(data: TrainingFormValues) {
    // Ensure arrays are included
    data.participants = participants;
    data.requiredEquipment = equipment;
    data.trainingObjectives = objectives;
    
    addTrainingMutation.mutate(data);
  }

  function viewTrainingDetails(training: Training) {
    setSelectedTraining(training);
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
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
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
                              {training.trainingType ? (
                                training.trainingType.charAt(0).toUpperCase() + training.trainingType.slice(1)
                              ) : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(training.startDate).toLocaleDateString()}
                            {training.startDate !== training.endDate && training.endDate && 
                              ` - ${new Date(training.endDate).toLocaleDateString()}`
                            }
                          </TableCell>
                          <TableCell>{training.location}</TableCell>
                          <TableCell>{training.instructor}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                training.status === "scheduled" ? "default" :
                                training.status === "completed" ? "secondary" :
                                training.status === "cancelled" ? "destructive" :
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
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Schedule New Training</DialogTitle>
            <DialogDescription>
              Add details for the new training session.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                  name="trainingType"
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
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="certification">Certification</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                      <FormLabel>Priority Level</FormLabel>
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
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
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
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Training location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor</FormLabel>
                      <FormControl>
                        <Input placeholder="Training instructor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <FormLabel>Participants</FormLabel>
                  <div className="flex flex-row gap-2 mt-1">
                    <Select onValueChange={setParticipantInput}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select participant" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(personnel) && personnel.map((person: Personnel) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm" 
                      onClick={addParticipant}
                      disabled={!participantInput}
                    >
                      Add
                    </Button>
                  </div>
                  {participants.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {participants.map((id, index) => {
                        const person = Array.isArray(personnel) && personnel.find((p: Personnel) => p.id === id);
                        return (
                          <Badge key={index} variant="secondary" className="px-2 py-1">
                            {person ? `${person.firstName} ${person.lastName}` : id}
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeItem(participants, setParticipants, 'participants', index)}
                            >
                              ×
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div>
                  <FormLabel>Required Equipment</FormLabel>
                  <div className="flex flex-row gap-2 mt-1">
                    <Input 
                      placeholder="Enter required equipment" 
                      value={equipmentInput}
                      onChange={(e) => setEquipmentInput(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={addEquipment}
                      disabled={!equipmentInput}
                    >
                      Add
                    </Button>
                  </div>
                  {equipment.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {equipment.map((item, index) => (
                        <Badge key={index} variant="secondary" className="px-2 py-1">
                          {item}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeItem(equipment, setEquipment, 'requiredEquipment', index)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <FormLabel>Training Objectives</FormLabel>
                  <div className="flex flex-row gap-2 mt-1">
                    <Input 
                      placeholder="Enter training objective" 
                      value={objectiveInput}
                      onChange={(e) => setObjectiveInput(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={addObjective}
                      disabled={!objectiveInput}
                    >
                      Add
                    </Button>
                  </div>
                  {objectives.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {objectives.map((objective, index) => (
                        <Badge key={index} variant="secondary" className="px-2 py-1">
                          {objective}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeItem(objectives, setObjectives, 'trainingObjectives', index)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetArrays();
                  }}
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
                      selectedTraining.priority === "high" ? "default" :
                      selectedTraining.priority === "medium" ? "secondary" :
                      "outline"
                    }
                    className="text-xs"
                  >
                    {selectedTraining.priority ? selectedTraining.priority.toUpperCase() : "MEDIUM"}
                  </Badge>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold">{selectedTraining.title}</h3>
                  <p className="text-muted-foreground">
                    {selectedTraining.trainingType ? (
                      `${selectedTraining.trainingType.charAt(0).toUpperCase() + selectedTraining.trainingType.slice(1)} Training`
                    ) : 'Unknown Training Type'}
                  </p>
                  <Badge 
                    variant={
                      selectedTraining.status === "scheduled" ? "default" :
                      selectedTraining.status === "completed" ? "secondary" :
                      selectedTraining.status === "cancelled" ? "destructive" :
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
              
              {selectedTraining.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="whitespace-pre-wrap">{selectedTraining.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Date</h4>
                  <p>
                    {new Date(selectedTraining.startDate).toLocaleDateString()}
                    {selectedTraining.startDate !== selectedTraining.endDate && selectedTraining.endDate && 
                      ` - ${new Date(selectedTraining.endDate).toLocaleDateString()}`
                    }
                  </p>
                </div>
                {selectedTraining.startTime && selectedTraining.endTime && (
                  <div>
                    <h4 className="text-sm font-medium">Time</h4>
                    <p>{selectedTraining.startTime} - {selectedTraining.endTime}</p>
                  </div>
                )}
                {selectedTraining.location && (
                  <div>
                    <h4 className="text-sm font-medium">Location</h4>
                    <p>{selectedTraining.location}</p>
                  </div>
                )}
                {selectedTraining.instructor && (
                  <div>
                    <h4 className="text-sm font-medium">Instructor</h4>
                    <p>{selectedTraining.instructor}</p>
                  </div>
                )}
              </div>
              
              {selectedTraining.trainingObjectives && selectedTraining.trainingObjectives.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Training Objectives</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {Array.isArray(selectedTraining.trainingObjectives) && selectedTraining.trainingObjectives.map((objective: string, index: number) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              
              {selectedTraining.requiredEquipment && selectedTraining.requiredEquipment.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Required Equipment</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {Array.isArray(selectedTraining.requiredEquipment) && selectedTraining.requiredEquipment.map((equipment: string, index: number) => (
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
                      {Array.isArray(selectedTraining.participants) && Array.isArray(personnel) && selectedTraining.participants.map((id: string) => {
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}