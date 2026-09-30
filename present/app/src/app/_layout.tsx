import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AzeretMono_400Regular, AzeretMono_600SemiBold } from '@expo-google-fonts/azeret-mono';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TripProvider } from '@/lib/trip';
import { C } from '@/components/ui';

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
        {/* Full-screen on phones; on wide web windows, a centred mobile-width
            column. Pure style, no width branching, so SSR and client match. */}
        <View style={s.stage}>
          <View style={s.column}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.surface }, animation: 'slide_from_right' }} />
          </View>
        </View>
      </TripProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  stage: { flex: 1, backgroundColor: C.bg },
  column: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: C.surface, overflow: 'hidden' },
});
