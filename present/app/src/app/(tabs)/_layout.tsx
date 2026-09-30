import { Tabs } from 'expo-router';
import { C, F } from '@/components/ui';
import { Icon, LeafPin } from '@/components/icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.accentText,
      tabBarInactiveTintColor: C.textMuted,
      tabBarLabelStyle: { fontFamily: F.bold, fontSize: 11 },
      tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, height: 64, paddingTop: 6, paddingBottom: 8 },
      sceneStyle: { backgroundColor: C.bg },
    }}>
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color }) => <Icon name="compass" color={color as string} /> }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: ({ color, focused }) => <LeafPin size={22} color={focused ? C.accent : (color as string)} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon name="user" color={color as string} /> }} />
    </Tabs>
  );
}
