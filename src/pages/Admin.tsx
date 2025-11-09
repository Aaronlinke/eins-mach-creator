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
import { WebAutomationPanel } from "@/components/admin/WebAutomationPanel";
import { MobileConnectionPanel } from "@/components/admin/MobileConnectionPanel";
import { AutonomousAIPanel } from "@/components/admin/AutonomousAIPanel";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (error || !data) {
      setIsAdmin(false);
      toast({
        title: "Zugriff verweigert",
        description: "Sie benötigen Administrator-Rechte für diese Seite.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/"), 2000);
    } else {
      setIsAdmin(true);
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
      await checkAdminRole(session.user.id);
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

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          {loading ? "Lädt..." : "Zugriff wird geprüft..."}
        </p>
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

        <Tabs defaultValue="autonomous" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
            <TabsTrigger value="autonomous">🤖 Autonom</TabsTrigger>
            <TabsTrigger value="web-automation">🌐 Web</TabsTrigger>
            <TabsTrigger value="mobile">📱 Mobile</TabsTrigger>
            <TabsTrigger value="quantum">⚛️ Quanten</TabsTrigger>
            <TabsTrigger value="hybrid-ai">🧠 Hybrid KI</TabsTrigger>
            <TabsTrigger value="semantic">🔮 Semantik</TabsTrigger>
            <TabsTrigger value="autonomy">🎯 Autonomie</TabsTrigger>
            <TabsTrigger value="ethics">⚖️ Ethik</TabsTrigger>
            <TabsTrigger value="economy">💎 Wirtschaft</TabsTrigger>
            <TabsTrigger value="governance">🏛️ Governance</TabsTrigger>
            <TabsTrigger value="physical">🌐 Physisch</TabsTrigger>
          </TabsList>

          <TabsContent value="autonomous">
            <AutonomousAIPanel />
          </TabsContent>

          <TabsContent value="web-automation">
            <WebAutomationPanel />
          </TabsContent>

          <TabsContent value="mobile">
            <MobileConnectionPanel />
          </TabsContent>

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
