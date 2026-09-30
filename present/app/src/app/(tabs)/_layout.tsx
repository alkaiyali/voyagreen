import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '@/components/ui';
import { Icon, LeafPin } from '@/components/icons';

export default function TabsLayout() {
  // Fixed height must include the home-indicator inset or labels sit under it.
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.accentText,
      tabBarInactiveTintColor: C.textMuted,
      tabBarLabelStyle: { fontFamily: F.bold, fontSize: 11 },
      tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, height: 64 + bottom, paddingTop: 6, paddingBottom: 8 + bottom },
      sceneStyle: { backgroundColor: C.bg },
    }}>
      <Tabs.Screen name="explore" options={{ title: 'Plan', tabBarIcon: ({ color }) => <Icon name="compass" color={color as string} /> }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: ({ color, focused }) => <LeafPin size={22} color={focused ? C.accent : (color as string)} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon name="user" color={color as string} /> }} />
    </Tabs>
  );
}
