import { Participant, Exclusion, Assignment } from '@/types/secretSanta';

export function generateAssignments(
  participants: Participant[],
  exclusions: Exclusion[]
): Assignment[] | null {
  const n = participants.length;
  if (n < 2) return null;

  // Create adjacency list of valid assignments
  const validReceivers: Map<string, Set<string>> = new Map();
  
  for (const giver of participants) {
    const valid = new Set<string>();
    for (const receiver of participants) {
      if (giver.id !== receiver.id) {
        const isExcluded = exclusions.some(
          ex => ex.fromId === giver.id && ex.toId === receiver.id
        );
        if (!isExcluded) {
          valid.add(receiver.id);
        }
      }
    }
    validReceivers.set(giver.id, valid);
  }

  // Try to find a valid assignment using backtracking
  const assignments: Assignment[] = [];
  const usedReceivers = new Set<string>();
  const participantsCopy = [...participants];

  // Shuffle for randomness
  for (let i = participantsCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participantsCopy[i], participantsCopy[j]] = [participantsCopy[j], participantsCopy[i]];
  }

  function backtrack(index: number): boolean {
    if (index === n) return true;

    const giver = participantsCopy[index];
    const valid = validReceivers.get(giver.id)!;
    const candidates = Array.from(valid).filter(id => !usedReceivers.has(id));

    // Shuffle candidates for randomness
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (const receiverId of candidates) {
      usedReceivers.add(receiverId);
      const receiver = participants.find(p => p.id === receiverId)!;
      assignments.push({ giver, receiver });

      if (backtrack(index + 1)) return true;

      assignments.pop();
      usedReceivers.delete(receiverId);
    }

    return false;
  }

  if (backtrack(0)) {
    return assignments;
  }

  return null;
}
