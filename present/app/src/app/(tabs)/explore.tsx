import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomBar, Button, C, DemoBadge, F, T } from '@/components/ui';
import { Icon } from '@/components/icons';
import { DestPhoto } from '@/components/photo';
import { DESTINATIONS, INTERESTS, PICKS } from '@/data/destinations';
import { useTrip } from '@/lib/trip';

// Demo step 1: the traveler says where they want to go. Scores stay hidden
// here on purpose — the check on the next screen is the reveal.
export default function Plan() {
  const { name, interests, days } = useTrip();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const query = q.trim().toLowerCase();
  const list = query
    ? Object.keys(DESTINATIONS).filter((id) => {
      const d = DESTINATIONS[id];
      return `${d.name} ${d.province} ${d.vibe.join(' ')}`.toLowerCase().includes(query);
    })
    : PICKS;
  const liked = INTERESTS.filter((x) => interests.includes(x.id)).map((x) => x.label);
  const chosen = sel ? DESTINATIONS[sel] : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={s.head}>
          <T.Muted style={{ flex: 1 }}>Magandang araw{name ? `, ${name}` : ''}</T.Muted>
          <DemoBadge />
        </View>
        <T.H1 style={{ marginTop: 6 }}>Where are you{'\n'}headed?</T.H1>

        <Pressable onPress={() => router.push('/setup?edit=1')} style={({ pressed }) => [s.prefs, pressed && { opacity: 0.75 }]}
          accessibilityRole="button" accessibilityLabel={`Trip: ${days} days, ${liked.join(', ') || 'no interests yet'}. Edit`}>
          <Icon name="calendar" size={18} color={C.accentText} />
          <T.Body style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
            <T.Body style={{ fontFamily: F.bold, fontSize: 14 }}>{days} day{days > 1 ? 's' : ''}</T.Body> · {liked.join(', ') || 'Add your interests'}
          </T.Body>
          <T.Body style={{ fontFamily: F.bold, fontSize: 14, color: C.accentText }}>Edit</T.Body>
        </Pressable>

        <View style={s.search}>
          <Icon name="search" size={18} color={C.textMuted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search a place, province or vibe" placeholderTextColor={C.textMuted} style={s.searchInput}
            accessibilityLabel="Search destinations" returnKeyType="search" clearButtonMode="while-editing" autoCorrect={false} />
        </View>

        <T.Label style={s.section}>{query ? `${list.length} result${list.length === 1 ? '' : 's'}` : 'Popular destinations'}</T.Label>
        {list.length === 0 && (
          <View style={s.none}>
            <T.Body style={{ fontFamily: F.bold }}>No match for “{q}”</T.Body>
            <T.Muted style={{ fontSize: 13 }}>We cover 20 places in the Philippines so far. Try Palawan, Bohol or “surf”.</T.Muted>
          </View>
        )}
        <View style={{ gap: 10 }} accessibilityRole="radiogroup">
          {list.map((id) => {
            const d = DESTINATIONS[id], on = sel === id;
            return (
              <Pressable key={id} onPress={() => setSel(on ? null : id)} style={({ pressed }) => [s.row, on && s.rowOn, pressed && { opacity: 0.8 }]}
                accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${d.name}, ${d.province}`}>
                <DestPhoto id={id} style={s.thumb} pinSize={22} />
                <View style={{ flex: 1 }}>
                  <T.Body style={{ fontFamily: F.bold, fontSize: 17 }}>{d.name}</T.Body>
                  <T.Muted style={{ fontSize: 13 }} numberOfLines={1}>{d.province}</T.Muted>
                  <T.Muted style={{ fontSize: 12, textTransform: 'capitalize' }} numberOfLines={1}>{d.vibe.slice(0, 3).join(' · ')}</T.Muted>
                </View>
                <View style={[s.radio, on && s.radioOn]}>{on && <Icon name="check" size={14} color={C.accentFg} width={2.4} />}</View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <BottomBar inset={false}>
        {chosen ? (
          <>
            <T.Muted style={{ fontSize: 12, textAlign: 'center' }}>We’ll check its tourism pressure and find greener options with the same vibe.</T.Muted>
            <Button title={`Check ${chosen.name}`} icon="arrow" onPress={() => router.push(`/destination/${sel}`)} style={{ marginTop: 8 }} />
          </>
        ) : (
          <Button title="Pick a destination" disabled />
        )}
      </BottomBar>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 24 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  prefs: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.accent50 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.textFaint },
  searchInput: { flex: 1, fontFamily: F.medium, fontSize: 15, color: C.text, paddingVertical: 13 },
  section: { marginTop: 24, marginBottom: 10 },
  none: { padding: 16, borderRadius: 20, backgroundColor: C.surface2, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 14, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  rowOn: { borderColor: C.accent, borderWidth: 2, backgroundColor: C.accent50 },
  thumb: { width: 60, height: 60, borderRadius: 14 },
  radio: { width: 24, height: 24, borderRadius: 99, borderWidth: 2, borderColor: C.textFaint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: C.accent, borderColor: C.accent },
});
