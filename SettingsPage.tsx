import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Loader2, Check, Save, AlertCircle, Sun, Moon, Monitor } from "lucide-react";

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  notes: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme, saveThemePreference } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(user?.profilePictureUrl || null);

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      notes: user?.notes || "",
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);


  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileFormSchema>) => {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof passwordFormSchema>) => {
      const response = await fetch(`/api/users/${user?.id}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await fetch(`/api/users/${user?.id}/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (profilePictureUrl: string) => {
      const response = await fetch(`/api/users/${user?.id}/profile-picture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profilePictureUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile picture");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onProfileSubmit(data: z.infer<typeof profileFormSchema>) {
    updateProfileMutation.mutate(data);
  }

  function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
    updatePasswordMutation.mutate(data);
  }

  function saveNotificationPreferences() {
    updatePreferencesMutation.mutate({
      emailNotifications,
      appNotifications,
    });
  }

  // Handle profile picture upload
  function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);

      // For demo purposes, we'll just use the preview URL as the actual URL
      // In a real app, you would upload the file to a storage service and get a URL back
      uploadProfilePictureMutation.mutate(previewUrl);
    }
  }

  // Export user data function
  function exportUserData() {
    // Create a download object with the user data
    if (!user) return;

    const userData = {
      ...user,
      // Don't include sensitive information like passwordHash
      passwordHash: undefined
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    // Create a link element and trigger a download
    const exportFileDefaultName = `user-data-${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Data exported",
      description: "Your data has been exported successfully.",
    });
  }

  // Helper function to get user's full name
  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return "User";
  };

  // Helper function to get avatar initials
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return "U";
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImagePreview || "/placeholders/user.png"} alt={getFullName()} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <input 
                    type="file" 
                    id="profile-picture" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-medium">{getFullName()}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={() => document.getElementById('profile-picture')?.click()}
                    disabled={uploadProfilePictureMutation.isPending}
                  >
                    {uploadProfilePictureMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Change Avatar"
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the email used for account-related communications.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional information or notes about your account"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your new password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters long.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full sm:w-auto"
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Session Management</h3>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-muted-foreground">
                            Last active: Just now
                          </p>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Current
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="destructive" size="sm">
                      Logout from All Devices
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your application preferences and theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Theme Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Theme</h3>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred appearance theme
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <div 
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all ${theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                      >
                        <Sun className="h-8 w-8 mb-2" />
                        <span>Light</span>
                      </div>
                      
                      <div 
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all ${theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                      >
                        <Moon className="h-8 w-8 mb-2" />
                        <span>Dark</span>
                      </div>
                      
                      <div 
                        onClick={() => setTheme("system")}
                        className={`flex flex-col items-center justify-center p-3 rounded-md border-2 cursor-pointer transition-all ${theme === "system" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                      >
                        <Monitor className="h-8 w-8 mb-2" />
                        <span>System</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-fit mt-2"
                      onClick={saveThemePreference}
                    >
                      Save Theme Preference
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="app-notifications">In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications within the application
                      </p>
                    </div>
                    <Switch
                      id="app-notifications"
                      checked={appNotifications}
                      onCheckedChange={setAppNotifications}
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={saveNotificationPreferences}
                    disabled={updatePreferencesMutation.isPending}
                  >
                    {updatePreferencesMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Notification Settings"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced options for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Data Management</h3>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Export Data</CardTitle>
                    <CardDescription>
                      Download your data in JSON format
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" onClick={exportUserData}>Export All Data</Button>
                  </CardFooter>
                </Card>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">System Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Application Version</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User Role</span>
                    <span className="capitalize">{user?.role || "admin"}</span>
                  </div>
                </div>
              </div>

              <div>
                <Card className="border-destructive/50 border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center text-destructive">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      These actions cannot be undone. Please proceed with caution.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="destructive">Delete Account</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}