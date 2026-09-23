import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import RouteTrace from '../src/components/RouteTrace';
import {
  cancelRunTracking,
  clearFinishedRun,
  finishRunTracking,
  getElapsedMs,
  getRunSession,
  pauseRunTracking,
  requestRunPermissions,
  resumeRunTracking,
  startRunTracking,
  type RunSession,
} from '../src/services/runTracking';

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return [h, m, s]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

function paceSeconds(distanceMeters: number, elapsedMs: number) {
  if (distanceMeters < 10 || elapsedMs < 1000) {
    return null;
  }

  return (elapsedMs / 1000) / (distanceMeters / 1000);
}

function formatPace(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) {
    return '--:--';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function estimateCalories(distanceMeters: number, weightKg: number) {
  // Running estimate: approximately 1 kcal/kg/km.
  return Math.max(0, (distanceMeters / 1000) * weightKg);
}

export default function RunScreen() {
  const [session, setSession] = useState<RunSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [weightKg, setWeightKg] = useState(70);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const refresh = useCallback(async () => {
    const next = await getRunSession();
    setSession(next);

    if (next) {
      const { data } = await supabase
        .from('profiles')
        .select('weight_kg')
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .maybeSingle();

      if (data?.weight_kg != null) {
        setWeightKg(Number(data.weight_kg));
      }
    }
  }, []);

  useEffect(() => {
    void refresh();

    const interval = setInterval(() => {
      setNow(Date.now());
      void refresh();
    }, 1000);

    const subscription = AppState.addEventListener('change', () => {
      void refresh();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  const elapsed = session ? getElapsedMs(session, now) : 0;
  const distanceKm = (session?.distanceMeters ?? 0) / 1000;

  const pace = session
    ? paceSeconds(session.distanceMeters, elapsed)
    : null;

  const speedKmh = pace ? 3600 / pace : 0;

  const calories = estimateCalories(
    session?.distanceMeters ?? 0,
    weightKg
  );

  const start = async () => {
    try {
      setLoading(true);

      const permission = await requestRunPermissions();

      if (!permission.granted) {
        Alert.alert(
          'Location permission needed',
          permission.reason === 'background-denied'
            ? 'Background location is required so your active run can continue when the screen is locked or the app is minimized. Enable it in Settings.'
            : 'Primal Champion needs location permission to record your run.'
        );

        return;
      }

      await startRunTracking();
      await refresh();
    } catch (error) {
      Alert.alert(
        'Could not start run',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const pause = async () => {
    try {
      setLoading(true);
      await pauseRunTracking();
      await refresh();
    } catch (error) {
      Alert.alert(
        'Could not pause run',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resume = async () => {
    try {
      setLoading(true);
      await resumeRunTracking();
      await refresh();
    } catch (error) {
      Alert.alert(
        'Could not resume run',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (!session || loading) {
      return;
    }

    try {
      setLoading(true);
      setShowFinishConfirm(false);

      // Stop GPS tracking first, but deliberately keep the local session.
      // The local buffer is only cleared after every database write succeeds.
      const completed = await finishRunTracking();

      const elapsedMs = getElapsedMs(completed);
      const elapsedSeconds = Math.max(
        1,
        Math.round(elapsedMs / 1000)
      );

      const averagePace = paceSeconds(
        completed.distanceMeters,
        elapsedMs
      );

      const completedCalories = estimateCalories(
        completed.distanceMeters,
        weightKg
      );

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const userId = authData.user?.id;

      if (!userId) {
        throw new Error('You are not signed in.');
      }

      // Read previous runs so we can calculate personal-best flags.
      const {
        data: previousRuns,
        error: previousError,
      } = await supabase
        .from('workouts')
        .select('distance_meters, avg_pace_seconds')
        .eq('user_id', userId)
        .eq('type', 'run')
        .not('completed_at', 'is', null)
        .limit(500);

      if (previousError) {
        throw previousError;
      }

      const previousBestDistance = Math.max(
        0,
        ...(previousRuns ?? []).map((run) =>
          Number(run.distance_meters ?? 0)
        )
      );

      const previousBestPaces = (previousRuns ?? [])
        .map((run) => Number(run.avg_pace_seconds ?? Infinity))
        .filter(Number.isFinite);

      const previousBestPace =
        previousBestPaces.length > 0
          ? Math.min(...previousBestPaces)
          : Infinity;

      const isDistancePB =
        completed.distanceMeters > previousBestDistance &&
        completed.distanceMeters >= 5000;

      const isPacePB =
        averagePace != null &&
        averagePace < previousBestPace &&
        completed.distanceMeters >= 1000;

      const personalBest = isDistancePB || isPacePB;

      // Save the workout first.
      const {
        data: workout,
        error: workoutError,
      } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          type: 'run',
          started_at: new Date(
            completed.startedAt
          ).toISOString(),
          completed_at: new Date().toISOString(),
          duration_seconds: elapsedSeconds,
          distance_meters: completed.distanceMeters,
          avg_pace_seconds: averagePace,
          calories: completedCalories,

          // IMPORTANT:
          // Final competition points are NOT trusted from the phone.
          // Segment 07 will calculate authoritative points server-side.
          score: 0,

          metadata: {
            source: 'gps_run',
            gps_point_count: completed.points.length,
            personal_best: personalBest,
            distance_pb: isDistancePB,
            pace_pb: isPacePB,
            scoring_status: 'pending_segment_07',
          },
        })
        .select('id')
        .single();

      if (workoutError) {
        throw workoutError;
      }

      // Save GPS points in batches.
      const batchSize = 200;

      for (
        let i = 0;
        i < completed.points.length;
        i += batchSize
      ) {
        const batch = completed.points
          .slice(i, i + batchSize)
          .map((point) => ({
            workout_id: workout.id,
            user_id: userId,
            latitude: point.latitude,
            longitude: point.longitude,
            altitude: point.altitude,
            accuracy: point.accuracy,
            speed: point.speed,
            recorded_at: new Date(
              point.timestamp
            ).toISOString(),
          }));

        if (batch.length === 0) {
          continue;
        }

        const { error: gpsError } = await supabase
          .from('gps_points')
          .insert(batch);

        if (gpsError) {
          throw gpsError;
        }
      }

      // Only clear the local session after the workout and
      // all GPS points have successfully reached Supabase.
      await clearFinishedRun();

      Alert.alert(
        personalBest
          ? 'PERSONAL BEST 🏆'
          : 'RUN COMPLETE',
        `${(completed.distanceMeters / 1000).toFixed(2)} km • ${formatTime(
          elapsedMs
        )}\n\nGPS points saved: ${completed.points.length}\n\nYour final competition points will be calculated by the server scoring engine.`,
        [
          {
            text: 'Back to Arena',
            onPress: () => router.replace('/home'),
          },
        ]
      );
    } catch (error) {
      console.error('RUN FINISH ERROR:', error);

      Alert.alert(
        'Could not save run',
        error instanceof Error
          ? error.message
          : 'The run could not be saved. Your local run buffer has been preserved so the data can be recovered.'
      );

      // IMPORTANT:
      // Do not clear the local run session when saving fails.
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    try {
      setLoading(true);
      setShowFinishConfirm(false);
      await cancelRunTracking();
      await refresh();
    } catch (error) {
      Alert.alert(
        'Could not discard run',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      ['DISTANCE', `${distanceKm.toFixed(2)} km`],
      ['PACE', `${formatPace(pace)} /km`],
      ['SPEED', `${speedKmh.toFixed(1)} km/h`],
      ['CALORIES', `${Math.round(calories)} kcal`],
    ],
    [distanceKm, pace, speedKmh, calories]
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pt-14 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-muted text-xs tracking-widest">
        GPS RUN
      </Text>

      <Text className="text-text text-4xl font-bold mt-2">
        Own the road.
      </Text>

      <Text className="text-muted mt-2">
        Location is recorded only while an active run is in progress.
      </Text>

      <View className="bg-surface border border-border rounded-card p-6 mt-6">
        <Text className="text-muted text-xs tracking-widest">
          ELAPSED
        </Text>

        <Text className="text-text text-5xl font-bold mt-2">
          {formatTime(elapsed)}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-3 mt-4">
        {stats.map(([label, value]) => (
          <View
            key={label}
            className="bg-surface border border-border rounded-control p-4 w-[47%]"
          >
            <Text className="text-muted text-[10px] tracking-widest">
              {label}
            </Text>

            <Text className="text-text text-xl font-bold mt-1">
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-4">
        <RouteTrace points={session?.points ?? []} />
      </View>

      {!session ? (
        <Pressable
          disabled={loading}
          onPress={start}
          className="bg-accent rounded-control py-4 items-center mt-5"
        >
          <Text className="text-background font-bold">
            {loading ? 'PREPARING GPS…' : 'START RUN'}
          </Text>
        </Pressable>
      ) : session.status === 'running' ? (
        <View className="flex-row gap-3 mt-5">
          <Pressable
            disabled={loading}
            onPress={pause}
            className="flex-1 bg-surface border border-border rounded-control py-4 items-center"
          >
            <Text className="text-text font-bold">
              {loading ? 'PLEASE WAIT…' : 'PAUSE'}
            </Text>
          </Pressable>

          <Pressable
            disabled={loading}
            onPress={() => setShowFinishConfirm(true)}
            className="flex-1 bg-accent rounded-control py-4 items-center"
          >
            <Text className="text-background font-bold">
              FINISH
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-3 mt-5">
          <Pressable
            disabled={loading}
            onPress={resume}
            className="flex-1 bg-accent rounded-control py-4 items-center"
          >
            <Text className="text-background font-bold">
              RESUME
            </Text>
          </Pressable>

          <Pressable
            disabled={loading}
            onPress={() => setShowFinishConfirm(true)}
            className="flex-1 bg-surface border border-border rounded-control py-4 items-center"
          >
            <Text className="text-text font-bold">
              FINISH
            </Text>
          </Pressable>
        </View>
      )}

      {showFinishConfirm && session && (
        <View className="bg-surface border border-border rounded-card p-5 mt-5">
          <Text className="text-text text-xl font-bold">
            Finish this run?
          </Text>

          <Text className="text-muted mt-2">
            Your GPS route and workout data will be saved to Supabase.
            The local run data will only be cleared after saving succeeds.
          </Text>

          <View className="flex-row gap-3 mt-5">
            <Pressable
              disabled={loading}
              onPress={() => setShowFinishConfirm(false)}
              className="flex-1 bg-surface border border-border rounded-control py-4 items-center"
            >
              <Text className="text-text font-bold">
                KEEP RUNNING
              </Text>
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={finish}
              className="flex-1 bg-accent rounded-control py-4 items-center"
            >
              <Text className="text-background font-bold">
                {loading ? 'SAVING…' : 'CONFIRM FINISH'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {session && (
        <Pressable
          disabled={loading}
          onPress={cancel}
          className="items-center mt-4 py-2"
        >
          <Text className="text-muted text-xs">
            DISCARD RUN
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}