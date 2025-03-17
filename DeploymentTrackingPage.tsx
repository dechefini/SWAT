import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mission } from "@shared/schema";
import { GoogleMap, Marker, HeatmapLayer, Libraries } from "@react-google-maps/api";
import { CalendarIcon, FilterIcon, MapPinIcon, Clock, CheckCircle2, AlertCircle, Edit, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

// Map container styles
const containerStyle = {
  width: '100%',
  height: '400px'
};

// Newark, NJ center coordinates as default (matches wireframe example)
const center = {
  lat: 40.7357,
  lng: -74.1724
};

type MissionType = 'high-risk-warrant' | 'barricade' | 'hostage' | 'surveillance' | 'vip-protection' | 'training' | 'other';
type PriorityLevel = 'low' | 'medium' | 'high';
type RiskLevel = 'low' | 'medium' | 'high';
type StatusType = 'planned' | 'active' | 'completed' | 'aborted';

interface MissionFormValues {
  title: string;
  missionType: MissionType;
  location: string;
  latitude?: string;
  longitude?: string;
  startDate: string;
  endDate?: string;
  priority: PriorityLevel;
  riskLevel: RiskLevel;
  status: StatusType;
  teamSize: string;
  teamLead: string;
  equipment: string[];
  objectives: string[];
  tacticalPlan: string;
  contingencyPlans: string[];
  notes?: string;
}

export default function DeploymentTrackingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewMissionDialog, setShowNewMissionDialog] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [missionsData, setMissionsData] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formValues, setFormValues] = useState<MissionFormValues>({
    title: '',
    missionType: 'high-risk-warrant',
    location: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium',
    riskLevel: 'medium',
    status: 'planned',
    teamSize: '',
    teamLead: '',
    equipment: [],
    objectives: [],
    tacticalPlan: '',
    contingencyPlans: []
  });
  const [newEquipment, setNewEquipment] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newContingencyPlan, setNewContingencyPlan] = useState("");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Define libraries array outside component to prevent unnecessary reloads
  const mapLibraries: Libraries = ['visualization']; // Required for heatmap
  
  // State for Google Maps API key
  const [apiKeyState, setApiKeyState] = useState<{
    isLoading: boolean;
    key: string;
    error: string | null;
  }>({
    isLoading: true,
    key: "",
    error: null
  });
  
  // Fetch the API key on component mount (only once)
  useEffect(() => {
    console.log("Making direct fetch to /api/config...");
    
    fetch('/api/config', {
      method: 'GET',
      credentials: 'include', // Important: Include cookies for auth
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log("Config response status:", response.status);
      if (!response.ok) {
        throw new Error(`API config response not OK: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Config data received:", data);
      if (data?.googleMapsApiKey) {
        const apiKey = data.googleMapsApiKey;
        
        // Log the key with most characters masked for security
        if (apiKey.length > 8) {
          console.log("Google Maps API Key is set:", 
            apiKey.substring(0, 4) + "..." + 
            apiKey.substring(apiKey.length - 4)
          );
        } else {
          console.log("Google Maps API Key is set (short key format)");
        }
        
        setApiKeyState({
          isLoading: false,
          key: apiKey,
          error: null
        });
      } else {
        console.log("Config response data missing googleMapsApiKey:", data);
        setApiKeyState({
          isLoading: false,
          key: "",
          error: "API key not found in config response"
        });
      }
    })
    .catch(error => {
      console.error("Error fetching config:", error);
      setApiKeyState({
        isLoading: false,
        key: "",
        error: `Failed to fetch API key: ${error.message}`
      });
    });
  }, []);
  
  // State to track map loading and Google Maps API status
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const mapsScriptLoaded = useRef(false);
  
  // Only attempt to load Google Maps API if we have a valid key
  useEffect(() => {
    if (!apiKeyState.key || apiKeyState.isLoading || mapsScriptLoaded.current) {
      return;
    }
    
    console.log("Loading Google Maps script with valid API key");
    mapsScriptLoaded.current = true;
    
    // Remove any existing script to avoid conflicts
    const existingScript = document.getElementById('google-map-script');
    if (existingScript) {
      document.head.removeChild(existingScript);
    }
    
    // Create and add the script element
    const script = document.createElement('script');
    script.id = 'google-map-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKeyState.key}&libraries=visualization&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("Google Maps script loaded successfully");
      
      // Debug visualization library
      if (window.google && window.google.maps) {
        console.log("Google Maps loaded correctly");
        if (window.google.maps.visualization) {
          console.log("Visualization library loaded correctly");
        } else {
          console.warn("Visualization library not loaded - heatmap will not work");
        }
      } else {
        console.warn("Google Maps object not available after script load");
      }
      
      setGoogleMapsLoaded(true);
    };
    
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setMapLoadError("Failed to load Google Maps API");
      mapsScriptLoaded.current = false;
    };
    
    document.head.appendChild(script);
    
    return () => {
      // This cleanup should only run on component unmount
      // We don't want to remove the script during normal component updates
    };
  }, [apiKeyState.key, apiKeyState.isLoading]);

  // Calculate stats from missions data
  const activeMissions = missionsData.filter(m => m.status === 'active').length;
  const plannedMissions = missionsData.filter(m => m.status === 'planned').length;
  const averageResponseTime = calculateAverageResponseTime(missionsData);
  const fastestResponseTime = calculateFastestResponseTime(missionsData);
  const deployedTeamMembers = calculateDeployedTeamMembers(missionsData);
  const availableTeamMembers = 16; // This should be fetched from API in real implementation

  // Fetch missions data
  const { isLoading: missionsLoading, data: missionsApiData } = useQuery<Mission[]>({
    queryKey: ['/api/agencies/current/missions']
  });

  // Update missionsData when API data changes
  useEffect(() => {
    if (missionsApiData) {
      setMissionsData(missionsApiData as Mission[]);
    }
  }, [missionsApiData]);
  
  // Filter missions based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // If no search query, show all missions
      setFilteredMissions(missionsData);
    } else {
      // Filter missions based on search query
      const query = searchQuery.toLowerCase();
      const filtered = missionsData.filter(mission => 
        mission.title.toLowerCase().includes(query) ||
        (mission.location && mission.location.toLowerCase().includes(query)) ||
        (mission.teamLead && mission.teamLead.toLowerCase().includes(query)) ||
        mission.missionType.toLowerCase().includes(query) ||
        (mission.status && mission.status.toLowerCase().includes(query)) ||
        (mission.priority && mission.priority.toLowerCase().includes(query))
      );
      setFilteredMissions(filtered);
    }
  }, [searchQuery, missionsData]);

  // Create mission mutation
  const createMissionMutation = useMutation({
    mutationFn: async (data: MissionFormValues) => {
      return await apiRequest('/api/agencies/current/missions', 'POST', {
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies/current/missions'] });
      setShowNewMissionDialog(false);
      resetForm();
      toast({
        title: "Mission created",
        description: "New mission has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating mission",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete mission mutation
  const deleteMissionMutation = useMutation({
    mutationFn: async (missionId: string) => {
      return await apiRequest(`/api/missions/${missionId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies/current/missions'] });
      toast({
        title: "Mission deleted",
        description: "Mission has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting mission",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function resetForm() {
    setFormValues({
      title: '',
      missionType: 'high-risk-warrant',
      location: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      priority: 'medium',
      riskLevel: 'medium',
      status: 'planned',
      teamSize: '',
      teamLead: '',
      equipment: [],
      objectives: [],
      tacticalPlan: '',
      contingencyPlans: []
    });
    setNewEquipment("");
    setNewObjective("");
    setNewContingencyPlan("");
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setFormValues(prev => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()]
      }));
      setNewEquipment("");
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormValues(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective.trim()]
      }));
      setNewObjective("");
    }
  };

  const addContingencyPlan = () => {
    if (newContingencyPlan.trim()) {
      setFormValues(prev => ({
        ...prev,
        contingencyPlans: [...prev.contingencyPlans, newContingencyPlan.trim()]
      }));
      setNewContingencyPlan("");
    }
  };

  const handleCreateMission = () => {
    createMissionMutation.mutate(formValues);
  };

  const handleDeleteMission = (missionId: string) => {
    if (confirm("Are you sure you want to delete this mission?")) {
      deleteMissionMutation.mutate(missionId);
    }
  };

  const onMapLoad = useCallback(() => {
    // Map loaded callback
  }, []);

  // Helper functions for statistics
  function calculateAverageResponseTime(missions: Mission[]): number {
    const completedMissions = missions.filter(m => m.status === 'completed' && m.responseTime);
    if (!completedMissions.length) return 0;
    
    const totalResponseTime = completedMissions.reduce((sum, mission) => sum + (mission.responseTime || 0), 0);
    return Math.round(totalResponseTime / completedMissions.length);
  }

  function calculateFastestResponseTime(missions: Mission[]): number {
    const completedMissions = missions.filter(m => m.status === 'completed' && m.responseTime);
    if (!completedMissions.length) return 0;
    
    return Math.min(...completedMissions.map(mission => mission.responseTime || Infinity));
  }

  function calculateDeployedTeamMembers(missions: Mission[]): number {
    const activeMissions = missions.filter(m => m.status === 'active');
    return activeMissions.reduce((total, mission) => total + (mission.teamSize || 0), 0);
  }

  function getStatusBadgeColor(status: StatusType) {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'planned':
        return 'bg-yellow-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'aborted':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  function getPriorityBadgeColor(priority: PriorityLevel) {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  // Mock mission data for display before API integration
  useEffect(() => {
    if (missionsData.length === 0 && !missionsLoading) {
      // This is mock data for display purposes - remove when API integration is complete
      setMissionsData([
        {
          id: '1',
          title: 'High-Risk Warrant',
          missionType: 'high-risk-warrant',
          description: 'Serve high-risk warrant',
          agencyId: '123',
          location: '50 Park Pl, Newark, NJ',
          latitude: '40.7431',
          longitude: '-74.1704',
          startDate: new Date('2024-03-15T08:00:00Z'),
          endDate: new Date('2024-03-15T12:00:00Z'),
          priority: 'high',
          riskLevel: 'high',
          status: 'completed',
          teamSize: 8,
          teamLead: 'john-smith-id',
          team: [],
          equipment: [],
          objectives: [],
          tacticalPlan: '',
          contingencyPlans: [],
          attachments: [],
          notes: 'Mission completed successfully',
          afterActionReport: 'Suspect apprehended without incident',
          responseTime: 18,
          createdAt: new Date('2024-03-10T00:00:00Z')
        },
        {
          id: '2',
          title: 'Crisis Response',
          missionType: 'barricade',
          description: 'Respond to barricaded suspect',
          agencyId: '123',
          location: '1 Raymond Blvd, Newark, NJ',
          latitude: '40.7357',
          longitude: '-74.1724',
          startDate: new Date('2024-03-16T14:00:00Z'),
          endDate: null,
          priority: 'high',
          riskLevel: 'high',
          status: 'active',
          teamSize: 12,
          teamLead: 'sarah-johnson-id',
          team: [],
          equipment: [],
          objectives: [],
          tacticalPlan: '',
          contingencyPlans: [],
          attachments: [],
          notes: 'Ongoing operation',
          afterActionReport: '',
          responseTime: 12,
          createdAt: new Date('2024-03-16T00:00:00Z')
        },
        {
          id: '3',
          title: 'Surveillance',
          missionType: 'surveillance',
          description: 'Conduct surveillance operation',
          agencyId: '123',
          location: '25 Market St, Newark, NJ',
          latitude: '40.7412',
          longitude: '-74.1701',
          startDate: new Date('2024-03-17T09:00:00Z'),
          endDate: null,
          priority: 'medium',
          riskLevel: 'medium',
          status: 'planned',
          teamSize: 6,
          teamLead: 'mike-wilson-id',
          team: [],
          equipment: [],
          objectives: [],
          tacticalPlan: '',
          contingencyPlans: [],
          attachments: [],
          notes: 'Preparation in progress',
          afterActionReport: '',
          responseTime: null,
          createdAt: new Date('2024-03-12T00:00:00Z')
        },
        {
          id: '4',
          title: 'Training',
          missionType: 'training',
          description: 'Tactical training exercise',
          agencyId: '123',
          location: '129 Academy St, Newark, NJ',
          latitude: '40.7435',
          longitude: '-74.1789',
          startDate: new Date('2024-03-18T13:00:00Z'),
          endDate: null,
          priority: 'medium',
          riskLevel: 'medium',
          status: 'planned',
          teamSize: 15,
          teamLead: 'david-chen-id',
          team: [],
          equipment: [],
          objectives: [],
          tacticalPlan: '',
          contingencyPlans: [],
          attachments: [],
          notes: 'Training schedule confirmed',
          afterActionReport: '',
          responseTime: null,
          createdAt: new Date('2024-03-15T00:00:00Z')
        },
        {
          id: '5',
          title: 'Protection',
          missionType: 'vip-protection',
          description: 'VIP protection detail',
          agencyId: '123',
          location: '233 Washington St, Newark, NJ',
          latitude: '40.7392',
          longitude: '-74.1711',
          startDate: new Date('2024-03-19T10:00:00Z'),
          endDate: null,
          priority: 'high',
          riskLevel: 'high',
          status: 'active',
          teamSize: 10,
          teamLead: 'emily-taylor-id',
          team: [],
          equipment: [],
          objectives: [],
          tacticalPlan: '',
          contingencyPlans: [],
          attachments: [],
          notes: 'VIP arriving on schedule',
          afterActionReport: '',
          responseTime: null,
          createdAt: new Date('2024-03-17T00:00:00Z')
        }
      ]);
    }
  }, [missionsLoading, missionsData.length]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Deployment & Mission Tracking</h1>
        <Button onClick={() => setShowNewMissionDialog(true)} className="bg-blue-500 hover:bg-blue-600">
          + New Mission
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Missions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              Active Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold">Current</div>
              <div className="text-3xl font-bold">{activeMissions}</div>
              <div className="font-semibold mt-4">Planned</div>
              <div className="text-3xl font-bold">{plannedMissions}</div>
            </div>
          </CardContent>
        </Card>

        {/* Response Times Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                <Clock className="h-4 w-4 text-white" />
              </div>
              Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold">Average Response</div>
              <div className="text-3xl font-bold">{averageResponseTime} min</div>
              <div className="font-semibold mt-4">Fastest Response</div>
              <div className="text-3xl font-bold">{fastestResponseTime} min</div>
            </div>
          </CardContent>
        </Card>

        {/* Team Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold">Deployed</div>
              <div className="text-3xl font-bold">{deployedTeamMembers}</div>
              <div className="font-semibold mt-4">Available</div>
              <div className="text-3xl font-bold">{availableTeamMembers}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Map */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
              <MapPinIcon className="h-4 w-4 text-white" />
            </div>
            Mission Map
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("Toggling heatmap, current value:", showHeatmap);
              setShowHeatmap(!showHeatmap);
            }}
          >
            {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          </Button>
        </CardHeader>
        <CardContent>
          {(() => {
            // API key is not available
            if (!apiKeyState.key) {
              return (
                <div className="h-[400px] flex flex-col items-center justify-center bg-gray-100 rounded-md border border-amber-300">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Maps API Key Required</h3>
                  <p className="text-sm text-gray-600 max-w-md text-center px-4">
                    To enable the interactive mission map, please add a Google Maps API key to your environment variables.
                  </p>
                  <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 max-w-md text-xs font-mono">
                    GOOGLE_MAPS_API_KEY=your_api_key_here
                  </div>
                </div>
              );
            }
            
            // Error loading the map
            if (mapLoadError) {
              return (
                <div className="h-[400px] flex flex-col items-center justify-center bg-gray-100 rounded-md border border-red-200">
                  <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Map Loading Error</h3>
                  <p className="text-sm text-gray-600 max-w-md text-center px-4">
                    {mapLoadError}
                  </p>
                </div>
              );
            }
            
            // Map is still loading
            if (!googleMapsLoaded) {
              return (
                <div className="h-[400px] flex items-center justify-center bg-gray-100">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-500">Loading map...</p>
                  </div>
                </div>
              );
            }
            
            // Google Maps is loaded and ready to use
            if (window.google && window.google.maps) {
              return (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={13}
                  onLoad={onMapLoad}
                  options={{
                    fullscreenControl: false,
                    streetViewControl: false,
                    mapTypeControl: true,
                    zoomControl: true,
                  }}
                >
                  {/* Markers for each mission */}
                  {filteredMissions.map((mission) => (
                    <Marker
                      key={mission.id}
                      position={{
                        lat: parseFloat(mission.latitude || '40.7357'),
                        lng: parseFloat(mission.longitude || '-74.1724')
                      }}
                      title={mission.title}
                    />
                  ))}
                  
                  {/* Conditional HeatmapLayer */}
                  {showHeatmap && window.google && window.google.maps && window.google.maps.visualization && (
                    <HeatmapLayer
                      options={{
                        radius: 20,
                        opacity: 0.6,
                        gradient: [
                          'rgba(0, 255, 255, 0)',
                          'rgba(0, 255, 255, 1)',
                          'rgba(0, 191, 255, 1)',
                          'rgba(0, 127, 255, 1)',
                          'rgba(0, 63, 255, 1)',
                          'rgba(0, 0, 255, 1)',
                          'rgba(0, 0, 223, 1)',
                          'rgba(0, 0, 191, 1)',
                          'rgba(0, 0, 159, 1)',
                          'rgba(0, 0, 127, 1)',
                          'rgba(63, 0, 91, 1)',
                          'rgba(127, 0, 63, 1)',
                          'rgba(191, 0, 31, 1)',
                          'rgba(255, 0, 0, 1)'
                        ]
                      }}
                      data={filteredMissions.map(mission => ({
                        location: new window.google.maps.LatLng(
                          parseFloat(mission.latitude || '40.7357'),
                          parseFloat(mission.longitude || '-74.1724')
                        ),
                        weight: mission.priority === 'high' ? 3 : mission.priority === 'medium' ? 2 : 1
                      }))}
                    />
                  )}
                </GoogleMap>
              );
            }
            
            // Fallback case - Google Maps API is not available
            return (
              <div className="h-[400px] flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
                  <p className="text-gray-500">Error initializing map component</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Mission List */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Mission List</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search missions..."
                className="pl-8 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <FilterIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">MISSION DETAILS</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">STATUS</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">PRIORITY</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">LOCATION</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">TEAM SIZE</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">TEAM LEAD</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">START TIME</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMissions.map((mission) => (
                  <tr key={mission.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-800 font-bold text-xs">{mission.title.substring(0, 2)}</span>
                        </div>
                        <div>
                          <div className="font-medium">{mission.title}</div>
                          <div className="text-sm text-gray-500">{mission.missionType.replace(/-/g, ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadgeColor(mission.status as StatusType)}>
                        {mission.status === 'active' ? 'Active' : 
                         mission.status === 'planned' ? 'Planned' : 
                         mission.status === 'completed' ? 'Completed' : 
                         'Aborted'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getPriorityBadgeColor(mission.priority as PriorityLevel)}>
                        {mission.priority === 'high' ? 'High' : 
                         mission.priority === 'medium' ? 'Medium' : 
                         'Low'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{mission.location}</td>
                    <td className="py-3 px-4 text-center">{mission.teamSize}</td>
                    <td className="py-3 px-4">{mission.teamLead}</td>
                    <td className="py-3 px-4">
                      {mission.startDate instanceof Date 
                        ? format(mission.startDate, 'yyyy-MM-dd HH:mm')
                        : typeof mission.startDate === 'string'
                          ? mission.startDate
                          : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="icon" title="View Details">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Delete"
                          onClick={() => handleDeleteMission(mission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Mission Dialog */}
      <Dialog open={showNewMissionDialog} onOpenChange={setShowNewMissionDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>New Mission</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Mission Title */}
              <div>
                <Label htmlFor="title">Mission Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter mission title"
                  value={formValues.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Mission Type */}
              <div>
                <Label htmlFor="missionType">Mission Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formValues.missionType}
                  onValueChange={(value) => handleSelectChange("missionType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-risk-warrant">High Risk Warrant</SelectItem>
                    <SelectItem value="barricade">Barricade</SelectItem>
                    <SelectItem value="hostage">Hostage</SelectItem>
                    <SelectItem value="surveillance">Surveillance</SelectItem>
                    <SelectItem value="vip-protection">VIP Protection</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Level */}
              <div>
                <Label htmlFor="priority">Priority Level <span className="text-red-500">*</span></Label>
                <Select
                  value={formValues.priority}
                  onValueChange={(value) => handleSelectChange("priority", value as PriorityLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Level */}
              <div>
                <Label htmlFor="riskLevel">Risk Level <span className="text-red-500">*</span></Label>
                <Select
                  value={formValues.riskLevel}
                  onValueChange={(value) => handleSelectChange("riskLevel", value as RiskLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="location"
                    name="location"
                    placeholder="Enter mission location"
                    value={formValues.location}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    title="Get location coordinates"
                  >
                    <MapPinIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Time <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="startDate"
                      name="startDate"
                      type="datetime-local"
                      value={formValues.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endDate">End Time</Label>
                  <div className="relative">
                    <Input
                      id="endDate"
                      name="endDate"
                      type="datetime-local"
                      value={formValues.endDate || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Team Size */}
              <div>
                <Label htmlFor="teamSize">Team Size <span className="text-red-500">*</span></Label>
                <Input
                  id="teamSize"
                  name="teamSize"
                  type="number"
                  placeholder="Enter team size"
                  value={formValues.teamSize}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Team Lead */}
              <div>
                <Label htmlFor="teamLead">Team Lead <span className="text-red-500">*</span></Label>
                <Input
                  id="teamLead"
                  name="teamLead"
                  placeholder="Enter team lead name"
                  value={formValues.teamLead}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Equipment */}
              <div>
                <Label>Equipment</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add equipment"
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    onClick={addEquipment}
                  >
                    +
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formValues.equipment.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Objectives */}
              <div>
                <Label>Objectives</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add objective"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    onClick={addObjective}
                  >
                    +
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formValues.objectives.map((objective, index) => (
                    <Badge key={index} variant="secondary">
                      {objective}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Tactical Plan */}
              <div>
                <Label htmlFor="tacticalPlan">Tactical Plan</Label>
                <Textarea
                  id="tacticalPlan"
                  name="tacticalPlan"
                  placeholder="Describe the tactical approach and execution plan..."
                  value={formValues.tacticalPlan}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              {/* Contingency Plans */}
              <div>
                <Label>Contingency Plans</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add contingency plan"
                    value={newContingencyPlan}
                    onChange={(e) => setNewContingencyPlan(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    onClick={addContingencyPlan}
                  >
                    +
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formValues.contingencyPlans.map((plan, index) => (
                    <Badge key={index} variant="secondary">
                      {plan}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments & Notes - Full Width */}
          <div className="mt-4">
            <Label>Attachments</Label>
            <div className="mt-2 border border-dashed rounded-md p-6 text-center">
              <Button variant="outline" type="button" className="mx-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                Upload Files
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Enter any additional notes or comments..."
              value={formValues.notes || ''}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowNewMissionDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateMission}
              disabled={createMissionMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Create Mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}