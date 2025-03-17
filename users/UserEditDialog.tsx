import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type User, type Agency } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useEffect } from "react";
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

interface UserEditDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditDialog({ user, open, onOpenChange }: UserEditDialogProps) {
  const { toast } = useToast();

  // Create a custom schema for editing users that includes premiumAccess and interfaceType
  const editUserSchema = z.object({
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    email: z.string().email("Invalid email address"),
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
  
  type EditUserFormValues = z.infer<typeof editUserSchema>;
  
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId ?? undefined,
      permissions: user.permissions ?? {
        read: true,
        write: false,
        edit: false,
        delete: false,
      },
      premiumAccess: user.premiumAccess ?? false,
      interfaceType: user.interfaceType ?? "assessment",
      notes: user.notes ?? undefined,
    },
  });
  
  // Reset form values when the user changes
  useEffect(() => {
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId ?? undefined,
      permissions: user.permissions ?? {
        read: true,
        write: false,
        edit: false,
        delete: false,
      },
      premiumAccess: user.premiumAccess ?? false,
      interfaceType: user.interfaceType ?? "assessment",
      notes: user.notes ?? undefined,
    });
  }, [user, form]);

  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const updateUser = useMutation({
    mutationFn: async (data: Partial<User>) => {
      try {
        const response = await apiRequest("PATCH", `/api/users/${user.id}`, data);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update user');
        }
        return response.json();
      } catch (error: any) {
        console.error('Error updating user:', error);
        throw new Error(error.response?.error || error.message || 'Failed to update user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      onOpenChange(false);
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
          <DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form} key={user.id}>
          <form onSubmit={form.handleSubmit((data) => updateUser.mutate(data))} className="space-y-4">
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
              <Button type="submit" disabled={updateUser.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}