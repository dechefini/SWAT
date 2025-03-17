import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Shield, Clipboard, UserCog } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(1, "Password is required"),
  interfaceType: z.enum(["assessment", "tracking"])
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedInterface, setSelectedInterface] = useState<"assessment" | "tracking">("assessment");

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      interfaceType: "assessment"
    },
  });

  useEffect(() => {
    if (user) {
      if (user.interfaceType === "tracking") {
        // If the user selected SWAT Tracking, redirect to SWAT dashboard
        setLocation(`/swat/dashboard/${user.agencyId || 'default'}`);
      } else {
        // Otherwise, redirect to Assessment dashboard
        setLocation("/admin/dashboard");
      }
    }
  }, [user, setLocation]);

  const onSubmit = async (data: LoginForm) => {
    try {
      // Include the selected interface type with the login data
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        interfaceType: data.interfaceType
      });
    } catch (error) {
      // Error handling is now managed by the loginMutation's onError callback in use-auth.tsx
      console.error('Login error:', error);
    }
  };

  // If the user is logged in, render nothing while the redirect happens
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <Shield className="h-12 w-12 text-yellow-500" />
            <h1 className="mt-4 text-2xl font-bold">Welcome to SWAT Accreditation</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your agency's accreditation process
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {loginMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {loginMutation.error.message || 'Invalid email or password'}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@swat.gov" type="email" {...field} />
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
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interfaceType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select Interface</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="assessment" id="assessment" />
                          <div className="flex items-center gap-2">
                            <Clipboard className="h-4 w-4 text-primary" />
                            <label htmlFor="assessment" className="font-normal cursor-pointer">
                              Assessment Interface
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="tracking" id="tracking" />
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-primary" />
                            <label htmlFor="tracking" className="font-normal cursor-pointer">
                              SWAT Tracking (Premium)
                            </label>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end">
                <Button type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Right Section - Hero Content */}
      <div className="flex-1 bg-[#111] p-8 flex items-center justify-center text-white">
        <div className="max-w-md space-y-6">
          <h2 className="text-2xl font-bold">Streamline Your SWAT Team Accreditation</h2>
          <p className="text-gray-300">
            Our platform provides comprehensive tools for managing team assessments,
            equipment tracking, and certification processes all in one place.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Efficient Assessment</h3>
              <p className="text-sm text-gray-400">
                Streamlined evaluation process based on NTOA standards
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-sm text-gray-400">
                Monitor progress and maintain compliance effortlessly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}