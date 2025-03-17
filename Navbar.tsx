import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-card/95 backdrop-blur-md fixed w-full z-50 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="flex items-center">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2" />
                <span className="text-lg sm:text-xl font-bold text-foreground">
                  SWAT Accreditation
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-baseline space-x-6">
              <Link href="/">
                <span className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </span>
              </Link>
              <Link href="/auth">
                <span className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Login
                </span>
              </Link>
              <Link href="/contact">
                <span className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Contact Sales
                </span>
              </Link>
            </div>
            <ThemeToggle />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-primary hover:bg-muted/50"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
              <Link href="/">
                <span className="text-foreground hover:text-primary block px-3 py-4 rounded-md text-base font-medium transition-colors">
                  Home
                </span>
              </Link>
              <Link href="/auth">
                <span className="text-foreground hover:text-primary block px-3 py-4 rounded-md text-base font-medium transition-colors">
                  Login
                </span>
              </Link>
              <Link href="/contact">
                <span className="text-foreground hover:text-primary block px-3 py-4 rounded-md text-base font-medium transition-colors">
                  Contact
                </span>
              </Link>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full mt-2 shadow-sm">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}