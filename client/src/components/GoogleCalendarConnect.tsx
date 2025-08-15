
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink, Trash2, Clock, TestTube, CheckCircle } from "lucide-react";
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
  const [showCalendlyTest, setShowCalendlyTest] = useState(false);
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
      console.log('Starting Calendly connection...');
      const response = await fetch('/api/auth/calendly', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Calendly response received:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Calendly data:', data);
      
      if (data.authUrl) {
        console.log('Redirecting to Calendly auth URL');
        window.location.href = data.authUrl;
      } else {
        console.error('No auth URL received from Calendly endpoint');
        setIsConnectingCalendly(false);
      }
    } catch (error) {
      console.error('Error connecting to Calendly:', error);
      setIsConnectingCalendly(false);
    }
  };

  // Test Calendly events query
  const { data: calendlyEvents, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['/api/calendly/events'],
    enabled: showCalendlyTest && !!calendlyIntegration,
    queryFn: async () => {
      const response = await fetch('/api/calendly/events', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCalendlyTest(!showCalendlyTest)}
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteIntegrationMutation.mutate(calendlyIntegration.id)}
                    disabled={deleteIntegrationMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Calendly scheduled events will be displayed alongside your appointments.
              </p>
              
              {/* Test Section */}
              {showCalendlyTest && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Test Calendly Connection</h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => refetchEvents()}
                      disabled={isLoadingEvents}
                    >
                      {isLoadingEvents ? (
                        <Clock className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                  
                  {isLoadingEvents ? (
                    <p className="text-sm text-muted-foreground">Loading your Calendly events...</p>
                  ) : calendlyEvents ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">Connection successful!</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Found {calendlyEvents.length || 0} upcoming events from your Calendly account.
                      </p>
                      {calendlyEvents.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Latest event: {calendlyEvents[0]?.name || 'Untitled'} 
                          {calendlyEvents[0]?.start_time && (
                            <span> on {new Date(calendlyEvents[0].start_time).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">Failed to fetch events. Check console for details.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 border rounded bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Calendly Not Connected
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  No active Calendly integration found in database.
                </p>
              </div>
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
