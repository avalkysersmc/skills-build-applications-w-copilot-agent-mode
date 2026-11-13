import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutsResponse = { suggestions: Workout[] };

export default function Workouts() {
  const userEmail = 'mona@example.com';
  const path = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;
  const { data, loading, error } = useApiData<WorkoutsResponse>(path);
  const suggestions = data?.suggestions ?? [];

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={!loading && !error && suggestions.length === 0}
      emptyMessage="No workout suggestions available."
    >
      <ul>
        {suggestions.map((workout) => (
          <li key={workout.title}>
            <strong>{workout.title}</strong> — {workout.focus}, {workout.minutes} minutes ({workout.difficulty}). {workout.reason}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
