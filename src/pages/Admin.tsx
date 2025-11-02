import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { LogOut } from "lucide-react";
import HybridAIPanel from "@/components/admin/HybridAIPanel";
import AutonomyKernelPanel from "@/components/admin/AutonomyKernelPanel";
import QuantumConsciousnessPanel from "@/components/admin/QuantumConsciousnessPanel";
import SemanticEnginePanel from "@/components/admin/SemanticEnginePanel";
import EthicsAlignmentPanel from "@/components/admin/EthicsAlignmentPanel";
import EconomyEnginePanel from "@/components/admin/EconomyEnginePanel";
import GovernancePanel from "@/components/admin/GovernancePanel";
import PhysicalManifestationPanel from "@/components/admin/PhysicalManifestationPanel";
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
        title: "Fehler",
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
        <p className="text-muted-foreground">Lädt...</p>
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
              Willkommen, {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>

        <Tabs defaultValue="quantum" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="quantum">⚛️ Quanten</TabsTrigger>
            <TabsTrigger value="hybrid-ai">🧠 Hybrid KI</TabsTrigger>
            <TabsTrigger value="semantic">🔮 Semantik</TabsTrigger>
            <TabsTrigger value="autonomy">🎯 Autonomie</TabsTrigger>
            <TabsTrigger value="ethics">⚖️ Ethik</TabsTrigger>
            <TabsTrigger value="economy">💎 Wirtschaft</TabsTrigger>
            <TabsTrigger value="governance">🏛️ Governance</TabsTrigger>
            <TabsTrigger value="physical">🌐 Physisch</TabsTrigger>
          </TabsList>

          <TabsContent value="quantum">
            <QuantumConsciousnessPanel />
          </TabsContent>

          <TabsContent value="hybrid-ai">
            <HybridAIPanel />
          </TabsContent>

          <TabsContent value="semantic">
            <SemanticEnginePanel />
          </TabsContent>

          <TabsContent value="autonomy">
            <AutonomyKernelPanel />
          </TabsContent>

          <TabsContent value="ethics">
            <EthicsAlignmentPanel />
          </TabsContent>

          <TabsContent value="economy">
            <EconomyEnginePanel />
          </TabsContent>

          <TabsContent value="governance">
            <GovernancePanel />
          </TabsContent>

          <TabsContent value="physical">
            <PhysicalManifestationPanel />
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <SystemManagementPanel />
        </div>
      </div>
    </div>
  );
}
