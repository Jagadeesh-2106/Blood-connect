import { Button } from "./ui/button";
import { Heart, Menu, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { OfflineModeIndicator } from "./OfflineModeIndicator";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <Heart className="w-8 h-8 text-red-600" />
            <span className="text-lg font-bold text-gray-900">BloodConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/how-it-works" className="text-gray-600 hover:text-red-600">How It Works</Link>
            <Link to="/find-donors" className="text-gray-600 hover:text-red-600">Find Donors</Link>
            <Link to="/about" className="text-gray-600 hover:text-red-600">About</Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <OfflineModeIndicator />
            <div className="flex items-center gap-2 text-red-600">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-semibold">Emergency: 911</span>
            </div>
            <Button asChild variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link to="/auth">Register</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link to="/how-it-works" className="text-gray-600 hover:text-red-600 text-center" onClick={() => setIsMenuOpen(false)}>How It Works</Link>
              <Link to="/find-donors" className="text-gray-600 hover:text-red-600 text-center" onClick={() => setIsMenuOpen(false)}>Find Donors</Link>
              <Link to="/about" className="text-gray-600 hover:text-red-600 text-center" onClick={() => setIsMenuOpen(false)}>About</TLink>
              <div className="flex justify-center mb-2">
                <OfflineModeIndicator />
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Button asChild variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Register</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
