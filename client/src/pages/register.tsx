
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { useLocation } from "wouter";

type RegistrationStep = 'details' | 'calendar-prompt' | 'calendar-selection';

export default function Register() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('details');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      // Store registration data in localStorage temporarily
      localStorage.setItem('pendingRegistration', JSON.stringify(formData));
      
      // Move to calendar prompt step
      setCurrentStep('calendar-prompt');
      setIsLoading(false);
    } catch (err) {
      setError("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleJustLooking = async () => {
    setIsLoading(true);
    try {
      // Redirect to Replit auth without calendar connection
      localStorage.setItem('skipCalendarConnection', 'true');
      window.location.href = '/api/login';
    } catch (err) {
      setError("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleConnectCalendar = () => {
    setCurrentStep('calendar-selection');
  };

  const handleGoogleCalendar = async () => {
    setIsLoading(true);
    try {
      // Mark that we want to connect Google Calendar after auth
      localStorage.setItem('connectGoogleCalendar', 'true');
      // Redirect to Replit auth
      window.location.href = '/api/login';
    } catch (err) {
      setError("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCalendly = async () => {
    setIsLoading(true);
    try {
      // Mark that we want to connect Calendly after auth
      localStorage.setItem('connectCalendly', 'true');
      // Redirect to Replit auth
      window.location.href = '/api/login';
    } catch (err) {
      setError("Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const renderDetailsStep = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-textPrimary">
            Welcome to FieldFlow
          </CardTitle>
          <p className="text-textSecondary mt-2">
            Let's get you started with your account
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-textPrimary font-medium">
              First Name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-textPrimary font-medium">
              Last Name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-textPrimary font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
              className="h-11"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-11 text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Continue"}
          </Button>
        </form>
        
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-textSecondary hover:text-textPrimary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <div className="text-center text-sm text-textSecondary">
          <p>Already have an account?</p>
          <Button variant="link" asChild className="p-0 h-auto text-primary">
            <a href="/signin">Sign In</a>
          </Button>
        </div>
      </CardContent>
    </>
  );

  const renderCalendarPrompt = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-textPrimary">
            Connect Your Calendar
          </CardTitle>
          <p className="text-textSecondary mt-2">
            Would you like to connect your calendar to sync appointments?
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-textSecondary">
            Connecting your calendar helps you manage appointments and avoid double-bookings.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleConnectCalendar}
              className="w-full h-12 text-lg font-medium"
              disabled={isLoading}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Yes, Connect My Calendar
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleJustLooking}
              className="w-full h-12 text-lg font-medium"
              disabled={isLoading}
            >
              <Clock className="w-5 h-5 mr-2" />
              Just Looking For Now
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <p className="text-xs text-textSecondary">
            You can always connect your calendar later from your dashboard.
          </p>
        </div>
        
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep('details')}
            className="text-textSecondary hover:text-textPrimary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardContent>
    </>
  );

  const renderCalendarSelection = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-textPrimary">
            Choose Your Calendar
          </CardTitle>
          <p className="text-textSecondary mt-2">
            Select which calendar service you'd like to connect
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button 
            onClick={handleGoogleCalendar}
            variant="outline"
            className="w-full h-16 text-left flex items-center justify-between p-4 border-2 hover:border-primary"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-textPrimary">Google Calendar</p>
                <p className="text-sm text-textSecondary">Sync with your Google Calendar events</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-textSecondary" />
          </Button>
          
          <Button 
            onClick={handleCalendly}
            variant="outline"
            className="w-full h-16 text-left flex items-center justify-between p-4 border-2 hover:border-primary"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-textPrimary">Calendly</p>
                <p className="text-sm text-textSecondary">Connect your Calendly booking page</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-textSecondary" />
          </Button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="text-center pt-4">
            <Button
              variant="ghost"
              onClick={handleJustLooking}
              className="text-textSecondary hover:text-textPrimary"
              disabled={isLoading}
            >
              Skip for now
            </Button>
          </div>
        </div>
        
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep('calendar-prompt')}
            className="text-textSecondary hover:text-textPrimary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardContent>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'calendar-prompt' && renderCalendarPrompt()}
        {currentStep === 'calendar-selection' && renderCalendarSelection()}
      </Card>
    </div>
  );
}
