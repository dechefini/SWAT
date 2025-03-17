import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, ClipboardCheck, Users, FileText, Target, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111] via-[#111] to-[#0a0a0a]">
      {/* Hero Section */}
      <div className="relative pt-20 sm:pt-24 pb-16 sm:pb-20 text-center px-4">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Shield Logo with glow effect */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-yellow-500 rounded-full blur opacity-30" />
              <Shield className="h-16 w-16 sm:h-20 sm:w-20 text-yellow-500 relative" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-4">
            <span className="block">Elevate Your SWAT Team's</span>
            <span className="block bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
              Professional Standards
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
            The most comprehensive platform for SWAT team accreditation, trusted by
            elite law enforcement agencies nationwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-yellow-500/20 transition-all">
                Start Accreditation Process
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-700 text-black bg-white hover:bg-gray-100 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Comprehensive SWAT Team Management
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Everything you need to assess, track, and improve your SWAT team's capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Assessment Tools */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:border-yellow-500/30">
              <div className="flex items-center mb-4">
                <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 ml-3">
                  Assessment Tools
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Industry-leading evaluation system based on NTOA standards, covering 17 critical areas of tactical operations and readiness
              </p>
            </div>

            {/* Team Management */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:border-yellow-500/30">
              <div className="flex items-center mb-4">
                <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 ml-3">
                  Team Management
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Centralized dashboard for personnel tracking, equipment inventory, and certification management with real-time updates
              </p>
            </div>

            {/* Automated Reports */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-lg hover:shadow-xl transition-all hover:border-yellow-500/30">
              <div className="flex items-center mb-4">
                <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 ml-3">
                  Automated Reports
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Generate comprehensive assessment reports and analytics dashboards to track progress and identify areas for improvement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[#111] py-16 sm:py-20 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-500 mb-2">100+</div>
              <div className="text-sm sm:text-base text-gray-400">Agencies Served</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-500 mb-2">98%</div>
              <div className="text-sm sm:text-base text-gray-400">Accreditation Success Rate</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-500 mb-2">24/7</div>
              <div className="text-sm sm:text-base text-gray-400">Expert Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Ready to streamline your accreditation process?
          </h2>
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join law enforcement agencies nationwide in using our platform
          </p>
          <Link href="/auth" className="block sm:inline-block">
            <Button size="lg" className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-yellow-500/20 transition-all">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#111] text-gray-400 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          <div className="space-y-4">
            <div className="flex items-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mr-2" />
              <span className="text-lg sm:text-xl font-bold text-white">
                SWAT Accreditation
              </span>
            </div>
            <p className="text-sm">
              Setting the gold standard in SWAT team accreditation and operational excellence.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-base sm:text-lg">Platform</h3>
            <ul className="space-y-2 sm:space-y-3 text-sm">
              <li className="hover:text-white transition-colors">Assessment Tools</li>
              <li className="hover:text-white transition-colors">Team Management</li>
              <li className="hover:text-white transition-colors">Equipment Tracking</li>
              <li className="hover:text-white transition-colors">Training Records</li>
              <li className="hover:text-white transition-colors">Automated Reports</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-base sm:text-lg">Company</h3>
            <ul className="space-y-2 sm:space-y-3 text-sm">
              <li className="hover:text-white transition-colors">About Us</li>
              <li className="hover:text-white transition-colors">Careers</li>
              <li className="hover:text-white transition-colors">Press</li>
              <li className="hover:text-white transition-colors">Privacy Policy</li>
              <li className="hover:text-white transition-colors">Terms of Service</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-base sm:text-lg">Contact</h3>
            <ul className="space-y-2 sm:space-y-3 text-sm">
              <li>Email: support@swataccreditation.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Hours: 24/7 Support Available</li>
            </ul>
            <div className="mt-6">
              <Link href="/contact">
              <Button variant="outline" size="sm" className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800">
                Contact Sales
              </Button>
            </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800 text-center text-xs sm:text-sm">
          <p>© 2025 SWAT Accreditation Software. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}