
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink, Trash2, Clock } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";


interface CalendarIntegration {
  id: string;
  provider: string;
  accountEmail: string;
  isActive: boolean;
  createdAt: string;
}

interface CalendarIntegrationsProps {
  integrations: CalendarIntegration[];
}

export default function CalendarIntegrations({ integrations }: CalendarIntegrationsProps) {
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isConnectingCalendly, setIsConnectingCalendly] = useState(false);
  const queryClient = useQueryClient();

  const googleIntegration = integrations?.find(i => i.provider === 'google');
  const calendlyIntegration = integrations?.find(i => i.provider === 'calendly');

  const connectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('No auth URL received from Google endpoint');
        setIsConnectingGoogle(false);
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setIsConnectingGoogle(false);
    }
  };

  const connectCalendly = async () => {
    setIsConnectingCalendly(true);
    try {
      console.log('=== STARTING CALENDLY CONNECTION ===');
      console.log('Making request to /api/auth/calendly...');
      
      const response = await fetch('/api/auth/calendly', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.authUrl) {
        console.log('Auth URL received:', data.authUrl);
        console.log('Redirecting to Calendly OAuth page...');
        window.location.href = data.authUrl;
      } else {
        console.error('No auth URL in response');
        setIsConnectingCalendly(false);
      }
    } catch (error) {
      console.error('=== CALENDLY CONNECTION ERROR ===');
      console.error('Error details:', error);
      console.error('==============================');
      setIsConnectingCalendly(false);
    }
  };



  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/calendar-integrations/${integrationId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-integrations"] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {googleIntegration ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Connected Account</p>
                  <p className="text-sm text-muted-foreground">{googleIntegration.accountEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Connected on {new Date(googleIntegration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteIntegrationMutation.mutate(googleIntegration.id)}
                  disabled={deleteIntegrationMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Google Calendar events will be displayed alongside your appointments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar to view your events alongside your FieldFlow appointments.
              </p>
              <Button 
                onClick={connectGoogle} 
                disabled={isConnectingGoogle}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isConnectingGoogle ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendly Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendly Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {calendlyIntegration ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Connected Account</p>
                  <p className="text-sm text-muted-foreground">{calendlyIntegration.accountEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Connected on {new Date(calendlyIntegration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteIntegrationMutation.mutate(calendlyIntegration.id)}
                  disabled={deleteIntegrationMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Calendly scheduled events will be displayed alongside your appointments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Calendly account to view your scheduled events alongside your FieldFlow appointments.
              </p>
              <Button 
                onClick={connectCalendly} 
                disabled={isConnectingCalendly}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isConnectingCalendly ? 'Connecting...' : 'Connect Calendly'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
