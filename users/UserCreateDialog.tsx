import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Agency, type User } from "@shared/schema";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// Create a custom schema for creating users that includes premiumAccess and interfaceType
const userCreateSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "agency"]),
  agencyId: z.string().optional(),
  permissions: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    edit: z.boolean().default(false),
    delete: z.boolean().default(false),
  }),
  notes: z.string().optional(),
  premiumAccess: z.boolean().default(false),
  interfaceType: z.enum(["assessment", "tracking"]).default("assessment"),
});

// Create a type that includes all fields from our custom schema
type UserFormValues = z.infer<typeof userCreateSchema>;

// Create a type for the server API
type UserApiSubmission = Omit<UserFormValues, 'password'> & {
  passwordHash?: string;
  interfaceType?: "assessment" | "tracking";
  preferences?: string;
  profilePictureUrl?: string;
};

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserCreateDialog({ open, onOpenChange }: UserCreateDialogProps) {
  const { toast } = useToast();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "agency",
      agencyId: undefined,
      permissions: {
        read: true,
        write: false,
        edit: false,
        delete: false,
      },
      notes: undefined,
      premiumAccess: false,
      interfaceType: "assessment",
    },
  });

  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const createUser = useMutation({
    mutationFn: async (formData: UserFormValues) => {
      try {
        // Convert form data to API submission format - Use 'password' instead of 'passwordHash'
        const data = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password, // Important: Server expects 'password', not 'passwordHash'
          role: formData.role,
          agencyId: formData.agencyId || null,
          permissions: formData.permissions,
          notes: formData.notes || null,
          premiumAccess: formData.premiumAccess,
          interfaceType: formData.interfaceType
        };
        
        console.log('Creating user with data:', { ...data, password: '****' }); // Log for debugging without exposing password
        
        const response = await apiRequest("POST", "/api/users", data);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server response error:', errorData);
          throw new Error(errorData.error ? JSON.stringify(errorData.error) : 'Failed to create user');
        }
        return response.json();
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createUser.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <h3 className="font-semibold">User Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
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
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter additional information"
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <h3 className="font-semibold">Role and Permissions</h3>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="agency">Agency User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("role") === "agency" && (
                  <FormField
                    control={form.control}
                    name="agencyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {agencies.map((agency) => (
                              <SelectItem key={agency.id} value={agency.id}>
                                {agency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.read}
                              onCheckedChange={(checked) => {
                                field.onChange({
                                  ...field.value,
                                  read: checked === true,
                                });
                              }}
                            />
                            <FormLabel className="!mt-0">Read</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.write}
                              onCheckedChange={(checked) => {
                                field.onChange({
                                  ...field.value,
                                  write: checked === true,
                                });
                              }}
                            />
                            <FormLabel className="!mt-0">Write</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.edit}
                              onCheckedChange={(checked) => {
                                field.onChange({
                                  ...field.value,
                                  edit: checked === true,
                                });
                              }}
                            />
                            <FormLabel className="!mt-0">Edit</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.delete}
                              onCheckedChange={(checked) => {
                                field.onChange({
                                  ...field.value,
                                  delete: checked === true,
                                });
                              }}
                            />
                            <FormLabel className="!mt-0">Delete</FormLabel>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interfaceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interface Access</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Automatically enable premium access when tracking interface is selected
                          if (value === "tracking") {
                            form.setValue("premiumAccess", true);
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interface access" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="assessment">Assessment Interface Only</SelectItem>
                          <SelectItem value="tracking">SWAT Tracking Interface</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Controls which interfaces the user can access. Tracking interface includes equipment, personnel, and training management.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="premiumAccess"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <div className="flex items-center justify-between space-x-2">
                        <FormLabel>Premium Access</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value || form.watch("interfaceType") === "tracking"}
                            onCheckedChange={field.onChange}
                            disabled={form.watch("interfaceType") === "tracking"}
                          />
                        </FormControl>
                      </div>
                      <FormDescription className="text-xs">
                        Enable premium features including advanced reporting, extended history, and priority support.
                        <strong className="text-amber-600 dark:text-amber-400"> Required for SWAT Tracking interface access.</strong>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                Add User
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}