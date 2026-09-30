import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BottomBar, Button, C, DaysStepper, F, SwapCompare, T, TopBar, tone } from '@/components/ui';
import { Icon, type IconName } from '@/components/icons';
import { DestPhoto } from '@/components/photo';
import { DESTINATIONS, TIPS } from '@/data/destinations';
import { buildItinerary, dest, level, score, useTrip } from '@/lib/trip';

export function generateStaticParams() {
  return Object.keys(DESTINATIONS).map((id) => ({ id }));
}

const SLOT: Record<string, { icon: IconName; label: string }> = {
  am: { icon: 'sun', label: 'Morning' }, pm: { icon: 'cloud', label: 'Afternoon' }, eve: { icon: 'moon', label: 'Evening' },
};

// Demo step 3: the itinerary, with the swap's impact up top and Save always in reach.
export default function TripScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { days, setDays, interests, saveTrip, isSaved } = useTrip();
  const d = dest(id), sd = score(d), lv = level(sd), t = tone(lv.tone);
  const o = from ? dest(from) : undefined, so = o ? score(o) : 0;
  const plan = buildItinerary(d, days, interests);
  const saved = isSaved(id!, from ?? id!);
  // Kept a high-pressure place? Offer the swap once more, gently.
  const nudge = !o && d.alt && sd >= 45 ? d.alt : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={['top']}>
      <TopBar title="Your itinerary" />
      <ScrollView contentContainerStyle={s.pad}>
        <View style={s.head}>
          <DestPhoto id={id!} style={s.headThumb} pinSize={22} />
          <View style={{ flex: 1 }}>
            <T.H1 style={{ fontSize: 28, lineHeight: 32 }}>{d.name}</T.H1>
            <T.Muted>{d.province}</T.Muted>
          </View>
        </View>

        {o ? (
          <Animated.View entering={FadeInDown.duration(350)} style={s.impact}
            accessible accessibilityLabel={`${so - sd} points lower tourism pressure than ${o.name}: ${o.name} ${so}, ${d.name} ${sd}`}>
            <View style={s.impactTop}>
              <T.Num style={{ fontSize: 48, lineHeight: 52, color: C.success }}>−{so - sd}</T.Num>
              <T.Body style={{ fontFamily: F.bold, fontSize: 14, lineHeight: 18, color: C.success, flex: 1 }}>points lower tourism{'\n'}pressure than {o.name}</T.Body>
            </View>
            <SwapCompare from={{ name: o.name, v: so }} to={{ name: d.name, v: sd }} />
          </Animated.View>
        ) : (
          <View style={[s.note, { backgroundColor: t.bg, borderColor: t.border }]}>
            <Icon name={lv.tone === 'success' ? 'check' : 'alert'} size={18} color={t.fg} />
            <View style={{ flex: 1, gap: 4 }}>
              <T.Body style={{ fontSize: 14, color: t.fg }}>{d.name} is under {lv.label.toLowerCase()} ({sd}/100). Your days follow the low-impact tips below.</T.Body>
              {nudge && (
                <Pressable onPress={() => router.replace(`/trip/${nudge}?from=${id}`)} accessibilityRole="button" hitSlop={8}
                  style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }, pressed && { opacity: 0.6 }]}>
                  <T.Body style={{ fontFamily: F.bold, fontSize: 14, color: C.accentText }}>Try {DESTINATIONS[nudge].name} instead ({score(DESTINATIONS[nudge])})</T.Body>
                  <Icon name="arrow" size={16} color={C.accentText} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={s.lengthRow}>
          <View style={{ flex: 1 }}>
            <T.Label>Trip length</T.Label>
            <T.Muted style={{ fontSize: 12 }}>Days rebuild as you change it</T.Muted>
          </View>
          <DaysStepper value={days} onChange={(n) => {
            setDays(n);
            if (saved) saveTrip({ id: id!, from: from ?? id!, days: n, savedAt: Date.now() });
          }} />
        </View>

        {plan.map((stops, i) => (
          <Animated.View key={`${days}-${i}`} entering={FadeIn.duration(250)} style={s.day}>
            <View style={s.dayHead}>
              <T.H2 style={{ fontSize: 18 }} accessibilityRole="header">Day {i + 1}</T.H2>
            </View>
            {stops.map((st, k) => (
              <View key={k} style={s.slot}>
                <View style={s.rail}>
                  <View style={s.dotIcon}><Icon name={SLOT[st.slot].icon} size={16} color={C.accentText} /></View>
                  {k < stops.length - 1 && <View style={s.line} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 14 }}>
                  <T.Label style={{ fontSize: 10, letterSpacing: 0.8, marginBottom: 2 }}>{SLOT[st.slot].label}</T.Label>
                  <T.Body style={{ fontSize: 15, lineHeight: 21 }}>{st.t}</T.Body>
                  {st.tags.some((x) => interests.includes(x)) && (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      {st.tags.filter((x) => interests.includes(x)).map((x) => (
                        <View key={x} style={s.tag}><T.Body style={s.tagText}>{x}</T.Body></View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
            <View style={s.tip}><Icon name="leaf" size={16} color={C.success} /><T.Body style={{ flex: 1, fontSize: 13, lineHeight: 18, color: C.success }}>{TIPS[i % TIPS.length]}</T.Body></View>
          </Animated.View>
        ))}

        <T.Muted style={{ fontSize: 12, marginTop: 4 }}>Assembled from a curated activity list for your interests. Pressure scores are illustrative demo values.</T.Muted>
      </ScrollView>

      <BottomBar>
        {saved ? (
          <Animated.View entering={FadeIn.duration(200)} style={s.savedRow} accessibilityLiveRegion="polite">
            <View style={s.savedMsg}>
              <View style={s.savedIcon}><Icon name="check" size={16} color={C.accentFg} /></View>
              <T.Body style={{ fontFamily: F.bold, color: C.success, flexShrink: 1 }}>Saved to My trips</T.Body>
            </View>
            <Button kind="ghost" title="View trips" icon="arrow" style={{ paddingHorizontal: 18 }} onPress={() => router.replace('/trips')} />
          </Animated.View>
        ) : (
          <Button title="Save this trip" icon="bookmark"
            onPress={() => saveTrip({ id: id!, from: from ?? id!, days, savedAt: Date.now() })} />
        )}
      </BottomBar>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 20, paddingTop: 4, paddingBottom: 24 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  headThumb: { width: 64, height: 64, borderRadius: 18 },
  impact: { marginTop: 16, padding: 16, borderRadius: 24, backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder, gap: 14 },
  impactTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 16 },
  lengthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 24, marginBottom: 16 },
  day: { borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 16, marginBottom: 12 },
  dayHead: { marginBottom: 12 },
  slot: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 32 },
  dotIcon: { width: 32, height: 32, borderRadius: 99, backgroundColor: C.accent50, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, backgroundColor: C.accent100, marginVertical: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: C.accent50 },
  tagText: { fontSize: 12, fontFamily: F.bold, color: C.accent700, textTransform: 'capitalize' },
  tip: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: C.successBg, marginTop: 2 },
  savedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  savedMsg: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  savedIcon: { width: 28, height: 28, borderRadius: 99, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
});
