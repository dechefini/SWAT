import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  Calendar as CalendarIcon, 
  Filter as FilterIcon, 
  Download as DownloadIcon, 
  File as FileIcon, 
  RefreshCw as RefreshCwIcon,
  PlusCircle as PlusCircleIcon,
  Upload
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
import { Label } from "@/components/ui/label";
import { ReportManagement } from "@/components/ReportManagement";
import { Report, Assessment, Agency } from "@/types";

// Extended report type that includes agency information
interface ReportWithAgency extends Report {
  agencyId?: string | null;
  agencyName?: string;
  assessmentName?: string;
  assessmentType?: string;
  status?: string;
}
import { downloadReport, formatAssessmentStatus, getStatusBadgeColor } from "@/lib/reportUtils";
import AdminReportDirectUpload from "@/components/reports/AdminReportDirectUpload";

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [tab, setTab] = useState<string>("all");
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>("all");
  const { toast } = useToast();
  
  // Fetch all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery<ReportWithAgency[]>({
    queryKey: ["/api/reports"],
    enabled: true,
  });

  // Fetch all agencies with custom queryFn for more reliability
  const { data: agencies, isLoading: isLoadingAgencies, error: agenciesError } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
    queryFn: async () => {
      console.log('ReportsPage: Using custom queryFn for agencies');
      try {
        // Try direct API request instead of using the optimizer
        const response = await fetch('/api/agencies', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch agencies: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`ReportsPage: Successfully fetched ${data.length} agencies directly`);
        return data;
      } catch (error) {
        console.error('ReportsPage: Error in direct agencies fetch:', error);
        throw error;
      }
    },
    enabled: true,
    retry: 3,
    retryDelay: 1000,
  });
  
  // Fetch all assessments
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
    enabled: true,
  });
  
  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ assessmentId, type }: { assessmentId: string; type: string }) => {
      const endpoint = type === 'gap-analysis' 
        ? `/api/reports/${assessmentId}/generate-gap-report`
        : `/api/reports/${assessmentId}/generate-tier-report`;
        
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate report");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report Generated",
        description: "The report has been generated successfully and is now available for download.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate report: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Prepare data for display
  const isLoading = isLoadingReports || isLoadingAgencies || isLoadingAssessments;
  
  const getAgencyName = (agencyId: string): string => {
    const agency = agencies?.find(a => a.id === agencyId);
    return agency?.name || 'Unknown Agency';
  };
  
  const getAssessment = (assessmentId: string): Assessment | undefined => {
    return assessments?.find(a => a.id === assessmentId);
  };
  
  // Create a combined data structure for reports with agency and assessment info
  const reportData: ReportWithAgency[] = (reports || []).map((report: any) => {
    console.log('Processing report client-side:', report);
    
    // Create a base extended report
    // First check if the report already has agency info from the server
    const extendedReport: ReportWithAgency = {
      ...report,
      // Use any server-provided agencyName if available
      agencyName: report.agencyName || 'Unknown Agency',
      assessmentName: report.assessmentName || 'Unknown Assessment',
      assessmentType: report.assessmentType || report.reportType || 'tier-assessment'
    };
    
    // If server didn't provide agency info, try to find it client-side
    if (!report.agencyName) {
      // Check if we need to determine agency info
      const assessment = getAssessment(report.assessmentId);
      
      // Determine agency
      if (assessment?.agencyId) {
        const agency = agencies?.find(a => a.id === assessment.agencyId);
        if (agency) {
          extendedReport.agencyId = agency.id;
          extendedReport.agencyName = agency.name;
        }
      }
      
      // Add assessment info
      if (assessment) {
        extendedReport.assessmentName = assessment.name;
        extendedReport.assessmentType = assessment.assessmentType || report.reportType || 'tier-assessment';
        extendedReport.status = assessment.status;
      }
    }
    
    console.log('Extended report client-side:', extendedReport);
    return extendedReport;
  });
  
  // Filter reports based on search query and selected filters
  const filteredReports = reportData.filter(report => {
    // Filter by search query
    const agencyName = report.agencyName || 'Unknown Agency';
    const assessmentName = report.assessmentName || 'Unknown Assessment';
    const assessmentType = report.assessmentType || report.reportType || 'tier-assessment';
    
    const matchesSearch = agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          assessmentName.toLowerCase().includes(searchQuery.toLowerCase());
                          
    // Filter by assessment type
    const matchesType = selectedAssessmentType === 'all' || 
                       assessmentType === selectedAssessmentType;
                       
    // Filter by tab
    const matchesTab = tab === 'all' || 
                      (tab === 'tier' && assessmentType === 'tier-assessment') ||
                      (tab === 'gap' && assessmentType === 'gap-analysis');
                      
    return matchesSearch && matchesType && matchesTab;
  });
  
  // Sort reports by most recent first
  const sortedReports = [...filteredReports].sort((a, b) => {
    return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
  });

  // We no longer show assessments on the reports page per requirements
  
  // State for upload dialog
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'tier-assessment' | 'gap-analysis'>('tier-assessment');
  
  // Function to open upload dialog with specified type
  const openUploadDialog = (type: 'tier-assessment' | 'gap-analysis') => {
    setUploadType(type);
    setIsUploadOpen(true);
  };

  // Only show upload buttons for admin users
  const { data: user } = useQuery<{ id: string; role: string }>({
    queryKey: ['/api/user'],
    enabled: true,
  });
  
  const isAdmin = user?.role === 'admin';

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assessment Reports</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => openUploadDialog('tier-assessment')}
              className="flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              Upload Tier Report
            </Button>
            <Button 
              variant="outline" 
              onClick={() => openUploadDialog('gap-analysis')}
              className="flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              Upload Gap Analysis
            </Button>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="tier">Tier Assessment</TabsTrigger>
          <TabsTrigger value="gap">Gap Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Assessment Reports</CardTitle>
              <CardDescription>
                View and manage all assessment reports for agencies across the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports by agency or assessment name..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={selectedAssessmentType} onValueChange={setSelectedAssessmentType}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by Type..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tier-assessment">Tier Assessment</SelectItem>
                    <SelectItem value="gap-analysis">Gap Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reports Table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedReports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium">Agency</th>
                        <th className="px-4 py-3 text-left font-medium">Assessment</th>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-left font-medium">Generated</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReports.map(report => (
                        <tr key={report.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3">{report.agencyName}</td>
                          <td className="px-4 py-3">{report.assessmentName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              report.assessmentType === 'gap-analysis' 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {report.assessmentType === 'gap-analysis' ? 'Gap Analysis' : 'Tier Assessment'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {format(new Date(report.generatedAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <a 
                                href={`/api/reports/${report.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                              >
                                <DownloadIcon className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No reports found with the current filters.</p>
                  <p className="mt-2">Complete assessments to generate reports.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* No Assessments section - assessments should not show up on reports page */}
        </TabsContent>
        
        <TabsContent value="tier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tier Assessment Reports</CardTitle>
              <CardDescription>
                View and manage tier assessment reports for all agencies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter bar for tier reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tier reports by agency..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Tier reports table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedReports.filter(r => r.assessmentType === 'tier-assessment').length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium">Agency</th>
                        <th className="px-4 py-3 text-left font-medium">Assessment</th>
                        <th className="px-4 py-3 text-left font-medium">Tier Level</th>
                        <th className="px-4 py-3 text-left font-medium">Generated</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReports
                        .filter(r => r.assessmentType === 'tier-assessment')
                        .map(report => (
                          <tr key={report.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3">{report.agencyName}</td>
                            <td className="px-4 py-3">{report.assessmentName}</td>
                            <td className="px-4 py-3">
                              {report.tierLevel ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  report.tierLevel === 1 ? "bg-green-100 text-green-800" :
                                  report.tierLevel === 2 ? "bg-blue-100 text-blue-800" :
                                  report.tierLevel === 3 ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  Tier {report.tierLevel}
                                </span>
                              ) : "Not Set"}
                            </td>
                            <td className="px-4 py-3">
                              {format(new Date(report.generatedAt), "MMM d, yyyy")}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <a 
                                  href={`/api/reports/${report.id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                >
                                  <DownloadIcon className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No tier assessment reports found.</p>
                  <p className="mt-2">Complete tier assessments to generate reports.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="gap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gap Analysis Reports</CardTitle>
              <CardDescription>
                View and manage gap analysis reports for all agencies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter bar for gap reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search gap reports by agency..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Gap reports table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedReports.filter(r => r.assessmentType === 'gap-analysis').length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium">Agency</th>
                        <th className="px-4 py-3 text-left font-medium">Assessment</th>
                        <th className="px-4 py-3 text-left font-medium">Generated</th>
                        <th className="px-4 py-3 text-left font-medium">Summary</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReports
                        .filter(r => r.assessmentType === 'gap-analysis')
                        .map(report => (
                          <tr key={report.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3">{report.agencyName}</td>
                            <td className="px-4 py-3">{report.assessmentName}</td>
                            <td className="px-4 py-3">
                              {format(new Date(report.generatedAt), "MMM d, yyyy")}
                            </td>
                            <td className="px-4 py-3 max-w-[250px] truncate">
                              {report.summary || "No summary available"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <a 
                                  href={`/api/reports/${report.id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                >
                                  <DownloadIcon className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No gap analysis reports found.</p>
                  <p className="mt-2">Complete gap analyses to generate reports.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Upload Report Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Upload {uploadType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} Report
            </DialogTitle>
            <DialogDescription>
              Upload a completed {uploadType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} report PDF for an agency.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <AdminReportDirectUpload 
              reportType={uploadType}
              onSuccess={() => {
                setIsUploadOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
                toast({
                  title: "Report Uploaded",
                  description: "The report has been successfully uploaded and processed.",
                });
              }}
              onCancel={() => setIsUploadOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}