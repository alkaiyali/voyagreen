import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, C, F, ScoreBadge, T } from '@/components/ui';
import { Icon, LeafPin } from '@/components/icons';
import { DestPhoto } from '@/components/photo';
import { dest, score, useTrip } from '@/lib/trip';

export default function Trips() {
  const { trips } = useTrip();
  const swaps = trips.filter((t) => t.id !== t.from);
  const avoided = swaps.reduce((n, t) => n + score(dest(t.from)) - score(dest(t.id)), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <T.H1>My trips</T.H1>
        {trips.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyArt}><LeafPin size={72} color={C.accent300} /></View>
            <T.H2 style={{ fontSize: 20, textAlign: 'center' }}>No trips yet</T.H2>
            <T.Muted style={{ textAlign: 'center', marginTop: 6, marginBottom: 20, maxWidth: 280 }}>Check a destination’s pressure, then save the itinerary you like. It lands here.</T.Muted>
            <Button title="Find a place" icon="arrow" onPress={() => router.navigate('/explore')} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : (
          <>
            {swaps.length > 0 && (
              <View style={s.impact} accessible accessibilityLabel={`${avoided} pressure points avoided across ${swaps.length} greener swap${swaps.length > 1 ? 's' : ''}`}>
                <Icon name="down" size={22} color={C.success} />
                <T.Num style={{ fontSize: 30, color: C.success }}>{avoided}</T.Num>
                <T.Body style={{ flex: 1, fontSize: 13, lineHeight: 18, color: C.success, fontFamily: F.bold }}>
                  pressure points avoided across {swaps.length} greener swap{swaps.length > 1 ? 's' : ''}
                </T.Body>
              </View>
            )}
            {trips.map((t) => {
              const d = dest(t.id), o = dest(t.from), swapped = t.id !== t.from, sc = score(d);
              return (
                <Pressable key={t.id} style={({ pressed }) => [s.card, pressed && { opacity: 0.75 }]}
                  onPress={() => router.push(swapped ? `/trip/${t.id}?from=${t.from}` : `/trip/${t.id}`)}
                  accessibilityRole="button" accessibilityLabel={`${d.name}, ${t.days} days${swapped ? `, instead of ${o.name}, ${score(o) - sc} points lower` : ''}. Pressure ${sc}`}>
                  <DestPhoto id={t.id} style={s.thumb} pinSize={20} />
                  <View style={{ flex: 1 }}>
                    <T.Body style={{ fontFamily: F.bold, fontSize: 17 }}>{d.name}</T.Body>
                    <T.Muted style={{ fontSize: 13 }}>{t.days} day{t.days > 1 ? 's' : ''} · {d.province}</T.Muted>
                    {swapped && (
                      <View style={s.swap}>
                        <Icon name="leaf" size={14} color={C.success} />
                        <T.Body style={{ fontSize: 12, fontFamily: F.bold, color: C.success }}>Instead of {o.name} · −{score(o) - sc}</T.Body>
                      </View>
                    )}
                  </View>
                  <ScoreBadge value={sc} />
                  <Icon name="chevron" size={18} color={C.textMuted} />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyArt: { width: 140, height: 140, borderRadius: 99, backgroundColor: C.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  impact: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginTop: 16, borderRadius: 18, backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginTop: 12, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
});
