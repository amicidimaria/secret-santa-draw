import { Participant, Exclusion } from '@/types/secretSanta';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Ban } from 'lucide-react';
import { useState } from 'react';

interface ExclusionManagerProps {
  participants: Participant[];
  exclusions: Exclusion[];
  onAddExclusion: (fromId: string, toId: string) => void;
  onRemoveExclusion: (id: string) => void;
}

const ExclusionManager = ({ participants, exclusions, onAddExclusion, onRemoveExclusion }: ExclusionManagerProps) => {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');

  const handleAdd = () => {
    if (fromId && toId && fromId !== toId) {
      onAddExclusion(fromId, toId);
      setFromId('');
      setToId('');
    }
  };

  const getParticipantName = (id: string) => {
    return participants.find(p => p.id === id)?.name || 'Sconosciuto';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="text-sm text-muted-foreground mb-1 block">Non può regalare a</label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Seleziona persona" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center px-2">
          <Ban className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-sm text-muted-foreground mb-1 block">Questa persona</label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Seleziona persona" />
            </SelectTrigger>
            <SelectContent>
              {participants.filter(p => p.id !== fromId).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleAdd} 
          variant="outline" 
          disabled={!fromId || !toId || fromId === toId}
          className="sm:w-auto w-full"
        >
          Aggiungi
        </Button>
      </div>

      {exclusions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {exclusions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 text-sm border border-border"
            >
              <span className="text-foreground">{getParticipantName(ex.fromId)}</span>
              <Ban className="w-3 h-3 text-destructive" />
              <span className="text-foreground">{getParticipantName(ex.toId)}</span>
              <button
                onClick={() => onRemoveExclusion(ex.id)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExclusionManager;
