import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';
import type { Activity } from '../api/types.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const resource = useApiResource(() => getJson<ActivitiesResponse>('/api/activities'), '/api/activities');
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      resource={resource}
      loadingText="Loading activities…"
      errorText="Unable to load activities. Please try again."
      emptyText="No activities logged yet."
      isEmpty={(data) => data.activities.length === 0}
    >
      {(data) => (
        <ul className="list-unstyled mb-0">
          {data.activities.map((activity, index) => (
            <li key={activity._id ?? index} className="mb-2">
              <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
              {activity.occurredAt && <> · {new Date(activity.occurredAt).toLocaleDateString()}</>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
