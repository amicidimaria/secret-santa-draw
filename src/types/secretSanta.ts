export interface Participant {
  id: string;
  name: string;
  email: string;
}

export interface Exclusion {
  id: string;
  fromId: string;
  toId: string;
}

export interface Assignment {
  giver: Participant;
  receiver: Participant;
}
