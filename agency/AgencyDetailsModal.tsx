import { useState } from "react";
import { Agency } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgencyForm } from "./AgencyForm";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminReportUpload from "@/components/reports/AdminReportUpload";

interface AgencyDetailsModalProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
}

export function AgencyDetailsModal({ agency, isOpen, onClose }: AgencyDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadReport, setShowUploadReport] = useState(false);
  const { toast } = useToast();
  
  // Fetch agency assessments
  const { data: assessments } = useQuery({
    queryKey: ['/api/agencies', agency.id, 'assessments'],
    queryFn: async () => {
      const response = await fetch(`/api/agencies/${agency.id}/assessments`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assessments');
      }
      return response.json();
    },
    enabled: isOpen && !!agency.id
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedAgency: Partial<Agency>) => {
      const res = await apiRequest("PATCH", `/api/agencies/${agency.id}`, updatedAgency);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
      setIsEditing(false);
      toast({
        title: "Agency updated",
        description: "The agency has been successfully updated."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating agency",
        description: error.message
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/agencies/${agency.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
      onClose();
      toast({
        title: "Agency deleted",
        description: "The agency has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting agency",
        description: error.message
      });
    }
  });

  const handleSubmit = async (data: Partial<Agency>) => {
    await updateMutation.mutateAsync(data);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold text-black">{agency.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {isEditing ? (
            <div className="py-4">
              <AgencyForm 
                agency={agency} 
                onSubmit={handleSubmit} 
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-black">Basic Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Name</dt>
                      <dd className="mt-1 text-sm text-black">{agency.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Jurisdiction</dt>
                      <dd className="mt-1 text-sm text-black">{agency.jurisdiction || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Population Served</dt>
                      <dd className="mt-1 text-sm text-black">{agency.populationServed?.toLocaleString() || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">SWAT Tier Level</dt>
                      <dd className="mt-1 text-sm">
                        {agency.tierLevel ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            TIER {agency.tierLevel}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not assessed</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <h3 className="text-lg font-semibold mt-8 mb-4 text-black">Contact Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Contact Name</dt>
                      <dd className="mt-1 text-sm text-black">{agency.contactName || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Contact Email</dt>
                      <dd className="mt-1 text-sm text-black">{agency.contactEmail}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Contact Phone</dt>
                      <dd className="mt-1 text-sm text-black">{agency.contactPhone || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-black">Team Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Sworn Officers</dt>
                      <dd className="mt-1 text-sm text-black">{agency.swornOfficers || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Support Staff</dt>
                      <dd className="mt-1 text-sm text-black">{agency.supportStaff || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Total SWAT Personnel</dt>
                      <dd className="mt-1 text-sm text-black">{agency.totalSwatPersonnel || 'N/A'}</dd>
                    </div>
                  </dl>

                  <h3 className="text-lg font-semibold mt-8 mb-4 text-black">Additional Information</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Department Structure</dt>
                      <dd className="mt-1 text-sm text-black">{agency.departmentStructure || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Personnel Gaps</dt>
                      <dd className="mt-1 text-sm text-black">{agency.personnelGaps || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-8 border-t pt-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowUploadReport(true)}
                >
                  <Upload className="h-4 w-4" />
                  Upload Report
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Agency
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Agency
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agency
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Report Upload Dialog */}
      {showUploadReport && (
        <AdminReportUpload
          agency={agency}
          isOpen={showUploadReport}
          onClose={() => setShowUploadReport(false)}
          assessments={assessments}
        />
      )}
    </>
  );
}