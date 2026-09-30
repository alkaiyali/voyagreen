// Bottom sheet for changing one itinerary stop: every activity the place
// offers (best fit for the time of day and your interests first), plus
// free time. Picking something already in the plan swaps the two stops.

import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, IconButton, T } from '@/components/ui';
import { Icon } from '@/components/icons';
import type { Destination, Slot } from '@/data/destinations';
import { FREE, type Stop } from '@/lib/trip';

const SLOT_LABEL: Record<Slot, string> = { am: 'Morning', pm: 'Afternoon', eve: 'Evening' };

export type Placed = { day: number; slot: Slot };

export function StopPicker({ open, title, current, dest, interests, placed, onPick, onClose }: {
  open: boolean; title: string; current?: Stop; dest: Destination; interests: string[];
  /** where each activity (by text) already sits in the plan */
  placed: Record<string, Placed>;
  onPick: (s: Omit<Stop, 'slot'>) => void; onClose: () => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const slot = current?.slot ?? 'am';
  const fit = (tags: string[], sl: Slot) => (sl === slot ? 10 : 0) + tags.filter((x) => interests.includes(x)).length;
  const options = [...dest.activities].sort((a, b) => fit(b.tags, b.slot) - fit(a.tags, a.slot));

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
      <View style={[s.sheet, { paddingBottom: Math.max(bottom, 16) }]} accessibilityViewIsModal>
        <View style={s.grip} />
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <T.Label>Change stop</T.Label>
            <T.H2 style={{ fontSize: 20 }} accessibilityRole="header">{title}</T.H2>
          </View>
          <IconButton icon="close" label="Close" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
          {options.map((a) => {
            const on = current?.t === a.t, where = placed[a.t];
            const liked = a.tags.filter((x) => interests.includes(x));
            return (
              <Pressable key={a.t} onPress={() => onPick({ t: a.t, tags: a.tags })} style={({ pressed }) => [s.opt, on && s.optOn, pressed && { opacity: 0.75 }]}
                accessibilityRole="radio" accessibilityState={{ checked: on }}
                accessibilityLabel={`${a.t}. Best in the ${SLOT_LABEL[a.slot].toLowerCase()}.${where && !on ? ` Already on day ${where.day + 1}, ${SLOT_LABEL[where.slot].toLowerCase()}; picking it swaps the two.` : ''}`}>
                <View style={{ flex: 1, gap: 4 }}>
                  <T.Body style={{ fontSize: 15, lineHeight: 20, fontFamily: on ? F.bold : F.medium }}>{a.t}</T.Body>
                  <View style={s.meta}>
                    <T.Muted style={{ fontSize: 12 }}>Best in the {SLOT_LABEL[a.slot].toLowerCase()}</T.Muted>
                    {liked.map((x) => <View key={x} style={s.tag}><T.Body style={s.tagText}>{x}</T.Body></View>)}
                  </View>
                  {where && !on && (
                    <View style={s.meta}>
                      <Icon name="swap" size={13} color={C.textMuted} />
                      <T.Muted style={{ fontSize: 12 }}>On Day {where.day + 1} · {SLOT_LABEL[where.slot]}: picking it swaps them</T.Muted>
                    </View>
                  )}
                </View>
                <View style={[s.radio, on && s.radioOn]}>{on && <Icon name="check" size={14} color={C.accentFg} width={2.4} />}</View>
              </Pressable>
            );
          })}
          <Pressable onPress={() => onPick(FREE)} style={({ pressed }) => [s.opt, current?.t === FREE.t && s.optOn, pressed && { opacity: 0.75 }]}
            accessibilityRole="radio" accessibilityState={{ checked: current?.t === FREE.t }} accessibilityLabel="Free time, nothing planned">
            <View style={{ flex: 1, gap: 2 }}>
              <T.Body style={{ fontSize: 15, fontFamily: F.bold }}>Free time</T.Body>
              <T.Muted style={{ fontSize: 12 }}>Leave this slot open, nothing planned</T.Muted>
            </View>
            <View style={[s.radio, current?.t === FREE.t && s.radioOn]}>{current?.t === FREE.t && <Icon name="check" size={14} color={C.accentFg} width={2.4} />}</View>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: `${C.accent900}73` },
  sheet: { maxHeight: '80%', backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 8 },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 99, backgroundColor: C.border, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: C.border },
  optOn: { borderColor: C.accent, borderWidth: 2, backgroundColor: C.accent50 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: C.accent50 },
  tagText: { fontSize: 11, fontFamily: F.bold, color: C.accent700, textTransform: 'capitalize' },
  radio: { width: 24, height: 24, borderRadius: 99, borderWidth: 2, borderColor: C.textFaint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: C.accent, borderColor: C.accent },
});
