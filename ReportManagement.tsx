import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileIcon, 
  DownloadIcon, 
  UploadIcon, 
  Trash2Icon, 
  RefreshCwIcon,
  Loader2Icon,
  PlusCircleIcon
} from "lucide-react";
import { Report, Assessment } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

interface ReportManagementProps {
  assessment: Assessment;
  report?: Report;
}

export function ReportManagement({ assessment, report }: ReportManagementProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [summary, setSummary] = useState(report?.summary || "");

  // Handle generating report
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      // Determine which report type to generate based on assessment type
      const endpoint = assessment.assessmentType === 'gap-analysis' 
        ? `/api/reports/${assessment.id}/generate-gap-report`
        : `/api/reports/${assessment.id}/generate-tier-report`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate report");
      }
      
      // Refresh reports data
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      toast({
        title: "Success",
        description: "Report generated successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle downloading report
  const handleDownload = async () => {
    if (!report?.id) return;
    
    try {
      const response = await fetch(`/api/reports/${report.id}/download`);
      
      if (!response.ok) {
        throw new Error("Failed to download report");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${assessment.name.replace(/\s+/g, '-')}-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Report downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle replacing report
  const handleReplaceReport = async () => {
    if (!replaceFile || !report?.id) {
      toast({
        title: "Missing Information",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsReplacing(true);
      
      // Create FormData to upload the file
      const formData = new FormData();
      formData.append("file", replaceFile);
      
      const response = await fetch(`/api/reports/${report.id}/upload`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to replace report");
      }
      
      // Refresh reports data
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      setReplaceFile(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Report replaced successfully.",
      });
    } catch (error) {
      console.error("Error replacing report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to replace report",
        variant: "destructive",
      });
    } finally {
      setIsReplacing(false);
    }
  };

  // Handle updating report summary
  const handleUpdateSummary = async () => {
    if (!report?.id) return;
    
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update report summary");
      }
      
      // Refresh reports data
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      toast({
        title: "Success",
        description: "Report summary updated successfully.",
      });
    } catch (error) {
      console.error("Error updating report summary:", error);
      toast({
        title: "Error",
        description: "Failed to update report summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle file selection for replacement
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReplaceFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">
          {assessment.assessmentType === 'gap-analysis' ? 'Gap Analysis Report' : 'Tier Assessment Report'}
        </CardTitle>
        <CardDescription>
          {assessment.name} - {format(new Date(assessment.createdAt), "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Report Details</TabsTrigger>
            <TabsTrigger value="management" className="flex-1">Report Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Assessment Type</h3>
                  <p className="text-base font-medium">
                    {assessment.assessmentType === 'gap-analysis' ? 'Gap Analysis' : 'Tier Assessment'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="text-base font-medium capitalize">{assessment.status}</p>
                </div>
                {report?.tierLevel && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tier Level</h3>
                    <p className="text-base font-medium">Tier {report.tierLevel}</p>
                  </div>
                )}
                {report?.generatedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Generated On</h3>
                    <p className="text-base font-medium">
                      {format(new Date(report.generatedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Report Summary</h3>
                <Textarea 
                  value={summary} 
                  onChange={(e) => setSummary(e.target.value)}
                  rows={5}
                  placeholder="Enter a summary of the assessment findings and recommendations"
                />
                <Button 
                  onClick={handleUpdateSummary} 
                  className="mt-2"
                  disabled={!report?.id}
                >
                  Save Summary
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="management" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report?.reportUrl ? (
                <>
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleDownload}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download Report
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Replace Report
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGenerateReport}
                  disabled={isGenerating || assessment.status !== 'completed'}
                >
                  {isGenerating ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {report?.reportUrl && (
              <div className="mt-4 p-4 bg-muted rounded-md flex items-center">
                <FileIcon className="h-6 w-6 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Current report file</p>
                  <p className="text-xs text-muted-foreground">
                    Generated on {format(new Date(report.generatedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            )}
            
            {assessment.status !== 'completed' && !report?.reportUrl && (
              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded">
                <p>Assessment must be completed before generating a report.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog for replacing report */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Report File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-file">Select a new PDF report</Label>
              <Input 
                id="report-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {replaceFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {replaceFile.name} ({Math.round(replaceFile.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReplaceReport}
              disabled={!replaceFile || isReplacing}
            >
              {isReplacing ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Replacing...
                </>
              ) : (
                "Replace Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}