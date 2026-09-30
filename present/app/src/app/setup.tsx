import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomBar, Button, C, DaysStepper, F, IconButton, InterestPicker, T } from '@/components/ui';
import { useTrip } from '@/lib/trip';

// First-run setup, and the same form later as "edit preferences" (?edit=1).
export default function Setup() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { name, setName, interests, toggleInterest, days, setDays } = useTrip();
  const ready = interests.length > 0;
  const done = () => (edit ? router.back() : router.replace('/explore'));

  return (
    <SafeAreaView style={s.wrap} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.bar}>
          <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
        <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
          <T.H1>{edit ? 'Your trip\npreferences' : 'What’s your\nkind of trip?'}</T.H1>
          <T.Muted style={{ marginTop: 8 }}>We match greener places and plan your days around this. Change it anytime.</T.Muted>

          <View style={s.labelRow}>
            <T.Label>What do you love?</T.Label>
            <T.Label style={{ color: ready ? C.accentText : C.textMuted }}>{ready ? `${interests.length} picked` : 'Pick one or more'}</T.Label>
          </View>
          <InterestPicker value={interests} onToggle={toggleInterest} />

          <T.Label style={s.label}>How many days?</T.Label>
          <DaysStepper value={days} onChange={setDays} />

          <T.Label style={s.label}>Your first name · optional</T.Label>
          <TextInput value={name} onChangeText={setName} placeholder="So we can say hi" placeholderTextColor={C.textMuted} style={s.input}
            accessibilityLabel="Your first name, optional" autoCapitalize="words" autoComplete="given-name" textContentType="givenName" returnKeyType="done" />
        </ScrollView>
        <BottomBar>
          <Button title={ready ? (edit ? 'Save preferences' : 'Continue') : 'Pick at least one interest'} icon={ready ? (edit ? 'check' : 'arrow') : undefined}
            disabled={!ready} onPress={done} />
        </BottomBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.surface },
  bar: { paddingHorizontal: 24, paddingVertical: 10 },
  pad: { paddingHorizontal: 24, paddingBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  label: { marginTop: 28, marginBottom: 12 },
  input: { fontFamily: F.medium, fontSize: 17, color: C.text, borderWidth: 1.5, borderColor: C.textFaint, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
});
