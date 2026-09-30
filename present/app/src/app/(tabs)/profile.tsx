import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, C, DaysStepper, InterestPicker, T } from '@/components/ui';
import { LeafPin } from '@/components/icons';
import { dest, score, useTrip } from '@/lib/trip';

export default function Profile() {
  const { name, interests, toggleInterest, days, setDays, trips } = useTrip();
  const swaps = trips.filter((t) => t.id !== t.from);
  const points = swaps.reduce((n, t) => n + score(dest(t.from)) - score(dest(t.id)), 0);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View style={s.head}>
          <View style={s.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <T.H2 style={{ color: C.accentFg }}>{(name || 'T')[0].toUpperCase()}</T.H2>
          </View>
          <T.H1 style={{ fontSize: 28, lineHeight: 32, flex: 1 }}>{name || 'Traveler'}</T.H1>
        </View>

        <View style={s.stats}>
          <Stat n={trips.length} label="saved trips" />
          <Stat n={swaps.length} label="greener swaps" />
          <Stat n={points} label="pressure points avoided" accent />
        </View>

        <T.H2 style={s.section} accessibilityRole="header">Trip preferences</T.H2>
        <T.Label style={{ marginBottom: 10 }}>What you love</T.Label>
        <InterestPicker value={interests} onToggle={toggleInterest} />
        <T.Label style={{ marginTop: 20, marginBottom: 10 }}>Usual trip length</T.Label>
        <DaysStepper value={days} onChange={setDays} />

        <View style={s.about}>
          <LeafPin size={28} />
          <T.Muted style={{ flex: 1, fontSize: 13 }}>Pressure scores in this demo are illustrative values built from visitor density, carrying capacity, environmental strain and peak crowding.</T.Muted>
        </View>
        <Button kind="ghost" title="Replay welcome" onPress={() => router.replace('/')} style={{ marginTop: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <View style={s.stat} accessible accessibilityLabel={`${n} ${label}`}>
      <T.Num style={{ fontSize: 28, color: accent ? C.success : C.text }}>{n}</T.Num>
      <T.Muted style={{ fontSize: 12, lineHeight: 16 }}>{label}</T.Muted>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 99, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 22 },
  stat: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, gap: 2 },
  section: { fontSize: 20, marginTop: 28, marginBottom: 14 },
  about: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, marginTop: 28, borderRadius: 18, backgroundColor: C.surface2 },
});
