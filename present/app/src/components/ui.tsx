import { Pressable, Text, View, StyleSheet, type TextProps, type ViewStyle, type StyleProp, type TextStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import palette from '../../palette';
import { INTERESTS } from '@/data/destinations';
import { level, type Tone } from '@/lib/trip';
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
  H1: (p: TP) => <Text accessibilityRole="header" {...p} style={[s.h1, p.style]} />,
  H2: (p: TP) => <Text {...p} style={[s.h2, p.style]} />,
  Body: (p: TP) => <Text {...p} style={[s.body, p.style]} />,
  Muted: (p: TP) => <Text {...p} style={[s.muted, p.style]} />,
  Label: (p: TP) => <Text {...p} style={[s.label, p.style]} />,
  Num: (p: TP) => <Text {...p} style={[s.num, p.style]} />,
};

export function Button({ title, onPress, icon, kind = 'primary', disabled, style }: {
  title: string; onPress?: () => void; icon?: IconName; kind?: 'primary' | 'ghost' | 'text'; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const primary = kind === 'primary';
  const fg = primary ? C.accentFg : kind === 'text' ? C.accentText : C.text;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, primary ? s.btnPrimary : kind === 'ghost' ? s.btnGhost : s.btnText_, pressed && s.pressed, disabled && s.btnDisabled, style]}>
      <Text style={[s.btnText, { color: disabled && primary ? C.textMuted : fg }]}>{title}</Text>
      {icon && <Icon name={icon} size={18} color={disabled && primary ? C.textMuted : fg} />}
    </Pressable>
  );
}

// Square icon-only control (back, stepper). 44pt target, always labelled.
export function IconButton({ icon, label, onPress, disabled, filled }: {
  icon: IconName; label: string; onPress?: () => void; disabled?: boolean; filled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.iconBtn, filled ? s.iconBtnFilled : s.iconBtnOutline, pressed && s.pressed, disabled && { opacity: 0.4 }]}>
      <Icon name={icon} />
    </Pressable>
  );
}

// Stack-screen header: back, title, demo badge.
export function TopBar({ title }: { title: string }) {
  return (
    <View style={s.topBar}>
      <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} />
      <T.Body style={{ fontFamily: F.bold, flex: 1 }} numberOfLines={1} accessibilityRole="header">{title}</T.Body>
      <DemoBadge />
    </View>
  );
}

// Sticky action area pinned above the home indicator.
// Inside a tab screen pass inset={false}: the tab bar already clears the home indicator.
export function BottomBar({ children, inset = true }: { children: React.ReactNode; inset?: boolean }) {
  const { bottom } = useSafeAreaInsets();
  return <View style={[s.bottomBar, { paddingBottom: inset ? Math.max(bottom, 16) : 12 }]}>{children}</View>;
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!on }}
      style={({ pressed }) => [s.chip, on && s.chipOn, pressed && s.pressed]}>
      {on && <Icon name="check" size={14} color={C.surface} />}
      <Text style={[s.chipText, on && { color: C.surface }]}>{label}</Text>
    </Pressable>
  );
}

export function InterestPicker({ value, onToggle }: { value: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={s.chips}>
      {INTERESTS.map((x) => <Chip key={x.id} label={x.label} on={value.includes(x.id)} onPress={() => onToggle(x.id)} />)}
    </View>
  );
}

