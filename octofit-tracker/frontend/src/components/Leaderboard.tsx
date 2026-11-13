import { useApiResource } from '../api/useApiResource.js';
import type { LeaderboardEntry } from '../api/types.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const resource = useApiResource<LeaderboardResponse>('/api/leaderboard');
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      resource={resource}
      loadingText="Loading leaderboard…"
      errorText="Unable to load the leaderboard. Please try again."
      emptyText="No rankings yet."
      isEmpty={(data) => data.leaderboard.length === 0}
    >
      {(data) => (
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Team</th>
              <th scope="col">Points</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((entry) => (
              <tr key={entry.teamName}>
                <td>{entry.rank}</td>
                <td>{entry.teamName}</td>
                <td>{entry.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CapabilityCard>
  );
}
