import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AzeretMono_400Regular, AzeretMono_600SemiBold } from '@expo-google-fonts/azeret-mono';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TripProvider } from '@/lib/trip';
import { C, F } from '@/components/ui';
import { LeafPin } from '@/components/icons';

export default function RootLayout() {
  // Render immediately (fonts swap in) so the static web export ships real HTML.
  useFonts({
    'Satoshi-Regular': require('../../assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Medium': require('../../assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Bold': require('../../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Black': require('../../assets/fonts/Satoshi-Black.ttf'),
    AzeretMono_400Regular,
    AzeretMono_600SemiBold,
  });

  return (
    <SafeAreaProvider>
      <TripProvider>
        <StatusBar style="dark" />
        <WebFrame>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.surface }, animation: 'slide_from_right' }} />
        </WebFrame>
      </TripProvider>
    </SafeAreaProvider>
  );
}

// On a laptop / projector the web build shows the app inside a phone, next to
// the brand. On a real phone (or a narrow window) it is full-screen.
function WebFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 760) return <View style={{ flex: 1 }}>{children}</View>;
  return (
    <View style={s.stage}>
      <View style={s.side}>
        <LeafPin size={64} />
        <Text style={s.sideName}>VoyaGreen</Text>
        <Text style={s.sideLine}>Same great trip.{'\n'}Less pressure on the places we love.</Text>
      </View>
      <View style={s.phone}>{children}</View>
    </View>
  );
}

const web = (o: object) => (Platform.OS === 'web' ? o : {});
const s = StyleSheet.create({
  stage: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 72, backgroundColor: C.bg,
    ...web({ backgroundImage: `radial-gradient(900px 600px at 12% 18%, ${C.glow}, transparent 60%), radial-gradient(700px 500px at 92% 95%, ${C.accent50}, transparent 60%)` }) },
  side: { maxWidth: 300 },
  sideName: { fontFamily: F.black, fontSize: 44, letterSpacing: -1.4, color: C.text, marginTop: 12, marginBottom: 8 },
  sideLine: { fontFamily: F.regular, fontSize: 18, lineHeight: 27, color: C.textMuted },
  phone: { width: 390, height: 844, borderRadius: 48, borderWidth: 10, borderColor: C.text, overflow: 'hidden', backgroundColor: C.surface,
    ...web({ boxShadow: `0 40px 80px -30px ${C.accent900}` }) },
});