export function DaysStepper({ value, onChange, min = 1, max = 5 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <View style={s.stepper}>
      <IconButton icon="minus" label="Fewer days" filled disabled={value <= min} onPress={() => onChange(value - 1)} />
      <View accessible accessibilityLabel={`${value} day${value > 1 ? 's' : ''}`} accessibilityLiveRegion="polite" style={s.stepperVal}>
        <T.Num style={{ fontSize: 22, letterSpacing: 0 }}>{value}</T.Num>
        <T.Muted>day{value > 1 ? 's' : ''}</T.Muted>
      </View>
      <IconButton icon="plus" label="More days" filled disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
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

// Compact score for lists: number + word, never color alone.
export function ScoreBadge({ value }: { value: number }) {
  const lv = level(value), c = tone(lv.tone);
  return (
    <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <T.Num style={{ fontSize: 17, color: c.fg, letterSpacing: -0.5 }}>{value}</T.Num>
      <Text style={[s.badgeText, { color: c.fg }]}>{lv.short}</Text>
    </View>
  );
}

// Half-circle gauge for the headline score.
export function ScoreGauge({ value, size = 220 }: { value: number; size?: number }) {
  const lv = level(value), c = tone(lv.tone);
  const sw = 16, r = (size - sw) / 2, cx = size / 2, cy = size / 2;
  const a = Math.PI * (1 - Math.min(Math.max(value, 0), 100) / 100);
  const arc = (x: number, y: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`;
  return (
    <View style={{ width: size, height: size / 2 + 8, alignItems: 'center' }}
      accessible accessibilityLabel={`Tourism pressure ${value} out of 100, ${lv.label.toLowerCase()}`}>
      <Svg width={size} height={size / 2 + sw / 2}>
        <Path d={arc(cx + r, cy)} stroke={C.surface} strokeWidth={sw} strokeLinecap="round" fill="none" />
        <Path d={arc(cx + r * Math.cos(a), cy - r * Math.sin(a))} stroke={c.fg} strokeWidth={sw} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={s.gaugeCenter}>
        <T.Num style={{ fontSize: 60, lineHeight: 64, color: c.fg }}>{value}</T.Num>
        <T.Label style={{ color: c.fg }}>{lv.label}</T.Label>
      </View>
    </View>
  );
}

export function DemoBadge() {
  return <View style={s.demo} accessibilityLabel="Demo data"><Text style={s.demoText}>DEMO DATA</Text></View>;
}

export function Bar({ value, t, height = 6, track = C.surface2 }: { value: number; t: Tone; height?: number; track?: string }) {
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${value}%`, height: '100%', borderRadius: 99, backgroundColor: tone(t).fg }} />
    </View>
  );
}

// "Boracay 87 → Carabao 29": the swap, as two labelled bars.
export function SwapCompare({ from, to, track = C.surface }: { from: { name: string; v: number }; to: { name: string; v: number }; track?: string }) {
  return (
    <View style={{ gap: 10 }}>
      {[from, to].map((x, k) => {
        const t = level(x.v).tone;
        return (
          <View key={k} style={s.cmpRow}>
            <T.Body style={[s.cmpName, k === 0 && { color: C.textMuted, fontFamily: F.medium }]} numberOfLines={1}>{x.name}</T.Body>
            <View style={{ flex: 1 }}><Bar value={x.v} t={t} height={8} track={track} /></View>
            <T.Num style={[s.cmpNum, { color: tone(t).fg }]}>{x.v}</T.Num>
          </View>
        );
      })}
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
  pressed: { opacity: 0.75 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16 },
  btnPrimary: { backgroundColor: C.accent },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.border },
  btnText_: { backgroundColor: 'transparent', minHeight: 44, paddingVertical: 10 },
  btnDisabled: { backgroundColor: C.raised, borderColor: C.raised },
  btnText: { fontFamily: F.bold, fontSize: 16 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBtnOutline: { borderWidth: 1, borderColor: C.border },
  iconBtnFilled: { backgroundColor: C.surface2 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, gap: 4, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  chipOn: { backgroundColor: C.text, borderColor: C.text },
  chipText: { fontFamily: F.medium, fontSize: 14, color: C.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 4, backgroundColor: C.surface },
  stepperVal: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, minWidth: 76 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  pillText: { fontFamily: F.bold, fontSize: 13 },
  badge: { alignItems: 'center', justifyContent: 'center', minWidth: 58, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  badgeText: { fontFamily: F.bold, fontSize: 11 },
  gaugeCenter: { position: 'absolute', bottom: 0, alignItems: 'center' },
  cmpRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cmpName: { width: 104, fontFamily: F.bold, fontSize: 14 },
  cmpNum: { width: 30, textAlign: 'right', fontSize: 17, letterSpacing: -0.5 },
  demo: { borderWidth: 1, borderColor: C.border, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  demoText: { fontFamily: F.monoBold, fontSize: 10, letterSpacing: 1, color: C.textMuted },
});
