import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  ClipboardCheck, 
  FileText, 
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Tag,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Plus
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWithinInterval, isToday, eachDayOfInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Event types for categorization
const eventTypes = [
  { id: "training", label: "Training" },
  { id: "meeting", label: "Meeting" },
  { id: "assessment", label: "Assessment" },
  { id: "operation", label: "Operation" },
  { id: "maintenance", label: "Maintenance" },
  { id: "other", label: "Other" },
];

// Sample team members for assignments
const teamMembers = [
  { id: "tm1", name: "John Smith" },
  { id: "tm2", name: "Sarah Johnson" },
  { id: "tm3", name: "Michael Lee" },
  { id: "tm4", name: "Jessica Taylor" },
  { id: "tm5", name: "Robert Brown" },
];

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().optional(),
  eventType: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]).default("scheduled"),
  participants: z.array(z.string()).optional(),
});

type EventForm = z.infer<typeof eventSchema>;

interface Event extends EventForm {
  id: string;
  userId: string;
}

const stats = [
  {
    title: "Total Agencies",
    value: "1",
    change: "+2",
    changeLabel: "from last month",
    icon: Building2
  },
  {
    title: "Active Assessments",
    value: "1",
    change: "+5",
    changeLabel: "from last week",
    icon: ClipboardCheck
  },
  {
    title: "Pending Reviews",
    value: "0",
    change: "-2",
    changeLabel: "from last week",
    icon: FileText
  },
  {
    title: "Total Users",
    value: "45",
    change: "+3",
    changeLabel: "from last month",
    icon: Users
  }
];

