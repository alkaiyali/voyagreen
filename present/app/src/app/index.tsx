import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, C, F, T, tone } from '@/components/ui';
import { Icon, LeafPin } from '@/components/icons';

// Pseudo onboarding — three pages, then a quick setup. No account is created.
const PAGES = [
  { title: 'Travel greener,\nnot less.', body: 'VoyaGreen finds you places just as good as the famous ones — without adding to the crowd.', art: 'pin' },
  { title: 'See the pressure\nbefore you go.', body: 'Every destination gets a tourism-pressure score built from crowding and environmental indicators.', art: 'gauge' },
  { title: 'Swap to a place\nwith the same vibe.', body: 'Overcrowded? We suggest a lower-pressure alternative and plan your days there around what you love.', art: 'swap' },
] as const;

export default function Onboarding() {
  const [i, setI] = useState(0);
  const last = i === PAGES.length - 1;
  const p = PAGES[i];
  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.top}>
        <View style={s.brand}><LeafPin size={24} /><Text style={s.brandName}>VoyaGreen</Text></View>
        {!last && <Pressable onPress={() => router.push('/setup')}><Text style={s.skip}>Skip</Text></Pressable>}
      </View>

      <View style={s.art}>{p.art === 'pin' ? <ArtPin /> : p.art === 'gauge' ? <ArtGauge /> : <ArtSwap />}</View>

      <View style={s.copy}>
        <T.H1 style={{ fontSize: 34, lineHeight: 37 }}>{p.title}</T.H1>
        <T.Muted style={{ fontSize: 16, lineHeight: 23, marginTop: 12 }}>{p.body}</T.Muted>
      </View>

      <View style={s.dots}>
        {PAGES.map((_, k) => <View key={k} style={[s.dot, k === i && s.dotOn]} />)}
      </View>
      <Button title={last ? 'Get started' : 'Next'} icon="arrow"
        onPress={() => (last ? router.push('/setup') : setI(i + 1))} />
    </SafeAreaView>
  );
}

function ArtPin() {
  return (
    <View style={s.artBox}>
      <View style={[s.ring, { width: 240, height: 240 }]} />
      <View style={[s.ring, { width: 170, height: 170, borderColor: C.accent200 }]} />
      <LeafPin size={112} />
      <View style={[s.float, { top: 34, left: 22 }]}><LeafPin size={26} color={C.accent300} /></View>
      <View style={[s.float, { bottom: 40, right: 26 }]}><LeafPin size={34} color={C.accent500} /></View>
    </View>
  );
}

function ArtGauge() {
  const d = tone('danger');
  return (
    <View style={s.artBox}>
      <View style={[s.card, { borderColor: d.border, backgroundColor: d.bg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T.H2 style={{ fontSize: 18 }}>Popular island</T.H2>
          <Icon name="alert" size={18} color={d.fg} />
        </View>
        <T.Num style={{ fontSize: 56, color: d.fg, marginTop: 6 }}>87</T.Num>
        <View style={s.track}><View style={[s.fill, { width: '87%', backgroundColor: d.fg }]} /></View>
        {[92, 81, 84].map((v, k) => (
          <View key={k} style={[s.track, { height: 5, marginTop: 10, backgroundColor: C.surface }]}>
            <View style={[s.fill, { width: `${v}%`, backgroundColor: d.border }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function ArtSwap() {
  const d = tone('danger'), g = tone('success');
  return (
    <View style={[s.artBox, { flexDirection: 'row', gap: 14 }]}>
      <View style={[s.mini, { borderColor: d.border }]}>
        <LeafPin size={40} color={C.borderStrong} />
        <T.Num style={{ fontSize: 30, color: d.fg, marginTop: 8 }}>87</T.Num>
        <Text style={[s.miniLbl, { color: d.fg }]}>High</Text>
      </View>
      <Icon name="arrow" size={26} color={C.textFaint} />
      <View style={[s.mini, { borderColor: C.accent, borderWidth: 2 }]}>
        <LeafPin size={40} />
        <T.Num style={{ fontSize: 30, color: g.fg, marginTop: 8 }}>29</T.Num>
        <Text style={[s.miniLbl, { color: g.fg }]}>Low</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.surface, paddingHorizontal: 24, paddingBottom: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontFamily: F.black, fontSize: 19, color: C.text, letterSpacing: -0.4 },
  skip: { fontFamily: F.bold, fontSize: 15, color: C.textMuted, padding: 6 },
  art: { flex: 1, justifyContent: 'center' },
  artBox: { height: 300, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: C.accent50 },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderColor: C.accent100 },
  float: { position: 'absolute' },
  card: { width: 240, padding: 18, borderRadius: 22, borderWidth: 1.5 },
  track: { height: 8, borderRadius: 99, backgroundColor: C.surface, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', borderRadius: 99 },
  mini: { width: 116, paddingVertical: 20, alignItems: 'center', borderRadius: 22, borderWidth: 1.5, backgroundColor: C.surface },
  miniLbl: { fontFamily: F.bold, fontSize: 13 },
  copy: { paddingTop: 8, paddingBottom: 24 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: C.border },
  dotOn: { width: 24, backgroundColor: C.accent },
});
