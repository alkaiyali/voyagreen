import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bar, Button, C, DemoBadge, F, Pill, T, tone } from '@/components/ui';
import { Icon, LeafPin } from '@/components/icons';
import { DESTINATIONS, INDICATORS } from '@/data/destinations';
import { dest, level, matchPct, score, useTrip } from '@/lib/trip';

export function generateStaticParams() {
  return Object.keys(DESTINATIONS).map((id) => ({ id }));
}

// Demo step 2: the pressure check, and the swap.
export default function DestinationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { days, interests } = useTrip();
  const d = dest(id), sc = score(d), lv = level(sc), t = tone(lv.tone);
  const altId = d.alt && sc >= 45 ? d.alt : undefined;
  const alt = altId ? DESTINATIONS[altId] : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}>
      <View style={s.bar}>
        <Pressable style={s.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} accessibilityLabel="Back"><Icon name="back" /></Pressable>
        <T.Body style={{ fontFamily: F.bold, flex: 1 }}>Pressure check</T.Body>
        <DemoBadge />
      </View>
      <ScrollView contentContainerStyle={s.pad}>
        <View style={[s.score, { backgroundColor: t.bg, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <T.H2 style={{ fontSize: 26 }}>{d.name}</T.H2>
              <T.Muted style={{ fontSize: 13 }}>{d.province}</T.Muted>
            </View>
            <Pill t={lv.tone} label={lv.label} icon={lv.tone === 'success' ? 'check' : 'alert'} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 }}>
            <T.Num style={{ fontSize: 68, lineHeight: 72, color: t.fg }}>{sc}</T.Num>
            <T.Num style={{ fontSize: 18, color: C.textMuted, marginBottom: 12, marginLeft: 4, letterSpacing: 0 }}>/100</T.Num>
          </View>
          <Bar value={sc} t={lv.tone} height={10} track={C.surface} />
          <View style={s.scale}>{['Low', 'Moderate', 'High'].map((x) => <T.Muted key={x} style={{ fontSize: 11 }}>{x}</T.Muted>)}</View>
        </View>

        <View style={{ gap: 14, marginTop: 18 }}>
          {INDICATORS.map((i) => {
            const v = d.indicators[i.id as keyof typeof d.indicators], it = level(v).tone;
            return (
              <View key={i.id}>
                <View style={s.indTop}>
                  <T.Body style={{ fontSize: 14 }}>{i.label}</T.Body>
                  <T.Num style={{ fontSize: 13, color: tone(it).fg, letterSpacing: 0 }}>{v}</T.Num>
                </View>
                <Bar value={v} t={it} />
                <T.Muted style={{ fontSize: 12, marginTop: 4 }}>{i.hint}</T.Muted>
              </View>
            );
          })}
        </View>

        {alt && altId ? (
          <>
            <View style={s.altHead}><Icon name="leaf" size={18} color={C.accentText} /><T.Body style={{ fontFamily: F.bold, color: C.accentText }}>A greener pick with the same vibe</T.Body></View>
            <Pressable onPress={() => router.push(`/trip/${altId}?from=${id}`)} style={({ pressed }) => [s.alt, pressed && { opacity: 0.92 }]}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <LeafPin size={36} />
                <View style={{ flex: 1 }}>
                  <T.H2 style={{ fontSize: 20 }}>{alt.name}</T.H2>
                  <T.Muted style={{ fontSize: 13 }}>{alt.province}</T.Muted>
                  <T.Body style={{ fontSize: 13, lineHeight: 18, marginTop: 6 }}>{alt.blurb}</T.Body>
                  <View style={s.tags}>
                    {alt.vibe.filter((v) => d.vibe.includes(v)).map((v) => <View key={v} style={s.tag}><T.Muted style={s.tagText}>{v}</T.Muted></View>)}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T.Num style={{ fontSize: 34, color: C.success }}>{score(alt)}</T.Num>
                  <T.Body style={{ fontFamily: F.bold, fontSize: 12, color: C.success }}>{level(score(alt)).short}</T.Body>
                  <T.Muted style={{ fontSize: 12, marginTop: 6 }}>{matchPct(alt, interests, d.vibe)}% match</T.Muted>
                </View>
              </View>
              <View style={s.altCta}>
                <T.Body style={{ fontFamily: F.bold, color: C.accentFg }}>Plan my {days}-day trip here</T.Body>
                <Icon name="arrow" size={18} color={C.accentFg} />
              </View>
            </Pressable>
            <Button kind="ghost" title={`Keep ${d.name} anyway`} style={{ marginTop: 12 }} onPress={() => router.push(`/trip/${id}`)} />
          </>
        ) : (
          <Button title={`Plan my ${days}-day trip to ${d.name}`} icon="arrow" style={{ marginTop: 24 }} onPress={() => router.push(`/trip/${id}`)} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 20, paddingTop: 4, paddingBottom: 32 },
  score: { borderWidth: 1.5, borderRadius: 24, padding: 18 },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  indTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  altHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26, marginBottom: 10 },
  alt: { borderWidth: 1.5, borderColor: C.accent, borderRadius: 24, padding: 16, backgroundColor: C.surface },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: C.surface2 },
  tagText: { fontSize: 11, fontFamily: F.bold, textTransform: 'capitalize' },
  altCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: C.accent },
});
