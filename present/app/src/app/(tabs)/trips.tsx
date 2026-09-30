import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, C, F, Pill, T } from '@/components/ui';
import { Icon, LeafPin } from '@/components/icons';
import { dest, level, score, useTrip } from '@/lib/trip';

export default function Trips() {
  const { trips } = useTrip();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <T.H1>My trips</T.H1>
        {trips.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyArt}><LeafPin size={72} color={C.accent300} /></View>
            <T.H2 style={{ fontSize: 20, textAlign: 'center' }}>No trips yet</T.H2>
            <T.Muted style={{ textAlign: 'center', marginTop: 6, marginBottom: 20 }}>Check a destination’s pressure and save the itinerary you like.</T.Muted>
            <Button title="Explore destinations" icon="arrow" onPress={() => router.replace('/explore')} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : trips.map((t) => {
          const d = dest(t.id), o = dest(t.from), swapped = t.id !== t.from, lv = level(score(d));
          return (
            <Pressable key={t.id} style={s.card} onPress={() => router.push(swapped ? `/trip/${t.id}?from=${t.from}` : `/trip/${t.id}`)}>
              <LeafPin size={34} />
              <View style={{ flex: 1 }}>
                <T.Body style={{ fontFamily: F.bold, fontSize: 17 }}>{d.name}</T.Body>
                <T.Muted style={{ fontSize: 13 }}>{t.days} days{swapped ? ` · instead of ${o.name}` : ''}</T.Muted>
                <View style={{ flexDirection: 'row', marginTop: 8 }}><Pill t={lv.tone} label={lv.label} /></View>
              </View>
              {swapped && <T.Num style={{ fontSize: 22, color: C.accentText }}>−{score(o) - score(d)}</T.Num>}
              <Icon name="arrow" size={18} color={C.textMuted} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyArt: { width: 140, height: 140, borderRadius: 99, backgroundColor: C.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginTop: 14, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
});
