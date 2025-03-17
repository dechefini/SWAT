import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarIcon, 
  Info, 
  PencilIcon, 
  PlusCircle, 
  Search, 
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Define form schema for corrective actions
const correctiveActionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  dueDate: z.date({ required_error: "Due date is required" }),
  targetCompletionDate: z.date().optional(),
  responsibleParty: z.string().min(1, "Responsible party is required"),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["open", "in-progress", "completed", "cancelled"]),
  actionPlan: z.array(z.object({
    action: z.string(),
    checked: z.boolean().default(false)
  })).default([]),
  notes: z.string().optional(),
});

type CorrectiveActionFormValues = z.infer<typeof correctiveActionSchema>;

// Sample action plan items
const defaultActionItems = [
  { action: "Issue Identification and Analysis", checked: false },
  { action: "Immediate Corrective Measures", checked: false },
  { action: "Implementation Timeline", checked: false },
  { action: "Documentation Updates", checked: false },
  { action: "Follow-up Assessment", checked: false },
  { action: "Root Cause Assessment", checked: false },
  { action: "Resource Requirements", checked: false },
  { action: "Training Requirements", checked: false },
  { action: "Verification Method", checked: false },
  { action: "After Action Review", checked: false }
];

// Sample data for UI development
const sampleOpenItems = 5;
const sampleCompletedThisMonth = 12;

// Sample category data for visualization
const sampleCategories = [
  { name: 'Training Related', count: 8 },
  { name: 'Equipment Issues', count: 6 }
];

// Sample priority distribution
const samplePriorityDistribution = {
  high: 2,
  medium: 3,
  low: 0
};

// Sample corrective actions
const sampleCorrectiveActions = [
  {
    id: '1',
    title: 'Update Training Documentation',
    category: 'Training',
    dueDate: new Date('2024-03-25'),
    targetCompletionDate: new Date('2024-03-31'),
    responsibleParty: 'John Smith',
    priority: 'high',
    status: 'in-progress',
    actionPlan: [
      { action: "Issue Identification and Analysis", checked: true },
      { action: "Immediate Corrective Measures", checked: true },
      { action: "Documentation Updates", checked: false },
    ],
    notes: 'Initial review completed; updates in progress'
  },
  {
    id: '2',
    title: 'Equipment Maintenance Schedule',
    category: 'Equipment',
    dueDate: new Date('2024-03-30'),
    targetCompletionDate: null,
    responsibleParty: 'Sarah Johnson',
    priority: 'medium',
    status: 'open',
    actionPlan: [
      { action: "Issue Identification and Analysis", checked: true },
      { action: "Resource Requirements", checked: false },
    ],
    notes: ''
  }
];

