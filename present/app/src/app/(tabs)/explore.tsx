import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, DemoBadge, F, Pill, T } from '@/components/ui';
import { Icon, LeafPin } from '@/components/icons';
import { DESTINATIONS, PICKS } from '@/data/destinations';
import { level, score, useTrip } from '@/lib/trip';

// Cover art is procedural (no stock photos): a ramp gradient + the pin.
const COVERS: [string, string][] = [
  [C.accent700, C.accent400], [C.accent800, C.accent500], [C.accent600, C.accent300], [C.accent900, C.accent600], [C.accent700, C.accent300],
];

export default function Explore() {
  const { name, interests } = useTrip();
  const [q, setQ] = useState('');
  const picks = PICKS.filter((id) => {
    const d = DESTINATIONS[id];
    return !q || `${d.name} ${d.province}`.toLowerCase().includes(q.toLowerCase());
  });
  const greener = PICKS.map((id) => DESTINATIONS[id].alt!).filter((id) =>
    !interests.length || DESTINATIONS[id].vibe.some((v) => interests.includes(v)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.pad}>
        <View style={s.head}>
          <View>
            <T.Muted>Magandang araw,</T.Muted>
            <T.H2 style={{ fontSize: 24 }}>{name || 'traveler'}</T.H2>
          </View>
          <DemoBadge />
        </View>

        <View style={s.search}>
          <Icon name="search" size={18} color={C.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Where are you headed?" placeholderTextColor={C.textFaint} style={s.searchInput} />
        </View>

        <T.Label style={s.section}>Popular right now</T.Label>
        {picks.map((id, k) => {
          const d = DESTINATIONS[id];
          return (
            <Pressable key={id} onPress={() => router.push(`/destination/${id}`)} style={({ pressed }) => [s.row, pressed && { opacity: 0.9 }]}>
              <LinearGradient colors={COVERS[k % COVERS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.thumb}>
                <LeafPin size={30} color={C.surface} leaf={COVERS[k % COVERS.length][0]} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <T.Body style={{ fontFamily: F.bold, fontSize: 17 }}>{d.name}</T.Body>
                <T.Muted style={{ fontSize: 13 }}>{d.province}</T.Muted>
                <T.Muted style={{ fontSize: 12, marginTop: 2 }} numberOfLines={1}>{d.vibe.slice(0, 3).join(' · ')}</T.Muted>
              </View>
              <View style={s.check}>
                <T.Label style={{ fontSize: 9, color: C.accentText }}>Check</T.Label>
                <Icon name="arrow" size={16} color={C.accentText} />
              </View>
            </Pressable>
          );
        })}

        <T.Label style={s.section}>Greener picks for your vibe</T.Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {greener.map((id, k) => {
            const d = DESTINATIONS[id], lv = level(score(d));
            return (
              <Pressable key={id} onPress={() => router.push(`/destination/${id}`)} style={s.card}>
                <LinearGradient colors={COVERS[(k + 2) % COVERS.length]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.cardArt}>
                  <LeafPin size={44} color={C.surface} leaf={COVERS[(k + 2) % COVERS.length][0]} />
                </LinearGradient>
                <View style={{ padding: 12, gap: 4 }}>
                  <T.Body style={{ fontFamily: F.bold }} numberOfLines={1}>{d.name}</T.Body>
                  <T.Muted style={{ fontSize: 12 }} numberOfLines={1}>{d.province}</T.Muted>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}><Pill t={lv.tone} label={lv.label} icon="check" /></View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 32 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  searchInput: { flex: 1, fontFamily: F.medium, fontSize: 15, color: C.text, paddingVertical: 14 },
  section: { marginTop: 26, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingRight: 14, marginBottom: 10, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  thumb: { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  check: { alignItems: 'center', gap: 2 },
  card: { width: 180, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardArt: { height: 100, alignItems: 'center', justifyContent: 'center' },
});
