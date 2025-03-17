import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { AlertCircle, FileUp, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Agency } from '@/types';
import { useQuery } from '@tanstack/react-query';

interface AdminReportDirectUploadProps {
  reportType: 'tier-assessment' | 'gap-analysis';
  onSuccess: () => void;
  onCancel: () => void;
}

function AdminReportDirectUpload({ 
  reportType,
  onSuccess,
  onCancel
}: AdminReportDirectUploadProps) {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [tierLevel, setTierLevel] = useState<string>('');
  const [summary, setSummary] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  
  // Fetch agencies with explicit error handling and direct API request
  const { 
    data: agencies, 
    isLoading: agenciesLoading, 
    error: agenciesError,
    refetch: refetchAgencies 
  } = useQuery<Agency[]>({
    queryKey: ['/api/agencies'],
    queryFn: async () => {
      console.log('Using custom queryFn for agencies');
      try {
        // Try direct API request instead of using the default optimizer
        const response = await fetch('/api/agencies', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch agencies: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch agencies: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched ${data.length} agencies directly`);
        return data;
      } catch (error) {
        console.error('Error in direct agencies fetch:', error);
        throw error;
      }
    },
    enabled: true,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 15000 // Auto retry every 15 seconds regardless of error state
  });
  
  // Handle errors in loading agencies
  useEffect(() => {
    if (agenciesError) {
      console.error('Error fetching agencies:', agenciesError);
      toast({
        title: 'Error loading agencies',
        description: 'Could not load the list of agencies. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [agenciesError, toast]);
  
  // Debug agencies loading
  useEffect(() => {
    console.log('Agencies loading status:', { 
      loading: agenciesLoading, 
      error: agenciesError, 
      data: agencies,
      agencyCount: agencies?.length || 0
    });
  }, [agencies, agenciesLoading, agenciesError]);
  
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
  
  const handleAgencyChange = (agencyId: string) => {
    setSelectedAgencyId(agencyId);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgencyId) {
      setError('Please select an agency');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    // Only require tier level for tier assessments
    if (reportType === 'tier-assessment' && !tierLevel) {
      setError('Please select a tier level');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Create form data for multipart/form-data request
      const formData = new FormData();
      formData.append('reportFile', file);
      formData.append('assessmentType', reportType);
      
      // Only include tier level for tier assessments
      if (reportType === 'tier-assessment' && tierLevel) {
        formData.append('tierLevel', tierLevel);
      } else if (reportType === 'tier-assessment') {
        // Default tier level for tier assessments if none selected
        formData.append('tierLevel', '1');
      }
      
      formData.append('summary', summary);
      
      // Get the selected agency
      const selectedAgency = agencies?.find(a => a.id === selectedAgencyId);
      
      // Generate assessment name if not provided
      const assessmentName = `${selectedAgency?.name || 'Agency'} ${reportType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} ${new Date().toLocaleDateString()}`;
      formData.append('assessmentName', assessmentName);
      
      // Make the API request
      const response = await fetch(`/api/agencies/${selectedAgencyId}/reports/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
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
        description: `The ${reportType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} report has been uploaded for ${selectedAgency?.name}.`,
        variant: 'default',
      });
      
      // Reset form
      setFile(null);
      setTierLevel('');
      setSummary('');
      setSelectedAgencyId('');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/agencies']});
      queryClient.invalidateQueries({queryKey: ['/api/reports']});
      
      // Call success callback
      setTimeout(() => {
        onSuccess();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="agency">Select Agency</Label>
          {agenciesLoading && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Loading...
            </div>
          )}
        </div>
        
        <Select 
          value={selectedAgencyId} 
          onValueChange={handleAgencyChange}
          disabled={agenciesLoading}
        >
          <SelectTrigger id="agency" className={agenciesLoading ? "opacity-70" : ""}>
            <SelectValue placeholder={agenciesLoading ? "Loading agencies..." : "Select agency"} />
          </SelectTrigger>
          <SelectContent>
            {agencies && agencies.length > 0 ? (
              agencies.map(agency => (
                <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>
                {agenciesLoading ? "Loading agencies..." : "No agencies found"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {/* Add loading/error status indicators below the select */}
        {agenciesError && (
          <div className="rounded-md bg-destructive/10 p-2 mt-2 flex items-center justify-between">
            <div className="text-destructive text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Failed to load agencies</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetchAgencies()}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
        
        {!agenciesLoading && !agenciesError && (!agencies || agencies.length === 0) && (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 mt-2">
            <div className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>No agencies found. Please create an agency first.</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Only show tier level selection for tier assessment reports */}
      {reportType === 'tier-assessment' && (
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
            This will update the agency's tier level for Tier Assessment reports.
          </p>
        </div>
      )}
      
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
            Report uploaded successfully.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={
            !file || 
            !selectedAgencyId || 
            (reportType === 'tier-assessment' && !tierLevel) || 
            uploading ||
            agenciesLoading  // Disable button while agencies are loading
          }
          className="min-w-[180px]"  // Ensure consistent button width
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : agenciesLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : !selectedAgencyId ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Select Agency First
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Upload {reportType === 'tier-assessment' ? 'Tier' : 'Gap Analysis'} Report
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default AdminReportDirectUpload;