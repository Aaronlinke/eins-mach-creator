import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Settings, Activity } from "lucide-react";

export default function SystemManagementPanel() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>
            Manage system data and configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            View System Layers
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Manage API Connections
          </Button>
          <Button variant="outline" className="w-full justify-start">
            System Events Log
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Metrics Dashboard
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Configure system settings and parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Auth Settings
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Security Policies
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Performance Tuning
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Backup & Recovery
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Monitoring
          </CardTitle>
          <CardDescription>
            Live system metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Active Layers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Agents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">99.97%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">2.8k</p>
              <p className="text-sm text-muted-foreground">Nodes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
