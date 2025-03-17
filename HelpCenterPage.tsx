import { useState } from "react";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  HelpCircle, 
  Book, 
  Video, 
  MessageSquare, 
  Mail,
  Phone,
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqItems = [
    {
      question: "How is the tier classification determined?",
      answer: "Tier classification is determined based on the assessment responses. The system calculates the percentage of positive responses to tier-impacting questions. Tier 1 requires 90%+ positive responses, Tier 2 requires 75%+, Tier 3 requires 50%+, and Tier 4 is assigned for less than 50%."
    },
    {
      question: "Can I update my agency information after initial registration?",
      answer: "Yes, you can update your agency information at any time from the Agency Profile page. Click on your agency name in the sidebar, then select 'Edit Profile' to make changes."
    },
    {
      question: "How do I add new team members to the assessment portal?",
      answer: "As an agency administrator, you can add new team members by going to the Users page and clicking the 'Add User' button. You'll need to provide their email address, name, and assign appropriate permissions."
    },
    {
      question: "What happens if I don't complete an assessment in one session?",
      answer: "The system automatically saves your progress as you complete each question. You can return to the assessment at any time, and it will resume exactly where you left off."
    },
    {
      question: "How often should we perform reassessments?",
      answer: "We recommend conducting a full reassessment annually to ensure your team maintains compliance with current standards. However, if significant changes occur in your team composition, equipment, or training, you may want to conduct a reassessment sooner."
    },
    {
      question: "Can I download my assessment report to share with stakeholders?",
      answer: "Yes, after completing an assessment, you can generate a PDF report from the Reports page. Click on 'Generate Report' if one doesn't already exist, then use the 'Download' button to save the PDF."
    },
    {
      question: "What should I do if I disagree with an assessment outcome?",
      answer: "If you believe your assessment outcome doesn't accurately reflect your team's capabilities, you can contact the support team via the Contact Support tab. Please provide specific details about your concerns for a thorough review."
    },
    {
      question: "How secure is our agency data on this platform?",
      answer: "The platform employs industry-standard security measures including encrypted data storage, secure authentication protocols, and regular security audits. All data is stored in compliance with relevant law enforcement data protection standards."
    }
  ];

  const guidesList = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of the SWAT Accreditation dashboard",
      icon: <FileText className="h-5 w-5" />,
      type: "Documentation"
    },
    {
      title: "Complete Assessment Guide",
      description: "Step-by-step instructions for completing assessments",
      icon: <Book className="h-5 w-5" />,
      type: "Documentation"
    },
    {
      title: "Tier Classification Explained",
      description: "Understand how tier classifications work",
      icon: <FileText className="h-5 w-5" />,
      type: "Documentation"
    },
    {
      title: "Agency Profile Management",
      description: "How to update and maintain your agency profile",
      icon: <FileText className="h-5 w-5" />,
      type: "Documentation"
    },
    {
      title: "Assessment Process Overview",
      description: "Overview of the assessment workflow",
      icon: <Video className="h-5 w-5" />,
      type: "Video"
    },
    {
      title: "Generating Reports Tutorial",
      description: "How to generate and interpret assessment reports",
      icon: <Video className="h-5 w-5" />,
      type: "Video"
    }
  ];

  // Filter items based on search query
  const filteredFaqs = faqItems.filter(
    item => item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = guidesList.filter(
    item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Help Center</h1>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help, guides, and FAQs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="faqs" className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Frequently Asked Questions
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Guides & Documentation
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Tutorials
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Contact Support
          </TabsTrigger>
        </TabsList>
        
        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find answers to common questions about the SWAT Accreditation platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No FAQs found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search or browse all categories
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guides & Documentation</CardTitle>
              <CardDescription>
                Comprehensive guides and documentation to help you navigate the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuides
                  .filter(guide => guide.type === "Documentation")
                  .map((guide, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {guide.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{guide.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {guide.description}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-2 flex items-center gap-1">
                          View Guide <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
              
              {filteredGuides.filter(guide => guide.type === "Documentation").length === 0 && (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No guides found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search or browse all categories
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Learn how to use the platform with step-by-step video guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuides
                  .filter(guide => guide.type === "Video")
                  .map((guide, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="bg-neutral-100 dark:bg-neutral-800 aspect-video flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {guide.description}
                        </p>
                        <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                          Watch Tutorial <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
              
              {filteredGuides.filter(guide => guide.type === "Video").length === 0 && (
                <div className="text-center py-8">
                  <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No video tutorials found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search or browse all categories
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Need help? Contact our support team for assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Mail className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">Email Support</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      For general inquiries and non-urgent support
                    </p>
                    <a href="mailto:support@swataccreditation.gov" className="text-primary hover:underline">
                      support@swataccreditation.gov
                    </a>
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Response time: 24-48 hours
                    </p>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Phone className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">Phone Support</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      For urgent issues requiring immediate assistance
                    </p>
                    <a href="tel:+18005551234" className="text-primary hover:underline">
                      1-800-555-1234
                    </a>
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Available Monday-Friday, 8am-6pm EST
                    </p>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">Live Chat</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Chat with a support representative in real-time
                    </p>
                    <Button className="w-full">
                      Start Chat
                    </Button>
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Available Monday-Friday, 9am-5pm EST
                    </p>
                  </CardFooter>
                </Card>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Submit a Support Ticket</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <Input id="email" type="email" placeholder="your.email@example.com" />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      Subject
                    </label>
                    <Input id="subject" placeholder="Brief description of your issue" />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Describe your issue in detail..."
                    />
                  </div>
                  <div>
                    <Button className="w-full md:w-auto">
                      Submit Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Access Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>
            Frequently accessed help resources and documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base">User Manual</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Complete platform documentation
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" className="flex items-center w-full justify-start p-0 h-auto">
                  <ArrowRight className="h-4 w-4 mr-2" /> View
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Training Webinars</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Recorded training sessions
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" className="flex items-center w-full justify-start p-0 h-auto">
                  <ArrowRight className="h-4 w-4 mr-2" /> View
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Release Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Latest features and updates
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" className="flex items-center w-full justify-start p-0 h-auto">
                  <ArrowRight className="h-4 w-4 mr-2" /> View
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="h-full">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  Common issues and solutions
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="ghost" size="sm" className="flex items-center w-full justify-start p-0 h-auto">
                  <ArrowRight className="h-4 w-4 mr-2" /> View
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
