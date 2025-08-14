
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CalendarIntegration {
  id: string;
  provider: string;
  accountEmail: string;
  isActive: boolean;
  createdAt: string;
}

interface GoogleCalendarConnectProps {
  integrations: CalendarIntegration[];
}

export default function GoogleCalendarConnect({ integrations }: GoogleCalendarConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const googleIntegration = integrations?.find(i => i.provider === 'google');

  const connectGoogle = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setIsConnecting(false);
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
              disabled={isConnecting}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
