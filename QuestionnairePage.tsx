import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agency, Assessment, Question, QuestionCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle,
  AlertTriangle,
  CheckCircle2, 
  ClipboardList,
  DownloadCloud, 
  FileText, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCcw,
  Save,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define schemas for question forms
const questionFormSchema = z.object({
  text: z.string().min(5, "Question text must be at least 5 characters"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  orderIndex: z.number().int().min(0),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function QuestionnairePage() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("assessment");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Define a type for response selection tracking
  interface ResponseSelection {
    response?: boolean;
    textResponse?: string;
    numericResponse?: number;
    selectResponse?: string;
    notes: string;
    responseId?: string;
  }
  
  // Use localStorage to persist response selections between sessions
  const [responseSelections, setResponseSelections] = useState<Record<string, ResponseSelection>>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      // First try to get current assessment ID from localStorage (for page refresh cases)
      const savedAssessmentId = localStorage.getItem('currentAssessmentId');
      
      if (savedAssessmentId) {
        // Try to get assessment-specific selections
        const savedSelections = localStorage.getItem(`responseSelections_${savedAssessmentId}`);
        
        if (savedSelections) {
          try {
            const parsedSelections = JSON.parse(savedSelections);
            console.log("Loading cached responses from localStorage for assessment:", savedAssessmentId, Object.keys(parsedSelections).length);
            return parsedSelections;
          } catch (e) {
            console.error('Failed to parse saved response selections:', e);
          }
        }
      } else {
        // Fallback to generic selections (backward compatibility)
        const savedSelections = localStorage.getItem('responseSelections');
        if (savedSelections) {
          try {
            return JSON.parse(savedSelections);
          } catch (e) {
            console.error('Failed to parse saved response selections:', e);
          }
        }
      }
    }
    return {};
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isAgencyUser = user?.role === "agency";
  const queryClient = useQueryClient();

  // Form for question creation/editing
  const form = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: "",
      description: "",
      categoryId: "",
      orderIndex: 0,
    },
  });

  // Fetch agencies with detailed status tracking and enhanced error handling
  const { 
    data: agencies = [], // Default to empty array for safety
    isLoading: isLoadingAgencies,
    isError: isAgenciesError,
    error: agenciesError,
    refetch: refetchAgencies
  } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
    enabled: true,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      try {
        console.log("🔍 Fetching agencies...");
        const response = await fetch("/api/agencies", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        
        // Log response details for debugging
        console.log(`📊 Agencies Response Status: ${response.status} ${response.statusText}`);
        
        // Safely log headers without iterator issues
        const safeHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          if (["content-type", "content-length", "date"].includes(key)) {
            safeHeaders[key] = value;
          }
        });
        console.log(`📋 Agencies Response Headers:`, safeHeaders);
        
        if (!response.ok) {
          const responseText = await response.text();
          console.error(`❌ API Error: ${response.status} ${response.statusText}`, responseText);
          throw new Error(`Failed to fetch agencies: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Enhanced validation and logging
        const isValidData = Array.isArray(data);
        console.log(`✅ Agencies fetch ${isValidData ? 'successful' : 'returned invalid format'}:`, 
          isValidData ? `${data.length} agencies found` : data);
        
        if (isValidData && data.length > 0) {
          console.log(`📝 First agency sample:`, { 
            id: data[0].id,
            name: data[0].name,
            // Include only a subset of properties for readability
            properties: Object.keys(data[0]).join(", ")
          });
        }
        
        // Always return an array, even if the API returns something unexpected
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("❌ Error fetching agencies:", error);
        throw error;
      }
    }
  });

  // Log errors for debugging
  useEffect(() => {
    if (agenciesError) {
      console.error("Agencies query error:", agenciesError);
      toast({
        title: "Error loading agencies",
        description: agenciesError instanceof Error ? agenciesError.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [agenciesError, toast]);

  // Fetch all assessments (for admin view)
  const { 
    data: allAssessments = [] // Default to empty array for safety
  } = useQuery({
    queryKey: ["/api/assessments"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/assessments", {
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch assessments: ${response.status}`);
        }
        return await response.json() as Assessment[];
      } catch (error) {
        console.error("Error fetching all assessments:", error);
        return [] as Assessment[];
      }
    },
    enabled: isAdmin, // Only fetch for admin users
  });

  // Fetch assessments for selected agency
  const { 
    data: assessments = [], // Default to empty array for safety
    isSuccess: assessmentsLoaded 
  } = useQuery({
    queryKey: ["/api/agencies", selectedAgencyId, "assessments"],
    queryFn: async () => {
      if (!selectedAgencyId) return [] as Assessment[];
      
      try {
        const response = await fetch(`/api/agencies/${selectedAgencyId}/assessments`, {
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch agency assessments: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Fetched ${data.length} assessments for agency ${selectedAgencyId}`);
        return data as Assessment[];
      } catch (error) {
        console.error("Error fetching agency assessments:", error);
        return [] as Assessment[];
      }
    },
    enabled: !!selectedAgencyId,
  });

  // Fetch question categories
  const { data: categoriesRaw } = useQuery<QuestionCategory[]>({
    queryKey: ["/api/question-categories"],
    enabled: !!currentAssessmentId || activeTab === "progress",
  });
  
  // Separate and sort categories - Tiering first, then Gap Analysis
  const categories = useMemo(() => {
    if (!categoriesRaw) return [];
    
    // Identify which categories are for Tiering vs Gap Analysis based on their name
    const tieringCategories = [];
    const gapAnalysisCategories = [];
    
    for (const category of categoriesRaw) {
      // These match the 16 official tier assessment categories
      if (
        category.name.includes("Tier") || 
        category.name.includes("Personnel & Leadership") ||
        category.name.includes("Mission Profiles") || 
        category.name.includes("Individual Operator Equipment") ||
        category.name.includes("Sniper Equipment") ||
        category.name.includes("Breaching") ||
        category.name.includes("Access & Elevated") ||
        category.name.includes("Less-Lethal") ||
        category.name.includes("Noise Flash") ||
        category.name.includes("Chemical Munitions") ||
        category.name.includes("K9 Operations") ||
        category.name.includes("Explosive Ordnance") ||
        category.name.includes("Mobility") ||
        category.name.includes("Unique Environment") ||
        category.name.includes("SCBA & HAZMAT") ||
        category.name.includes("Negotiations & Crisis Response") ||
        category.name.includes("Tactical Emergency Medical Support") ||
        category.name.includes("TEMS")
      ) {
        tieringCategories.push(category);
      } else {
        gapAnalysisCategories.push(category);
      }
    }
    
    // Sort each group by orderIndex
    const sortedTieringCategories = [...tieringCategories].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    
    const sortedGapAnalysisCategories = [...gapAnalysisCategories].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    
    // Combine the two sorted arrays - Tiering first, then Gap Analysis
    return [...sortedTieringCategories, ...sortedGapAnalysisCategories];
  }, [categoriesRaw]);

  // Fetch questions for the current assessment
  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
    enabled: !!currentAssessmentId || activeTab === "progress",
  });

  // Fetch assessment responses for current assessment
  const { data: responses, refetch: refetchResponses, isLoading: isLoadingResponses } = useQuery<any[]>({
    queryKey: ["/api/assessment-responses", currentAssessmentId],
    enabled: !!currentAssessmentId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // Keep data in cache for 24 hours for better persistence
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch on component mount to ensure data is fresh
  });
  
  // Fetch assessment responses for all assessments (for admin view)
  const { data: allAssessmentResponses } = useQuery<any[]>({
    queryKey: ["/api/assessment-responses"],
    enabled: isAdmin, // Always fetch for admin, regardless of active tab
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // Keep data in cache for 24 hours
    refetchOnWindowFocus: false,
  });

  // Fetch reports
  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
    enabled: isAdmin && activeTab === "reports",
  });
  
  // Debug categories and questions data
  useEffect(() => {
    if (categories && questions) {
      console.log("Categories loaded:", categories.length);
      console.log("Questions loaded:", questions.length);
      
      // Log the first 10 categories to debug nav order
      console.log("First 10 categories in sorted order:");
      categories.slice(0, 10).forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} (orderIndex: ${category.orderIndex})`);
      });
      
      // Log some important categories
      const accessCategory = categories.find(c => c.name.includes("Access & Elevated"));
      if (accessCategory) {
        console.log("Access & Elevated Tactics category found:", accessCategory);
        
        // Find questions for this category
        const accessQuestions = questions.filter(q => q.categoryId === accessCategory.id);
        console.log(`Direct questions for Access & Elevated (${accessCategory.id}):`, accessQuestions.length);
      } else {
        console.log("Access & Elevated Tactics category NOT found");
      }
      
      const missionCategory = categories.find(c => c.name.includes("Mission"));
      if (missionCategory) {
        console.log("Mission category found:", missionCategory);
        
        // Find questions for this category
        const missionQuestions = questions.filter(q => q.categoryId === missionCategory.id);
        console.log(`Direct questions for Mission (${missionCategory.id}):`, missionQuestions.length);
      }
      
      // Print out all category IDs and associated question counts
      console.log("Question counts by category:");
      categories.forEach(category => {
        const count = questions.filter(q => q.categoryId === category.id).length;
        console.log(`- ${category.name} (${category.id}): ${count} questions`);
      });
      
      // Check for questions with category IDs that don't match any category
      const categoryIds = categories.map(c => c.id);
      const orphanedQuestions = questions.filter(q => !categoryIds.includes(q.categoryId));
      if (orphanedQuestions.length > 0) {
        console.log(`Found ${orphanedQuestions.length} questions with category IDs that don't match any category`);
        // Get unique category IDs without using Set iteration
        const uniqueCategoryIds = orphanedQuestions.map(q => q.categoryId)
          .filter((id, index, self) => self.indexOf(id) === index);
        console.log("Orphaned question category IDs:", uniqueCategoryIds);
      }
    }
  }, [categories, questions]);

  // Reset form when editing question changes
  useEffect(() => {
    if (editingQuestion) {
      form.reset({
        text: editingQuestion.text,
        description: editingQuestion.description || "",
        categoryId: editingQuestion.categoryId,
        orderIndex: editingQuestion.orderIndex,
      });
    } else {
      form.reset({
        text: "",
        description: "",
        categoryId: categories?.[0]?.id || "",
        orderIndex: questions?.length || 0,
      });
    }
  }, [editingQuestion, form, categories, questions]);

  // Function to handle saving a response to a question
  const handleResponseSubmit = async (
    questionId: string, 
    response?: boolean, 
    textResponse?: string,
    numericResponse?: number,
    selectResponse?: string
  ) => {
    if (!currentAssessmentId) {
      toast({
        title: "Error",
        description: "No active assessment. Please start an assessment first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update the local state immediately for a responsive UI
      setResponseSelections(prev => ({
        ...prev,
        [questionId]: {
          ...(prev[questionId] || {}),
          response: response,
          textResponse: textResponse,
          numericResponse: numericResponse,
          selectResponse: selectResponse,
          notes: prev[questionId]?.notes || '',
          responseId: prev[questionId]?.responseId
        },
      }));
      
      // Save to server with all possible response types
      await saveResponseMutation.mutateAsync({
        questionId,
        response,
        textResponse,
        numericResponse,
        selectResponse
      });
    } catch (error) {
      console.error("Failed to submit response:", error);
      // Revert the local state change if server call fails
      setResponseSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[questionId]; // Remove the optimistic update
        return newSelections;
      });
    }
  };

  // Create a new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (agencyId: string) => {
      // Use apiRequest utility to ensure consistent error handling
      try {
        const response = await fetch(`/api/agencies/${agencyId}/assessments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            agencyId,
            status: "in_progress",
            completionStatus: false
            // Fields handled by server-side defaults:
            // - startedAt (defaultNow())
            // - progressPercentage (default: 0)
            // - tierLevel (optional)
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Assessment creation error:", errorData);
          throw new Error(errorData.error || "Failed to create assessment");
        }
        
        return response.json();
      } catch (error) {
        console.error("Assessment request error:", error);
        throw error;
      }
    },
    onSuccess: (newAssessment) => {
      setCurrentAssessmentId(newAssessment.id);
      queryClient.invalidateQueries({ queryKey: ["/api/agencies", selectedAgencyId, "assessments"] });
      toast({
        title: "Assessment Created",
        description: "You can now begin the assessment.",
      });
    },
    onError: (error) => {
      console.error("Assessment creation failed:", error);
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create a new question
  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const response = await fetch(`/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsQuestionDialogOpen(false);
      toast({
        title: "Question Created",
        description: "The question has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit an eisting question
  const editQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuestionFormValues }) => {
      const response = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({
        title: "Question Updated",
        description: "The question has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete a question
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to delete question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      setIsDeleteDialogOpen(false);
      setQuestionToDelete(null);
      toast({
        title: "Question Deleted",
        description: "The question has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate and download Tier Assessment report
  const generateTierReportMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      try {
        // Generate the report first
        const generateResponse = await fetch(`/api/reports/${assessmentId}/generate-tier-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportType: "tier-assessment" }),
        });
        
        if (!generateResponse.ok) {
          throw new Error("Failed to generate tier assessment report");
        }
        
        const reportData = await generateResponse.json();
        
        // Then immediately download it
        const downloadResponse = await fetch(`/api/reports/${reportData.id}/download`);
        
        if (!downloadResponse.ok) {
          throw new Error("Failed to download tier assessment report");
        }
        
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TierAssessment-Report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return reportData;
      } catch (error) {
        console.error("Error with tier assessment report:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Tier Assessment Downloaded",
        description: `Report has been generated and downloaded successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate or download tier assessment report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate and download Gap Analysis report
  const generateGapReportMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      try {
        // Generate the report first
        const generateResponse = await fetch(`/api/reports/${assessmentId}/generate-gap-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportType: "gap-analysis" }),
        });
        
        if (!generateResponse.ok) {
          throw new Error("Failed to generate gap analysis report");
        }
        
        const reportData = await generateResponse.json();
        
        // Then immediately download it
        const downloadResponse = await fetch(`/api/reports/${reportData.id}/download`);
        
        if (!downloadResponse.ok) {
          throw new Error("Failed to download gap analysis report");
        }
        
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GapAnalysis-Report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return reportData;
      } catch (error) {
        console.error("Error with gap analysis report:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Gap Analysis Downloaded",
        description: "Gap Analysis report has been generated and downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate or download gap analysis report. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Legacy report generator (keeping for backward compatibility)
  const generateReportMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await fetch(`/api/reports/${assessmentId}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: "assessment" }),
      });
      if (!response.ok) throw new Error("Failed to generate report");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report Generated",
        description: "PDF report has been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save assessment response with enhanced error handling & retry logic
  const saveResponseMutation = useMutation({
    mutationFn: async ({
      questionId,
      response,
      textResponse,
      numericResponse,
      selectResponse,
      notes,
    }: {
      questionId: string;
      response?: boolean;
      textResponse?: string;
      numericResponse?: number;
      selectResponse?: string;
      notes?: string;
    }) => {
      // Validate current assessment ID
      if (!currentAssessmentId) {
        throw new Error("No active assessment. Please select or create an assessment first.");
      }
      
      console.log('Saving assessment response:', {
        assessmentId: currentAssessmentId,
        questionId,
        response,
        textResponse,
        numericResponse,
        selectResponse,
        notes
      });
      
      // First update local state immediately for better UX
      setResponseSelections(prev => {
        const updatedSelections = { 
          ...prev, 
          [questionId]: {
            response,
            textResponse,
            numericResponse,
            selectResponse,
            notes: notes || '',
            // Preserve existing responseId if any
            responseId: prev[questionId]?.responseId 
          }
        };
        
        // Save to localStorage for persistence between page refreshes
        if (typeof window !== 'undefined' && currentAssessmentId) {
          try {
            localStorage.setItem(`responseSelections_${currentAssessmentId}`, JSON.stringify(updatedSelections));
            localStorage.setItem('currentAssessmentId', currentAssessmentId);
          } catch (e) {
            console.warn("Failed to save to localStorage:", e);
          }
        }
        
        return updatedSelections;
      });
      
      // Implement retry logic with backoff for network issues
      const MAX_RETRIES = 2;
      let retries = 0;
      let lastError;
      
      while (retries <= MAX_RETRIES) {
        try {
          const res = await fetch("/api/assessment-responses", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            credentials: "include", // Ensure cookies are sent for auth
            body: JSON.stringify({
              assessmentId: currentAssessmentId,
              questionId,
              response,
              textResponse,
              numericResponse,
              selectResponse,
              notes,
            }),
          });
          
          if (!res.ok) {
            // Try to extract more detailed error information
            const errorData = await res.json().catch(() => ({}));
            console.error(`Response save error (${res.status}):`, errorData);
            throw new Error(errorData.error || `Failed to save response (Status: ${res.status})`);
          }
          
          const data = await res.json();
          console.log('Server response:', data);
          return data;
        } catch (error) {
          console.warn(`Save attempt ${retries + 1} failed:`, error);
          lastError = error;
          
          if (retries < MAX_RETRIES) {
            // Exponential backoff - wait longer between retries
            const delay = Math.pow(2, retries) * 500;
            await new Promise(resolve => setTimeout(resolve, delay));
            retries++;
          } else {
            // Max retries reached, throw the last error
            throw lastError;
          }
        }
      }
      
      // This should never be reached due to the throw above, but TypeScript needs a return
      throw new Error("Failed to save response after retries");
    },
    onSuccess: (data) => {
      console.log('Response saved successfully:', data);
      
      // Safely update the responses cache
      queryClient.setQueryData(["/api/assessment-responses", currentAssessmentId], (oldData: any) => {
        if (!oldData) return [data];
        if (!Array.isArray(oldData)) {
          console.warn("Unexpected responses data format, expected array:", oldData);
          return [data];
        }
        
        // Check if this response already exists
        const existingIndex = oldData.findIndex((r: any) => r.questionId === data.questionId);
        
        if (existingIndex >= 0) {
          // Update existing response
          const newData = [...oldData];
          newData[existingIndex] = data;
          return newData;
        } else {
          // Add new response
          return [...oldData, data];
        }
      });
      
      // Update response selections with the server-assigned ID
      setResponseSelections(prev => {
        const updated = { 
          ...prev, 
          [data.questionId]: {
            ...(prev[data.questionId] || {}),
            responseId: data.id
          } 
        };
        
        // Update localStorage with the latest data including server ID
        if (typeof window !== 'undefined' && currentAssessmentId) {
          try {
            localStorage.setItem(`responseSelections_${currentAssessmentId}`, JSON.stringify(updated));
          } catch (e) {
            console.warn("Failed to update localStorage after save:", e);
          }
        }
        
        return updated;
      });
      
      // Only invalidate the assessment data to update progress, not the responses
      if (selectedAgencyId) {
        queryClient.invalidateQueries({ queryKey: ["/api/agencies", selectedAgencyId, "assessments"] });
      }
      
      toast({
        title: "Response Saved",
        description: "Your answer has been recorded.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to save response:", error);
      
      // Provide a helpful error message to the user
      toast({
        title: "Save Error",
        description: `Failed to save response: ${error instanceof Error ? error.message : "Please try again"}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating assessment progress on the server
  const updateAssessmentMutation = useMutation({
    mutationFn: async ({ id, progressPercentage }: { id: string; progressPercentage: number }) => {
      console.log(`Updating assessment progress: ${progressPercentage}% for assessment ${id}`);
      return apiRequest(`/api/agencies/${user?.agencyId}/assessment/${id}`, "PATCH", { 
        progressPercentage 
      });
    },
    onSuccess: (data) => {
      console.log('Assessment progress updated successfully:', data);
      // Silently update the assessments data without triggering a full UI refresh
      queryClient.setQueryData(["/api/agencies", user?.agencyId, "assessments"], (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        
        return oldData.map((assessment: any) => {
          if (assessment.id === currentAssessmentId) {
            return { ...assessment, ...data };
          }
          return assessment;
        });
      });
    },
    onError: (error) => {
      console.error("Failed to update assessment progress:", error);
      // We don't show a toast here as this happens silently in the background
      // and we don't want to distract users with potential network issues
    }
  });

  // Memoize the agency selection handler to prevent useEffect dependency issues
  const handleAgencySelect = useCallback(async (agencyId: string) => {
    console.log(`🔍 Selected agency: ${agencyId}`);
    
    if (!agencyId || agencyId === "no-agencies") {
      console.error("❌ Invalid agency ID received:", agencyId);
      toast({
        title: "Error",
        description: "Invalid agency selected. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Update the state immediately for UI responsiveness
    setSelectedAgencyId(agencyId);
    
    // Find the selected agency in our local data for displaying info
    const selectedAgency = Array.isArray(agencies) ? agencies.find(a => a.id === agencyId) : null;
    if (selectedAgency) {
      console.log(`✅ Selected agency name: ${selectedAgency.name}`);
      
      // Provide user feedback
      toast({
        title: "Agency Selected",
        description: `Agency "${selectedAgency.name}" selected successfully.`,
        duration: 3000, // short duration
      });
    } else {
      console.warn(`⚠️ Agency with ID ${agencyId} was selected but not found in the agencies list`);
    }
    
    // Fetch assessments for the selected agency
    try {
      console.log(`🔄 Fetching assessments for agency ${agencyId}...`);
      
      // Make sure we have the freshest data
      await queryClient.invalidateQueries({ queryKey: ["/api/agencies", agencyId, "assessments"] });
      
      // Get any existing assessments for this agency with proper credentials
      const response = await fetch(`/api/agencies/${agencyId}/assessments`, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      
      // Log response details for debugging
      console.log(`📊 Assessment Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Could not read error details");
        console.error(`❌ Assessment fetch error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch agency assessments: ${response.status}`);
      }
      
      const agencyAssessments = await response.json();
      
      // Validate response format
      if (!Array.isArray(agencyAssessments)) {
        console.error("❌ Invalid assessment data format:", agencyAssessments);
        throw new Error("Invalid response format. Expected an array of assessments.");
      }
      
      console.log(`✅ Found ${agencyAssessments.length} assessments for agency ${agencyId}`);
      
      if (agencyAssessments && agencyAssessments.length > 0) {
        // Use the most recent assessment - handle potential null dates
        const sortedAssessments = [...agencyAssessments].sort((a, b) => {
          const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
          const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setCurrentAssessmentId(sortedAssessments[0].id);
        console.log(`Selected most recent assessment: ${sortedAssessments[0].id}`);
        
        // Show success message
        toast({
          title: "Assessment Loaded",
          description: `Continuing assessment for ${selectedAgency?.name || 'selected agency'}`,
        });
      } else {
        // No existing assessments found - create a new one
        console.log("No existing assessments found. Creating a new one...");
        toast({
          title: "Creating New Assessment",
          description: `Starting new assessment for ${selectedAgency?.name || 'selected agency'}`,
        });
        createAssessmentMutation.mutate(agencyId);
      }
    } catch (error) {
      console.error("Error selecting agency:", error);
      toast({
        title: "Error Loading Assessments",
        description: "Could not load existing assessments. Creating a new one.",
        variant: "destructive",
      });
      // Create a new assessment if failing to fetch existing ones
      createAssessmentMutation.mutate(agencyId);
    }
  }, [createAssessmentMutation, queryClient, agencies, toast]);

  // Function to handle question form submission
  const onQuestionFormSubmit = async (data: QuestionFormValues) => {
    if (editingQuestion) {
      await editQuestionMutation.mutateAsync({
        id: editingQuestion.id,
        data,
      });
    } else {
      await createQuestionMutation.mutateAsync(data);
    }
  };

  // Function to handle editing a question
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  // Function to handle question deletion
  const handleDeleteQuestion = async () => {
    if (questionToDelete) {
      try {
        await deleteQuestionMutation.mutateAsync(questionToDelete);
      } catch (error) {
        console.error("Failed to delete question:", error);
      }
    }
  };

  // Find the current assessment from the appropriate list based on user role
  // First try to find in assessments (agency-specific), then in allAssessments (admin view)
  const assessmentFromAgency = Array.isArray(assessments) ? assessments.find(a => a.id === currentAssessmentId) : null;
  const assessmentFromAdmin = isAdmin && Array.isArray(allAssessments) ? allAssessments.find(a => a.id === currentAssessmentId) : null;

  // Directly fetch a specific assessment if we have the ID but can't find it in the lists
  const { data: directAssessment } = useQuery<any>({
    queryKey: ["/api/agency/assessment", currentAssessmentId],
    enabled: !!currentAssessmentId && !!user?.agencyId && !assessmentFromAgency && !assessmentFromAdmin,
    // Custom query function to directly get the assessment by ID
    queryFn: async () => {
      // For security, admin users can fetch any assessment
      // Regular users can only fetch their agency's assessments
      if (!currentAssessmentId) return null;
      
      console.log("Trying to fetch assessment directly by ID:", currentAssessmentId);
      
      try {
        // Fetch the assessment from the server
        const assessment = await fetch(`/api/agencies/${user?.agencyId || 'admin'}/assessment/${currentAssessmentId}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch assessment: ${res.status}`);
            return res.json();
          })
          .catch(error => {
            console.error("Failed to fetch assessment:", error);
            return null;
          });
          
        console.log("Direct assessment fetch result:", assessment);
        return assessment;
      } catch (error) {
        console.error("Error fetching assessment directly:", error);
        return null;
      }
    }
  });
  
  console.log("Debug assessment search:", {
    currentAssessmentId,
    foundInAgency: !!assessmentFromAgency,
    foundInAdminList: !!assessmentFromAdmin,
    directAssessmentLoaded: !!directAssessment,
    assessmentsLength: assessments?.length || 0,
    allAssessmentsLength: allAssessments?.length || 0
  });
  
  // Ensure we check both sources and handle null/undefined correctly
  let currentAssessment = null;
  
  // First check regular assessment lists
  if (assessmentFromAgency) {
    currentAssessment = assessmentFromAgency;
  } else if (assessmentFromAdmin) {
    currentAssessment = assessmentFromAdmin;
  } else if (directAssessment) {
    // Use the directly fetched assessment if available
    currentAssessment = directAssessment;
  } else if (currentAssessmentId) {
    // If we have an ID but no assessment found yet, create a placeholder assessment
    // This prevents UI errors while data is being loaded
    currentAssessment = {
      id: currentAssessmentId,
      agencyId: selectedAgencyId || user?.agencyId,
      status: 'incomplete',
      progressPercentage: 0,
      startedAt: new Date().toISOString()
    };
    
    console.log("Created placeholder assessment while loading:", currentAssessment);
    
    // Try to load the assessment again if needed
    if (assessments && assessments.length === 0) {
      queryClient.invalidateQueries({ queryKey: ["/api/agencies", selectedAgencyId, "assessments"] });
    }
    
    if (isAdmin && allAssessments && allAssessments.length === 0) {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    }
  }
  
  // Debug check to see why the layout thinks there's no assessment
  if (currentAssessmentId && !currentAssessment) {
    console.error("Assessment ID exists but assessment not found:", currentAssessmentId);
  }
  
  // Create a state variable for the calculated progress percentage
  const [calculatedProgressPercentage, setCalculatedProgressPercentage] = useState<number>(0);

  // Calculate progress from localStorage responses when component mounts
  useEffect(() => {
    if (questions && categories && currentAssessmentId) {
      if (typeof window !== 'undefined') {
        const savedSelections = localStorage.getItem(`responseSelections_${currentAssessmentId}`);
        
        if (savedSelections) {
          try {
            const parsedSelections = JSON.parse(savedSelections);
            const savedResponsesCount = Object.keys(parsedSelections).length;
            
            if (savedResponsesCount > 0) {
              // Calculate how many questions we have in total across all categories
              let totalQuestionsCount = 0;
              categories.forEach(category => {
                const categoryQuestions = questions.filter(q => q.categoryId === category.id);
                totalQuestionsCount += categoryQuestions.length;
              });
              
              // Calculate progress percentage based on localStorage data
              if (totalQuestionsCount > 0) {
                const progressFromLocalStorage = (savedResponsesCount / totalQuestionsCount) * 100;
                const roundedProgress = Math.round(progressFromLocalStorage);
                
                // Update our local state with calculated progress
                setCalculatedProgressPercentage(roundedProgress);
                
                console.log(`Calculated progress from localStorage: ${savedResponsesCount}/${totalQuestionsCount} = ${roundedProgress}%`);
              }
            }
          } catch (e) {
            console.error('Failed to parse saved response selections for progress calculation:', e);
          }
        }
      }
    }
  }, [currentAssessmentId, questions, categories]);

  // For agency users, auto-select their agency and load existing assessment
  useEffect(() => {
    // If user is agency user and has agencyId, automatically select their agency
    if (isAgencyUser && user?.agencyId) {
      // Only select if not already selected or if forcing refresh
      if (!selectedAgencyId || !currentAssessmentId) {
        console.log("Auto-selecting agency for agency user:", user.agencyId);
        handleAgencySelect(user.agencyId);
      }
    }
  }, [isAgencyUser, user, selectedAgencyId, currentAssessmentId, handleAgencySelect]);
  
  // Load responses into local state when they change
  useEffect(() => {
    if (responses && Array.isArray(responses) && responses.length > 0) {
      const selections: Record<string, ResponseSelection> = {};
      
      // Map responses to our local state format
      responses.forEach((response: any) => {
        // Handle any response type (boolean, text, numeric, select)
        if (response.questionId) {
          selections[response.questionId] = {
            response: response.response === true,
            textResponse: response.textResponse,
            numericResponse: response.numericResponse,
            selectResponse: response.selectResponse,
            notes: response.notes || '',
            responseId: response.id
          };
        }
      });
      
      // Update local state with current responses
      setResponseSelections(prev => {
        // Preserve existing selections and merge with new ones, prioritizing server data
        const merged = { ...prev, ...selections };
        // Save to localStorage for persistence between page refreshes
        if (typeof window !== 'undefined' && currentAssessmentId) {
          localStorage.setItem(`responseSelections_${currentAssessmentId}`, JSON.stringify(merged));
          localStorage.setItem('currentAssessmentId', currentAssessmentId);
          console.log("Saved response selections to localStorage for assessment:", currentAssessmentId, Object.keys(merged).length);
        }
        return merged;
      });
      
      console.log("Loaded response selections into local state:", Object.keys(selections).length);
    }
  }, [responses, currentAssessmentId]);
  
  // Save response selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && currentAssessmentId && Object.keys(responseSelections).length > 0) {
      localStorage.setItem(`responseSelections_${currentAssessmentId}`, JSON.stringify(responseSelections));
      localStorage.setItem('currentAssessmentId', currentAssessmentId);
      console.log("Updated localStorage with latest response selections for assessment:", currentAssessmentId);
    }
  }, [responseSelections, currentAssessmentId]);
  
  // Load saved response selections from localStorage when assessment ID changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentAssessmentId) {
      // Try to load assessment-specific saved data
      const savedSelections = localStorage.getItem(`responseSelections_${currentAssessmentId}`);
      
      if (savedSelections) {
        try {
          const parsedSelections = JSON.parse(savedSelections);
          
          // Only update if we actually have data and aren't overwriting with empty data
          if (Object.keys(parsedSelections).length > 0) {
            setResponseSelections(parsedSelections);
            console.log("Restored saved response selections for assessment:", currentAssessmentId);
          }
        } catch (e) {
          console.error('Failed to parse saved response selections for assessment:', currentAssessmentId, e);
        }
      }
    }
  }, [currentAssessmentId]);

  // Helper function to normalize category names when comparing
  // This helps with handling both formats: "Mission Capabilities & Training" and "2. Mission Profiles"
  const normalizeCategoryName = (name: string): string => {
    // First remove any numeric prefix if it exists
    const withoutPrefix = name.replace(/^\d+\.\s+/, '').trim();
    
    // Create a mapping between the different naming conventions
    const categoryMappings: Record<string, string[]> = {
      "Mission Capabilities & Training": ["Mission Profiles"],
      "Individual Operator Equipment": ["Individual Operator Equipment"],
      "Breaching Capabilities": ["Breaching Operations"],
      "Access & Elevated Tactics": ["Access & Elevated Tactics"],
      "Sniper Equipment & Operations": ["Sniper Equipment & Operations"],
      "Team Composition & Structure": ["Personnel & Leadership"],
      "Specialized Roles": ["Specialized Roles"],
      "Personnel & Leadership": ["Team Composition & Structure"]
    };
    
    // Check if this category name is a key in our mapping
    for (const [standardName, alternateNames] of Object.entries(categoryMappings)) {
      if (withoutPrefix === standardName || alternateNames.includes(withoutPrefix)) {
        return standardName; // Return the standardized name
      }
    }
    
    // If no mapping found, just return the name without prefix
    return withoutPrefix;
  };
  
  // Define the interface for our category ID mapping
  interface CategoryIdMappings {
    [categoryId: string]: string[]
  }
  
  // Function to map between category IDs and their equivalent category IDs from the database
  const getCategoryIdMapping = (): CategoryIdMappings => {
    // Create a mapping between different category IDs (based on our debugging findings)
    // This maps known category IDs to their equivalent category IDs 
    // Format: { [displayedCategoryId]: [equivalentCategoryId1, equivalentCategoryId2, ...] }
    return {
      // 1. Tier 1-4 Metrics (Personnel & Leadership) mappings
      "c1411a75-599f-49cf-a8b2-65e17db5f9ba": [
        "c1411a75-599f-49cf-a8b2-65e17db5f9ba", // Self-reference
        "906a6bbb-4d4c-4960-9bd3-74f64089b2b2", // Team Composition & Structure
        "e4442078-a293-4840-b993-6b76837cca20", // Personnel & Leadership
        "21a30524-a80b-4d6c-a23c-4ebd4714e451", // Additional related IDs
        "835844cf-903e-4370-9ec2-ca6622b43250",
        "ffe43a49-30f4-4e3a-9a11-7f4241ce6bbd",
        "bc7a7c3d-9aac-4809-b055-f008524ea784",
        "a8f396e3-59d6-434c-8710-a0418cc100ff" // Specialized Roles
      ],
      
      // 2. Mission Profiles mappings
      "3f137fcf-33c0-4d97-a4a4-7db2c28fc1c8": [
        "3f137fcf-33c0-4d97-a4a4-7db2c28fc1c8", // Self-reference
        "c8f1d7d1-a70b-46ac-8060-00d6428c4f85", // Mission Capabilities & Training
        "a88d5534-0d87-468e-a361-1f94c9b13651"  // Standard Operating Guidelines (SOGs)
      ],
      
      // 3. Individual Operator Equipment mappings
      "dbb503ba-0683-49a5-8de7-03f4603773b6": [
        "dbb503ba-0683-49a5-8de7-03f4603773b6", // Self-reference
        "1db3fb40-5247-4d07-9408-63c5af333bb3", // Alternative ID
        "e0663c8c-1b37-4e8e-afec-3f833634a1d6", // Equipment Procurement and Allocation
        "6306d310-3c76-41d7-a45f-fed538e73fd0", // Equipment Maintenance and Inspection
        "1b236b8a-0aeb-48e5-bb56-bfc0e87bb278"  // Equipment Inventory Management
      ],
      
      // 4. Sniper Equipment & Operations mappings
      "f3f0d9c4-d9fd-42e0-8df8-94e5bf93a1e5": [
        "f3f0d9c4-d9fd-42e0-8df8-94e5bf93a1e5", // Self-reference
        "a272f7a1-32bf-45e2-8083-79224e1fc5f3"  // Alternative ID
      ],
      
      // 5. Breaching Operations mappings
      "9420533e-af40-478c-8b8e-65b08e1f31ab": [
        "9420533e-af40-478c-8b8e-65b08e1f31ab", // Self-reference
        "df55fded-87cf-458b-8790-21cc42d86cce"  // Breaching Capabilities
      ],
      
      // 6. Access & Elevated Tactics mappings
      "1597467a-612f-437a-9de7-e86f9529cf6f": [
        "1597467a-612f-437a-9de7-e86f9529cf6f", // Self-reference
        "5b9276a1-d646-4e88-9d1c-82bd0bfd8a86"  // Alternative ID
      ],
      
      // 7. Less-Lethal Capabilities mappings
      "7697e444-532a-4515-a8d5-a16cd428b4e0": [
        "7697e444-532a-4515-a8d5-a16cd428b4e0"  // Self-reference
      ],
      
      // 8. Noise Flash Diversionary Devices (NFDDs) mappings
      "a65cd14e-69a8-4acc-8f46-7c6b169c9a62": [
        "a65cd14e-69a8-4acc-8f46-7c6b169c9a62"  // Self-reference
      ],
      
      // 9. Chemical Munitions mappings
      "c1191dc6-01ad-4af4-93fa-a99ac7f0350e": [
        "c1191dc6-01ad-4af4-93fa-a99ac7f0350e"  // Self-reference
      ],
      
      // 10. K9 Operations & Integration mappings
      "8e0106b2-9608-4ac0-b68a-bcf0bdbc31e5": [
        "8e0106b2-9608-4ac0-b68a-bcf0bdbc31e5"  // Self-reference
      ],
      
      // 11. Explosive Ordnance Disposal (EOD) Support mappings
      "f7efe965-38ce-458a-b6b0-508d6dd53cbf": [
        "f7efe965-38ce-458a-b6b0-508d6dd53cbf"  // Self-reference
      ],
      
      // 12. Mobility, Transportation & Armor Support mappings
      "1fed3322-7f4f-4a66-828e-c5f7bedd3008": [
        "1fed3322-7f4f-4a66-828e-c5f7bedd3008"  // Self-reference
      ],
      
      // 13. Unique Environment & Technical Capabilities mappings
      "0d05ec4d-902f-4582-bf92-aae31017a4e6": [
        "0d05ec4d-902f-4582-bf92-aae31017a4e6", // Self-reference
        "5694e619-097b-4245-9083-fe6f56623366", // Surveillance & Intelligence
        "e5fb4ff5-77ae-49d8-908f-67819feeda2a"  // Video & Photography
      ],
      
      // 14. SCBA & HAZMAT Capabilities mappings
      "c8d87078-a85b-4f20-b681-d26223ff2ca8": [
        "c8d87078-a85b-4f20-b681-d26223ff2ca8", // Self-reference
        "cc2b59bd-8008-40a1-9d2d-94a868d8d851"  // SCBA & HAZMAT Equipment
      ],
      
      // 15. Tactical Emergency Medical Support (TEMS) mappings
      "74b73cd8-b277-485f-b5c7-d84ee4ff2a26": [
        "74b73cd8-b277-485f-b5c7-d84ee4ff2a26", // Self-reference
        "3f687dee-a05d-4d0e-9408-0f2aaf5089e1"  // Tactical Medical Support
      ]
    };
  };
  
  // Direct question-to-category mapping for display purposes
  const getQuestionsForCategoryName = (categoryName: string): string[] => {
    if (!questions || !categories) return [];
    
    // Find the category ID for the given category name
    const category = categories.find(c => c.name === categoryName);
    if (!category) {
      console.warn(`Category not found: ${categoryName}`);
      return [];
    }
    
    // First priority: Use direct category ID lookup, which will be 100% accurate
    const directlyMappedQuestions = questions.filter(q => q.categoryId === category.id);
    
    // If we found direct matches, use them
    if (directlyMappedQuestions.length > 0) {
      console.log(`Found ${directlyMappedQuestions.length} questions for ${categoryName} using direct category ID matching`);
      return directlyMappedQuestions.map(q => q.id);
    }
    
    // Only use content-based matching as a fallback if needed
    console.log(`No direct matches for ${categoryName} (${category.id}), falling back to content matching`);
    
    // Content-based fallback filters in case category IDs are incorrect
    const keywordFilters: Record<string, (q: Question) => boolean> = {
      "Tier 1-4 Metrics (Personnel & Leadership)": (q) => 
        q.text.toLowerCase().includes("personnel") || 
        q.text.toLowerCase().includes("leadership") ||
        q.text.toLowerCase().includes("member") ||
        q.text.toLowerCase().includes("team") ||
        q.text.toLowerCase().includes("leader"),
        
      "Mission Profiles": (q) => 
        q.text.toLowerCase().includes("mission") ||
        q.text.toLowerCase().includes("profiles") ||
        q.text.toLowerCase().includes("capabilities"),
        
      "Individual Operator Equipment": (q) => 
        q.text.toLowerCase().includes("equipment") ||
        q.text.toLowerCase().includes("gear") ||
        q.text.toLowerCase().includes("operator"),
        
      "Sniper Equipment & Operations": (q) => 
        q.text.toLowerCase().includes("sniper") ||
        q.text.toLowerCase().includes("precision") ||
        q.text.toLowerCase().includes("rifle"),
        
      "Breaching Operations": (q) => 
        q.text.toLowerCase().includes("breach") ||
        q.text.toLowerCase().includes("entry") ||
        q.text.toLowerCase().includes("door"),
        
      "Access & Elevated Tactics": (q) => 
        q.text.toLowerCase().includes("access") || 
        q.text.toLowerCase().includes("elevated") || 
        q.text.toLowerCase().includes("rope") ||
        q.text.toLowerCase().includes("rappel"),
        
      "Less-Lethal Capabilities": (q) => 
        q.text.toLowerCase().includes("less-lethal") ||
        q.text.toLowerCase().includes("less lethal") ||
        q.text.toLowerCase().includes("taser"),
        
      "Noise Flash Diversionary Devices (NFDDs)": (q) => 
        q.text.toLowerCase().includes("flash") ||
        q.text.toLowerCase().includes("diversionary") ||
        q.text.toLowerCase().includes("nfdd"),
        
      "Chemical Munitions": (q) => 
        q.text.toLowerCase().includes("chemical") ||
        q.text.toLowerCase().includes("munitions") ||
        q.text.toLowerCase().includes("gas"),
        
      "K9 Operations & Integration": (q) => 
        q.text.toLowerCase().includes("k9") || 
        q.text.toLowerCase().includes("canine") ||
        q.text.toLowerCase().includes("dog"),
        
      "Explosive Ordnance Disposal (EOD) Support": (q) => 
        q.text.toLowerCase().includes("explosive") ||
        q.text.toLowerCase().includes("ordnance") ||
        q.text.toLowerCase().includes("eod"),
        
      "Mobility, Transportation & Armor Support": (q) => 
        q.text.toLowerCase().includes("mobility") || 
        q.text.toLowerCase().includes("transportation") ||
        q.text.toLowerCase().includes("vehicle"),
        
      "Unique Environment & Technical Capabilities": (q) => 
        q.text.toLowerCase().includes("environment") ||
        q.text.toLowerCase().includes("technical") ||
        q.text.toLowerCase().includes("specialized"),
        
      "SCBA & HAZMAT Capabilities": (q) => 
        q.text.toLowerCase().includes("scba") || 
        q.text.toLowerCase().includes("hazmat") ||
        q.text.toLowerCase().includes("breathing"),
        
      "Negotiations & Crisis Response": (q) => 
        q.text.toLowerCase().includes("negotiation") || 
        q.text.toLowerCase().includes("crisis") ||
        q.text.toLowerCase().includes("response") ||
        q.text.toLowerCase().includes("hostage") ||
        q.text.toLowerCase().includes("barricade"),
        
      "Tactical Emergency Medical Support (TEMS)": (q) => 
        q.text.toLowerCase().includes("medical") || 
        q.text.toLowerCase().includes("tems") ||
        q.text.toLowerCase().includes("paramedic")
    };
    
    // Apply content-based filtering for this category
    if (keywordFilters[categoryName]) {
      const matchingQuestions = questions.filter(keywordFilters[categoryName]);
      console.log(`Found ${matchingQuestions.length} questions for ${categoryName} using content matching`);
      return matchingQuestions.map(q => q.id);
    }
    
    // Return empty array if no matches found
    return [];
  };

  // Get all questions for current category (for step-by-step flow)
  const getCurrentStepQuestions = () => {
    if (!categories || !questions || !Array.isArray(questions)) return [];
    const currentCategory = categories[currentStep];
    if (!currentCategory) return [];
    
    console.log(`Filtering questions for category: ${currentCategory.name} (ID: ${currentCategory.id})`);
    console.log(`Total questions available: ${questions.length}`);
    
    // First try the direct mapping by name
    const questionIds = getQuestionsForCategoryName(currentCategory.name);
    
    // If we have direct mappings for this category, use them
    if (questionIds.length > 0) {
      console.log(`Using direct mapping for ${currentCategory.name}, found ${questionIds.length} questions`);
      const directMappingQuestions = questions.filter(q => questionIds.includes(q.id));
      
      // If we found questions with direct mapping, return them
      if (directMappingQuestions.length > 0) {
        console.log(`Returning ${directMappingQuestions.length} directly mapped questions for ${currentCategory.name}`);
        return directMappingQuestions;
      }
    }
    
    // If we don't have direct mappings or they're empty, fall back to the regular filtering
    console.log(`No direct mappings found for ${currentCategory.name}, using traditional filtering`);
    
    // Get the category ID mapping for equivalent categories
    const categoryIdMapping = getCategoryIdMapping();
    
    // Find questions for this category including alternate naming formats and IDs
    const filteredQuestions = questions.filter(q => {
      // Direct category ID match
      if (q.categoryId === currentCategory.id) {
        return true;
      }
      
      // Check if this question's category ID is in our mapping for the current category
      if (categoryIdMapping[currentCategory.id] && 
          categoryIdMapping[currentCategory.id].includes(q.categoryId)) {
        return true;
      }
      
      // Try to find matching category by normalized name
      if (categories) {
        // Get normalized name of current category
        const normalizedCurrentName = normalizeCategoryName(currentCategory.name);
        
        const matchingCategories = categories.filter(c => 
          c.id !== currentCategory.id && 
          normalizeCategoryName(c.name) === normalizedCurrentName
        );
        
        return matchingCategories.some(c => q.categoryId === c.id);
      }
      return false;
    });
    
    // If we still don't have any questions, use fuzzy matching based on content keywords
    if (filteredQuestions.length === 0) {
      const keywordMap: Record<string, string[]> = {
        "Tier 1-4 Metrics (Personnel & Leadership)": ["personnel", "leadership", "member", "team", "commander", "leader"],
        "Mission Profiles": ["mission", "profiles", "capabilities", "operational"],
        "Individual Operator Equipment": ["equipment", "gear", "operator", "individual"],
        "Sniper Equipment & Operations": ["sniper", "precision", "rifle", "marksman"],
        "Breaching Operations": ["breach", "entry", "door", "forcible", "mechanical", "explosive"],
        "Access & Elevated Tactics": ["access", "elevation", "height", "rope", "tactical", "entry"],
        "Less-Lethal Capabilities": ["less-lethal", "less lethal", "non-lethal", "taser", "bean bag"],
        "Noise Flash Diversionary Devices (NFDDs)": ["noise", "flash", "diversionary", "nfdd", "flash-bang", "flashbang"],
        "Chemical Munitions": ["chemical", "munitions", "cs", "oc", "smoke", "gas"],
        "K9 Operations & Integration": ["k9", "canine", "dog", "handler"],
        "Explosive Ordnance Disposal (EOD) Support": ["explosive", "ordnance", "disposal", "eod", "bomb"],
        "Mobility, Transportation & Armor Support": ["mobility", "transportation", "armor", "vehicle", "armored"],
        "Unique Environment & Technical Capabilities": ["unique", "environment", "technical", "specialized", "water", "maritime", "rural"],
        "SCBA & HAZMAT Capabilities": ["scba", "hazmat", "hazardous", "breathing", "apparatus", "respirator"],
        "Negotiations & Crisis Response": ["negotiation", "crisis", "response", "hostage", "barricade", "negotiator"],
        "Tactical Emergency Medical Support (TEMS)": ["medical", "tems", "tactical emergency", "medic", "paramedic", "first aid"]
      };
      
      const keywords = keywordMap[currentCategory.name] || [];
      if (keywords.length > 0) {
        const keywordQuestions = questions.filter(q => 
          keywords.some(keyword => 
            q.text.toLowerCase().includes(keyword) || 
            (q.description?.toLowerCase().includes(keyword) || false)
          )
        );
        console.log(`Found ${keywordQuestions.length} questions by keyword matching for ${currentCategory.name}`);
        return keywordQuestions;
      }
    }
    
    console.log(`Filtered questions for ${currentCategory.name}: ${filteredQuestions.length}`);
    // Sort questions by orderIndex if available
    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
      // If both have orderIndex, sort by it
      if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
        return a.orderIndex - b.orderIndex;
      }
      // If only a has orderIndex, it comes first
      if (a.orderIndex !== undefined) return -1;
      // If only b has orderIndex, it comes first
      if (b.orderIndex !== undefined) return 1;
      // If neither has orderIndex, maintain original order
      return 0;
    });
    
    console.log(`Returning ${sortedQuestions.length} sorted questions for ${currentCategory.name}`);
    return sortedQuestions;
  };

  // Calculate completion status for each category
  const getCategoryCompletionStatus = (categoryId: string, assessmentId?: string) => {
    if (!questions || !categories) return { total: 0, completed: 0 };
    
    // Find the category by ID
    const category = categories.find(c => c.id === categoryId);
    if (!category) return { total: 0, completed: 0 };

    // Get questions for this category using our direct and keyword mappings
    let categoryQuestions: Question[] = [];
    
    // First try the direct content-based mapping by name
    const questionIds = getQuestionsForCategoryName(category.name);
    
    if (questionIds.length > 0) {
      // Use the direct mapping questions if available
      let filteredQuestions = questions.filter(q => questionIds.includes(q.id));
      
      // Sort by orderIndex if available
      categoryQuestions = [...filteredQuestions].sort((a, b) => {
        // If both have orderIndex, sort by it
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
          return a.orderIndex - b.orderIndex;
        }
        // If only a has orderIndex, it comes first
        if (a.orderIndex !== undefined) return -1;
        // If only b has orderIndex, it comes first
        if (b.orderIndex !== undefined) return 1;
        // If neither has orderIndex, maintain original order
        return 0;
      });
      
      // Log for debugging - only for problem categories
      if (category.name.includes("Access & Elevated") || 
          category.name.includes("Mission") || 
          category.name.includes("Breaching")) {
        console.log(`Direct mapping found ${categoryQuestions.length} questions for ${category.name}`);
      }
    }
    
    // If direct mapping didn't produce any questions, fall back to ID-based mapping
    if (categoryQuestions.length === 0) {
      // Get category ID mappings
      const categoryIdMapping = getCategoryIdMapping();
      
      categoryQuestions = questions.filter(q => {
        // Direct category ID match
        if (q.categoryId === categoryId) return true;
        
        // Check if this question's category ID is in our mapping for the current category
        if (categoryIdMapping[categoryId] && 
            categoryIdMapping[categoryId].includes(q.categoryId)) {
          return true;
        }
        
        // Try to find matching category by normalized name
        const normalizedCategoryName = normalizeCategoryName(category.name);
        const matchingCategories = categories.filter(c => 
          c.id !== categoryId && 
          normalizeCategoryName(c.name) === normalizedCategoryName
        );
        
        return matchingCategories.some(c => q.categoryId === c.id);
      });
    }
    
    // If we still don't have questions, use keyword matching as a last resort
    if (categoryQuestions.length === 0) {
      const keywordMap: Record<string, string[]> = {
        "Tier 1-4 Metrics (Personnel & Leadership)": ["personnel", "leadership", "member", "team", "commander", "leader"],
        "Mission Profiles": ["mission", "profiles", "capabilities", "operational"],
        "Individual Operator Equipment": ["equipment", "gear", "operator", "individual"],
        "Sniper Equipment & Operations": ["sniper", "precision", "rifle", "marksman"],
        "Breaching Operations": ["breach", "entry", "door", "forcible", "mechanical", "explosive"],
        "Access & Elevated Tactics": ["access", "elevation", "height", "rope", "tactical", "entry"],
        "Less-Lethal Capabilities": ["less-lethal", "less lethal", "non-lethal", "taser", "bean bag"],
        "Noise Flash Diversionary Devices (NFDDs)": ["noise", "flash", "diversionary", "nfdd", "flash-bang", "flashbang"],
        "Chemical Munitions": ["chemical", "munitions", "cs", "oc", "smoke", "gas"],
        "K9 Operations & Integration": ["k9", "canine", "dog", "handler"],
        "Explosive Ordnance Disposal (EOD) Support": ["explosive", "ordnance", "disposal", "eod", "bomb"],
        "Mobility, Transportation & Armor Support": ["mobility", "transportation", "armor", "vehicle", "armored"],
        "Unique Environment & Technical Capabilities": ["unique", "environment", "technical", "specialized", "water", "maritime", "rural"],
        "Negotiations & Crisis Response": ["negotiation", "crisis", "response", "hostage", "barricade", "negotiator"],
        "SCBA & HAZMAT Capabilities": ["scba", "hazmat", "hazardous", "breathing", "apparatus", "respirator"],
        "Tactical Emergency Medical Support (TEMS)": ["medical", "tems", "tactical emergency", "medic", "paramedic", "first aid"]
      };
      
      const keywords = keywordMap[category.name] || [];
      if (keywords.length > 0) {
        categoryQuestions = questions.filter(q => 
          keywords.some(keyword => 
            q.text.toLowerCase().includes(keyword) || 
            (q.description?.toLowerCase().includes(keyword) || false)
          )
        );
      }
    }
    
    // Fallback to a default sample of questions if all other methods fail
    // This ensures the UI always shows something instead of empty data
    if (categoryQuestions.length === 0) {
      // Take a sample from all questions for this category
      categoryQuestions = questions.slice(0, Math.min(5, questions.length));
    }
    
    // Count the completed questions
    let completedQuestions = 0;
    let assessmentResponses = null;
    
    if (assessmentId) {
      // For admin view, when viewing progress of specific assessment
      if (isAdmin && allAssessmentResponses) {
        // Filter responses for the specific assessment
        assessmentResponses = Array.isArray(allAssessmentResponses) 
          ? allAssessmentResponses.filter((r: any) => r.assessmentId === assessmentId)
          : [];
      } else if (assessmentId === currentAssessmentId && responses) {
        // For current assessment being viewed
        assessmentResponses = responses;
      }
    } else if (responses) {
      // For current assessment if no specific assessment is requested
      assessmentResponses = responses;
    }
    
    // Count completed questions with defensive error handling
    try {
      if (assessmentResponses && Array.isArray(assessmentResponses)) {
        // First count the responses from the server
        completedQuestions = categoryQuestions.filter(q => 
          assessmentResponses.some((r: any) => r.questionId === q.id)
        ).length;
        
        // If we are loading for the current assessment, also consider localStorage data
        if (!assessmentId || assessmentId === currentAssessmentId) {
          // Try to incorporate localStorage responses for more accurate progress calculation
          const savedSelections = typeof window !== 'undefined' && currentAssessmentId ? 
            localStorage.getItem(`responseSelections_${currentAssessmentId}`) : null;
            
          if (savedSelections) {
            try {
              const parsedSelections = JSON.parse(savedSelections);
              
              // Count questions that have a saved response in localStorage but aren't in the server responses
              const additionalCompletedQuestions = categoryQuestions.filter(q => {
                // Skip questions already counted from server responses
                if (assessmentResponses.some((r: any) => r.questionId === q.id)) {
                  return false;
                }
                
                // Check if this question has a response in localStorage
                return parsedSelections[q.id] !== undefined;
              }).length;
              
              // Add the additional completed questions from localStorage
              if (additionalCompletedQuestions > 0) {
                console.log(`Found ${additionalCompletedQuestions} additional completed questions from localStorage for category ${categoryId}`);
                completedQuestions += additionalCompletedQuestions;
              }
            } catch (e) {
              console.error('Failed to parse localStorage responses for progress calculation:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error counting completed questions:", error);
      // If there's an error, fall back to a default value
      completedQuestions = 0;
    }

    return {
      total: categoryQuestions.length,
      completed: completedQuestions
    };
  };
  
  // Calculate overall progress percentage across all categories
  const calculateOverallProgress = () => {
    if (!questions || !categories || !responses) {
      return 0;
    }
    
    let totalQuestions = 0;
    let totalAnswered = 0;
    
    // Sum up totals across all categories
    categories.forEach(category => {
      const { total, completed } = getCategoryCompletionStatus(category.id);
      totalQuestions += total;
      totalAnswered += completed;
    });
    
    // Avoid division by zero
    if (totalQuestions === 0) return 0;
    
    return (totalAnswered / totalQuestions) * 100;
  };
  
  // Navigate to next category step
  const goToNextStep = () => {
    if (categories && currentStep < categories.length - 1) {
      // Update assessment progress on the server before moving to next step
      if (currentAssessmentId) {
        const progress = calculatedProgressPercentage > 0 ? 
          calculatedProgressPercentage : 
          Math.round(calculateOverallProgress());
          
        updateAssessmentMutation.mutate({ 
          id: currentAssessmentId, 
          progressPercentage: progress 
        });
      }
      
      // Move to next category
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Navigate to previous category step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Save current progress explicitly
  const saveProgress = () => {
    if (currentAssessmentId) {
      const progress = calculatedProgressPercentage > 0 ? 
        calculatedProgressPercentage : 
        Math.round(calculateOverallProgress());
        
      // Show saving indicator
      toast({
        title: "Saving progress...",
        description: "Your assessment progress is being saved.",
      });
      
      // Update assessment progress on the server
      updateAssessmentMutation.mutate({ 
        id: currentAssessmentId, 
        progressPercentage: progress 
      }, {
        onSuccess: () => {
          toast({
            title: "Progress saved",
            description: "Your assessment progress has been saved successfully."
          });
        },
        onError: () => {
          toast({
            title: "Error saving progress",
            description: "There was an error saving your progress. Your responses are still saved locally.",
            variant: "destructive"
          });
        }
      });
    }
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply these shortcuts when focused on the body
      if (document.activeElement === document.body) {
        // Left arrow key for previous step
        if (e.key === 'ArrowLeft' && currentStep > 0) {
          goToPreviousStep();
        }
        // Right arrow key for next step
        else if (e.key === 'ArrowRight' && categories && currentStep < categories.length - 1) {
          goToNextStep();
        }
        // S key for save progress
        else if ((e.key === 's' || e.key === 'S') && e.ctrlKey) {
          e.preventDefault(); // Prevent default browser save dialog
          saveProgress();
        }
      }
    };
    
    // Add event listener for keyboard navigation
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, categories]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-screen-xl">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold">SWAT Team Assessment</h2>
        {currentAssessment && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <Progress 
              value={calculatedProgressPercentage > 0 ? calculatedProgressPercentage : (currentAssessment?.progressPercentage || 0)} 
              className="w-full sm:w-[200px] max-w-xs dark:bg-gray-700" 
            />
            <span className="text-sm font-medium whitespace-nowrap">
              {calculatedProgressPercentage > 0 ? calculatedProgressPercentage : (currentAssessment?.progressPercentage || 0)}%
            </span>
          </div>
        )}
      </div>

      {/* Agency User View - Guided Step-by-Step Assessment */}
      {isAgencyUser && (
        <div className="space-y-6">
          {!currentAssessmentId && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-l">Welcome to Your SWAT Team Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  This assessment will help determine your team's readiness level and provide recommendations
                  for improvement. Your responses are saved automatically as you progress.
                </p>
                
                {/* Agency is automatically selected for agency users */}
                {user?.agencyId && agencies?.find(a => a.id === user.agencyId) && (
                  <div className="flex items-center space--2 mb-6">
                    <Badge variant="outline" className="text-sm p-3 py-.5">
                      {agencies?.find(a => a.id === user.agencyId)?.name || 'Your Agency'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Your responses will be saved to this agency profile</span>
                  </div>
                )}
                
                <Button 
                  className="w-full sm:w-auto" 
                  size="lg"
                  onClick={() => {
                    if (currentAssessment) {
                      setCurrentStep(0);
                    } else if (user?.agencyId) {
                      // Create a new assessment manually
                      console.log("Explicitly creating new assessment from Start button");
                      createAssessmentMutation.mutateAsync(user.agencyId);
                    }
                  }}
                >
                  {currentAssessment ? 'Continue Assessment' : 'Start New Assessment'}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentAssessmentId && categories && categories.length > 0 && (
            <div className="space-y-8">
              {/* Premium Progress Steps */}
              <div className="relative mb-12 mt-6 pt-2">
                {/* Progress bar background */}
                <div className="absolute top-8 left-0 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                  {/* Animated progress fill */}
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                    style={{ 
                      width: `${(currentStep / (
                        categories.filter(cat => {
                          // First filter Tier Assessment categories, using the exact names from official docs
                          // These must be in exact order according to the SWAT Tier Level Assessment Template
                          const tierAssessmentCategories = [
                            "Tier 1-4 Metrics (Personnel & Leadership)",
                            "Mission Profiles",
                            "Individual Operator Equipment",
                            "Sniper Equipment & Operations",
                            "Breaching Operations",
                            "Access & Elevated Tactics",
                            "Less-Lethal Capabilities",
                            "Noise Flash Diversionary Devices (NFDDs)",
                            "Chemical Munitions",
                            "K9 Operations & Integration",
                            "Explosive Ordnance Disposal (EOD) Support",
                            "Mobility, Transportation & Armor Support",
                            "Unique Environment & Technical Capabilities",
                            "SCBA & HAZMAT Capabilities",
                            "Tactical Emergency Medical Support (TEMS)",
                            "Negotiations & Crisis Response"
                          ];
                          
                          // Check if this category matches any of the tier assessment category names
                          // We're only using tier assessment categories here for the progress bar
                          // Gap Analysis categories are handled separately
                          return tierAssessmentCategories.some(tierCat => 
                            cat.name === tierCat || 
                            cat.name.replace(/^\d+\.\s+/, '') === tierCat // Remove any number prefix
                          );
                        }).length - 1
                      )) * 100}%` 
                    }}
                  ></div>
                </div>
                
                {/* Category steps - only show main assessment categories from SWAT Tier Level Assessment */}
                <div className="relative flex space-x-6 overflow-x-auto pb-8 pt-2 px-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {/* Filter to show both Tier Assessment and Gap Analysis categories based on official docs */}
                  {categories.filter(cat => {
                    // Include both Tier Assessment and Gap Analysis categories
                    // These must be in exact order according to the SWAT Tier Level Assessment Template
                    const allAssessmentCategories = [
                      // Tier Assessment Categories (16)
                      "Tier 1-4 Metrics (Personnel & Leadership)",
                      "Mission Profiles",
                      "Individual Operator Equipment",
                      "Sniper Equipment & Operations",
                      "Breaching Operations",
                      "Access & Elevated Tactics",
                      "Less-Lethal Capabilities",
                      "Noise Flash Diversionary Devices (NFDDs)",
                      "Chemical Munitions",
                      "K9 Operations & Integration",
                      "Explosive Ordnance Disposal (EOD) Support",
                      "Mobility, Transportation & Armor Support",
                      "Unique Environment & Technical Capabilities",
                      "SCBA & HAZMAT Capabilities",
                      "Tactical Emergency Medical Support (TEMS)",
                      "Negotiations & Crisis Response",
                      
                      // Gap Analysis Categories (8)
                      "Team Structure and Chain of Command",
                      "Supervisor-to-Operator Ratio",
                      "Span of Control Adjustments for Complex Operations",
                      "Training and Evaluation of Leadership",
                      "Equipment Procurement and Allocation",
                      "Equipment Maintenance and Inspection",
                      "Equipment Inventory Management",
                      "Standard Operating Guidelines (SOGs)"
                    ];
                    
                    // Check if this category matches any of the assessment category names
                    return allAssessmentCategories.some(assessmentCat => 
                      cat.name === assessmentCat || 
                      cat.name.replace(/^\d+\.\s+/, '') === assessmentCat // Remove any number prefix
                    );
                  }).map((category, index) => {
                    const { total, completed } = getCategoryCompletionStatus(category.id);
                    const isComplete = total > 0 && completed === total;
                    const isCurrent = index === currentStep;
                    
                    return (
                      <div 
                        key={category.id}
                        className={`flex flex-col items-center cursor-pointer transition-all duration-300 flex-shrink-0 px-2
                          ${isCurrent ? 'transform scale-110' : 'opacity-80 hover:opacity-100'}`}
                        onClick={() => setCurrentStep(index)}
                      >
                        <div className={`
                          flex items-center justify-center w-12 h-12 rounded-full shadow-md
                          ${isComplete 
                            ? 'bg-green-600 text-white' 
                            : index < currentStep 
                              ? 'bg-primary/80 text-white' 
                              : isCurrent 
                                ? 'bg-primary text-white ring-4 ring-primary/20' 
                                : 'bg-background border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}
                          z-10 text-sm font-bold transition-all
                        `}>
                          {isComplete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                        </div>
                        <div className={`
                          mt-3 text-xs font-medium max-w-[120px] text-center whitespace-normal h-auto
                          ${isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'}
                        `}>
                          {category.name.split('&').map((part, i) => (
                            <span key={i}>
                              {i > 0 && <span className="whitespace-nowrap">&</span>} {part.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Completion Summary - Responsive Layout */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/30 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm font-semibold">Assessment Progress:</span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Progress 
                      value={calculatedProgressPercentage > 0 ? calculatedProgressPercentage : Math.round(calculateOverallProgress())} 
                      className="w-full sm:w-32 h-2.5" 
                    />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {calculatedProgressPercentage > 0 ? calculatedProgressPercentage : Math.round(calculateOverallProgress())}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
                  <Badge variant="outline" className="bg-primary/10">
                    {calculatedProgressPercentage > 0 ? calculatedProgressPercentage : Math.round(calculateOverallProgress())}% Complete
                  </Badge>
                  <Badge variant="outline" className="bg-secondary/10">
                    Step {currentStep + 1} of {categories.filter(cat => {
                      // First filter Tier Assessment categories, followed by Gap Analysis categories
                      // These must be in exact order according to the official templates
                      const assessmentCategories = [
                        // Tier Assessment Categories (16)
                        "Tier 1-4 Metrics (Personnel & Leadership)",
                        "Mission Profiles",
                        "Individual Operator Equipment",
                        "Sniper Equipment & Operations",
                        "Breaching Operations",
                        "Access & Elevated Tactics",
                        "Less-Lethal Capabilities",
                        "Noise Flash Diversionary Devices (NFDDs)",
                        "Chemical Munitions",
                        "K9 Operations & Integration",
                        "Explosive Ordnance Disposal (EOD) Support",
                        "Mobility, Transportation & Armor Support",
                        "Unique Environment & Technical Capabilities",
                        "SCBA & HAZMAT Capabilities",
                        "Tactical Emergency Medical Support (TEMS)",
                        "Negotiations & Crisis Response",
                        
                        // Gap Analysis Categories (8)
                        "Team Structure and Chain of Command",
                        "Supervisor-to-Operator Ratio",
                        "Span of Control Adjustments for Complex Operations",
                        "Training and Evaluation of Leadership",
                        "Equipment Procurement and Allocation",
                        "Equipment Maintenance and Inspection",
                        "Equipment Inventory Management",
                        "Standard Operating Guidelines (SOGs)"
                      ];
                      
                      // Check if this category matches any of the assessment category names
                      const isMatch = assessmentCategories.some(assessmentCat => 
                        cat.name === assessmentCat || 
                        cat.name.replace(/^\d+\.\s+/, '') === assessmentCat // Remove any number prefix
                      );
                      
                      // Debug logs to help diagnose category matching
                      if (cat.name.includes("Structure") || cat.name.includes("Gap")) {
                        console.log(`Checking category match: ${cat.name}, isMatch: ${isMatch}`);
                      }
                      
                      return isMatch;
                    }).length}
                  </Badge>
                </div>
              </div>
              
              {/* Current Category Questions */}
              {categories[currentStep] && (
                <Card>
                  <CardHeader className="bg-muted/30">
                    <CardTitle>{categories[currentStep].name}</CardTitle>
                    {categories[currentStep].description && (
                      <p className="text-sm text-muted-foreground">{categories[currentStep].description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-8">
                      {getCurrentStepQuestions().map((question, idx) => (
                        <div 
                          key={question.id} 
                          className="p-4 sm:p-6 border rounded-xl shadow-sm bg-card hover:shadow-md transition-shadow duration-200 space-y-5"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                  {idx + 1}
                                </div>
                                <Label className="text-sm sm:text-base font-medium leading-tight">{question.text}</Label>
                              </div>
                              {question.description && (
                                <p className="text-xs sm:text-sm text-muted-foreground ml-11">{question.description}</p>
                              )}
                            </div>
                          </div>
                          
                          {isLoadingResponses ? (
                            <div className="flex items-center gap-2 text-muted-foreground ml-0 sm:ml-11">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Loading your previous answer...</span>
                            </div>
                          ) : (
                            <div className="ml-0 sm:ml-11">
                              {question.questionType === "text" ? (
                                <div className="mt-2">
                                  <Input
                                    id={`step-${question.id}-text`}
                                    placeholder="Enter your response"
                                    className="w-full"
                                    value={
                                      // First check our local state for immediate updates
                                      responseSelections[question.id]?.textResponse || 
                                      // Then fall back to server data
                                      (responses && Array.isArray(responses) && 
                                       responses.find((r: any) => r.questionId === question.id)?.textResponse) || 
                                      ""
                                    }
                                    onChange={(e) => {
                                      const textResponse = e.target.value;
                                      setResponseSelections(prev => ({
                                        ...prev,
                                        [question.id]: {
                                          ...prev[question.id],
                                          textResponse,
                                          notes: prev[question.id]?.notes || ''
                                        }
                                      }));
                                      saveResponseMutation.mutate({
                                        questionId: question.id,
                                        textResponse
                                      });
                                    }}
                                  />
                                </div>
                              ) : question.questionType === "numeric" ? (
                                <div className="mt-2">
                                  <div className="relative">
                                    <input
                                      id={`step-${question.id}-numeric`}
                                      type="text"
                                      placeholder={question.text.includes("ratio") ? "Enter a ratio (e.g., 1:5 or 0.2)" : "Enter a number"}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={
                                        // First check for textResponse for formatted display
                                        responseSelections[question.id]?.textResponse || 
                                        // Then fall back to server data for textResponse
                                        (responses && Array.isArray(responses) && 
                                         responses.find((r: any) => r.questionId === question.id)?.textResponse) ||
                                        // Then fall back to numericResponse
                                        responseSelections[question.id]?.numericResponse?.toString() || 
                                        (responses && Array.isArray(responses) && 
                                         responses.find((r: any) => r.questionId === question.id)?.numericResponse?.toString()) || 
                                        ""
                                      }
                                      onKeyDown={(e) => {
                                        // Allow colon key
                                        if (e.key === ":" && question.text.includes("ratio")) {
                                          // Explicitly allowed
                                        } 
                                        // Allow numbers, backspace, delete, arrow keys
                                        else if (!/[0-9\.]/.test(e.key) && 
                                          !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                                          // Only block non-numeric keys if not special keys
                                          if (e.key.length === 1) {
                                            e.preventDefault();
                                          }
                                        }
                                      }}
                                      onChange={(e) => {
                                        // Always store the raw input value in state for display
                                        const value = e.target.value;
                                        
                                        // Store the raw text value (including the colon)
                                        setResponseSelections(prev => ({
                                          ...prev,
                                          [question.id]: {
                                            ...prev[question.id],
                                            textResponse: value, // Store as text for display
                                            notes: prev[question.id]?.notes || ''
                                          }
                                        }));
                                        
                                        // Process for numeric value to store in database
                                        let numericResponse: number | undefined;
                                        
                                        // Handle ratio format (e.g., "1:5")
                                        if (value.includes(':')) {
                                          const parts = value.split(':');
                                          if (parts.length === 2) {
                                            const numerator = parseFloat(parts[0].trim());
                                            const denominator = parseFloat(parts[1].trim());
                                            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                                              numericResponse = numerator / denominator;
                                              // Send the calculated value to the server
                                              saveResponseMutation.mutate({
                                                questionId: question.id,
                                                numericResponse: numericResponse as number,
                                                textResponse: value // Also store the formatted text
                                              });
                                            }
                                          }
                                        } 
                                        // Handle direct numeric input
                                        else if (value !== '') {
                                          numericResponse = parseFloat(value);
                                          if (!isNaN(numericResponse)) {
                                            // Send the numeric value to the server
                                            saveResponseMutation.mutate({
                                              questionId: question.id,
                                              numericResponse: numericResponse as number,
                                              textResponse: value
                                            });
                                          }
                                        }
                                      }}
                                    />
                                    {question.text.includes("ratio") && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        You can enter a ratio like "1:5" or a decimal like "0.2"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : question.questionType === "select" && question.validationRules?.options ? (
                                <div className="mt-2">
                                  <Select
                                    value={
                                      // First check our local state for immediate updates
                                      responseSelections[question.id]?.selectResponse || 
                                      // Then fall back to server data
                                      (responses && Array.isArray(responses) && 
                                       responses.find((r: any) => r.questionId === question.id)?.selectResponse) || 
                                      ""
                                    }
                                    onValueChange={(value) => {
                                      setResponseSelections(prev => ({
                                        ...prev,
                                        [question.id]: {
                                          ...prev[question.id],
                                          selectResponse: value,
                                          notes: prev[question.id]?.notes || ''
                                        }
                                      }));
                                      saveResponseMutation.mutate({
                                        questionId: question.id,
                                        selectResponse: value
                                      });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {question.validationRules.options.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <RadioGroup
                                  key={`question-${question.id}-responses-${responses?.length || 0}`}
                                  onValueChange={(value) => handleResponseSubmit(question.id, value === "yes")}
                                  className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-2"
                                  value={
                                    // First check our local state for immediate updates
                                    responseSelections[question.id]?.response === true
                                      ? "yes"
                                      : responseSelections[question.id]?.response === false
                                        ? "no"
                                        : // Then fall back to server data
                                          responses && Array.isArray(responses) && responses.find((r: any) => r.questionId === question.id)?.response === true
                                            ? "yes" 
                                            : responses && Array.isArray(responses) && responses.find((r: any) => r.questionId === question.id)?.response === false
                                              ? "no"
                                              : undefined
                                  }
                                >
                                  <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 w-full sm:w-auto justify-center sm:justify-start">
                                    <RadioGroupItem value="yes" id={`step-${question.id}-yes`} />
                                    <Label htmlFor={`step-${question.id}-yes`} className="font-medium">Yes</Label>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 w-full sm:w-auto justify-center sm:justify-start">
                                    <RadioGroupItem value="no" id={`step-${question.id}-no`} />
                                    <Label htmlFor={`step-${question.id}-no`} className="font-medium">No</Label>
                                  </div>
                                </RadioGroup>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center py-4 border-t">
                    <Button
                      variant="outline"
                      onClick={goToPreviousStep}
                      disabled={currentStep === 0}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={saveProgress}
                      className="flex items-center gap-2 hidden sm:flex"
                      title="Save progress and continue later (Ctrl+S)"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Progress</span>
                    </Button>
                    
                    <div className="text-sm text-muted-foreground hidden md:block">
                      {getCurrentStepQuestions().length} questions in this section
                    </div>
                    
                    <Button
                      onClick={goToNextStep}
                      disabled={currentStep === categories.length - 1}
                      className="flex items-center gap-2"
                    >
                      <span>{currentStep === categories.length - 2 ? 'Finish' : 'Next'}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )}
              
              {/* Summary when all steps are completed */}
              {currentStep === categories.length - 1 && (
                <Card className="mt-6 border-green-200 dark:border-green-900">
                  <CardHeader className="border-b bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <CardTitle>Assessment Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="mb-6">
                      Thank you for completing your SWAT team assessment. Based on your responses,
                      {isAdmin 
                        ? " we can now generate reports to help you understand the team's current readiness level and identify areas for improvement."
                        : " your assessment data has been saved. An administrator will review your responses and can generate detailed reports for your agency."
                      }
                    </p>
                    
                    {isAdmin && (
                      <div className="flex flex-col md:flex-row gap-4">
                        <Button
                          onClick={() => generateTierReportMutation.mutateAsync(currentAssessmentId)}
                          className="flex items-center gap-2"
                          disabled={generateTierReportMutation.isPending}
                        >
                          {generateTierReportMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          Generate Tier Assessment
                        </Button>
                        
                        <Button
                          onClick={() => generateGapReportMutation.mutateAsync(currentAssessmentId)}
                          className="flex items-center gap-2"
                          variant="outline"
                          disabled={generateGapReportMutation.isPending}
                        >
                          {generateGapReportMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          Generate Gap Analysis
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin View - Tab-based management interface */}
      {isAdmin && (
        <div className="space-y-6">
          <Tabs 
            defaultValue="assessment" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            {/* Assessment Creation Tab */}
            <TabsContent value="assessment" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Assessment Management</h3>
                {selectedAgencyId && (
                  <Button 
                    onClick={() => createAssessmentMutation.mutate(selectedAgencyId)}
                    disabled={!selectedAgencyId || createAssessmentMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {createAssessmentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4" />
                    )}
                    New Assessment
                  </Button>
                )}
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Create or Manage Assessments</CardTitle>
                  <CardDescription>
                    Select an agency to view or create assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agency">Agency</Label>
                      <div className="space-y-3">
                        <Select 
                          value={selectedAgencyId || undefined}
                          onValueChange={handleAgencySelect}
                          disabled={isLoadingAgencies}
                        >
                          <SelectTrigger id="agency" className={`w-full mt-2 ${isLoadingAgencies ? 'opacity-70' : ''}`}>
                            <SelectValue placeholder={isLoadingAgencies ? "Loading agencies..." : "Select an agency"} />
                            {isLoadingAgencies && (
                              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(agencies) && agencies.length > 0 ? (
                              agencies.map((agency) => (
                                <SelectItem key={agency.id} value={agency.id}>
                                  {agency.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-agencies" disabled>
                                {isLoadingAgencies ? "Loading agencies..." : "No agencies available"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        
                        {/* Loading states */}
                        {isLoadingAgencies && (
                          <div className="flex items-center gap-2 text-muted-foreground my-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading agencies...</span>
                          </div>
                        )}
                        
                        {/* Error state */}
                        {isAgenciesError && (
                          <div className="text-destructive text-sm flex items-center gap-2 my-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>Failed to load agencies</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => refetchAgencies()}
                              className="h-7 px-2 text-xs"
                            >
                              Retry
                            </Button>
                          </div>
                        )}
                        
                        {/* Empty state */}
                        {!isLoadingAgencies && !isAgenciesError && (!Array.isArray(agencies) || agencies.length === 0) && (
                          <div className="text-amber-500 text-sm flex items-center gap-2 my-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>No agencies found. Please create an agency first.</span>
                          </div>
                        )}
                        
                        {/* Debug information */}
                        <div className="text-xs text-muted-foreground mt-1">
                          {Array.isArray(agencies) && !isLoadingAgencies ? `${agencies.length} agencies available` : 'Loading agencies...'}
                          {selectedAgencyId && ` • Selected: ${selectedAgencyId.substring(0, 8)}...`}
                        </div>
                        
                        {/* Direct agency selection buttons as fallback */}
                        {Array.isArray(agencies) && agencies.length > 0 && !selectedAgencyId && !isLoadingAgencies && (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="text-sm font-medium">Quick Select Agency:</div>
                            <div className="flex flex-wrap gap-2">
                              {agencies.map(agency => (
                                <button
                                  key={agency.id}
                                  type="button"
                                  className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md"
                                  onClick={() => handleAgencySelect(agency.id)}
                                >
                                  {agency.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {assessments && assessments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Existing Assessments</h4>
                        <div className="border rounded-md divide-y">
                          {assessments.map((assessment) => (
                            <div 
                              key={assessment.id} 
                              className={`p-3 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors ${
                                assessment.id === currentAssessmentId ? 'bg-muted' : ''
                              }`}
                              onClick={() => setCurrentAssessmentId(assessment.id)}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {assessment.startedAt ? new Date(assessment.startedAt).toLocaleDateString() : 'N/A'}
                                  </span>
                                  <Badge variant={assessment.status === 'completed' ? 'success' : 'default'}>
                                    {assessment.status === 'completed' ? 'Completed' : 'In Progress'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Tier Level: {assessment.tierLevel || 'Not determined yet'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">
                                  {assessment.progressPercentage || 0}%
                                </div>
                                <Progress
                                  value={assessment.progressPercentage || 0}
                                  className="w-[100px]"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className={assessment.id === currentAssessmentId ? 'text-primary' : ''}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Current Assessment View */}
              {currentAssessmentId && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>Current Assessment</CardTitle>
                      <Badge variant="outline">
                        ID: {currentAssessmentId.split('-')[0]}...
                      </Badge>
                    </div>
                    <CardDescription>
                      {currentAssessment?.agencyId && agencies?.find(a => a.id === currentAssessment?.agencyId)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Started</div>
                          <div>{currentAssessment?.startedAt ? new Date(currentAssessment.startedAt).toLocaleString() : 'N/A'}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Status</div>
                          <Badge variant={currentAssessment?.status === 'completed' ? 'success' : 'default'}>
                            {currentAssessment?.status === 'completed' ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 w-full md:w-auto">
                          <div className="text-sm font-medium">Progress</div>
                          <div className="flex items-center gap-2">
                            <Progress value={currentAssessment?.progressPercentage || 0} className="w-[150px]" />
                            <span className="text-sm font-medium">{currentAssessment?.progressPercentage || 0}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Tier Level</div>
                          <div>{currentAssessment?.tierLevel || 'Not determined yet'}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          onClick={() => setActiveTab('questions')}
                          variant="default"
                          className="flex items-center gap-2"
                        >
                          <ClipboardList className="h-4 w-4" /> 
                          Edit Questions
                        </Button>
                        
                        {isAdmin && (
                          <>
                            <Button
                              onClick={() => generateTierReportMutation.mutateAsync(currentAssessmentId)}
                              variant="outline"
                              className="flex items-center gap-2"
                              disabled={generateTierReportMutation.isPending}
                            >
                              {generateTierReportMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              Generate Tier Assessment
                            </Button>
                            
                            <Button
                              onClick={() => generateGapReportMutation.mutateAsync(currentAssessmentId)}
                              variant="outline"
                              className="flex items-center gap-2"
                              disabled={generateGapReportMutation.isPending}
                            >
                              {generateGapReportMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                              Generate Gap Analysis
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Progress Tracking Tab */}
            <TabsContent value="progress" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Progress Tracking</h3>
                <div className="space-y-2">
                  {/* Agency selection dropdown */}
                  <div className="space-y-1">
                    <Label htmlFor="agency-select">Select Agency</Label>
                    {Array.isArray(agencies) && agencies.length > 0 ? (
                      <Select
                        value={selectedAgencyId || undefined}
                        onValueChange={handleAgencySelect}
                        disabled={isLoadingAgencies}
                      >
                        <SelectTrigger id="agency-select" className={`w-full ${isLoadingAgencies ? 'opacity-70' : ''}`}>
                          <SelectValue placeholder={isLoadingAgencies ? "Loading agencies..." : "Select agency"} />
                          {isLoadingAgencies && (
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(agencies) && agencies.length > 0 ? (
                            agencies.map((agency) => (
                              <SelectItem key={agency.id} value={agency.id}>
                                {agency.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-agencies" disabled>
                              {isLoadingAgencies ? "Loading agencies..." : "No agencies available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="relative">
                        <Input 
                          id="agency-select"
                          value="No agencies available" 
                          readOnly
                          disabled={isLoadingAgencies}
                          className="bg-muted cursor-not-allowed"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-primary"
                          onClick={() => refetchAgencies()}
                        >
                          <RefreshCcw className="h-4 w-4 mr-1" />
                          <span className="text-xs">Reload</span>
                        </Button>
                      </div>
                    )}
                  
                    {/* Loading state */}
                    {isLoadingAgencies && (
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Loading agencies...</span>
                      </div>
                    )}
                    
                    {/* Error state with retry button */}
                    {isAgenciesError && (
                      <div className="rounded-md bg-destructive/10 p-2 mt-2">
                        <div className="text-destructive text-xs flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Failed to load agencies</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => refetchAgencies()}
                            className="h-6 ml-auto"
                          >
                            <RefreshCcw className="h-3 w-3 mr-1" />
                            <span className="text-xs">Retry</span>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Error: {agenciesError instanceof Error ? agenciesError.message : "Unknown error"}
                        </p>
                      </div>
                    )}
                    
                    {/* Success state and count */}
                    {!isLoadingAgencies && !isAgenciesError && Array.isArray(agencies) && agencies.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedAgencyId ? (
                          <span className="text-primary">
                            Selected: {agencies.find(a => a.id === selectedAgencyId)?.name || 'Unknown Agency'}
                          </span>
                        ) : (
                          <span>{agencies.length} agencies available • Please select an agency to continue</span>
                        )}
                      </div>
                    )}
                    
                    {/* No agencies found */}
                    {!isLoadingAgencies && !isAgenciesError && (!agencies || !Array.isArray(agencies) || agencies.length === 0) && (
                      <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 mt-2">
                        <div className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>No agencies found. Please contact an administrator.</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick select buttons as fallback */}
                  {Array.isArray(agencies) && agencies.length > 0 && !selectedAgencyId && !isLoadingAgencies && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t">
                      <div className="w-full text-xs font-medium mb-1">Quick Select:</div>
                      {agencies.slice(0, 3).map(agency => (
                        <Button
                          key={agency.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAgencySelect(agency.id)}
                          className="h-8"
                        >
                          {agency.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedAgencyId && assessments && assessments.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {assessments.map((assessment) => (
                      <Card key={assessment.id} className={assessment.id === currentAssessmentId ? 'border-primary' : ''}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between">
                            <span>{assessment.startedAt ? new Date(assessment.startedAt).toLocaleDateString() : 'N/A'}</span>
                            <Badge variant={assessment.status === 'completed' ? 'success' : 'default'}>
                              {assessment.status === 'completed' ? 'Completed' : 'In Progress'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress:</span>
                                <span className="font-medium">{assessment.progressPercentage || 0}%</span>
                              </div>
                              <Progress value={assessment.progressPercentage || 0} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Tier Level:</span>
                                <div className="font-medium">{assessment.tierLevel || 'Not determined'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Last Updated:</span>
                                <div className="font-medium">
                                  {new Date(assessment.startedAt || new Date()).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => {
                              // Set the current assessment ID (this should trigger UI updates)
                              setCurrentAssessmentId(assessment.id);
                              
                              // Clear any previous cached data
                              queryClient.invalidateQueries({ 
                                queryKey: ["/api/assessment-responses", assessment.id] 
                              });
                              
                              // Force scroll to the category progress section
                              setTimeout(() => {
                                const categoryProgressEl = document.querySelector('[data-section="category-progress"]');
                                if (categoryProgressEl) {
                                  categoryProgressEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                                
                                // Manually trigger assessment response loading
                                fetch(`/api/assessment-responses/${assessment.id}`)
                                  .then(res => res.json())
                                  .then(data => {
                                    console.log(`Fetched ${data.length || 0} responses for assessment ${assessment.id}`);
                                    
                                    // Manually update responses in the query cache
                                    queryClient.setQueryData(
                                      ["/api/assessment-responses", assessment.id], 
                                      data
                                    );
                                    
                                    // Force a UI update
                                    setResponseSelections(prevSelections => {
                                      const newSelections = { ...prevSelections };
                                      data.forEach((response: any) => {
                                        newSelections[response.questionId] = {
                                          response: response.response,
                                          notes: response.notes || '',
                                          responseId: response.id,
                                        };
                                      });
                                      console.log("Loaded response selections into local state:", Object.keys(newSelections).length);
                                      return newSelections;
                                    });
                                    
                                    // Force the Assessment tab to be active
                                    setActiveTab('assessment');
                                  })
                                  .catch(error => console.error("Error fetching responses:", error));
                              }, 100);
                            }}
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  
                  {currentAssessmentId && categories && categories.length > 0 && (
                    <Card data-section="category-progress">
                      <CardHeader>
                        <CardTitle>Category Progress</CardTitle>
                        <CardDescription>
                          Completion status for each assessment category
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {categories.map((category) => {
                            const { total, completed } = getCategoryCompletionStatus(category.id, currentAssessmentId);
                            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                            
                            return (
                              <div key={category.id} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">{category.name}</span>
                                  <span className="text-muted-foreground">{completed}/{total} questions completed</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Progress value={percentage} className="flex-1" />
                                  <span className="text-sm font-medium w-10 text-right">{percentage}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {(!selectedAgencyId || (assessments && assessments.length === 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>No Assessments Found</CardTitle>
                    <CardDescription>
                      Select an agency or create a new assessment to track progress.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center py-6">
                      <Button 
                        onClick={() => setActiveTab('assessment')}
                        disabled={!selectedAgencyId}
                      >
                        {selectedAgencyId ? 'Create Assessment' : 'Select Agency First'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Questions Management Tab */}
            <TabsContent value="questions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Question Management</h3>
                <Button 
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsQuestionDialogOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
              
              {categories && categories.length > 0 && (
                <Accordion type="single" collapsible className="space-y-4">
                  {categories.map((category) => {
                    // Get all questions for this category using our direct and keyword mappings
                    let categoryQuestions: Question[] = [];
                    
                    if (questions) {
                      // First try the direct ID-based match (original method)
                      // First get questions with direct ID match
                      let filteredQuestions = questions.filter(q => q.categoryId === category.id);
                      
                      // Sort by orderIndex if available
                      categoryQuestions = [...filteredQuestions].sort((a, b) => {
                        // If both have orderIndex, sort by it
                        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                          return a.orderIndex - b.orderIndex;
                        }
                        // If only a has orderIndex, it comes first
                        if (a.orderIndex !== undefined) return -1;
                        // If only b has orderIndex, it comes first
                        if (b.orderIndex !== undefined) return 1;
                        // If neither has orderIndex, maintain original order
                        return 0;
                      });
                      
                      // If no direct matches, try content-based matching
                      if (categoryQuestions.length === 0) {
                        // Use the direct mapping questions if available
                        const questionIds = getQuestionsForCategoryName(category.name);
                        if (questionIds.length > 0) {
                          categoryQuestions = questions.filter(q => questionIds.includes(q.id));
                        }
                      }
                      
                      // If still no questions found, try with category ID mapping
                      if (categoryQuestions.length === 0) {
                        const categoryIdMapping = getCategoryIdMapping();
                        if (categoryIdMapping[category.id]) {
                          const mappedIds = categoryIdMapping[category.id];
                          categoryQuestions = questions.filter(q => mappedIds.includes(q.categoryId));
                        }
                      }
                    }
                    
                    return (
                      <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
                        <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50 rounded-t-lg">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="outline">{categoryQuestions.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-2 pb-4">
                          <div className="space-y-4">
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                            
                            {categoryQuestions.length > 0 ? (
                              <div className="border rounded-md divide-y">
                                {categoryQuestions
                                  .sort((a, b) => {
                                    // If both have orderIndex, sort by it
                                    if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                                      return a.orderIndex - b.orderIndex;
                                    }
                                    // If only a has orderIndex, it comes first
                                    if (a.orderIndex !== undefined) return -1;
                                    // If only b has orderIndex, it comes first
                                    if (b.orderIndex !== undefined) return 1;
                                    // If neither has orderIndex, maintain original order
                                    return 0;
                                  })
                                  .map((question) => (
                                    <div key={question.id} className="p-3 space-y-2">
                                      <div className="flex justify-between">
                                        <div className="font-medium">{question.text}</div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditQuestion(question)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              setQuestionToDelete(question.id);
                                              setIsDeleteDialogOpen(true);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      {question.description && (
                                        <p className="text-sm text-muted-foreground">{question.description}</p>
                                      )}
                                      <div className="flex gap-2 items-center text-sm text-muted-foreground">
                                        <span>Order: {question.orderIndex || 0}</span>
                                        <span className="text-xs text-gray-500">Category ID: {question.categoryId.substring(0, 8)}...</span>
                                        {question.impactsTier && (
                                          <Badge variant="secondary" className="text-xs">Impacts Tier</Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                No questions in this category.
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setEditingQuestion(null);
                                    form.setValue('categoryId', category.id);
                                    setIsQuestionDialogOpen(true);
                                  }}
                                  className="pl-1"
                                >
                                  Add one?
                                </Button>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
              
              {/* Question Create/Edit Dialog */}
              <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                    <DialogDescription>
                      {editingQuestion
                        ? "Update this question for assessment."
                        : "Create a new question for assessment."}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onQuestionFormSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
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
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter question text"
                                className="resize-none min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Additional description or help text"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="orderIndex"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Index</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Determines the display order within the category.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsQuestionDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={form.formState.isSubmitting || !form.formState.isValid}
                        >
                          {form.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {editingQuestion ? 'Update Question' : 'Add Question'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Question Delete Confirmation Dialog */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this question? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteQuestion}
                      disabled={deleteQuestionMutation.isPending}
                    >
                      {deleteQuestionMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Generated Reports</h3>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Available Reports</CardTitle>
                  <CardDescription>
                    Download generated assessment reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(reports) && reports.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {reports.map((report: any) => (
                        <div key={report.id} className="p-3 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{report.reportType} Report</div>
                            <div className="text-sm text-muted-foreground">
                              Generated on {new Date(report.createdAt).toLocaleString()}
                            </div>
                            {report.agencyId && agencies?.find(a => a.id === report.agencyId) && (
                              <div className="text-sm mt-1">
                                <Badge variant="outline">
                                  {agencies?.find(a => a.id === report.agencyId)?.name}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            asChild
                          >
                            <a href={`/api/reports/${report.id}/download`} target="_blank" rel="noopener noreferrer">
                              <DownloadCloud className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/60" />
                        <h4 className="text-lg font-medium">No Reports Available</h4>
                        <p className="text-sm">
                          Generate reports from completed assessments to see them here.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {currentAssessmentId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generate New Report</CardTitle>
                    <CardDescription>
                      Generate new assessment reports for the currently selected assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => generateTierReportMutation.mutateAsync(currentAssessmentId)}
                        className="flex items-center gap-2"
                        disabled={generateTierReportMutation.isPending}
                      >
                        {generateTierReportMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        Generate Tier Assessment Report
                      </Button>
                      
                      <Button
                        onClick={() => generateGapReportMutation.mutateAsync(currentAssessmentId)}
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={generateGapReportMutation.isPending}
                      >
                        {generateGapReportMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        Generate Gap Analysis Report
                      </Button>
                    </div>
                    
                    {!currentAssessmentId && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        Select an assessment first to generate reports.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Export Tab */}
            <TabsContent value="export" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Data Export</h3>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Export Assessment Data</CardTitle>
                  <CardDescription>
                    Export assessment data in various formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Select Export Format</h4>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={!currentAssessmentId}
                        onClick={() => {
                          if (!currentAssessmentId) return;
                          
                          console.log("Exporting assessment as CSV", currentAssessmentId);
                          // Get assessment responses
                          apiRequest("GET", `/api/assessment-responses/${currentAssessmentId}`)
                            .then(response => response.json())
                            .then((responses: any[]) => {
                              if (!responses || !Array.isArray(responses)) {
                                throw new Error("Invalid response data");
                              }
                              
                              console.log("Got responses for export:", responses.length);
                              
                              // Create CSV content
                              const headers = ["Question ID", "Question Text", "Category", "Response", "Notes"];
                              const rows = responses.map((response: any) => {
                                const question = questions?.find(q => q.id === response.questionId);
                                const category = categories?.find(c => c.id === question?.categoryId);
                                return [
                                  response.questionId,
                                  (question?.text || "Unknown Question").replace(/"/g, '""'), // Escape quotes for CSV
                                  (category?.name || "Unknown Category").replace(/"/g, '""'),
                                  response.response ? "Yes" : "No",
                                  (response.notes || "").replace(/"/g, '""')
                                ];
                              });
                              
                              // Create CSV string
                              const csvContent = [
                                headers.join(","),
                                ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
                              ].join("\n");
                              
                              console.log("CSV content created, length:", csvContent.length);
                              
                              // Create download
                              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.setAttribute("href", url);
                              link.setAttribute("download", `assessment_${currentAssessmentId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              toast({
                                title: "Export Successful",
                                description: "Assessment data has been exported as CSV.",
                              });
                            })
                            .catch((error: Error) => {
                              console.error("CSV export error:", error);
                              toast({
                                title: "Export Failed",
                                description: "Could not export assessment data to CSV format.",
                                variant: "destructive"
                              });
                            });
                        }}
                      >
                        <DownloadCloud className="h-4 w-4" />
                        Export as CSV
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={!currentAssessmentId}
                        onClick={() => {
                          if (!currentAssessmentId) return;
                          
                          console.log("Exporting assessment as Excel (CSV format)", currentAssessmentId);
                          // Get assessment responses - using CSV format with .xlsx extension
                          apiRequest("GET", `/api/assessment-responses/${currentAssessmentId}`)
                            .then(response => response.json())
                            .then((responses: any[]) => {
                              if (!responses || !Array.isArray(responses)) {
                                throw new Error("Invalid response data");
                              }
                              
                              console.log("Got responses for Excel export:", responses.length);
                              
                              // Create CSV content (Excel compatible)
                              const headers = ["Question ID", "Question Text", "Category", "Response", "Notes"];
                              const rows = responses.map((response: any) => {
                                const question = questions?.find(q => q.id === response.questionId);
                                const category = categories?.find(c => c.id === question?.categoryId);
                                return [
                                  response.questionId,
                                  (question?.text || "Unknown Question").replace(/"/g, '""'),
                                  (category?.name || "Unknown Category").replace(/"/g, '""'),
                                  response.response ? "Yes" : "No",
                                  (response.notes || "").replace(/"/g, '""')
                                ];
                              });
                              
                              // Create CSV string
                              const csvContent = [
                                headers.join(","),
                                ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
                              ].join("\n");
                              
                              // Create download (with .xlsx extension)
                              const blob = new Blob([csvContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.setAttribute("href", url);
                              link.setAttribute("download", `assessment_${currentAssessmentId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.xlsx`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              toast({
                                title: "Export Successful",
                                description: "Assessment data has been exported as Excel format.",
                              });
                            })
                            .catch((error: Error) => {
                              console.error("Excel export error:", error);
                              toast({
                                title: "Export Failed",
                                description: "Could not export assessment data to Excel format.",
                                variant: "destructive"
                              });
                            });
                        }}
                      >
                        <DownloadCloud className="h-4 w-4" />
                        Export as Excel
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={!currentAssessmentId}
                        onClick={() => {
                          if (!currentAssessmentId) return;
                          
                          console.log("Exporting assessment as JSON", currentAssessmentId);
                          
                          // Get assessment data
                          Promise.all([
                            apiRequest("GET", `/api/agencies/${selectedAgencyId}/assessment/${currentAssessmentId}`).then(res => res.json()),
                            apiRequest("GET", `/api/assessment-responses/${currentAssessmentId}`).then(res => res.json())
                          ])
                            .then(([assessment, responses]: [any, any[]]) => {
                              if (!responses || !Array.isArray(responses)) {
                                throw new Error("Invalid response data");
                              }
                              
                              console.log("Got responses and assessment for JSON export");
                              
                              // Get questions for each response
                              const enhancedResponses = responses.map((response: any) => {
                                const question = questions?.find(q => q.id === response.questionId);
                                const category = categories?.find(c => c.id === question?.categoryId);
                                return {
                                  ...response,
                                  questionText: question?.text || "Unknown Question",
                                  categoryName: category?.name || "Unknown Category"
                                };
                              });
                              
                              // Create export object
                              const exportData = {
                                assessment: assessment,
                                responses: enhancedResponses,
                                exportDate: new Date().toISOString(),
                                agencyName: agencies?.find(a => a.id === assessment.agencyId)?.name || "Unknown Agency"
                              };
                              
                              console.log("JSON data prepared, creating download");
                              
                              // Create download
                              const jsonString = JSON.stringify(exportData, null, 2);
                              const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.setAttribute("href", url);
                              link.setAttribute("download", `assessment_${currentAssessmentId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.json`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              toast({
                                title: "Export Successful",
                                description: "Assessment data has been exported as JSON.",
                              });
                            })
                            .catch((error: Error) => {
                              console.error("JSON export error:", error);
                              toast({
                                title: "Export Failed",
                                description: "Could not export assessment data to JSON.",
                                variant: "destructive"
                              });
                            });
                        }}
                      >
                        <DownloadCloud className="h-4 w-4" />
                        Export as JSON
                      </Button>
                    </div>
                    
                    {!currentAssessmentId && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        Select an assessment first to export data.
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Bulk Export Options</h4>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          console.log("Exporting all questions");
                          
                          // Fetch all questions
                          apiRequest("GET", "/api/questions")
                            .then(response => response.json())
                            .then((allQuestions: any[]) => {
                              if (!allQuestions || !Array.isArray(allQuestions)) {
                                throw new Error("Invalid questions data");
                              }
                              
                              console.log(`Got ${allQuestions.length} questions for export`);
                              
                              // Create CSV content
                              const headers = ["Question ID", "Question Text", "Category", "Order Index"];
                              const rows = allQuestions.map((question: any) => {
                                const category = categories?.find(c => c.id === question.categoryId);
                                return [
                                  question.id,
                                  (question.text || "").replace(/"/g, '""'), // Escape quotes for CSV
                                  (category?.name || "Unknown Category").replace(/"/g, '""'),
                                  question.orderIndex?.toString() || "0"
                                ];
                              });
                              
                              // Create CSV string
                              const csvContent = [
                                headers.join(","),
                                ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
                              ].join("\n");
                              
                              // Create download
                              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.setAttribute("href", url);
                              link.setAttribute("download", `all_questions_${new Date().toISOString().split("T")[0]}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              toast({
                                title: "Export Successful",
                                description: `${allQuestions.length} questions exported as CSV.`,
                              });
                            })
                            .catch((error: Error) => {
                              console.error("Questions export error:", error);
                              toast({
                                title: "Export Failed",
                                description: "Could not export questions data.",
                                variant: "destructive"
                              });
                            });
                        }}
                      >
                        <DownloadCloud className="h-4 w-4" />
                        Export All Questions
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          console.log("Exporting all categories");
                          
                          // Fetch all categories
                          apiRequest("GET", "/api/question-categories")
                            .then(response => response.json())
                            .then((allCategories: any[]) => {
                              if (!allCategories || !Array.isArray(allCategories)) {
                                throw new Error("Invalid categories data");
                              }
                              
                              console.log(`Got ${allCategories.length} categories for export`);
                              
                              // Create CSV content
                              const headers = ["Category ID", "Category Name", "Description", "Question Count"];
                              const rows = allCategories.map((category: any) => {
                                const questionCount = questions?.filter(q => q.categoryId === category.id).length || 0;
                                return [
                                  category.id,
                                  (category.name || "").replace(/"/g, '""'), // Escape quotes for CSV
                                  (category.description || "").replace(/"/g, '""'),
                                  questionCount.toString()
                                ];
                              });
                              
                              // Create CSV string
                              const csvContent = [
                                headers.join(","),
                                ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
                              ].join("\n");
                              
                              // Create download
                              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.setAttribute("href", url);
                              link.setAttribute("download", `all_categories_${new Date().toISOString().split("T")[0]}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              toast({
                                title: "Export Successful",
                                description: `${allCategories.length} categories exported as CSV.`,
                              });
                            })
                            .catch((error: Error) => {
                              console.error("Categories export error:", error);
                              toast({
                                title: "Export Failed",
                                description: "Could not export categories data.",
                                variant: "destructive"
                              });
                            });
                        }}
                      >
                        <DownloadCloud className="h-4 w-4" />
                        Export All Categories
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}