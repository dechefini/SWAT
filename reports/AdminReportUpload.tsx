import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { AlertCircle, FileUp, CheckCircle2, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Agency, Assessment } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminReportUploadProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
  assessments?: Assessment[];
}

export function AdminReportUpload({ agency, isOpen, onClose, assessments = [] }: AdminReportUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [assessmentType, setAssessmentType] = useState<'tier-assessment' | 'gap-analysis'>('tier-assessment');
  const [tierLevel, setTierLevel] = useState<string>('');
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.');
        setFile(null);
        return;
      }
      
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum file size is 10MB.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };
  
  const handleTierLevelChange = (value: string) => {
    setTierLevel(value);
  };
  
  const handleAssessmentTypeChange = (value: 'tier-assessment' | 'gap-analysis') => {
    setAssessmentType(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!tierLevel) {
      setError('Please select a tier level');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Create form data for multipart/form-data request
      const formData = new FormData();
      formData.append('reportFile', file);
      formData.append('assessmentType', assessmentType);
      formData.append('tierLevel', tierLevel);
      formData.append('summary', summary);
      
      // Generate assessment name if not provided
      const assessmentName = `${agency.name} ${assessmentType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} ${new Date().toLocaleDateString()}`;
      formData.append('assessmentName', assessmentName);
      
      // Make the API request
      const response = await fetch(`/api/agencies/${agency.id}/reports/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload report');
      }
      
      const data = await response.json();
      
      // Show success message
      setSuccess(true);
      toast({
        title: 'Report uploaded successfully',
        description: `The ${assessmentType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} report has been uploaded and the agency tier level has been updated.`,
        variant: 'default',
      });
      
      // Reset form
      setFile(null);
      setTierLevel('');
      setSummary('');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/agencies']});
      queryClient.invalidateQueries({queryKey: ['/api/agencies', agency.id, 'assessments']});
      queryClient.invalidateQueries({queryKey: ['/api/reports']});
      
      // Close the dialog after successful upload
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error uploading report:', err);
      setError(err.message || 'Failed to upload report');
      toast({
        title: 'Error uploading report',
        description: err.message || 'There was an error uploading the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Official Report for {agency.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select 
                value={assessmentType} 
                onValueChange={(value) => handleAssessmentTypeChange(value as 'tier-assessment' | 'gap-analysis')}
              >
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier-assessment">Tier Assessment</SelectItem>
                  <SelectItem value="gap-analysis">Gap Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tier-level">Tier Level</Label>
              <Select 
                value={tierLevel} 
                onValueChange={handleTierLevelChange}
              >
                <SelectTrigger id="tier-level">
                  <SelectValue placeholder="Select tier level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tier 1</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3</SelectItem>
                  <SelectItem value="4">Tier 4</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This will update the agency's tier level.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="summary">Report Summary (Optional)</Label>
              <Textarea 
                id="summary" 
                placeholder="Enter a brief summary of the report findings"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Upload Report Document</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Accepted formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Report uploaded successfully. The agency tier level has been updated.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setTierLevel('');
                  setSummary('');
                  setError(null);
                  setSuccess(false);
                }}
              >
                Reset
              </Button>
              <Button 
                type="submit"
                disabled={!file || !tierLevel || uploading}
              >
                {uploading ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminReportUpload;