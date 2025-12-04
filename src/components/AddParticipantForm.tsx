import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';

interface AddParticipantFormProps {
  onAdd: (name: string, email: string) => void;
}

const AddParticipantForm = ({ onAdd }: AddParticipantFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      onAdd(name.trim(), email.trim());
      setName('');
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Nome partecipante"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-muted/50 border-border focus:border-primary"
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-muted/50 border-border focus:border-primary"
        />
        <Button type="submit" variant="festive" className="sm:w-auto w-full">
          <UserPlus className="w-4 h-4 mr-2" />
          Aggiungi
        </Button>
      </div>
    </form>
  );
};

export default AddParticipantForm;
