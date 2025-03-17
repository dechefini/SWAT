import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Agency } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PlusCircle, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AgencyDetailsModal } from "@/components/agency/AgencyDetailsModal";

export default function AgenciesListPage() {
  const { toast } = useToast();
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  console.log('AgenciesListPage: Component rendering');
  
  const [fallbackAgencies, setFallbackAgencies] = useState<Agency[] | null>(null);
  
  // Direct fetch function as a fallback in case React Query is having issues
  const fetchAgenciesDirectly = async () => {
    try {
      console.log('Attempting direct fetch of agencies');
      const response = await fetch('/api/agencies', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agencies: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch succeeded, agencies count:', data?.length);
      setFallbackAgencies(data);
      return data;
    } catch (err) {
      console.error('Direct fetch of agencies failed:', err);
      return null;
    }
  };

  // Main React Query fetch
  const { data: agencies, isLoading, error } = useQuery<Agency[]>({
    queryKey: ['/api/agencies'],
    queryFn: async () => {
      const response = await fetch('/api/agencies', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agencies');
      }
      return response.json();
    },
    retry: 3,
    refetchOnWindowFocus: true,
    staleTime: 30000
  });

  // Handle errors from the query
  useEffect(() => {
    if (error) {
      console.error('Error fetching agencies via React Query:', error);
      // Try direct fetch as fallback
      fetchAgenciesDirectly();
      
      toast({
        title: "Error loading agencies",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [error, toast, fetchAgenciesDirectly]);

  // Use fallback agencies if main query failed but direct fetch succeeded
  const agenciesToUse = agencies || fallbackAgencies;
  
  // Try direct fetch when component mounts if main query hasn't succeeded
  useEffect(() => {
    if (!agencies && !fallbackAgencies && !isLoading) {
      console.log('No agencies data available, trying direct fetch');
      fetchAgenciesDirectly();
    }
  }, [agencies, fallbackAgencies, isLoading, fetchAgenciesDirectly]);
  
  const filteredAgencies = agenciesToUse?.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.jurisdiction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJurisdiction = jurisdictionFilter === "all" || agency.jurisdiction === jurisdictionFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && agency.accessStatus) ||
      (statusFilter === "inactive" && !agency.accessStatus);

    return matchesSearch && matchesJurisdiction && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agencies</h1>
        <Link href="/admin/agencies/new">
          <Button variant="yellow" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Agency
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 focus-visible:ring-yellow-500 focus-visible:border-yellow-500"
          />
        </div>
        <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
          <SelectTrigger className="w-[180px] focus:ring-yellow-500 focus:border-yellow-500">
            <SelectValue placeholder="Jurisdiction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jurisdictions</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="county">County</SelectItem>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="federal">Federal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] focus:ring-yellow-500 focus:border-yellow-500">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>AGENCY NAME</TableHead>
              <TableHead>JURISDICTION</TableHead>
              <TableHead>CONTACT</TableHead>
              <TableHead>TIER LEVEL</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading agencies...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-red-500">
                  Error loading agencies: {error instanceof Error ? error.message : 'Unknown error'}
                  {/* Log error details to console */}
                  <div className="mt-2">
                    {error && (() => { console.error('Detailed error:', error); return null; })()}
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAgencies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No agencies found. Add your first agency to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgencies?.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-medium">{agency.name}</TableCell>
                  <TableCell className="capitalize">{agency.jurisdiction}</TableCell>
                  <TableCell>{agency.contactEmail}</TableCell>
                  <TableCell>
                    {agency.tierLevel ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                        TIER {agency.tierLevel}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500">
                        NOT ASSESSED
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={agency.accessStatus ? "success" : "secondary"}
                    >
                      {agency.accessStatus ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSelectedAgency(agency)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedAgency && (
        <AgencyDetailsModal
          agency={selectedAgency}
          isOpen={!!selectedAgency}
          onClose={() => setSelectedAgency(null)}
        />
      )}
    </div>
  );
}