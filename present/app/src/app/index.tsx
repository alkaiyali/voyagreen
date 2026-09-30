import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, C, F, T, tone } from '@/components/ui';
import { Icon, LeafPin, type IconName } from '@/components/icons';

// One welcome screen (the product in a picture + three steps), then setup.
const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'search', title: 'Pick where you want to go', body: 'Any of 20 places across the Philippines.' },
  { icon: 'alert', title: 'See its tourism pressure', body: 'A 0–100 score from crowding and strain on the place, with the reasons.' },
  { icon: 'leaf', title: 'Swap or keep it — your call', body: 'Greener options with the same vibe, and why they’re greener. Then a day-by-day plan.' },
];

export default function Welcome() {
  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.brand}><LeafPin size={26} /><Text style={s.brandName}>VoyaGreen</Text></View>

      <Animated.View entering={FadeInDown.duration(400)} style={s.hero} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <SwapArt />
      </Animated.View>

      <T.H1 style={{ fontSize: 34, lineHeight: 37 }}>Travel greener,{'\n'}not less.</T.H1>
      <T.Muted style={{ fontSize: 16, lineHeight: 23, marginTop: 8 }}>Places just as good as the famous ones, without adding to the crowd.</T.Muted>

      <View style={s.steps}>
        {STEPS.map((x, k) => (
          <Animated.View key={x.title} entering={FadeInDown.delay(120 + k * 80).duration(350)} style={s.step}>
            <View style={s.stepIcon}><Icon name={x.icon} size={18} color={C.accentText} /></View>
            <View style={{ flex: 1 }}>
              <T.Body style={{ fontFamily: F.bold }}>{x.title}</T.Body>
              <T.Muted style={{ fontSize: 13, lineHeight: 18 }}>{x.body}</T.Muted>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Button title="Get started" icon="arrow" onPress={() => router.push('/setup')} />
    </SafeAreaView>
  );
}

function SwapArt() {
  const d = tone('danger'), g = tone('success');
  return (
    <View style={s.art}>
      <View style={[s.mini, { borderColor: d.border }]}>
        <Text style={s.miniName}>Famous island</Text>
        <T.Num style={{ fontSize: 32, color: d.fg }}>87</T.Num>
        <Text style={[s.miniLbl, { color: d.fg }]}>High pressure</Text>
      </View>
      <View style={s.arrow}><Icon name="arrow" size={20} color={C.accentFg} /></View>
      <View style={[s.mini, { borderColor: C.accent, borderWidth: 2 }]}>
        <Text style={s.miniName}>Same vibe</Text>
        <T.Num style={{ fontSize: 32, color: g.fg }}>29</T.Num>
        <Text style={[s.miniLbl, { color: g.fg }]}>Low pressure</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.surface, paddingHorizontal: 24, paddingBottom: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingBottom: 16 },
  brandName: { fontFamily: F.black, fontSize: 19, color: C.text, letterSpacing: -0.4 },
  hero: { marginBottom: 24 },
  art: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 28, borderRadius: 28, backgroundColor: C.accent50 },
  mini: { width: 124, paddingVertical: 16, alignItems: 'center', borderRadius: 20, borderWidth: 1.5, backgroundColor: C.surface },
  miniName: { fontFamily: F.bold, fontSize: 12, color: C.textMuted },
  miniLbl: { fontFamily: F.bold, fontSize: 12 },
  arrow: { width: 32, height: 32, borderRadius: 99, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  steps: { gap: 14, marginTop: 22 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent50, alignItems: 'center', justifyContent: 'center' },
});
