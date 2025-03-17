import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  FileText,
  PieChart as PieChartIcon,
  Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Placeholder for mission data
const missionData = {
  completed: 32,
  ongoing: 15,
  failed: 3
};

// Sample data for the charts
const monthlyMissionsData = [
  { name: 'Jan', missions: 4 },
  { name: 'Feb', missions: 5 },
  { name: 'Mar', missions: 6 },
  { name: 'Apr', missions: 8 },
  { name: 'May', missions: 10 },
  { name: 'Jun', missions: 9 }
];

const incidentData = [
  { name: 'Jan', incidents: 2 },
  { name: 'Feb', incidents: 3 },
  { name: 'Mar', incidents: 5 },
  { name: 'Apr', incidents: 7 },
  { name: 'May', incidents: 4 },
  { name: 'Jun', incidents: 6 }
];

// AI insights data
const aiInsights = [
  {
    id: 1,
    type: 'success',
    message: 'Mission success rates have increased by 10% this quarter, primarily due to improved team coordination.',
    confidence: 92
  },
  {
    id: 2,
    type: 'warning',
    message: 'High-severity incidents peaked in July—data suggests a correlation with reduced training hours.',
    confidence: 85
  },
  {
    id: 3,
    type: 'info',
    message: 'Report submission delays have increased by 15%. Consider implementing automated reminders.',
    confidence: 78
  },
  {
    id: 4,
    type: 'success',
    message: 'Equipment maintenance compliance has improved by 25% following new tracking procedures.',
    confidence: 95
  }
];

// Incident summary data
const incidentSummary = {
  highPriority: 5,
  mediumPriority: 12,
  lowPriority: 30
};

export default function ReportsHistoricalPage() {
  const { agencyId } = useParams();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('last30Days');
  const [missionType, setMissionType] = useState('allMissionTypes');
  const [operationType, setOperationType] = useState('allOperations');
  
  // Fetching data would happen here in a real implementation
  const { data: missions = [], isLoading: missionsLoading } = useQuery({
    queryKey: ['/api/agencies', agencyId, 'missions'],
    enabled: !!agencyId,
  });
  
  // Function to export reports
  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    toast({
      title: 'Export Initiated',
      description: `Your report is being exported as ${format.toUpperCase()}.`,
    });
  };

  // Function to explain page functionality
  const handleExplainPage = () => {
    toast({
      title: 'Reports & Historical Data',
      description: 'This page provides detailed analytics and historical data about your SWAT operations, incidents, and team performance metrics.',
      duration: 5000,
    });
  };
  
  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <PieChartIcon className="text-blue-600 mr-2" size={24} />
          <h1 className="text-2xl font-bold">Reports & Historical Data</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleExplainPage}
          >
            <Info size={16} className="mr-2" />
            Explain This Page
          </Button>
          <Button>
            <FileText size={16} className="mr-2" />
            Print Report
          </Button>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <Input
            type="text"
            placeholder="Search reports..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2" size={16} />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30Days">Last 30 Days</SelectItem>
              <SelectItem value="last90Days">Last 90 Days</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={missionType} onValueChange={setMissionType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mission Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allMissionTypes">All Mission Types</SelectItem>
              <SelectItem value="highRiskWarrant">High-Risk Warrant</SelectItem>
              <SelectItem value="hostage">Hostage Situation</SelectItem>
              <SelectItem value="barricade">Barricaded Subject</SelectItem>
              <SelectItem value="vipProtection">VIP Protection</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={operationType} onValueChange={setOperationType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Operation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allOperations">All Operations</SelectItem>
              <SelectItem value="tactical">Tactical</SelectItem>
              <SelectItem value="surveillance">Surveillance</SelectItem>
              <SelectItem value="training">Training</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Dashboard Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Missions Overview Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Missions Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="success" className="mr-2 bg-green-100 text-green-800 hover:bg-green-200">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                  </Badge>
                  <span>Completed</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">{missionData.completed}</span>
                  <ArrowUpRight size={16} className="ml-1 text-green-500" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                  </Badge>
                  <span>Ongoing</span>
                </div>
                <span className="font-medium">{missionData.ongoing}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="destructive" className="mr-2 bg-red-100 text-red-800 hover:bg-red-200">
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                  </Badge>
                  <span>Failed</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">{missionData.failed}</span>
                  <ArrowDownRight size={16} className="ml-1 text-red-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Compliance Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32">
                <circle
                  className="text-gray-200"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="50"
                  cx="65"
                  cy="65"
                />
                <circle
                  className="text-blue-600"
                  strokeWidth="10"
                  strokeDasharray={314} // 2 * PI * r
                  strokeDashoffset={(1 - 0.85) * 314} // (1 - percentage) * circumference
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="50"
                  cx="65"
                  cy="65"
                />
              </svg>
              <span className="absolute text-2xl font-bold">85%</span>
            </div>
            <div className="text-center mt-auto text-sm text-gray-500">
              Policy Accomplishment Rate
            </div>
          </CardContent>
        </Card>
        
        {/* Incident Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Incident Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="destructive" className="mr-2 bg-red-100 text-red-800 hover:bg-red-200">
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                  </Badge>
                  <span>High Priority</span>
                </div>
                <span className="font-medium">{incidentSummary.highPriority}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 bg-orange-100 text-orange-800 hover:bg-orange-200">
                    <div className="h-2 w-2 rounded-full bg-orange-500 mr-1"></div>
                  </Badge>
                  <span>Medium Priority</span>
                </div>
                <span className="font-medium">{incidentSummary.mediumPriority}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></div>
                  </Badge>
                  <span>Low Priority</span>
                </div>
                <span className="font-medium">{incidentSummary.lowPriority}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Missions Completed Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Missions Completed per Month</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyMissionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="missions" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Incident Trends Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Incident Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="incidents" stroke="#ef4444" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Insights Section */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center">
              <Lightbulb className="text-amber-500 mr-2" size={20} />
              AI-Generated Insights
            </CardTitle>
            <span className="text-xs text-gray-500">Last updated: 2 hours ago</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div 
                key={insight.id} 
                className={`flex p-4 rounded-md border ${
                  insight.type === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : insight.type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm">
                    {insight.message}
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        insight.type === 'success' 
                          ? 'bg-green-500' 
                          : insight.type === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`} 
                      style={{ width: `${insight.confidence}%` }}
                    ></div>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">Confidence Score</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => handleExport('excel')}>
          <Download size={16} className="mr-2" />
          Export Excel
        </Button>
        <Button variant="outline" onClick={() => handleExport('csv')}>
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" onClick={() => handleExport('pdf')}>
          <Download size={16} className="mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}