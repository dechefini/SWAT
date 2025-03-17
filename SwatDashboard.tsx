import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
// SWAT Dashboard no longer needs to import DashboardLayout
// as it's now wrapped by SwatLayout in App.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { 
  UserCog, 
  Briefcase, 
  Calendar, 
  Award, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart4,
  Clock
} from "lucide-react";

export default function SwatDashboard() {
  const { agencyId } = useParams();
  const { user } = useAuth() || { user: null };
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch personnel for the agency
  const { data: personnel = [], isLoading: personnelLoading } = useQuery<any[]>({
    queryKey: ['/api/agencies', agencyId, 'personnel'],
    enabled: !!agencyId,
  });

  // Fetch equipment for the agency
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<any[]>({
    queryKey: ['/api/agencies', agencyId, 'equipment'],
    enabled: !!agencyId,
  });

  // Fetch trainings for the agency
  const { data: trainings = [], isLoading: trainingsLoading } = useQuery<any[]>({
    queryKey: ['/api/agencies', agencyId, 'trainings'],
    enabled: !!agencyId,
  });

  // Calculate personnel statistics
  const personnelStats = {
    total: personnel.length || 0,
    active: personnel.filter((p: any) => p.status === 'active' || p.status === 'on-duty').length || 0,
    onLeave: personnel.filter((p: any) => p.status === 'leave').length || 0,
    inTraining: personnel.filter((p: any) => p.status === 'training').length || 0,
  };

  // Calculate equipment statistics
  const equipmentStats = {
    total: equipment.length || 0,
    operational: equipment.filter((e: any) => e.status === 'operational').length || 0,
    maintenance: equipment.filter((e: any) => e.status === 'maintenance').length || 0,
    outOfService: equipment.filter((e: any) => e.status === 'out_of_service' || e.status === 'repair').length || 0,
  };

  // Calculate training statistics
  const trainingStats = {
    total: trainings.length || 0,
    upcoming: trainings.filter((t: any) => {
      const today = new Date();
      const startDate = new Date(t.startDate);
      return startDate >= today && t.status !== 'completed';
    }).length || 0,
    completed: trainings.filter((t: any) => t.status === 'completed').length || 0,
    thisMonth: trainings.filter((t: any) => {
      const today = new Date();
      const startDate = new Date(t.startDate);
      return startDate.getMonth() === today.getMonth() && 
             startDate.getFullYear() === today.getFullYear();
    }).length || 0,
  };

  // Get upcoming trainings for the next 30 days
  const upcomingTrainings = trainings.filter((t: any) => {
    const today = new Date();
    const startDate = new Date(t.startDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return startDate >= today && 
           startDate <= thirtyDaysFromNow && 
           t.status !== 'completed' && 
           t.status !== 'cancelled';
  });

  // Get equipment in maintenance
  const equipmentInMaintenance = equipment.filter((e: any) => 
    e.status === 'maintenance' || e.status === 'service_due'
  );

  // Get personnel on leave
  const personnelOnLeave = personnel.filter((p: any) => 
    p.status === 'leave'
  );

  return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {user?.firstName || 'SWAT Manager'}
            </h1>
            <p className="text-muted-foreground">
              Overview and management of your SWAT team's operations
            </p>
          </div>
          <Badge className="px-3 py-1 text-sm" variant="outline">
            PREMIUM MODULE
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="status">Team Status</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
                    Personnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{personnelStats.total}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">{personnelStats.active} Active</span> • {personnelStats.onLeave} on Leave • {personnelStats.inTraining} in Training
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/swat/personnel/${agencyId}`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Manage Personnel
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{equipmentStats.total}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-500 font-medium">{equipmentStats.operational} Operational</span> • {equipmentStats.maintenance} in Maintenance • {equipmentStats.outOfService} Out of Service
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/swat/equipment/${agencyId}`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Manage Equipment
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    Training
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{trainingStats.upcoming}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-blue-500 font-medium">Upcoming Sessions</span> • {trainingStats.completed} Completed • {trainingStats.thisMonth} This Month
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/swat/training/${agencyId}`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Manage Training
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Training</CardTitle>
                  <CardDescription>
                    Next 30 days training schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingTrainings.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p>No upcoming training sessions scheduled</p>
                      <Link href={`/swat/training/${agencyId}`}>
                        <Button variant="outline" size="sm" className="mt-3">
                          Schedule Training
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {upcomingTrainings.slice(0, 5).map((training: any) => (
                        <li key={training.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <div className="font-medium">{training.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(training.startDate).toLocaleDateString()} | {training.location}
                            </div>
                          </div>
                          <Badge variant={
                            training.status === 'scheduled' ? 'outline' : 
                            training.status === 'in-progress' ? 'secondary' : 
                            'default'
                          }>
                            {training.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                {upcomingTrainings.length > 0 && (
                  <CardFooter>
                    <Link href={`/swat/training/${agencyId}`}>
                      <Button variant="outline" size="sm">View All Training</Button>
                    </Link>
                  </CardFooter>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Status</CardTitle>
                  <CardDescription>
                    Equipment and personnel status overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                        Equipment in Maintenance
                      </h3>
                      {equipmentInMaintenance.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No equipment in maintenance</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {equipmentInMaintenance.slice(0, 3).map((item: any) => (
                            <li key={item.id} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {item.nextMaintenance ? 
                                  `Maint due: ${new Date(item.nextMaintenance).toLocaleDateString()}` : 
                                  'No maint. scheduled'}
                              </span>
                            </li>
                          ))}
                          {equipmentInMaintenance.length > 3 && (
                            <li className="text-xs text-muted-foreground text-right">
                              +{equipmentInMaintenance.length - 3} more items
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-blue-500" />
                        Personnel on Leave
                      </h3>
                      {personnelOnLeave.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No personnel currently on leave</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {personnelOnLeave.slice(0, 3).map((person: any) => (
                            <li key={person.id} className="flex justify-between">
                              <span>{person.firstName} {person.lastName}</span>
                              <span className="text-muted-foreground text-xs">
                                {person.role}
                              </span>
                            </li>
                          ))}
                          {personnelOnLeave.length > 3 && (
                            <li className="text-xs text-muted-foreground text-right">
                              +{personnelOnLeave.length - 3} more personnel
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-6">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Certifications Status</CardTitle>
                  <CardDescription>
                    Team certification and qualification summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Shield className="h-8 w-8 mr-3 text-primary" />
                        <div>
                          <div className="font-medium">SWAT Basic Certification</div>
                          <div className="text-xs text-muted-foreground">National Tactical Officers Association</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">85% Complete</div>
                        <div className="text-xs text-muted-foreground">17/20 Team Members Certified</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Award className="h-8 w-8 mr-3 text-amber-500" />
                        <div>
                          <div className="font-medium">Advanced Tactical Operations</div>
                          <div className="text-xs text-muted-foreground">Law Enforcement Training Center</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">60% Complete</div>
                        <div className="text-xs text-muted-foreground">12/20 Team Members Certified</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Award className="h-8 w-8 mr-3 text-blue-500" />
                        <div>
                          <div className="font-medium">Tactical Firearms Specialist</div>
                          <div className="text-xs text-muted-foreground">Federal Law Enforcement Training Center</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">45% Complete</div>
                        <div className="text-xs text-muted-foreground">9/20 Team Members Certified</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/swat/certifications/${agencyId}`}>
                    <Button variant="outline" size="sm">Manage Certifications</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and management actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/swat/personnel/${agencyId}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <UserCog className="mr-2 h-4 w-4" />
                      Add Team Member
                    </Button>
                  </Link>
                  <Link href={`/swat/equipment/${agencyId}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Register Equipment
                    </Button>
                  </Link>
                  <Link href={`/swat/training/${agencyId}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Training
                    </Button>
                  </Link>
                  <Link href={`/swat/certifications/${agencyId}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Award className="mr-2 h-4 w-4" />
                      Assign Certification
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="status">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Ready Status
                  </CardTitle>
                  <CardDescription>
                    Components at full operational readiness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Primary Response Team</span>
                      <Badge className="bg-green-500">100% Ready</Badge>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Communications Equipment</span>
                      <Badge className="bg-green-500">100% Ready</Badge>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Entry Team Equipment</span>
                      <Badge className="bg-green-500">100% Ready</Badge>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Tactical Vehicles</span>
                      <Badge className="bg-green-500">100% Ready</Badge>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                    Attention Required
                  </CardTitle>
                  <CardDescription>
                    Components needing maintenance or attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Secondary Response Team</span>
                      <Badge className="bg-yellow-500">90% Ready</Badge>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Surveillance Equipment</span>
                      <Badge className="bg-yellow-500">85% Ready</Badge>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Team Certifications</span>
                      <Badge className="bg-yellow-500">83% Ready</Badge>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="font-medium">Tactical Medical Supplies</span>
                      <Badge className="bg-yellow-500">75% Ready</Badge>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Team Readiness Summary</CardTitle>
                <CardDescription>
                  Current operational status of your SWAT team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex flex-col items-center">
                    <div className="text-6xl font-bold text-primary">92%</div>
                    <div className="text-sm text-muted-foreground">Overall Readiness</div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Personnel</span>
                        <span className="text-sm font-medium">95%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Equipment</span>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Training</span>
                        <span className="text-sm font-medium">90%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Certifications</span>
                        <span className="text-sm font-medium">83%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '83%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart4 className="h-5 w-5 mr-2" />
                    Training Completion Rate
                  </CardTitle>
                  <CardDescription>
                    Year-to-date training completion statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart4 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Training analytics visualization</p>
                    <p className="text-sm">(Placeholder for charts)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart4 className="h-5 w-5 mr-2" />
                    Equipment Status Trends
                  </CardTitle>
                  <CardDescription>
                    Equipment maintenance and availability
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart4 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Equipment analytics visualization</p>
                    <p className="text-sm">(Placeholder for charts)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators for your SWAT team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-muted-foreground text-sm mb-1">Training Hours (YTD)</div>
                    <div className="text-3xl font-bold">1,240</div>
                    <div className="text-xs text-green-500">+18% from last year</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-muted-foreground text-sm mb-1">Certifications Obtained</div>
                    <div className="text-3xl font-bold">42</div>
                    <div className="text-xs text-green-500">+12% from last year</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-muted-foreground text-sm mb-1">Equipment Readiness</div>
                    <div className="text-3xl font-bold">94%</div>
                    <div className="text-xs text-green-500">+5% from last year</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}