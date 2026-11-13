import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Team = { name: string; mascot?: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiData<TeamsResponse>('/api/teams');
  const teams = data?.teams ?? [];

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={!loading && !error && teams.length === 0}
      emptyMessage="No teams yet."
    >
      <ul>
        {teams.map((team) => (
          <li key={team.name}>
            {team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members.length} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
