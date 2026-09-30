import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BottomBar, Button, C, F, Pill, ScoreBadge, T, TopBar, tone } from '@/components/ui';
import { Icon } from '@/components/icons';
import { DestPhoto, PhotoCredit } from '@/components/photo';
import { LiveCard } from '@/components/live';
import { DESTINATIONS, INDICATORS, INTERESTS, type Destination } from '@/data/destinations';
import { useLiveSignals } from '@/lib/live';
import { alternatives, dest, level, score, useTrip, verdict } from '@/lib/trip';

export function generateStaticParams() {
  return Object.keys(DESTINATIONS).map((id) => ({ id }));
}

type Ind = keyof Destination['indicators'];

// Demo step 2: a decision screen. Verdict on the place the traveler picked,
// greener options with the same vibe, and — for the selected option — exactly
// why it is greener and what the trip keeps. The traveler decides.
export default function DestinationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { days, interests } = useTrip();
  const destId = id && DESTINATIONS[id] ? id : 'boracay';
  const d = dest(destId), sc = score(d), lv = level(sc), t = tone(lv.tone);
  const alts = alternatives(destId, interests);
  const [pickId, setPickId] = useState<string | undefined>(alts[0]);
  const pick = pickId ? DESTINATIONS[pickId] : undefined;
  const nDays = `${days} day${days > 1 ? 's' : ''}`;
  const live = useLiveSignals(destId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={['top']}>
      <TopBar title="Pressure check" />
      <ScrollView contentContainerStyle={s.pad}>
        <DestPhoto id={destId} style={s.banner} pinSize={40} size="hero" />
        <PhotoCredit id={destId} style={s.credit} size="hero" />

        {/* Verdict on the traveler's own choice */}
        <View style={[s.verdict, { backgroundColor: t.bg, borderColor: t.border }]}
          accessible accessibilityLabel={`${d.name} is under ${lv.label.toLowerCase()}, ${sc} out of 100. ${verdict(d)}`}>
          <View style={s.verdictTop}>
            <View style={{ flex: 1 }}>
              <T.H1 style={{ fontSize: 26, lineHeight: 30 }}>{d.name}</T.H1>
              <T.Muted style={{ fontSize: 13 }}>{d.province}</T.Muted>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <T.Num style={{ fontSize: 44, lineHeight: 48, color: t.fg }}>{sc}</T.Num>
                <T.Num style={{ fontSize: 14, color: C.textMuted, letterSpacing: 0 }}>/100</T.Num>
              </View>
              <Pill t={lv.tone} label={lv.label} icon={lv.tone === 'success' ? 'check' : 'alert'} />
            </View>
          </View>
          <Scale value={sc} />
          <T.Body style={{ fontFamily: F.bold, fontSize: 14, color: t.fg, marginTop: 10 }}>{verdict(d)}</T.Body>
          {live.data && !live.data.offline && (
            <T.Muted style={{ fontSize: 12, marginTop: 6 }}>Live estimate today: <T.Num style={{ fontSize: 12, letterSpacing: 0 }}>{live.data.occupancy}</T.Num>/100 occupancy (open data, see below)</T.Muted>
          )}
        </View>

        {alts.length > 0 && pick && pickId ? (
          <Animated.View entering={FadeInDown.delay(120).duration(350)}>
            <T.H2 style={s.h2} accessibilityRole="header">Greener options with your vibe</T.H2>
            <T.Muted style={{ fontSize: 13, marginBottom: 12 }}>Same kind of trip, much less pressure on the place. Pick one to compare.</T.Muted>
            <View style={{ gap: 8 }} accessibilityRole="radiogroup">
              {alts.map((aid) => {
                const a = DESTINATIONS[aid], as = score(a), on = aid === pickId;
                return (
                  <Pressable key={aid} onPress={() => setPickId(aid)} style={({ pressed }) => [s.opt, on && s.optOn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${a.name}, ${a.province}, ${as} out of 100, ${Math.round(((sc - as) / sc) * 100)}% less pressure than ${d.name}`}>
                    <DestPhoto id={aid} style={s.optThumb} pinSize={18} />
                    <View style={{ flex: 1 }}>
                      <T.Body style={{ fontFamily: F.bold }} numberOfLines={1}>{a.name} <T.Muted style={{ fontSize: 12 }}>· {a.province}</T.Muted></T.Body>
                      <T.Body style={{ fontSize: 12, fontFamily: F.bold, color: C.success }} numberOfLines={1}>{Math.round(((sc - as) / sc) * 100)}% less pressure</T.Body>
                      <T.Muted style={{ fontSize: 12, textTransform: 'capitalize' }} numberOfLines={1}>{a.vibe.filter((v) => d.vibe.includes(v)).join(' · ')}</T.Muted>
                    </View>
                    <ScoreBadge value={as} />
                  </Pressable>
                );
              })}
            </View>

            <Animated.View key={pickId} entering={FadeIn.duration(200)}>
              <WhyGreener from={d} to={pick} />
              <WhatYouKeep from={d} to={pick} interests={interests} />
            </Animated.View>
          </Animated.View>
        ) : lv.tone !== 'success' ? (
          <View style={s.note}>
            <T.Body style={{ fontFamily: F.bold }}>No lower-pressure match for this vibe yet</T.Body>
            <T.Muted style={{ fontSize: 13 }}>If you go, the plan follows low-impact tips: travel midweek, stay locally owned, carry your trash out.</T.Muted>
          </View>
        ) : null}

        <View style={s.liveHead}>
          <Icon name="signal" size={18} color={C.accentText} />
          <T.H2 style={{ fontSize: 18, color: C.accentText }} accessibilityRole="header">Live signals for {d.name}</T.H2>
        </View>
        {live.loading ? (
          <View style={s.skeleton}>
            <View style={[s.skelBar, { width: '42%' }]} />
            <View style={[s.skelBar, { width: '76%', marginTop: 12 }]} />
            <T.Muted style={{ fontSize: 12, marginTop: 14 }}>Checking live signals…</T.Muted>
          </View>
        ) : live.data ? <LiveCard data={live.data} /> : null}

        <T.Muted style={{ fontSize: 12, marginTop: 20 }}>Pressure scores are illustrative demo values. Live signals are estimates from open data.</T.Muted>
      </ScrollView>

      <BottomBar>
        {pick && pickId ? (
          <>
            <Button title={`Go with ${pick.name}`} icon="arrow" onPress={() => router.push(`/trip/${pickId}?from=${destId}`)} />
            <Button kind="text" title={`Keep ${d.name} anyway`} onPress={() => router.push(`/trip/${destId}`)} />
          </>
        ) : (
          <Button title={`Plan ${nDays} in ${d.name}`} icon="arrow" onPress={() => router.push(`/trip/${destId}`)} />
        )}
      </BottomBar>
    </SafeAreaView>
  );
}

// Low / Moderate / High bands with a marker — where this place sits.
function Scale({ value }: { value: number }) {
  return (
    <View style={{ marginTop: 14 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={s.scale}>
        <View style={[s.band, { flex: 45, backgroundColor: C.successBorder }]} />
        <View style={[s.band, { flex: 20, backgroundColor: C.warningBorder }]} />
        <View style={[s.band, { flex: 35, backgroundColor: C.dangerBorder }]} />
        <View style={[s.marker, { left: `${value}%`, backgroundColor: tone(level(value).tone).fg }]} />
      </View>
      <View style={s.scaleLbls}>
        <T.Muted style={[s.scaleLbl, { flex: 45 }]}>Low</T.Muted>
        <T.Muted style={[s.scaleLbl, { flex: 20 }]}>Moderate</T.Muted>
        <T.Muted style={[s.scaleLbl, { flex: 35, textAlign: 'right' }]}>High</T.Muted>
      </View>
    </View>
  );
}

// Indicator-by-indicator: the reason the option is greener, in numbers.
function WhyGreener({ from, to }: { from: Destination; to: Destination }) {
  const sf = score(from), st = score(to);
  const pct = Math.round(((sf - st) / sf) * 100);
  const lower = INDICATORS.filter((i) => to.indicators[i.id as Ind] < from.indicators[i.id as Ind]).length;
  return (
    <View style={s.card}>
      <T.Label>Why {to.name} is greener</T.Label>
      <View style={s.bigRow} accessible accessibilityLabel={`${pct}% less tourism pressure than ${from.name}: ${st} versus ${sf}`}>
        <T.Num style={{ fontSize: 40, lineHeight: 44, color: C.success }}>{pct}%</T.Num>
        <T.Body style={{ flex: 1, fontFamily: F.bold, fontSize: 14, lineHeight: 18 }}>less tourism pressure than {from.name} ({st} vs {sf})</T.Body>
      </View>

      <View style={s.tHead}>
        <View style={{ flex: 1 }} />
        <T.Muted style={[s.tCol, s.tHeadTxt]} numberOfLines={2}>{from.name}</T.Muted>
        <T.Muted style={[s.tCol, s.tHeadTxt, { color: C.success, fontFamily: F.bold }]} numberOfLines={2}>{to.name}</T.Muted>
      </View>
      {INDICATORS.map((i) => {
        const a = from.indicators[i.id as Ind], b = to.indicators[i.id as Ind];
        return (
          <View key={i.id} style={s.tRow} accessible accessibilityLabel={`${i.label}: ${from.name} ${a}, ${to.name} ${b}`}>
            <View style={{ flex: 1 }}>
              <T.Body style={{ fontFamily: F.bold, fontSize: 14 }}>{i.label}</T.Body>
              <T.Muted style={{ fontSize: 12, lineHeight: 16 }}>{i.hint}</T.Muted>
              <View style={s.pair}>
                <View style={[s.pairBar, { width: `${a}%`, backgroundColor: tone(level(a).tone).fg }]} />
                <View style={[s.pairBar, { width: `${b}%`, backgroundColor: tone(level(b).tone).fg }]} />
              </View>
            </View>
            <T.Num style={[s.tCol, s.tNum, { color: tone(level(a).tone).fg }]}>{a}</T.Num>
            <T.Num style={[s.tCol, s.tNum, { color: tone(level(b).tone).fg }]}>{b}</T.Num>
          </View>
        );
      })}
      <View style={s.foot}>
        <Icon name={lower === INDICATORS.length ? 'check' : 'down'} size={16} color={C.success} />
        <T.Body style={{ fontSize: 13, fontFamily: F.bold, color: C.success }}>
          {lower === INDICATORS.length ? `Lower on all ${lower} measures` : `Lower on ${lower} of ${INDICATORS.length} measures`}
        </T.Body>
      </View>
    </View>
  );
}

// The "same trip" half of the promise: shared vibe + real things to do there.
function WhatYouKeep({ from, to, interests }: { from: Destination; to: Destination; interests: string[] }) {
  const shared = to.vibe.filter((v) => from.vibe.includes(v));
  const covered = INTERESTS.filter((x) => interests.includes(x.id) && (to.vibe.includes(x.id) || to.activities.some((a) => a.tags.includes(x.id))));
  const tried = new Set<string>();
  const samples = to.activities.filter((a) => a.tags.some((x) => interests.includes(x) && !tried.has(x) && tried.add(x))).slice(0, 3);
  return (
    <View style={s.card}>
      <T.Label>What you keep</T.Label>
      <View style={s.tags}>
        {shared.map((v) => <View key={v} style={s.tag}><Icon name="check" size={12} color={C.accent700} width={2.4} /><T.Body style={s.tagText}>{v}</T.Body></View>)}
      </View>
      {interests.length > 0 && (
        <T.Body style={{ fontSize: 14, marginTop: 10 }}>
          Covers <T.Body style={{ fontFamily: F.bold, fontSize: 14 }}>{covered.length} of your {interests.length}</T.Body> interests
          {covered.length ? ` (${covered.map((x) => x.label.toLowerCase()).join(', ')})` : ''}.
        </T.Body>
      )}
      {samples.length > 0 && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {samples.map((a) => (
            <View key={a.t} style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="leaf" size={14} color={C.success} />
              <T.Body style={{ flex: 1, fontSize: 13, lineHeight: 18 }}>{a.t}</T.Body>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  pad: { padding: 20, paddingTop: 4, paddingBottom: 24 },
  banner: { height: 132, borderRadius: 22 },
  credit: { alignSelf: 'stretch', marginTop: 6, marginBottom: 10 },
  verdict: { borderWidth: 1.5, borderRadius: 24, padding: 16 },
  verdictTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  scale: { flexDirection: 'row', height: 8, borderRadius: 99, overflow: 'visible', gap: 3 },
  band: { height: 8, borderRadius: 99 },
  marker: { position: 'absolute', top: -5, width: 6, height: 18, marginLeft: -3, borderRadius: 3, borderWidth: 1.5, borderColor: C.surface },
  scaleLbls: { flexDirection: 'row', marginTop: 6 },
  scaleLbl: { fontSize: 11 },
  h2: { fontSize: 20, marginTop: 28, marginBottom: 2 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, paddingRight: 10, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  optOn: { borderColor: C.accent, borderWidth: 2, backgroundColor: C.accent50 },
  optThumb: { width: 56, height: 56, borderRadius: 12 },
  card: { marginTop: 14, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  bigRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 6 },
  tHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.surface2 },
  tCol: { width: 64, textAlign: 'right', fontSize: 12 },
  tHeadTxt: { fontSize: 11, lineHeight: 14 },
  tNum: { fontSize: 18, letterSpacing: -0.5 },
  pair: { gap: 3, marginTop: 6 },
  pairBar: { height: 4, borderRadius: 99 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: C.accent50 },
  tagText: { fontSize: 13, fontFamily: F.bold, color: C.accent700, textTransform: 'capitalize' },
  note: { marginTop: 20, padding: 16, borderRadius: 20, backgroundColor: C.surface2, gap: 4 },
  liveHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 10 },
  skeleton: { borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 16, backgroundColor: C.surface },
  skelBar: { height: 14, borderRadius: 7, backgroundColor: C.surface2 },
});
