import { View, Text } from 'react-native';
import type { RunPoint } from '../services/runTracking';

type Props = { points: RunPoint[] };

export default function RouteTrace({ points }: Props) {
  if (points.length < 2) {
    return (
      <View className="h-48 rounded-card bg-surface border border-border items-center justify-center">
        <Text className="text-muted">GPS route will appear here</Text>
        <Text className="text-muted text-xs mt-2">Move outdoors for a stronger GPS signal.</Text>
      </View>
    );
  }

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = Math.max(maxLat - minLat, 0.00001);
  const lngRange = Math.max(maxLng - minLng, 0.00001);

  return (
    <View className="h-48 rounded-card bg-surface border border-border overflow-hidden p-3">
      <View className="flex-1 bg-background rounded-control overflow-hidden">
        {points.map((point, index) => {
          const left = ((point.longitude - minLng) / lngRange) * 88 + 6;
          const top = (1 - (point.latitude - minLat) / latRange) * 82 + 6;
          return (
            <View
              key={`${point.timestamp}-${index}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-accent"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        })}
        <Text className="absolute bottom-2 left-2 text-muted text-[10px]">ROUTE TRACE • {points.length} GPS points</Text>
      </View>
    </View>
  );
}
