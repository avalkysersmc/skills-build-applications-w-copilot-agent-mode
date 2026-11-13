import { Activity, Team, User, Workout } from '../models/index.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

// Activity types map to the workout focus they train.
const focusByActivityType: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  swim: 'endurance',
  walk: 'mobility',
  yoga: 'mobility',
  strength: 'strength',
  lift: 'strength',
};

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(400, `${field} is required`);
  }
  return value.trim();
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: any) {
  const { userId, teamId, type, minutes, occurredAt } = input ?? {};
  if (!isObjectId(userId)) throw httpError(400, 'userId must be a valid ID');
  if (!isObjectId(teamId)) throw httpError(400, 'teamId must be a valid ID');
  const activityType = requireText(type, 'type');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'minutes must be a positive number');
  }
  let occurred = new Date();
  if (occurredAt !== undefined) {
    occurred = new Date(occurredAt);
    if (Number.isNaN(occurred.getTime())) throw httpError(400, 'occurredAt must be a valid date');
  }

  const [user, team] = await Promise.all([User.findById(userId).lean(), Team.findById(teamId).lean()]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');
  if (String(user.team) !== String(team._id)) throw httpError(400, 'User is not a member of that team');

  // One point per minute, matching the seed data.
  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: activityType,
    minutes,
    points: minutes,
    occurredAt: occurred,
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: any) {
  const name = requireText(input?.name, 'name');
  const mascot = requireText(input?.mascot, 'mascot');
  const memberIds: unknown[] = input?.members ?? [];
  if (!Array.isArray(memberIds) || !memberIds.every(isObjectId)) {
    throw httpError(400, 'members must be a list of valid IDs');
  }
  const uniqueMemberIds = [...new Set(memberIds as string[])];
  if (uniqueMemberIds.length > 0) {
    const found = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
    if (found !== uniqueMemberIds.length) throw httpError(400, 'members must reference existing users');
  }

  try {
    const team = await Team.create({ name, mascot, members: uniqueMemberIds });
    if (uniqueMemberIds.length > 0) {
      // Keep both sides of the membership in sync, as the seed script does.
      const previousTeams = await User.find({ _id: { $in: uniqueMemberIds }, team: { $ne: null } }).select('team').lean();
      const previousTeamIds = [...new Set(previousTeams.map((user) => String(user.team)))].filter((id) => id !== String(team._id));
      if (previousTeamIds.length > 0) {
        await Team.updateMany({ _id: { $in: previousTeamIds } }, { $pull: { members: { $in: uniqueMemberIds } } });
      }
      await User.updateMany({ _id: { $in: uniqueMemberIds } }, { $set: { team: team._id } });
    }
    return team.toObject();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw httpError(409, 'A team with that name already exists');
    throw error;
  }
}

export async function getLeaderboard() {
  const [totals, teams] = await Promise.all([
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
    Team.find().lean(),
  ]);
  const totalsByTeam = new Map(totals.map((row) => [String(row._id), row.totalPoints]));
  const sorted = teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(String(team._id)) ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName));

  // Competition ranking: tied teams share a rank and the next rank skips ahead (1, 1, 3).
  let rank = 0;
  let previousTotal: number | undefined;
  return sorted.map((entry, index) => {
    if (entry.totalPoints !== previousTotal) {
      rank = index + 1;
      previousTotal = entry.totalPoints;
    }
    return { ...entry, rank };
  });
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'No user found for that email');

  const recent = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentFocus = recent ? focusByActivityType[recent.type] : undefined;
  const workouts = await Workout.find().lean();

  const ranked = workouts
    .map((workout) => {
      if (workout.focus === user.fitnessGoal) {
        const activityNote = recent && recentFocus === workout.focus ? ` and your recent ${recent.type} activity` : '';
        return { workout, priority: 0, reason: `Matches your ${user.fitnessGoal} goal${activityNote}` };
      }
      if (recent && workout.focus === recentFocus) {
        return { workout, priority: 1, reason: `Matches your recent ${recent.type} activity` };
      }
      return null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.priority - b.priority || a.workout.title.localeCompare(b.workout.title));

  const suggestions = ranked.length > 0
    ? ranked
    : workouts.map((workout) => ({ workout, priority: 2, reason: 'A general option to round out your routine' }));

  return suggestions.map(({ workout, reason }) => ({
    title: workout.title,
    focus: workout.focus,
    minutes: workout.minutes,
    difficulty: workout.difficulty,
    reason,
  }));
}

export { User };
