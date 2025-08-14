
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Mail, Clock } from 'lucide-react';

export default function EmailTest() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Consultation Meeting',
    dateTime: '',
    location: 'Office Conference Room',
    notes: 'Initial consultation to discuss project requirements',
    customerEmail: '',
    customerPhone: ''
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Please sign in to test email functionality.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createTestAppointment = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          dateTime: new Date(formData.dateTime).toISOString(),
          location: formData.location,
          notes: formData.notes,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          status: 'confirmed'
        }),
      });

      if (response.ok) {
        const appointment = await response.json();
        toast({
          title: "Success!",
          description: "Test appointment created and confirmation email sent!",
        });
        console.log('Created appointment:', appointment);
        
        // Reset form
        setFormData({
          title: 'Consultation Meeting',
          dateTime: '',
          location: 'Office Conference Room',
          notes: 'Initial consultation to discuss project requirements',
          customerEmail: '',
          customerPhone: ''
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating test appointment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create test appointment",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const checkMailgunConfig = async () => {
    try {
      const response = await fetch('/api/test/mailgun-config');
      const data = await response.json();
      
      toast({
        title: "Mailgun Configuration",
        description: data.mailgunConfigured 
          ? `✅ Mailgun configured for domain: ${data.domain}`
          : "❌ Mailgun not properly configured",
        variant: data.mailgunConfigured ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check Mailgun configuration",
        variant: "destructive",
      });
    }
  };

  // Set default datetime to 1 hour from now
  const defaultDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Flow Testing</h1>
          <p className="text-gray-600">Test the appointment booking and email confirmation flow</p>
        </div>

        {/* Mailgun Status Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Mailgun Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={checkMailgunConfig} variant="outline" className="w-full">
              Check Mailgun Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Test Appointment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Create Test Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Appointment Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Meeting title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTime">Date & Time</Label>
              <Input
                id="dateTime"
                name="dateTime"
                type="datetime-local"
                value={formData.dateTime || defaultDateTime}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Meeting location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email (optional)</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="customer@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone (optional)</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about the appointment"
                rows={3}
              />
            </div>

            <Button 
              onClick={createTestAppointment}
              disabled={isCreating}
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Test Appointment & Send Email'}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>This will create an appointment and send a confirmation email to your registered email address.</p>
          <p>Check your email inbox (and spam folder) for the confirmation message.</p>
        </div>
      </div>
    </div>
  );
}