export default function CorrectiveActionsPage() {
  const { agencyId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [newActionItem, setNewActionItem] = useState('');
  
  // Fetch corrective actions
  const { data: correctiveActions = sampleCorrectiveActions, isLoading } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'corrective-actions'],
    enabled: !!agencyId,
  });
  
  // Create form for adding new corrective action
  const addForm = useForm<CorrectiveActionFormValues>({
    resolver: zodResolver(correctiveActionSchema),
    defaultValues: {
      title: '',
      category: '',
      dueDate: new Date(),
      targetCompletionDate: undefined,
      responsibleParty: '',
      priority: 'medium',
      status: 'open',
      actionPlan: defaultActionItems,
      notes: '',
    },
  });
  
  // Create form for editing corrective action
  const editForm = useForm<CorrectiveActionFormValues>({
    resolver: zodResolver(correctiveActionSchema),
    defaultValues: {
      title: '',
      category: '',
      dueDate: new Date(),
      targetCompletionDate: undefined,
      responsibleParty: '',
      priority: 'medium',
      status: 'open',
      actionPlan: [],
      notes: '',
    },
  });
  
  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (data: CorrectiveActionFormValues) => {
      return await apiRequest(`/api/agencies/${agencyId}/corrective-actions`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Corrective action created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'corrective-actions'] });
      setAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create corrective action: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data: CorrectiveActionFormValues & { id: string }) => {
      const { id, ...formData } = data;
      return await apiRequest(`/api/agencies/${agencyId}/corrective-actions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Corrective action updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'corrective-actions'] });
      setEditDialogOpen(false);
      setSelectedAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update corrective action: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/agencies/${agencyId}/corrective-actions/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Corrective action deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies', agencyId, 'corrective-actions'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete corrective action: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Handle add form submission
  const onAddSubmit = (formData: CorrectiveActionFormValues) => {
    addMutation.mutate(formData);
  };
  
  // Handle edit form submission
  const onEditSubmit = (formData: CorrectiveActionFormValues) => {
    if (selectedAction) {
      editMutation.mutate({ ...formData, id: selectedAction.id });
    }
  };
  
  // Handle delete action
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this corrective action?')) {
      deleteMutation.mutate(id);
    }
  };
  
  // Handle edit action
  const handleEdit = (action: any) => {
    setSelectedAction(action);
    editForm.reset({
      title: action.title,
      category: action.category,
      dueDate: new Date(action.dueDate),
      targetCompletionDate: action.targetCompletionDate ? new Date(action.targetCompletionDate) : undefined,
      responsibleParty: action.responsibleParty,
      priority: action.priority,
      status: action.status,
      actionPlan: action.actionPlan || [],
      notes: action.notes || '',
    });
    setEditDialogOpen(true);
  };
  
  // Add new action item to the plan
  const addActionItem = (formContext: any) => {
    if (!newActionItem.trim()) return;
    
    const currentPlan = formContext.getValues('actionPlan') || [];
    formContext.setValue('actionPlan', [
      ...currentPlan,
      { action: newActionItem, checked: false }
    ]);
    
    setNewActionItem('');
  };
  
  // Filter corrective actions based on search query
  const filteredActions = correctiveActions.filter((action) => 
    action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.responsibleParty.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Open</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Corrective Actions</h1>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => {
              toast({
                title: 'What are Corrective Actions?',
                description: 'Corrective actions are measures implemented to rectify identified issues, improve operational effectiveness, and ensure compliance with standards.',
                duration: 5000,
              });
            }}
          >
            <Info size={16} className="mr-2" />
            Explain This Page
          </Button>
          <Button 
            className="flex items-center"
            onClick={() => {
              addForm.reset({
                title: '',
                category: '',
                dueDate: new Date(),
                targetCompletionDate: undefined,
                responsibleParty: '',
                priority: 'medium',
                status: 'open',
                actionPlan: defaultActionItems,
                notes: '',
              });
              setAddDialogOpen(true);
            }}
          >
            <PlusCircle size={16} className="mr-2" />
            New Action Item
          </Button>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Action Items Overview Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 7V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="15" r="1" fill="currentColor"/>
              </svg>
              Action Items Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-500">Open Items</span>
                  <span className="font-semibold text-orange-600">{sampleOpenItems}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-500">Completed This Month</span>
                  <span className="font-semibold text-green-600">{sampleCompletedThisMonth}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Priority Distribution Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="flex items-center">
                    <Badge className="mr-2 bg-red-100 text-red-800">
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                    </Badge>
                    <span>High Priority</span>
                  </span>
                  <span className="font-semibold">{samplePriorityDistribution.high}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="flex items-center">
                    <Badge className="mr-2 bg-yellow-100 text-yellow-800">
                      <div className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></div>
                    </Badge>
                    <span>Medium Priority</span>
                  </span>
                  <span className="font-semibold">{samplePriorityDistribution.medium}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="flex items-center">
                    <Badge className="mr-2 bg-green-100 text-green-800">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                    </Badge>
                    <span>Low Priority</span>
                  </span>
                  <span className="font-semibold">{samplePriorityDistribution.low}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Categories Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleCategories.map((category, index) => (
                <div key={index}>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">{category.name}</span>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(category.count / 20) * 100}%` }} 
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions Section */}
      <div className="bg-white rounded-md shadow-sm border p-6 mb-6">
        <div className="font-medium text-lg mb-4">Active Corrective Actions</div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <Input
              type="text"
              placeholder="Search actions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button variant="outline" className="flex items-center">
            <SlidersHorizontal size={16} className="mr-2" />
            Filter
          </Button>
        </div>
        
        {/* Actions Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">TITLE</TableHead>
                <TableHead>PRIORITY</TableHead>
                <TableHead>ASSIGNED TO</TableHead>
                <TableHead>DUE DATE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.title}</TableCell>
                  <TableCell>{getPriorityBadge(action.priority)}</TableCell>
                  <TableCell>{action.responsibleParty}</TableCell>
                  <TableCell>{format(new Date(action.dueDate), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{getStatusBadge(action.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(action)}
                      >
                        <PencilIcon className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(action.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredActions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No corrective actions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Add New Corrective Action Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Corrective Action</DialogTitle>
            <DialogDescription>
              Create a new corrective action to track issues and remediation.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter issue title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Policy">Policy</SelectItem>
                          <SelectItem value="Personnel">Personnel</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date/Time *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="targetCompletionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Completion Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Optional target date for completion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="responsibleParty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsible Party *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Responsible Party" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="John Smith">John Smith</SelectItem>
                          <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                          <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                          <SelectItem value="Team Lead">Team Lead</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
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
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel>Action Plan</FormLabel>
                <div className="mt-2 space-y-2">
                  {addForm.watch('actionPlan')?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`action-${index}`}
                        checked={item.checked}
                        onCheckedChange={(checked) => {
                          const actionPlan = [...addForm.getValues('actionPlan')];
                          actionPlan[index].checked = !!checked;
                          addForm.setValue('actionPlan', actionPlan);
                        }}
                      />
                      <label
                        htmlFor={`action-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.action}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Input 
                    placeholder="Add new action item" 
                    value={newActionItem} 
                    onChange={(e) => setNewActionItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addActionItem(addForm);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => addActionItem(addForm)}
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              
              <FormField
                control={addForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter additional notes or comments" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Action'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Corrective Action Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Corrective Action</DialogTitle>
            <DialogDescription>
              Update the corrective action details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter issue title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Policy">Policy</SelectItem>
                          <SelectItem value="Personnel">Personnel</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date/Time *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="targetCompletionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Completion Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Optional target date for completion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="responsibleParty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsible Party *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Responsible Party" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="John Smith">John Smith</SelectItem>
                          <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                          <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                          <SelectItem value="Team Lead">Team Lead</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
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
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel>Action Plan</FormLabel>
                <div className="mt-2 space-y-2">
                  {editForm.watch('actionPlan')?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-action-${index}`}
                        checked={item.checked}
                        onCheckedChange={(checked) => {
                          const actionPlan = [...editForm.getValues('actionPlan')];
                          actionPlan[index].checked = !!checked;
                          editForm.setValue('actionPlan', actionPlan);
                        }}
                      />
                      <label
                        htmlFor={`edit-action-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.action}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Input 
                    placeholder="Add new action item" 
                    value={newActionItem} 
                    onChange={(e) => setNewActionItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addActionItem(editForm);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => addActionItem(editForm)}
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter additional notes or comments" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending}>
                  {editMutation.isPending ? 'Updating...' : 'Update Action'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}