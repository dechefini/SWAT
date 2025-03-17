import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  CalendarIcon, 
  FilterIcon, 
  DownloadIcon, 
  FileIcon, 
  RefreshCwIcon,
  PlusCircleIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReportManagement } from "@/components/ReportManagement";
import { Report, Assessment, Agency } from "@/types";

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedAgency, setSelectedAgency] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [selectedAssessmentForReport, setSelectedAssessmentForReport] = useState<string>("");
  const [reportType, setReportType] = useState<"tier-assessment" | "gap-analysis">("tier-assessment");
  
  const { toast } = useToast();
  
  // Fetch all agencies
  const { data: agencies, isLoading: isLoadingAgencies } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
    enabled: true,
  });
  
  // Fetch all assessments
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    enabled: true,
  });
  
  // Fetch all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: true,
  });
  
  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ assessmentId, reportType }: { assessmentId: string, reportType: "tier-assessment" | "gap-analysis" }) => {
      const endpoint = reportType === "tier-assessment" 
        ? `/api/reports/${assessmentId}/generate-tier-report`
        : `/api/reports/${assessmentId}/generate-gap-report`;
        
      return apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ /* any additional data */ }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report Generated",
        description: `The ${data.reportType === "tier-assessment" ? "Tier Assessment" : "Gap Analysis"} report has been generated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: `Failed to generate report: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle report generation
  const handleGenerateReport = () => {
    if (!selectedAssessmentForReport) {
      toast({
        title: "Error",
        description: "Please select an assessment to generate a report.",
        variant: "destructive",
      });
      return;
    }
    
    generateReportMutation.mutate({
      assessmentId: selectedAssessmentForReport,
      reportType: reportType,
    });
  };
  
  // Filter reports based on search, agency, and date
  const filteredReports = reports ? reports.filter((report) => {
    const matchesSearch = searchQuery === "" || 
      (report.assessmentId && report.assessmentId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply agency filter if not "all"
    const matchesAgency = selectedAgency === "all" || (
      assessments?.find(a => a.id === report.assessmentId)?.agencyId === selectedAgency
    );
    
    // Apply date filter
    let matchesDate = true;
    if (selectedDateRange !== "all") {
      const reportDate = new Date(report.generatedAt);
      const now = new Date();
      
      if (selectedDateRange === "last7") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = reportDate >= sevenDaysAgo;
      } else if (selectedDateRange === "last30") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchesDate = reportDate >= thirtyDaysAgo;
      } else if (selectedDateRange === "last90") {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        matchesDate = reportDate >= ninetyDaysAgo;
      }
    }
    
    return matchesSearch && matchesAgency && matchesDate;
  }) : [];
  
  // Function to find the agency name for a given assessment
  const getAgencyNameForAssessment = (assessmentId: string): string => {
    if (!assessments || !agencies) return "Unknown";
    
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) return "Unknown";
    
    const agency = agencies.find(a => a.id === assessment.agencyId);
    return agency?.name || "Unknown";
  };
  
  const isLoading = isLoadingReports || isLoadingAgencies || isLoadingAssessments;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assessment Reports</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Generate New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Assessment Report</DialogTitle>
              <DialogDescription>
                Select an assessment and report type to generate a new report.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="assessment" className="text-right">
                  Assessment
                </label>
                <div className="col-span-3">
                  <Select value={selectedAssessmentForReport} onValueChange={setSelectedAssessmentForReport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments?.filter(a => a.status === "completed").map((assessment) => (
                        <SelectItem key={assessment.id} value={assessment.id}>
                          {assessment.name} ({getAgencyNameForAssessment(assessment.id)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="reportType" className="text-right">
                  Report Type
                </label>
                <div className="col-span-3">
                  <Select value={reportType} onValueChange={(value: "tier-assessment" | "gap-analysis") => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier-assessment">Tier Assessment</SelectItem>
                      <SelectItem value="gap-analysis">Gap Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending || !selectedAssessmentForReport}
              >
                {generateReportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Report Management</CardTitle>
          <CardDescription>
            Generate, download and manage assessment reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
              <SelectTrigger>
                <div className="flex items-center">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select Agency..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                {agencies?.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date Range..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium">No reports found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search criteria or generate a new report.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs defaultValue="all" className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">All Reports</TabsTrigger>
                  <TabsTrigger value="tier-assessment">Tier Assessment</TabsTrigger>
                  <TabsTrigger value="gap-analysis">Gap Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="space-y-4">
                    {filteredReports.map((report) => (
                      <ReportManagement 
                        key={report.id} 
                        report={report} 
                        onUpdate={(updatedReport) => {
                          // Update the local cache when a report is updated
                          queryClient.setQueryData<Report[]>(["/api/reports"], (oldData) => {
                            if (!oldData) return [updatedReport];
                            return oldData.map(r => r.id === updatedReport.id ? updatedReport : r);
                          });
                        }}
                      />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="tier-assessment">
                  <div className="space-y-4">
                    {filteredReports
                      .filter(report => report.reportType === "tier-assessment")
                      .map((report) => (
                        <ReportManagement 
                          key={report.id} 
                          report={report} 
                          onUpdate={(updatedReport) => {
                            // Update the local cache when a report is updated
                            queryClient.setQueryData<Report[]>(["/api/reports"], (oldData) => {
                              if (!oldData) return [updatedReport];
                              return oldData.map(r => r.id === updatedReport.id ? updatedReport : r);
                            });
                          }}
                        />
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="gap-analysis">
                  <div className="space-y-4">
                    {filteredReports
                      .filter(report => report.reportType === "gap-analysis")
                      .map((report) => (
                        <ReportManagement 
                          key={report.id} 
                          report={report} 
                          onUpdate={(updatedReport) => {
                            // Update the local cache when a report is updated
                            queryClient.setQueryData<Report[]>(["/api/reports"], (oldData) => {
                              if (!oldData) return [updatedReport];
                              return oldData.map(r => r.id === updatedReport.id ? updatedReport : r);
                            });
                          }}
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}