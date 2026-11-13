import { Activity, Team, User, Workout } from '../models/index.js';

type RecordInput = Record<string, unknown>;

function isRecord(input: unknown): input is RecordInput {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw httpError(400, `${field} is required`);
  }
  return value.trim();
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');

  const { userId, teamId } = input;
  const type = requiredString(input.type, 'type');
  const minutes = input.minutes;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw httpError(400, 'Valid userId and teamId are required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');

  const name = requiredString(input.name, 'name');
  const mascot = requiredString(input.mascot, 'mascot');
  const memberIds = input.members ?? [];
  if (!Array.isArray(memberIds) || memberIds.some((memberId) => !isObjectId(memberId))) {
    throw httpError(400, 'members must be an array of valid user IDs');
  }

  const members = memberIds.length > 0
    ? await User.find({ _id: { $in: memberIds } }).select('_id')
    : [];
  if (members.length !== memberIds.length) throw httpError(404, 'One or more team members were not found');

  return Team.create({ name, mascot, members: members.map((member) => member._id) });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const normalizedType = type.toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking'].includes(normalizedType)) return 'endurance';
  return normalizedType;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const workouts = await Workout.find().lean();
  const goal = user.fitnessGoal.trim().toLowerCase();
  const activityFocuses = recentActivities.map((activity) => ({
    focus: focusForActivity(activity.type),
    type: activity.type,
  }));
  const rankedFocuses = [goal, ...activityFocuses.map(({ focus }) => focus)]
    .filter((focus, index, focuses) => focus && focuses.indexOf(focus) === index);

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const focusIndex = rankedFocuses.indexOf(focus);
      if (focusIndex === -1) return null;
      const reason = focusIndex === 0
        ? `Recommended to support your ${user.fitnessGoal} goal.`
        : `Recommended based on your recent ${activityFocuses.find((activity) => activity.focus === focus)?.type ?? focus} activity.`;
      return { ...workout, reason, focusIndex };
    })
    .filter((workout): workout is NonNullable<typeof workout> => workout !== null)
    .sort((left, right) => left.focusIndex - right.focusIndex)
    .map(({ focusIndex: _focusIndex, ...workout }) => workout);
}

export { User };
