import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, Settings, Cpu, Network, Database } from "lucide-react";
import HybridAIPanel from "@/components/admin/HybridAIPanel";
import AutonomyKernelPanel from "@/components/admin/AutonomyKernelPanel";
import SystemManagementPanel from "@/components/admin/SystemManagementPanel";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">OMEGA Admin Portal</h1>
            <p className="text-muted-foreground">
              Welcome, {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hybrid-ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hybrid-ai">
              <Cpu className="h-4 w-4 mr-2" />
              Hybrid KI
            </TabsTrigger>
            <TabsTrigger value="autonomy">
              <Network className="h-4 w-4 mr-2" />
              Autonomy Kernel
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="h-4 w-4 mr-2" />
              System Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hybrid-ai">
            <HybridAIPanel />
          </TabsContent>

          <TabsContent value="autonomy">
            <AutonomyKernelPanel />
          </TabsContent>

          <TabsContent value="system">
            <SystemManagementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
