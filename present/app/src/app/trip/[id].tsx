import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bar, Button, C, DemoBadge, F, T, tone } from '@/components/ui';
import { Icon, LeafPin, type IconName } from '@/components/icons';
import { DESTINATIONS, TIPS } from '@/data/destinations';
import { buildItinerary, dest, level, score, useTrip } from '@/lib/trip';

export function generateStaticParams() {
  return Object.keys(DESTINATIONS).map((id) => ({ id }));
}

const SLOT: Record<string, { icon: IconName; label: string }> = {
  am: { icon: 'sun', label: 'Morning' }, pm: { icon: 'cloud', label: 'Afternoon' }, eve: { icon: 'moon', label: 'Evening' },
};

// Demo step 3: the itinerary, with the side-by-side pressure comparison.
export default function TripScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { days, interests, saveTrip } = useTrip();
  const [saved, setSaved] = useState(false);
  const d = dest(id), sd = score(d);
  const o = from ? dest(from) : undefined, so = o ? score(o) : 0;
  const plan = buildItinerary(d, days, interests);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={s.bar}>
        <Pressable style={s.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} accessibilityLabel="Back"><Icon name="back" /></Pressable>
        <T.Body style={{ fontFamily: F.bold, flex: 1 }} numberOfLines={1}>{d.name} · {days} day{days > 1 ? 's' : ''}</T.Body>
        <DemoBadge />
      </View>
      <ScrollView contentContainerStyle={s.pad}>
        {o ? (
          <View style={s.compare}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Col name={o.name} v={so} />
              <Icon name="arrow" size={20} color={C.textFaint} />
              <Col name={d.name} v={sd} />
            </View>
            <View style={s.big}>
              <T.Num style={{ fontSize: 56, lineHeight: 60, color: C.accentText }}>−{so - sd}</T.Num>
              <T.Body style={{ fontFamily: F.bold, fontSize: 14, lineHeight: 18 }}>points lower{'\n'}tourism pressure</T.Body>
            </View>
          </View>
        ) : (
          <View style={[s.keep, { backgroundColor: tone(level(sd).tone).bg, borderColor: tone(level(sd).tone).border }]}>
            <Icon name={level(sd).tone === 'success' ? 'check' : 'alert'} size={18} color={tone(level(sd).tone).fg} />
            <T.Body style={{ flex: 1, fontSize: 14, color: tone(level(sd).tone).fg }}>
              {d.name} is under {level(sd).label.toLowerCase()} ({sd}/100). Your days follow the low-impact tips below.
            </T.Body>
          </View>
        )}

        {plan.map((stops, i) => (
          <View key={i} style={s.day}>
            <View style={s.dayHead}><LeafPin size={20} /><T.H2 style={{ fontSize: 18 }}>Day {i + 1}</T.H2></View>
            {stops.map((st, k) => (
              <View key={k} style={s.slot}>
                <Icon name={SLOT[st.slot].icon} size={18} color={C.textMuted} />
                <View style={{ flex: 1 }}>
                  <T.Label style={{ fontSize: 9, color: C.textFaint, marginBottom: 3 }}>{SLOT[st.slot].label}</T.Label>
                  <T.Body style={{ fontSize: 14.5, lineHeight: 20 }}>{st.t}</T.Body>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {st.tags.filter((x) => interests.includes(x)).map((x) => (
                      <View key={x} style={s.tag}><T.Body style={s.tagText}>{x}</T.Body></View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
            <View style={s.tip}><Icon name="leaf" size={16} color={C.success} /><T.Body style={{ flex: 1, fontSize: 13, lineHeight: 18, color: C.success }}>{TIPS[i % TIPS.length]}</T.Body></View>
          </View>
        ))}

        <T.Muted style={{ fontSize: 12, marginVertical: 8 }}>Itinerary assembled from a curated activity list for your interests. Pressure scores are illustrative demo values.</T.Muted>
        <Button title={saved ? 'Saved to your trips' : 'Save this trip'} icon={saved ? 'check' : 'bookmark'}
          onPress={() => { saveTrip({ id: id!, from: from ?? id!, days, savedAt: Date.now() }); setSaved(true); }} />
        {saved && <Button kind="ghost" title="Go to my trips" style={{ marginTop: 10 }} onPress={() => router.replace('/trips')} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Col({ name, v }: { name: string; v: number }) {
  const t = level(v).tone;
  return (
    <View style={{ flex: 1 }}>
      <T.Muted style={{ fontSize: 13, fontFamily: F.bold }}>{name}</T.Muted>
      <T.Num style={{ fontSize: 30, color: tone(t).fg }}>{v}</T.Num>
      <Bar value={v} t={t} track={C.surface} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 20, paddingTop: 4, paddingBottom: 32 },
  compare: { borderRadius: 24, backgroundColor: C.surface2, padding: 16, marginBottom: 16 },
  big: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  keep: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 16 },
  day: { borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 16, marginBottom: 12 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  slot: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.surface2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: C.accent50 },
  tagText: { fontSize: 11, fontFamily: F.bold, color: C.accent700, textTransform: 'capitalize' },
  tip: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: C.successBg, marginTop: 6 },
});
