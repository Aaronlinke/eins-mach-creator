import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Vote, Users, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Proposal {
  id: string;
  title: string;
  description?: string;
  votes_yes: number;
  votes_no: number;
  status: "active" | "passed" | "rejected";
}

export default function GovernancePanel() {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('governance_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals((data || []).map(p => ({
        ...p,
        status: p.status as "active" | "passed" | "rejected"
      })));
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Proposals konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, vote: "yes" | "no") => {
    try {
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) return;

      const updates = vote === "yes" 
        ? { votes_yes: proposal.votes_yes + 1 }
        : { votes_no: proposal.votes_no + 1 };

      const { error } = await supabase
        .from('governance_proposals')
        .update(updates)
        .eq('id', proposalId);

      if (error) throw error;

      toast({
        title: "Stimme registriert",
        description: `Ihre Stimme wurde erfolgreich gezählt.`,
      });

      loadProposals();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏛️ Governance Protokoll - Multi-Stakeholder System
        </CardTitle>
        <CardDescription>
          Transparente Entscheidungsfindung mit 12.500 Stakeholdern
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">12,500</div>
              <p className="text-sm text-muted-foreground">Stakeholder</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4 text-center">
              <Vote className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">89</div>
              <p className="text-sm text-muted-foreground">Jurisdiktionen</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-bold">98%</div>
              <p className="text-sm text-muted-foreground">Transparenz</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mt-6">
            <h3 className="font-semibold">Aktive Abstimmungen</h3>
            <Button variant="outline" size="sm" onClick={loadProposals} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aktualisieren"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : proposals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keine Proposals gefunden</p>
          ) : (
            proposals.map((proposal) => (
            <Card key={proposal.id} className={
              proposal.status === "passed" ? "border-emerald-500/50 bg-emerald-500/5" :
              proposal.status === "rejected" ? "border-red-500/50 bg-red-500/5" :
              "border-blue-500/50 bg-blue-500/5"
            }>
              <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{proposal.title}</h4>
                      {proposal.description && (
                        <p className="text-sm text-muted-foreground mb-2">{proposal.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-emerald-600">
                          ✓ {proposal.votes_yes} Ja
                        </span>
                        <span className="text-red-600">
                          ✗ {proposal.votes_no} Nein
                        </span>
                      </div>
                    </div>
                  <Badge variant={
                    proposal.status === "passed" ? "default" :
                    proposal.status === "rejected" ? "destructive" :
                    "secondary"
                  }>
                    {proposal.status === "active" ? "Aktiv" : proposal.status === "passed" ? "Angenommen" : "Abgelehnt"}
                  </Badge>
                </div>

                {proposal.status === "active" && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                      onClick={() => handleVote(proposal.id, "yes")}
                    >
                      Ja stimmen
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-500/10"
                      onClick={() => handleVote(proposal.id, "no")}
                    >
                      Nein stimmen
                    </Button>
                  </div>
                )}

                <div className="mt-3 bg-background/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500"
                    style={{ 
                      width: `${(proposal.votes_yes / (proposal.votes_yes + proposal.votes_no)) * 100}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        <Button className="w-full" variant="outline">
          <Vote className="h-4 w-4 mr-2" />
          Neue Abstimmung erstellen
        </Button>
      </CardContent>
    </Card>
  );
}
