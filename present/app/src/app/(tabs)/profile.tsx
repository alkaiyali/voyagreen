import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, C, Chip, F, T } from '@/components/ui';
import { LeafPin } from '@/components/icons';
import { INTERESTS } from '@/data/destinations';
import { dest, score, useTrip } from '@/lib/trip';

export default function Profile() {
  const { name, interests, toggleInterest, days, trips } = useTrip();
  const swaps = trips.filter((t) => t.id !== t.from);
  const points = swaps.reduce((n, t) => n + score(dest(t.from)) - score(dest(t.id)), 0);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.head}>
          <View style={s.avatar}><T.H2 style={{ color: C.accentFg }}>{(name || 'T')[0].toUpperCase()}</T.H2></View>
          <View>
            <T.H2>{name || 'Traveler'}</T.H2>
            <T.Muted>Usually travels {days} days</T.Muted>
          </View>
        </View>

        <View style={s.stats}>
          <View style={s.stat}><T.Num style={{ fontSize: 28 }}>{trips.length}</T.Num><T.Muted style={{ fontSize: 12 }}>saved trips</T.Muted></View>
          <View style={s.stat}><T.Num style={{ fontSize: 28 }}>{swaps.length}</T.Num><T.Muted style={{ fontSize: 12 }}>greener swaps</T.Muted></View>
          <View style={s.stat}><T.Num style={{ fontSize: 28, color: C.accentText }}>{points}</T.Num><T.Muted style={{ fontSize: 12 }}>pressure points avoided</T.Muted></View>
        </View>

        <T.Label style={{ marginTop: 26, marginBottom: 10 }}>Your interests</T.Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {INTERESTS.map((x) => <Chip key={x.id} label={x.label} on={interests.includes(x.id)} onPress={() => toggleInterest(x.id)} />)}
        </View>

        <View style={s.about}>
          <LeafPin size={28} />
          <T.Muted style={{ flex: 1, fontSize: 13 }}>Pressure scores in this demo are illustrative values built from visitor density, carrying capacity, environmental strain and peak crowding.</T.Muted>
        </View>
        <Button kind="ghost" title="Replay onboarding" onPress={() => router.replace('/')} style={{ marginTop: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 99, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 22 },
  stat: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, gap: 2 },
  about: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, marginTop: 26, borderRadius: 18, backgroundColor: C.surface2 },
});
