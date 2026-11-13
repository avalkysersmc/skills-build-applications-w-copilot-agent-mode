import { useApiResource } from '../api/useApiResource.js';
import type { WorkoutSuggestion } from '../api/types.js';
import { CapabilityCard } from './CapabilityCard.js';

type SuggestionsResponse = { suggestions: WorkoutSuggestion[] };

// Until user selection exists, suggestions are shown for a demo user.
const demoUserEmail = (import.meta.env.VITE_DEMO_USER_EMAIL as string | undefined) ?? 'mona@example.com';

export default function Workouts() {
  const resource = useApiResource<SuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`);
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      resource={resource}
      loadingText="Loading workout suggestions…"
      errorText="Unable to load workout suggestions. Please try again."
      emptyText="No workout suggestions yet."
      isEmpty={(data) => data.suggestions.length === 0}
    >
      {(data) => (
        <ul className="list-unstyled mb-0">
          {data.suggestions.map((suggestion) => (
            <li key={suggestion.title} className="mb-2">
              <strong>{suggestion.title}</strong>
              <p className="mb-0">{suggestion.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
