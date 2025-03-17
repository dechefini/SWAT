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
  Upload as UploadIcon
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
import { downloadReport, formatAssessmentStatus, getStatusBadgeColor } from "@/lib/reportUtils";

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [tab, setTab] = useState<string>("all");
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>("all");
  const { toast } = useToast();
  
  // Fetch all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    enabled: true,
  });

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
  const reportData = (reports || []).map(report => {
    const assessment = getAssessment(report.assessmentId);
    return {
      id: report.id,
      assessmentId: report.assessmentId,
      agencyId: assessment?.agencyId,
      agencyName: assessment ? getAgencyName(assessment.agencyId) : 'Unknown',
      assessmentName: assessment?.name || 'Unknown Assessment',
      assessmentType: assessment?.assessmentType || 'tier-assessment',
      tierLevel: report.tierLevel,
      generatedAt: report.generatedAt,
      status: assessment?.status || 'unknown',
      reportUrl: report.reportUrl,
      reportType: report.reportType,
      summary: report.summary
    };
  });
  
  // Filter reports based on search query and selected filters
  const filteredReports = reportData.filter(report => {
    // Filter by search query
    const matchesSearch = report.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.assessmentName.toLowerCase().includes(searchQuery.toLowerCase());
                          
    // Filter by assessment type
    const matchesType = selectedAssessmentType === 'all' || 
                       report.assessmentType === selectedAssessmentType;
                       
    // Filter by tab
    const matchesTab = tab === 'all' || 
                      (tab === 'tier' && report.assessmentType === 'tier-assessment') ||
                      (tab === 'gap' && report.assessmentType === 'gap-analysis');
                      
    return matchesSearch && matchesType && matchesTab;
  });
  
  // Sort reports by most recent first
  const sortedReports = [...filteredReports].sort((a, b) => {
    return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
  });

  // Get recent assessments ready for report generation
  const completedAssessments = (assessments || [])
    .filter(assessment => assessment.status === 'completed')
    .filter(assessment => {
      // Filter out assessments that already have reports
      const hasReport = reportData.some(report => report.assessmentId === assessment.id);
      return !hasReport;
    })
    .map(assessment => ({
      ...assessment,
      agencyName: getAgencyName(assessment.agencyId)
    }))
    .sort((a, b) => {
      const dateA = a.updatedAt || a.completedAt || a.createdAt;
      const dateB = b.updatedAt || b.completedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 5); // Get only the 5 most recent ones

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assessment Reports</h1>
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const assessment = getAssessment(report.assessmentId);
                                  if (assessment && report.id) {
                                    const filename = `${assessment.assessmentType === 'gap-analysis' ? 'GapAnalysis' : 'TierAssessment'}-${report.agencyName.replace(/\s+/g, '-')}-${format(new Date(report.generatedAt), "yyyy-MM-dd")}.pdf`;
                                    
                                    // Download the report
                                    fetch(`/api/reports/${report.id}/download`)
                                      .then(response => {
                                        if (!response.ok) throw new Error("Failed to download report");
                                        return response.blob();
                                      })
                                      .then(blob => {
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = filename;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      })
                                      .catch(error => {
                                        toast({
                                          title: "Error",
                                          description: "Failed to download report. Please try again.",
                                          variant: "destructive",
                                        });
                                      });
                                  }
                                }}
                                className="flex items-center"
                              >
                                <DownloadIcon className="h-4 w-4 mr-1" />
                                Download
                              </Button>
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

          {/* Pending Reports Section */}
          {completedAssessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assessments Ready for Report Generation</CardTitle>
                <CardDescription>
                  These assessments are completed and ready for report generation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium">Agency</th>
                        <th className="px-4 py-3 text-left font-medium">Assessment</th>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-left font-medium">Completed</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedAssessments.map(assessment => (
                        <tr key={assessment.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3">{assessment.agencyName}</td>
                          <td className="px-4 py-3">{assessment.name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              assessment.assessmentType === 'gap-analysis' 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {assessment.assessmentType === 'gap-analysis' ? 'Gap Analysis' : 'Tier Assessment'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {format(new Date(assessment.completedAt || assessment.updatedAt || assessment.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                generateReportMutation.mutate({ 
                                  assessmentId: assessment.id, 
                                  type: assessment.assessmentType 
                                });
                              }}
                              disabled={generateReportMutation.isPending}
                              className="flex items-center"
                            >
                              {generateReportMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FileIcon className="h-4 w-4 mr-1" />
                                  Generate Report
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const assessment = getAssessment(report.assessmentId);
                                    if (assessment && report.id) {
                                      const filename = `TierAssessment-${report.agencyName.replace(/\s+/g, '-')}-${format(new Date(report.generatedAt), "yyyy-MM-dd")}.pdf`;
                                      
                                      // Download the report
                                      fetch(`/api/reports/${report.id}/download`)
                                        .then(response => {
                                          if (!response.ok) throw new Error("Failed to download report");
                                          return response.blob();
                                        })
                                        .then(blob => {
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = filename;
                                          document.body.appendChild(a);
                                          a.click();
                                          window.URL.revokeObjectURL(url);
                                          document.body.removeChild(a);
                                        })
                                        .catch(error => {
                                          toast({
                                            title: "Error",
                                            description: "Failed to download report. Please try again.",
                                            variant: "destructive",
                                          });
                                        });
                                    }
                                  }}
                                  className="flex items-center"
                                >
                                  <DownloadIcon className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const assessment = getAssessment(report.assessmentId);
                                    if (assessment && report.id) {
                                      const filename = `GapAnalysis-${report.agencyName.replace(/\s+/g, '-')}-${format(new Date(report.generatedAt), "yyyy-MM-dd")}.pdf`;
                                      
                                      // Download the report
                                      fetch(`/api/reports/${report.id}/download`)
                                        .then(response => {
                                          if (!response.ok) throw new Error("Failed to download report");
                                          return response.blob();
                                        })
                                        .then(blob => {
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = filename;
                                          document.body.appendChild(a);
                                          a.click();
                                          window.URL.revokeObjectURL(url);
                                          document.body.removeChild(a);
                                        })
                                        .catch(error => {
                                          toast({
                                            title: "Error",
                                            description: "Failed to download report. Please try again.",
                                            variant: "destructive",
                                          });
                                        });
                                    }
                                  }}
                                  className="flex items-center"
                                >
                                  <DownloadIcon className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
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
    </div>
  );
}