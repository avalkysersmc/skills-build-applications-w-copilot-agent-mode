import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';
import type { Team } from '../api/types.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const resource = useApiResource(() => getJson<TeamsResponse>('/api/teams'), '/api/teams');
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      resource={resource}
      loadingText="Loading teams…"
      errorText="Unable to load teams. Please try again."
      emptyText="No teams yet."
      isEmpty={(data) => data.teams.length === 0}
    >
      {(data) => (
        <ul className="list-unstyled mb-0">
          {data.teams.map((team, index) => (
            <li key={team._id ?? index} className="mb-2">
              <strong>{team.name}</strong> · Mascot: {team.mascot} · {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
