import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { Agency } from "@shared/schema";
import { AgencyForm } from "@/components/agency/AgencyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgencyPage() {
  const { id } = useParams();
  const isNewAgency = !id;
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: agency, isLoading } = useQuery<Agency>({
    queryKey: ['/api/agencies', id],
    enabled: !isNewAgency
  });

  const { mutate: saveAgency, isPending } = useMutation({
    mutationFn: async (data: Partial<Agency>) => {
      console.log('Submitting agency data:', data);
      
      // Ensure required fields are present
      if (!data.name) {
        throw new Error('Agency name is required');
      }
      if (!data.contactEmail) {
        throw new Error('Contact email is required');
      }
      
      const response = await fetch(`/api/agencies${id ? `/${id}` : ''}`, {
        method: id ? 'PATCH' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include' // Important for sending cookies with the request
      });
      
      if (!response.ok) {
        console.error('API response status:', response.status);
        
        try {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          
          if (response.status === 401) {
            throw new Error('Authentication error: You must be logged in as an admin to perform this action');
          } else if (response.status === 403) {
            throw new Error('Authorization error: You do not have permission to perform this action');
          } else if (errorData.details) {
            throw new Error(Array.isArray(errorData.details) 
              ? errorData.details.map((d: {message: string}) => d.message).join(', ') 
              : errorData.details);
          } else {
            throw new Error(errorData.error || 'Failed to save agency');
          }
        } catch (jsonError) {
          console.error('Error parsing API error response:', jsonError);
          throw new Error(`Failed to save agency: Server responded with ${response.status}`);
        }
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Agency saved successfully:', data);
      
      // Invalidate the agencies list cache
      queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
      
      toast({
        title: "Success",
        description: `Agency ${id ? 'updated' : 'created'} successfully`,
      });
      
      // Navigate back to agencies list
      setLocation('/admin/agencies');
    },
    onError: (error: Error) => {
      console.error('Error saving agency:', error);
      
      toast({
        title: "Error",
        description: error.message || 'Failed to save agency',
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{isNewAgency ? 'Add New Agency' : 'Edit Agency'}</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyForm
            agency={agency}
            onSubmit={(data) => saveAgency(data)}
            onCancel={() => setLocation('/admin/agencies')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
