export type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
  occurredAt?: string;
};

export type Team = {
  _id?: string;
  name: string;
  mascot: string;
  members: string[];
};

export type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export type WorkoutSuggestion = {
  title: string;
  focus?: string;
  reason: string;
};
