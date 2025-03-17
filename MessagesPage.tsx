import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  MailPlus,
  Send,
  Inbox,
  Archive,
  Flag,
  Search,
  MessageCircle,
  Trash2,
  User,
  Users,
} from 'lucide-react';

// Message schema for form validation
const messageSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
  recipientId: z.string().optional(),
  category: z.enum(["assessment", "equipment", "personnel", "training", "general", "support"]).default("general"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  parentMessageId: z.string().optional(),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface Message {
  id: string;
  senderId: string;
  recipientId?: string | null;
  agencyId?: string | null;
  subject: string;
  content: string;
  category: 'assessment' | 'equipment' | 'personnel' | 'training' | 'general' | 'support';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  sentAt: string;
  parentMessageId?: string | null;
  senderName?: string;
  senderRole?: 'admin' | 'agency';
  recipientName?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'agency';
  agencyId?: string | null;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('inbox');
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  
  // Load messages and users
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Fetch sent messages
        const sentResponse = await apiRequest("GET", '/api/messages/sent');
        const sentData = await sentResponse.json();
        setSentMessages(sentData);
        
        // Fetch received messages
        const receivedResponse = await apiRequest("GET", '/api/messages/received');
        const receivedData = await receivedResponse.json();
        setReceivedMessages(receivedData);
        
        // Fetch users for recipient selection
        const usersResponse = await apiRequest("GET", '/api/users');
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    fetchMessages();
  }, [toast]);
  
  // Form for new messages
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: '',
      content: '',
      category: 'general',
      priority: 'medium',
    },
  });
  
  // Form for reply messages
  const replyForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: '',
      content: '',
      category: 'general',
      priority: 'medium',
    },
  });
  
  // Handle message submission
  const onSubmit = async (data: MessageFormValues) => {
    try {
      const response = await apiRequest('POST', '/api/messages', data);
      
      if (response.ok) {
        const newMessage = await response.json();
        setSentMessages(prev => [newMessage, ...prev]);
        setComposeOpen(false);
        form.reset();
        toast({
          title: 'Success',
          description: 'Your message has been sent',
        });
      } else {
        // Try to get more detailed error message from the response
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Message Restriction',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle marking a message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/messages/${messageId}/read`);
      
      if (response.ok) {
        // Update the message in the received messages list
        setReceivedMessages(prev => 
          prev.map(msg => msg.id === messageId ? { ...msg, read: true } : msg)
        );
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  // Handle message deletion
  const deleteMessage = async (messageId: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/messages/${messageId}`);
      
      if (response.ok) {
        // Remove the message from both lists
        setSentMessages(prev => prev.filter(msg => msg.id !== messageId));
        setReceivedMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        setSelectedMessage(null);
        setViewOpen(false);
        
        toast({
          title: 'Success',
          description: 'Message has been deleted',
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle message selection for viewing
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setViewOpen(true);
    
    // If it's an unread received message, mark it as read
    if (!message.read && message.recipientId === user?.id) {
      markAsRead(message.id);
    }
  };
  
  // Handle reply to a message
  const handleReply = () => {
    if (!selectedMessage) return;
    
    // Set up reply form with appropriate values
    replyForm.reset({
      subject: `Re: ${selectedMessage.subject}`,
      content: '',
      recipientId: selectedMessage.senderId,
      category: selectedMessage.category,
      priority: selectedMessage.priority,
      parentMessageId: selectedMessage.id,
    });
    
    setReplyOpen(true);
  };
  
  // Submit a reply
  const onReplySubmit = async (data: MessageFormValues) => {
    try {
      const response = await apiRequest('POST', '/api/messages', data);
      
      if (response.ok) {
        const newMessage = await response.json();
        setSentMessages(prev => [newMessage, ...prev]);
        setReplyOpen(false);
        replyForm.reset();
        toast({
          title: 'Success',
          description: 'Your reply has been sent',
        });
      } else {
        // Try to get more detailed error message from the response
        let errorMessage = 'Failed to send reply';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: 'Message Restriction',
        description: error.message || 'Failed to send reply. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Filter messages based on search term
  const filteredSentMessages = sentMessages.filter(message => 
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.recipientName && message.recipientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredReceivedMessages = receivedMessages.filter(message => 
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.senderName && message.senderName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };
  
  // Get category badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'assessment':
        return <Badge className="bg-blue-500">Assessment</Badge>;
      case 'equipment':
        return <Badge className="bg-green-500">Equipment</Badge>;
      case 'personnel':
        return <Badge className="bg-purple-500">Personnel</Badge>;
      case 'training':
        return <Badge className="bg-amber-500">Training</Badge>;
      case 'support':
        return <Badge className="bg-indigo-500">Support</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button onClick={() => setComposeOpen(true)}>
          <MailPlus className="mr-2 h-4 w-4" />
          Compose
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button 
                  variant={activeTab === 'inbox' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('inbox')}
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  Inbox
                  {receivedMessages.filter(m => !m.read).length > 0 && (
                    <Badge className="ml-auto">{receivedMessages.filter(m => !m.read).length}</Badge>
                  )}
                </Button>
                <Button 
                  variant={activeTab === 'sent' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('sent')}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Sent
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Filter by Category</h3>
                  <Select defaultValue="all" onValueChange={(val) => setSearchTerm(val === 'all' ? '' : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="personnel">Personnel</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Filter by Priority</h3>
                  <Select defaultValue="all" onValueChange={(val) => setSearchTerm(val === 'all' ? '' : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{activeTab === 'inbox' ? 'Inbox' : 'Sent Messages'}</CardTitle>
              <CardDescription>
                {activeTab === 'inbox' 
                  ? `${filteredReceivedMessages.length} messages, ${receivedMessages.filter(m => !m.read).length} unread` 
                  : `${filteredSentMessages.length} messages sent`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                {activeTab === 'inbox' ? (
                  filteredReceivedMessages.length > 0 ? (
                    <div className="space-y-2">
                      {filteredReceivedMessages.map((message) => (
                        <div 
                          key={message.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${message.read ? '' : 'bg-slate-50 dark:bg-slate-800'}`}
                          onClick={() => handleSelectMessage(message)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2">
                              <div className={`mt-1 h-2 w-2 rounded-full ${message.read ? 'bg-transparent' : 'bg-blue-600'}`} />
                              <div>
                                <div className="font-semibold">{message.subject}</div>
                                <div className="text-sm text-muted-foreground">
                                  {message.senderName || 'Unknown Sender'} 
                                  {message.parentMessageId && <span className="ml-2 text-xs">(Reply)</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(message.sentAt)}
                            </div>
                          </div>
                          <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                            {message.content}
                          </div>
                          <div className="mt-2 flex items-center space-x-2">
                            {getPriorityBadge(message.priority)}
                            {getCategoryBadge(message.category)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No messages</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        You don't have any messages in your inbox.
                      </p>
                    </div>
                  )
                ) : (
                  filteredSentMessages.length > 0 ? (
                    <div className="space-y-2">
                      {filteredSentMessages.map((message) => (
                        <div 
                          key={message.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => handleSelectMessage(message)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold">{message.subject}</div>
                              <div className="text-sm text-muted-foreground">
                                To: {message.recipientName || 'Broadcast'}
                                {message.parentMessageId && <span className="ml-2 text-xs">(Reply)</span>}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(message.sentAt)}
                            </div>
                          </div>
                          <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                            {message.content}
                          </div>
                          <div className="mt-2 flex items-center space-x-2">
                            {getPriorityBadge(message.priority)}
                            {getCategoryBadge(message.category)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No sent messages</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        You haven't sent any messages yet.
                      </p>
                    </div>
                  )
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>
              Create a new message to send to a recipient or agency.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recipientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Filter out non-admin users if the current user is an agency user */}
                        {users
                          .filter(u => user?.role === 'admin' || u.role === 'admin')
                          .map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.role})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {user?.role === 'agency' 
                        ? "As an agency user, you can only send messages to administrators. Agency users cannot message other agencies."
                        : "Select the recipient for your message. As an administrator, you can message any user."}
                    </FormDescription>
                    {user?.role === 'agency' && (
                      <div className="mt-1 p-2 border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded-md text-xs text-amber-600 dark:text-amber-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                        Agency users can only message administrators or reply to admin messages. This restriction is enforced for security compliance.
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Message subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="personnel">Personnel</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="general">General</SelectItem>
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
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your message here..." 
                        className="h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setComposeOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Send Message</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Message Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedMessage.subject}</DialogTitle>
                  <div className="flex space-x-2">
                    {getPriorityBadge(selectedMessage.priority)}
                    {getCategoryBadge(selectedMessage.category)}
                  </div>
                </div>
                <DialogDescription>
                  {selectedMessage.senderId === user?.id ? (
                    <>To: {selectedMessage.recipientName || 'Broadcast'}</>
                  ) : (
                    <>From: {selectedMessage.senderName || 'Unknown'}</>
                  )}
                  <span className="mx-2">•</span>
                  {formatDate(selectedMessage.sentAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 border rounded-md p-4 whitespace-pre-wrap">
                {selectedMessage.content}
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    deleteMessage(selectedMessage.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                
                {selectedMessage.senderId !== user?.id && (
                  user?.role === 'admin' || (selectedMessage.senderRole === 'admin') ? (
                    <Button onClick={handleReply}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Reply
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" disabled>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Reply
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Agency users can only reply to admin messages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              Send a reply to {selectedMessage?.senderName || 'this message'}.
            </DialogDescription>
            {user?.role === 'agency' && selectedMessage?.senderRole === 'admin' && (
              <div className="mt-2 p-2 border border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-md text-xs text-blue-600 dark:text-blue-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                You are replying to an admin message, which is allowed under the agency messaging policy.
              </div>
            )}
          </DialogHeader>
          
          <Form {...replyForm}>
            <form onSubmit={replyForm.handleSubmit(onReplySubmit)} className="space-y-4">
              <FormField
                control={replyForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={replyForm.control}
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
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="personnel">Personnel</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={replyForm.control}
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
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={replyForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reply</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your reply here..." 
                        className="h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setReplyOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Send Reply</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}