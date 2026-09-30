import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, C, Chip, F, T } from '@/components/ui';
import { Icon } from '@/components/icons';
import { INTERESTS } from '@/data/destinations';
import { useTrip } from '@/lib/trip';

export default function Setup() {
  const { name, setName, interests, toggleInterest, days, setDays } = useTrip();
  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.bar}>
        <Pressable style={s.back} onPress={() => router.back()} accessibilityLabel="Back"><Icon name="back" /></Pressable>
        <View style={s.progress}><View style={s.progressFill} /></View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <T.H1>Let’s set up{'\n'}your trips</T.H1>
        <T.Muted style={{ marginTop: 8 }}>We use this to match greener places to what you actually enjoy.</T.Muted>

        <T.Label style={s.label}>What should we call you?</T.Label>
        <TextInput value={name} onChangeText={setName} placeholder="Your first name" placeholderTextColor={C.textFaint} style={s.input} />

        <T.Label style={s.label}>What do you love on a trip?</T.Label>
        <View style={s.chips}>
          {INTERESTS.map((x) => <Chip key={x.id} label={x.label} on={interests.includes(x.id)} onPress={() => toggleInterest(x.id)} />)}
        </View>

        <T.Label style={s.label}>Usual trip length</T.Label>
        <View style={s.stepper}>
          <Pressable style={s.step} onPress={() => setDays(Math.max(1, days - 1))} accessibilityLabel="Fewer days"><Icon name="minus" /></Pressable>
          <T.Num style={{ fontSize: 22, minWidth: 24, textAlign: 'center' }}>{days}</T.Num>
          <T.Muted>days</T.Muted>
          <Pressable style={s.step} onPress={() => setDays(Math.min(5, days + 1))} accessibilityLabel="More days"><Icon name="plus" /></Pressable>
        </View>
      </ScrollView>
      <Button title="Start exploring" icon="arrow" onPress={() => router.replace('/explore')} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.surface, paddingHorizontal: 24, paddingBottom: 24 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, marginBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  progress: { flex: 1, height: 6, borderRadius: 99, backgroundColor: C.surface2, overflow: 'hidden' },
  progressFill: { width: '80%', height: '100%', backgroundColor: C.accent, borderRadius: 99 },
  label: { marginTop: 26, marginBottom: 10 },
  input: { fontFamily: F.medium, fontSize: 17, color: C.text, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 5 },
  step: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
});
