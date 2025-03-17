import { Report, Assessment } from "@/types";

/**
 * Generates a formatted filename for report downloads
 * 
 * @param assessment - The assessment object
 * @param report - The report object
 * @returns A formatted filename for the report
 */
export function generateReportFilename(assessment: Assessment, report?: Report): string {
  const prefix = assessment.assessmentType === 'gap-analysis' ? 'GapAnalysis' : 'TierAssessment';
  // Get agency name from the assessment or use a default
  const agencyName = typeof assessment.agencyName === 'string' 
    ? assessment.agencyName 
    : 'Agency';
  const date = new Date().toISOString().split('T')[0];
  const tierPart = report?.tierLevel ? `-Tier${report.tierLevel}` : '';
  
  return `${prefix}-${agencyName.replace(/\s+/g, '-')}${tierPart}-${date}.pdf`;
}

/**
 * Validates a PDF file for report upload
 * 
 * @param file - The file to validate
 * @returns An object containing validation status and error message if any
 */
export function validateReportFile(file: File): { valid: boolean; error?: string } {
  // Check if file is a PDF
  if (!file.type.includes('pdf')) {
    return { valid: false, error: 'Only PDF files are accepted.' };
  }
  
  // Check file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'File size exceeds the 10MB limit. Please compress or reduce the file size.' 
    };
  }
  
  return { valid: true };
}

/**
 * Downloads a report from the server
 * 
 * @param reportId - The ID of the report to download
 * @param filename - The filename to use for the downloaded file
 * @returns A promise that resolves when the download is complete
 */
export async function downloadReport(reportId: string, filename: string): Promise<void> {
  try {
    const response = await fetch(`/api/reports/${reportId}/download`);
    
    if (!response.ok) {
      throw new Error("Failed to download report");
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading report:", error);
    throw error;
  }
}

/**
 * Calculates the completion percentage of an assessment
 * 
 * @param assessment - The assessment object
 * @param responses - Array of assessment responses
 * @param totalQuestions - Total number of questions in the assessment
 * @returns The percentage of completion as a number between 0 and 100
 */
export function calculateAssessmentCompletion(
  assessment: Assessment, 
  responses: any[], 
  totalQuestions: number
): number {
  if (!responses || !Array.isArray(responses) || responses.length === 0 || totalQuestions === 0) {
    return 0;
  }
  
  const answeredQuestions = responses.filter(response => {
    return (
      response.booleanResponse !== null || 
      response.textResponse || 
      response.numericResponse !== null || 
      response.selectResponse
    );
  }).length;
  
  return Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Determines the appropriate status badge color based on assessment status
 * 
 * @param status - The assessment status
 * @returns A string representing the Tailwind CSS color class
 */
export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Formats an assessment status for display
 * 
 * @param status - The assessment status
 * @returns A formatted string for the status
 */
export function formatAssessmentStatus(status: string): string {
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Creates a report data object for the reports table display
 * 
 * @param report - The report object
 * @param assessment - The associated assessment object
 * @param agencyName - The name of the agency
 * @returns A formatted report data object for display
 */
export function createReportTableData(
  report: Report, 
  assessment: Assessment, 
  agencyName: string
) {
  return {
    id: report.id,
    agencyName: agencyName,
    assessmentName: assessment.name,
    assessmentType: assessment.assessmentType === 'gap-analysis' ? 'Gap Analysis' : 'Tier Assessment',
    tierLevel: report.tierLevel,
    status: assessment.status,
    generatedDate: report.generatedAt,
    assessmentId: assessment.id,
    reportUrl: report.reportUrl,
    reportType: report.reportType
  };
}