export function Dashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date()));
  const [filters, setFilters] = useState({
    eventType: [] as string[],
    priority: [] as string[],
    status: [] as string[]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Generate week dates
  const weekDates = Array(7).fill(0).map((_, idx) => addDays(weekStartDate, idx));

  const form = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      location: "",
    },
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      console.log("Fetching events...");
      const response = await apiRequest('GET', '/api/events');
      const data = await response.json();
      
      // Map server data format to client format
      const mappedEvents = data.map((event: any) => {
        // Extract date part and time part from startDate
        let datePart = '';
        let timePart = '';
        
        if (event.startDate) {
          const date = new Date(event.startDate);
          datePart = date.toISOString().split('T')[0]; // YYYY-MM-DD
          // Format time HH:MM from the date object
          timePart = date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        }
        
        return {
          id: event.id,
          userId: event.userId,
          title: event.title,
          description: event.description,
          date: datePart, // Convert to YYYY-MM-DD
          time: timePart || event.startTime || '',
          location: event.location || '',
          eventType: event.eventType,
          priority: event.priority,
          status: event.status
        };
      });
      
      console.log("Events fetched and mapped:", mappedEvents);
      return mappedEvents;
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      console.log('Creating event with data:', data);
      const payload = {
        ...data,
        userId: user?.id
      };
      console.log('Sending API request with payload:', payload);
      const response = await apiRequest('POST', '/api/events', payload);
      const result = await response.json();
      console.log('Received API response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Event created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event created",
        description: "Your event has been successfully created.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Failed to create event:', error);
      toast({
        title: "Failed to create event",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventForm }) => {
      console.log('Updating event', id, 'with data:', data);
      const response = await apiRequest('PUT', `/api/events/${id}`, {
        ...data,
        userId: user?.id
      });
      const result = await response.json();
      console.log('Received API response:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event updated",
        description: "Your event has been successfully updated.",
      });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedEvent(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Failed to update event:', error);
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting event:', id);
      const response = await apiRequest('DELETE', `/api/events/${id}`);
      console.log('Received API response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('Event deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event deleted",
        description: "Your event has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
      setIsDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      console.error('Failed to delete event:', error);
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: EventForm) => {
    console.log('Form submitted with values:', data);
    if (isEditMode && selectedEvent) {
      console.log('Updating existing event:', selectedEvent.id);
      updateEventMutation.mutate({ id: selectedEvent.id, data });
    } else {
      console.log('Creating new event');
      createEventMutation.mutate(data);
    }
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event);
    setSelectedEvent(event);
    form.reset({
      title: event.title,
      description: event.description || "",
      date: format(new Date(event.date), 'yyyy-MM-dd'),
      time: event.time,
      location: event.location || "",
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = () => {
    console.log("Delete event initiated");
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const getFilteredEvents = () => {
    if (!Array.isArray(events)) return [];
    
    return events.filter((event) => {
      // Filter by event type
      if (filters.eventType.length > 0 && !filters.eventType.includes(event.eventType || '')) {
        return false;
      }
      
      // Filter by priority
      if (filters.priority.length > 0 && !filters.priority.includes(event.priority || '')) {
        return false;
      }
      
      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(event.status || '')) {
        return false;
      }
      
      return true;
    });
  };

  // Get events for the current day view
  const selectedDateEvents = Array.isArray(events)
    ? getFilteredEvents().filter((event) => {
        // Check if event has a valid date
        if (!event.date) return false;
        
        // For direct string comparison of dates
        const eventDateStr = event.date;
        const selectedDateStr = format(date, 'yyyy-MM-dd');
        
        // Simple exact string matching
        return eventDateStr === selectedDateStr;
      })
    : [];
    
  // Get events for the current week view
  const weekEvents = Array.isArray(events) 
    ? getFilteredEvents().filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return isWithinInterval(eventDate, {
          start: weekStartDate,
          end: endOfWeek(weekStartDate)
        });
      })
    : [];

  // Navigate to previous or next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7;
    setWeekStartDate(prevDate => addDays(prevDate, days));
  };

  // Get events for a specific day in the week view
  const getEventsForDay = (day: Date) => {
    if (!Array.isArray(events)) return [];
    
    const formattedDay = format(day, 'yyyy-MM-dd');
    return getFilteredEvents().filter(event => event.date === formattedDay);
  };

  // Handle adding a new event from calendar
  const handleAddEvent = (selectedDate?: Date) => {
    setIsEditMode(false);
    form.reset({
      title: '',
      description: '',
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      location: '',
      eventType: '',
      priority: 'medium',
      status: 'scheduled',
      participants: [],
    });
    setIsDialogOpen(true);
  };

  // Toggle a filter value
  const toggleFilter = (type: 'eventType' | 'priority' | 'status', value: string) => {
    setFilters(prev => {
      const currentValues = [...prev[type]];
      const index = currentValues.indexOf(value);
      
      if (index >= 0) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(value);
      }
      
      return {
        ...prev,
        [type]: currentValues
      };
    });
  };

  const getEventPriorityColor = (priority?: string) => {
    switch(priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getEventStatusColor = (status?: string) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-500 text-white';
      case 'in-progress': return 'bg-purple-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-300 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || 'Administrator'}
        </h2>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith('+');
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change} {stat.changeLabel}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Schedule</CardTitle>
              <div className="flex items-center mt-2 space-x-2">
                {/* View Switcher */}
                <div className="flex items-center space-x-1 border rounded-md">
                  <Button 
                    size="sm" 
                    variant={view === 'day' ? 'default' : 'ghost'} 
                    className="h-7 rounded-none rounded-l-md"
                    onClick={() => setView('day')}
                  >
                    Day
                  </Button>
                  <Button 
                    size="sm" 
                    variant={view === 'week' ? 'default' : 'ghost'} 
                    className="h-7 rounded-none"
                    onClick={() => setView('week')}
                  >
                    Week
                  </Button>
                  <Button 
                    size="sm" 
                    variant={view === 'month' ? 'default' : 'ghost'} 
                    className="h-7 rounded-none rounded-r-md"
                    onClick={() => setView('month')}
                  >
                    Month
                  </Button>
                </div>
                
                {/* Filter Button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7">
                      <Filter className="h-3.5 w-3.5 mr-1" /> 
                      Filters {Object.values(filters).flat().length > 0 && 
                        <Badge variant="secondary" className="ml-1 h-5 px-1 rounded-sm">
                          {Object.values(filters).flat().length}
                        </Badge>
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Event Type</h4>
                        <div className="space-y-2">
                          {eventTypes.map(type => (
                            <div key={type.id} className="flex items-center">
                              <Checkbox
                                id={`type-${type.id}`}
                                checked={filters.eventType.includes(type.id)}
                                onCheckedChange={() => toggleFilter('eventType', type.id)}
                              />
                              <label 
                                htmlFor={`type-${type.id}`}
                                className="ml-2 text-sm font-normal cursor-pointer"
                              >
                                {type.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Priority</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {['high', 'medium', 'low'].map(priority => (
                            <Badge 
                              key={priority}
                              variant={filters.priority.includes(priority) ? 'default' : 'outline'}
                              className="cursor-pointer justify-center"
                              onClick={() => toggleFilter('priority', priority)}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['scheduled', 'in-progress', 'completed', 'cancelled'].map(status => (
                            <Badge 
                              key={status}
                              variant={filters.status.includes(status) ? 'default' : 'outline'}
                              className="cursor-pointer justify-center"
                              onClick={() => toggleFilter('status', status)}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {Object.values(filters).flat().length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setFilters({eventType: [], priority: [], status: []})}
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {view === 'week' && (
                <div className="flex items-center space-x-2 mr-2">
                  <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    {format(weekStartDate, 'MMM d')} - {format(addDays(weekStartDate, 6), 'MMM d, yyyy')}
                  </div>
                  <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Event</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                    <DialogDescription>
                      {isEditMode ? 'Modify the event details below.' : 'Add a new event to your calendar. Fill in the details below.'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Event title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Event location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="eventType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {eventTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
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
                                  <SelectItem value="high">
                                    <div className="flex items-center">
                                      <AlertTriangle className="w-3 h-3 mr-2 text-red-500" />
                                      High
                                    </div>
                                  </SelectItem>
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
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Event description" 
                                {...field}
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className="gap-2">
                        {isEditMode && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                        <Button type="submit">
                          {isEditMode ? 'Save Changes' : 'Create Event'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {view === 'day' && (
              <div className="flex flex-col lg:flex-row gap-6 p-4">
                <div className="w-full lg:w-1/2 xl:w-3/5">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(day) => day && setDate(day)}
                    className="rounded-md border shadow-sm w-full"
                    modifiers={{
                      eventDay: Array.isArray(events) 
                        ? events.filter(e => e.date).map(event => new Date(event.date))
                        : []
                    }}
                    modifiersClassNames={{
                      eventDay: "event-day"
                    }}
                  />
                  {/* Add custom CSS for event indicator */}
                  <style>{`
                    .event-day::after {
                      content: "";
                      position: absolute;
                      bottom: 4px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background-color: var(--primary);
                    }
                  `}</style>
                  

                </div>
                
                <div className="w-full lg:w-1/2 xl:w-2/5">
                  <Card className="h-full shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                        {date ? format(date, 'MMMM d, yyyy') : 'No date selected'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isToday(date) ? 'Today' : format(date, 'EEEE')}
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      {selectedDateEvents.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDateEvents.map((event) => (
                            <Card
                              key={event.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 shadow-sm"
                              style={{ 
                                borderLeftColor: event.priority === 'high' 
                                  ? 'var(--red-500)' 
                                  : event.priority === 'medium' 
                                    ? 'var(--yellow-500)' 
                                    : 'var(--green-500)' 
                              }}
                              onClick={() => handleEventClick(event)}
                            >
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                  <h4 className="font-semibold text-base">{event.title}</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {event.eventType && (
                                      <Badge variant="outline" className="text-xs">
                                        {eventTypes.find(t => t.id === event.eventType)?.label || event.eventType}
                                      </Badge>
                                    )}
                                    {event.status && (
                                      <Badge className={`text-xs ${getEventStatusColor(event.status)}`}>
                                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{event.time}</span>
                                  </div>
                                  
                                  {event.location && (
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {event.description && (
                                  <p className="text-sm mt-3">{event.description}</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground">No events scheduled for this day</p>
                          <Button 
                            onClick={() => handleAddEvent(date)} 
                            variant="outline"
                            className="mt-4"
                          >
                            <Plus className="mr-1 h-4 w-4" /> Add Event
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {view === 'week' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigateWeek('prev')}
                      className="h-9 w-9 p-0"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigateWeek('next')}
                      className="h-9 w-9 p-0"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-medium text-center">
                    {format(weekStartDate, 'MMM d')} - {format(addDays(weekStartDate, 6), 'MMM d, yyyy')}
                  </h3>
                  
                  <Button
                    onClick={() => handleAddEvent()}
                    size="sm"
                    className="hidden md:flex items-center"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Event
                  </Button>
                </div>
                
                {/* Calendar header - days of week */}
                <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4 border-b pb-2">
                  {weekDates.map((day, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "text-center font-medium py-2",
                        isToday(day) && "text-primary font-bold"
                      )}
                    >
                      <div className="mb-1 text-sm md:text-base">{format(day, 'E')}</div>
                      <div 
                        className={cn(
                          "rounded-full w-8 h-8 md:w-10 md:h-10 mx-auto flex items-center justify-center text-sm md:text-base",
                          isToday(day) && "bg-primary text-primary-foreground",
                          isSameDay(day, date) && !isToday(day) && "border-2 border-primary"
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mobile Add Event Button */}
                <div className="md:hidden mb-4">
                  <Button
                    onClick={() => handleAddEvent()}
                    className="w-full"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Event
                  </Button>
                </div>
                
                {/* Calendar body - events */}
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                  {weekDates.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    return (
                      <div key={index}>
                        <div 
                          className={cn(
                            "p-2 md:p-3 border rounded-md min-h-[150px] md:min-h-[250px] overflow-auto relative shadow-sm",
                            isSameDay(day, date) && "border-primary bg-primary/5",
                            "hover:border-primary/70 transition-colors cursor-pointer"
                          )}
                          onClick={() => {
                            setDate(day);
                            setView('day');
                          }}
                        >
                          {dayEvents.length > 0 ? (
                            <div className="space-y-2">
                              {dayEvents.map(event => (
                                <div 
                                  key={event.id}
                                  className={cn(
                                    "p-2 md:p-3 rounded text-xs md:text-sm cursor-pointer shadow-sm",
                                    getEventPriorityColor(event.priority)
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}
                                >
                                  <div className="font-medium line-clamp-1">{event.title}</div>
                                  <div className="flex items-center text-xs mt-1">
                                    <Clock className="h-3 w-3 mr-1 inline" />
                                    {event.time}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="absolute bottom-2 right-2 opacity-60 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddEvent(day);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {view === 'month' && (
              <div className="p-2 md:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-3">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(day) => day && setDate(day)}
                      className="rounded-md border w-full mx-auto shadow-sm"
                      modifiers={{
                        eventDay: Array.isArray(events) 
                          ? events.filter(e => e.date).map(event => new Date(event.date))
                          : []
                      }}
                      modifiersClassNames={{
                        eventDay: "event-day"
                      }}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Events This Month</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {getFilteredEvents().length > 0 ? (
                            getFilteredEvents()
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map(event => (
                                <Card
                                  key={event.id}
                                  className="cursor-pointer hover:bg-muted/50 transition-colors mb-2 shadow-sm"
                                  onClick={() => {
                                    const eventDate = new Date(event.date);
                                    setDate(eventDate);
                                    setView('day');
                                  }}
                                >
                                  <CardContent className="p-3 flex items-center">
                                    <div 
                                      className={cn(
                                        "w-4 h-4 rounded-full mr-3",
                                        event.priority === 'high' ? 'bg-red-500' :
                                        event.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                      )} 
                                    />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{event.title}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {format(new Date(event.date), 'MMM d')} • {event.time}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                          ) : (
                            <p className="text-muted-foreground text-sm">No events found</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                {/* Add custom CSS for event indicator */}
                <style>{`
                  .event-day::after {
                    content: "";
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: var(--primary);
                  }
                  
                  /* Make the month view text larger */
                  .rdp-caption_label {
                    font-size: 1.25rem !important;
                    font-weight: 600 !important;
                  }
                  
                  /* Add spacing to the month view rows */
                  .rdp-row {
                    margin-top: 0.75rem !important;
                    margin-bottom: 0.75rem !important;
                  }
                  
                  /* Make calendar responsive for mobile */
                  @media (max-width: 640px) {
                    .rdp-caption_label {
                      font-size: 1.1rem !important;
                    }
                    
                    .rdp-row {
                      margin-top: 0.5rem !important;
                      margin-bottom: 0.5rem !important;
                    }
                  }
                `}</style>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}