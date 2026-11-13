import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiData<LeaderboardResponse>('/api/leaderboard');
  const leaderboard = data?.leaderboard ?? [];

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={!loading && !error && leaderboard.length === 0}
      emptyMessage="No leaderboard rankings yet."
    >
      <ol>
        {leaderboard.map((entry) => (
          <li key={entry.rank}>{entry.teamName}: {entry.totalPoints} points</li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
