import { Participant } from '@/types/secretSanta';
import { Button } from '@/components/ui/button';
import { Trash2, User, Mail } from 'lucide-react';

interface ParticipantCardProps {
  participant: Participant;
  onRemove: (id: string) => void;
  index: number;
}

const ParticipantCard = ({ participant, onRemove, index }: ParticipantCardProps) => {
  return (
    <div 
      className="bg-gradient-card rounded-lg p-4 shadow-card border border-border/50 hover:border-primary/30 transition-all duration-300 group"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-festive flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{participant.name}</p>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {participant.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(participant.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ParticipantCard;
