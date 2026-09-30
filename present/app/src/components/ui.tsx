import { Pressable, Text, View, StyleSheet, type TextProps, type ViewStyle, type StyleProp, type TextStyle } from 'react-native';
import palette from '../../palette';
import type { Tone } from '@/lib/trip';
import { Icon, type IconName } from './icons';

export const C = palette;

// Lane A type: Satoshi for everything, Azeret Mono for numbers and labels.
export const F = {
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  bold: 'Satoshi-Bold',
  black: 'Satoshi-Black',
  mono: 'AzeretMono_400Regular',
  monoBold: 'AzeretMono_600SemiBold',
};

export const tone = (t: Tone) => ({
  fg: C[t], bg: C[`${t}Bg` as const], border: C[`${t}Border` as const],
});

type TP = TextProps & { style?: StyleProp<TextStyle> };
export const T = {
  H1: (p: TP) => <Text {...p} style={[s.h1, p.style]} />,
  H2: (p: TP) => <Text {...p} style={[s.h2, p.style]} />,
  Body: (p: TP) => <Text {...p} style={[s.body, p.style]} />,
  Muted: (p: TP) => <Text {...p} style={[s.muted, p.style]} />,
  Label: (p: TP) => <Text {...p} style={[s.label, p.style]} />,
  Num: (p: TP) => <Text {...p} style={[s.num, p.style]} />,
};

export function Button({ title, onPress, icon, kind = 'primary', style }: {
  title: string; onPress?: () => void; icon?: IconName; kind?: 'primary' | 'ghost'; style?: StyleProp<ViewStyle>;
}) {
  const primary = kind === 'primary';
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => [s.btn, primary ? s.btnPrimary : s.btnGhost, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }, style]}>
      <Text style={[s.btnText, { color: primary ? C.accentFg : C.text }]}>{title}</Text>
      {icon && <Icon name={icon} size={18} color={primary ? C.accentFg : C.text} />}
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!on }}
      style={[s.chip, on && s.chipOn]}>
      {on && <Icon name="check" size={14} color={C.surface} />}
      <Text style={[s.chipText, on && { color: C.surface }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ t, label, icon }: { t: Tone; label: string; icon?: IconName }) {
  const c = tone(t);
  return (
    <View style={[s.pill, { borderColor: c.border, backgroundColor: C.surface }]}>
      {icon && <Icon name={icon} size={14} color={c.fg} />}
      <Text style={[s.pillText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function DemoBadge() {
  return <View style={s.demo}><Text style={s.demoText}>DEMO DATA</Text></View>;
}

export function Bar({ value, t, height = 6, track = C.surface2 }: { value: number; t: Tone; height?: number; track?: string }) {
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${value}%`, height: '100%', borderRadius: 99, backgroundColor: tone(t).fg }} />
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: F.black, fontSize: 32, lineHeight: 35, letterSpacing: -1.1, color: C.text },
  h2: { fontFamily: F.black, fontSize: 22, letterSpacing: -0.5, color: C.text },
  body: { fontFamily: F.medium, fontSize: 15, lineHeight: 21, color: C.text },
  muted: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.textMuted },
  label: { fontFamily: F.monoBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: C.textMuted },
  num: { fontFamily: F.monoBold, color: C.text, letterSpacing: -1 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  btnPrimary: { backgroundColor: C.accent },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.border },
  btnText: { fontFamily: F.bold, fontSize: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  chipOn: { backgroundColor: C.text, borderColor: C.text },
  chipText: { fontFamily: F.medium, fontSize: 14, color: C.text },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  pillText: { fontFamily: F.bold, fontSize: 13 },
  demo: { borderWidth: 1, borderColor: C.border, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  demoText: { fontFamily: F.monoBold, fontSize: 9, letterSpacing: 1, color: C.textMuted },
});
