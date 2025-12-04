import { useState } from 'react';
import { Participant, Exclusion, Assignment } from '@/types/secretSanta';
import { generateAssignments } from '@/utils/secretSantaAlgorithm';
import { Button } from '@/components/ui/button';
import Snowfall from '@/components/Snowfall';
import ParticipantCard from '@/components/ParticipantCard';
import AddParticipantForm from '@/components/AddParticipantForm';
import ExclusionManager from '@/components/ExclusionManager';
import { Gift, Sparkles, Users, ShieldX, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [emailsSent, setEmailsSent] = useState(false);

  const addParticipant = (name: string, email: string) => {
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      email,
    };
    setParticipants([...participants, newParticipant]);
    setAssignments(null);
    setEmailsSent(false);
    toast.success(`${name} aggiunto!`);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
    setExclusions(exclusions.filter(e => e.fromId !== id && e.toId !== id));
    setAssignments(null);
    setEmailsSent(false);
  };

  const addExclusion = (fromId: string, toId: string) => {
    const exists = exclusions.some(e => e.fromId === fromId && e.toId === toId);
    if (!exists) {
      setExclusions([...exclusions, { id: crypto.randomUUID(), fromId, toId }]);
      setAssignments(null);
      setEmailsSent(false);
    }
  };

  const removeExclusion = (id: string) => {
    setExclusions(exclusions.filter(e => e.id !== id));
    setAssignments(null);
  };

  const performDraw = () => {
    if (participants.length < 2) {
      toast.error('Servono almeno 2 partecipanti!');
      return;
    }

    const result = generateAssignments(participants, exclusions);
    if (result) {
      setAssignments(result);
      setEmailsSent(false);
      toast.success('Sorteggio completato!', {
        description: 'Ora puoi inviare le email ai partecipanti.',
        icon: <Sparkles className="w-4 h-4" />,
      });
    } else {
      toast.error('Impossibile completare il sorteggio', {
        description: 'Troppe esclusioni rendono impossibile un abbinamento valido.',
      });
    }
  };

  const sendEmails = async () => {
    if (!assignments) return;
    
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-secret-santa-emails', {
        body: {
          assignments: assignments.map(a => ({
            giver: { name: a.giver.name, email: a.giver.email },
            receiver: { name: a.receiver.name }
          })),
          eventName: 'Secret Santa 2024'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setEmailsSent(true);
        toast.success('Email inviate con successo!', {
          description: 'Tutti i partecipanti hanno ricevuto il nome del loro Secret Santa.',
          icon: <CheckCircle className="w-4 h-4" />,
        });
      } else {
        throw new Error(data?.error || 'Errore sconosciuto');
      }
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast.error('Errore nell\'invio delle email', {
        description: error.message || 'Riprova più tardi.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Snowfall />
      
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-festive shadow-glow mb-6 animate-float">
            <Gift className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-3">
            Secret Santa
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Organizza il tuo scambio di regali natalizio in modo semplice e divertente
          </p>
        </header>

        {/* Participants Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-display font-semibold text-foreground">
              Partecipanti
            </h2>
            <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {participants.length}/8
            </span>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-border shadow-card mb-4">
            <AddParticipantForm onAdd={addParticipant} />
          </div>

          {participants.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {participants.map((p, i) => (
                <ParticipantCard 
                  key={p.id} 
                  participant={p} 
                  onRemove={removeParticipant}
                  index={i}
                />
              ))}
            </div>
          )}

          {participants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aggiungi i partecipanti per iniziare</p>
            </div>
          )}
        </section>

        {/* Exclusions Section */}
        {participants.length >= 2 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <ShieldX className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-display font-semibold text-foreground">
                Esclusioni
              </h2>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-border shadow-card">
              <p className="text-sm text-muted-foreground mb-4">
                Imposta chi non può regalare a chi (es. coppie, familiari)
              </p>
              <ExclusionManager
                participants={participants}
                exclusions={exclusions}
                onAddExclusion={addExclusion}
                onRemoveExclusion={removeExclusion}
              />
            </div>
          </section>
        )}

        {/* Draw Section */}
        {participants.length >= 2 && (
          <section className="text-center">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-border shadow-card">
              {!assignments ? (
                <>
                  <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
                  <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                    Pronto per il sorteggio?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {participants.length} partecipanti, {exclusions.length} esclusioni
                  </p>
                  <Button 
                    variant="gold" 
                    size="lg" 
                    onClick={performDraw}
                    className="min-w-[200px]"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Effettua Sorteggio
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                    Sorteggio completato!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Gli abbinamenti sono pronti. Invia le email per notificare tutti i partecipanti.
                  </p>
                  
                  {!emailsSent ? (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        variant="gold" 
                        size="lg" 
                        onClick={sendEmails}
                        disabled={isSending}
                        className="min-w-[200px]"
                      >
                        {isSending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin mr-2" />
                            Invio in corso...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Invia Email
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={performDraw}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Nuovo Sorteggio
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-500">
                        <CheckCircle className="w-5 h-5" />
                        <span>Tutte le email sono state inviate!</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => {
                          setAssignments(null);
                          setEmailsSent(false);
                        }}
                      >
                        Ricomincia
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-border flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Come funziona</p>
            <p>Ogni partecipante riceverà un'email con il nome della persona a cui deve fare il regalo. Nessuno conoscerà gli abbinamenti degli altri!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
