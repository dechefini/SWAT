import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { 
  FileText, 
  Upload, 
  Film, 
  Globe, 
  Search, 
  Download,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Define the Resource type
interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: 'policy' | 'sop' | 'training' | 'template' | 'external' | 'other';
  fileUrl: string | null;
  fileType: string | null;
  uploadedBy: string;
  uploadDate: string;
  lastUpdated: string | null;
  version: string | null;
  tags: string[];
  notes: string | null;
}

export default function ResourcesLibraryPage() {
  const { agencyId } = useParams();
  const { user } = useAuth() || { user: null };
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('policies');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch resources for the agency
  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ['/api/agencies', agencyId, 'resources'],
    enabled: !!agencyId,
  });

  // Resource categories and their mapping to tabs
  const categoryToTabMap = {
    'policy': 'policies',
    'sop': 'policies',
    'template': 'forms',
    'training': 'training',
    'external': 'external',
    'other': 'other'
  };

  // Filter resources based on active tab and search query
  const filteredResources = resources.filter(resource => {
    const matchesTab = categoryToTabMap[resource.category] === activeTab;
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    return matchesTab && (searchQuery === '' || matchesSearch);
  });

  // Handle resource download/access
  const handleResourceAction = (resource: Resource) => {
    if (resource.fileUrl) {
      if (resource.category === 'external') {
        window.open(resource.fileUrl, '_blank');
      } else {
        // For local files, trigger download
        const link = document.createElement('a');
        link.href = resource.fileUrl;
        link.download = resource.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      toast({
        title: 'Resource Unavailable',
        description: 'This resource is currently unavailable.',
        variant: 'destructive',
      });
    }
  };

  // Handle upload resource
  const handleUploadResource = () => {
    toast({
      title: 'Upload Feature',
      description: 'Resource upload functionality will be implemented soon.',
    });
  };

  // Render different content based on the active tab
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (filteredResources.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-400">No resources found. Try a different search or upload new resources.</p>
        </div>
      );
    }

    switch(activeTab) {
      case 'policies':
        return <PoliciesContent resources={filteredResources} handleAction={handleResourceAction} />;
      case 'forms':
        return <FormsContent resources={filteredResources} handleAction={handleResourceAction} />;
      case 'training':
        return <TrainingContent resources={filteredResources} handleAction={handleResourceAction} />;
      case 'external':
        return <ExternalContent resources={filteredResources} handleAction={handleResourceAction} />;
      default:
        return <PoliciesContent resources={filteredResources} handleAction={handleResourceAction} />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FileText className="text-blue-500 mr-2" size={24} />
          <h1 className="text-2xl font-bold">Policies & Resources</h1>
        </div>
        
        <Button 
          onClick={handleUploadResource}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload size={16} className="mr-2" />
          Upload Resource
        </Button>
      </div>
      
      {/* Tab Navigation */}
      <Tabs 
        defaultValue="policies" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mb-6"
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="policies" className="flex items-center">
            <FileText size={16} className="mr-2" />
            Policies & SOPs
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center">
            <FileText size={16} className="mr-2" />
            Forms & Templates
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center">
            <Film size={16} className="mr-2" />
            Training Videos
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center">
            <Globe size={16} className="mr-2" />
            External Resources
          </TabsTrigger>
        </TabsList>
        
        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <Input
              type="text"
              placeholder="Search resources..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Tab Content */}
        <TabsContent value="policies">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="forms">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="training">
          {renderTabContent()}
        </TabsContent>
        <TabsContent value="external">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Policies & SOPs Tab Content
const PoliciesContent = ({ resources, handleAction }: { resources: Resource[], handleAction: (resource: Resource) => void }) => {
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b">
            <th className="px-6 py-3 text-sm font-medium">Title</th>
            <th className="px-6 py-3 text-sm font-medium">Category</th>
            <th className="px-6 py-3 text-sm font-medium">Effective Date</th>
            <th className="px-6 py-3 text-sm font-medium">Version</th>
            <th className="px-6 py-3 text-sm font-medium">Status</th>
            <th className="px-6 py-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map(resource => (
            <tr key={resource.id} className="border-b hover:bg-muted/50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <FileText size={16} className="text-blue-500 mr-2" />
                  <span className="font-medium">{resource.title}</span>
                </div>
                {resource.description && (
                  <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
                )}
              </td>
              <td className="px-6 py-4 text-sm">
                {resource.category === 'policy' ? 'Policy' : 'SOP'}
              </td>
              <td className="px-6 py-4 text-sm">
                {new Date(resource.uploadDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm">{resource.version || '-'}</td>
              <td className="px-6 py-4">
                <Badge 
                  variant={resource.lastUpdated ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {resource.lastUpdated ? 'Updated' : 'Current'}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-500 hover:text-blue-400 mr-2"
                  onClick={() => handleAction(resource)}
                >
                  <Eye size={16} className="mr-1" /> View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-500 hover:text-blue-400"
                  onClick={() => handleAction(resource)}
                >
                  <Download size={16} className="mr-1" /> Download
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Forms & Templates Tab Content
const FormsContent = ({ resources, handleAction }: { resources: Resource[], handleAction: (resource: Resource) => void }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map(resource => (
        <Card key={resource.id} className="hover:bg-muted/50 transition duration-150">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <FileText size={24} className="text-blue-500 mr-3" />
                <div>
                  <h4 className="font-medium">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {resource.category === 'template' ? 'Template' : 'Form'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAction(resource)}
              >
                <Download size={16} />
              </Button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center justify-between">
              <span>Updated: {new Date(resource.uploadDate).toLocaleDateString()}</span>
              <span>{resource.fileType?.toUpperCase() || 'DOCX'} • {Math.floor(Math.random() * 500) + 100}KB</span>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                variant="link" 
                size="sm" 
                className="text-blue-500 hover:text-blue-400"
                onClick={() => handleAction(resource)}
              >
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Upload New Template Button */}
      <Card className="border-dashed hover:bg-muted/50 transition duration-150 flex items-center justify-center p-4 cursor-pointer">
        <CardContent className="p-0 text-center">
          <div className="h-10 w-10 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
            <Upload size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Upload New Template</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Training Videos Tab Content
const TrainingContent = ({ resources, handleAction }: { resources: Resource[], handleAction: (resource: Resource) => void }) => {
  // User's certification progress
  const certificationProgress = {
    completed: 5,
    required: 8
  };
  
  // Training hours
  const trainingHours = {
    completed: 18.5,
    required: 40
  };
  
  return (
    <div>
      {/* Training Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-blue-950 text-white border-none">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your Certifications
            </h3>
            <p className="text-sm text-blue-300 mb-2">
              {certificationProgress.completed} of {certificationProgress.required} required certifications complete
            </p>
            <div className="w-full bg-blue-900 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full" 
                style={{ width: `${(certificationProgress.completed / certificationProgress.required) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-950 text-white border-none">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Training Hours
            </h3>
            <p className="text-sm text-green-300 mb-2">
              {trainingHours.completed} hours completed in 2025
            </p>
            <p className="text-xs text-green-300 mb-2">
              Annual requirement: {trainingHours.required} hours
            </p>
            <div className="w-full bg-green-900 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${(trainingHours.completed / trainingHours.required) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Training Videos List */}
      <div className="space-y-4">
        {resources.map(resource => (
          <Card key={resource.id} className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Video Thumbnail */}
              <div className="bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-blue-600/90 flex items-center justify-center cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {resource.uploadDate && new Date(resource.uploadDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">NEW</div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{Math.floor(Math.random() * 30) + 10}:15</div>
              </div>
              
              {/* Video Details */}
              <div className="col-span-2 p-4">
                <h3 className="text-lg font-medium mb-1">{resource.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{resource.category}</p>
                <p className="text-sm mb-3">
                  {resource.description || 'No description provided.'}
                </p>
                
                <div className="flex flex-wrap justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Uploaded: {new Date(resource.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleAction(resource)}
                    >
                      Resources
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                      onClick={() => handleAction(resource)}
                    >
                      Watch Video
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// External Resources Tab Content
const ExternalContent = ({ resources, handleAction }: { resources: Resource[], handleAction: (resource: Resource) => void }) => {
  return (
    <div className="space-y-4">
      {resources.map(resource => (
        <Card key={resource.id} className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium">{resource.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {resource.category === 'external' ? 'External Resource' : resource.category}
                </p>
              </div>
            </div>
            
            <p className="text-sm mb-4">
              {resource.description || 'No description available.'}
            </p>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Added: {new Date(resource.uploadDate).toLocaleDateString()}
              </p>
              <Button 
                variant="default"
                size="sm"
                onClick={() => handleAction(resource)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink size={14} className="mr-1" />
                Access Resource
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};