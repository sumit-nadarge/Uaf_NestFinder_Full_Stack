// app/(owner)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function OwnerLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border, height: 65, paddingBottom: 10, paddingTop: 6 },
      tabBarActiveTintColor: Colors.gold,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="requests"   options={{ title: 'Requests',   tabBarIcon: ({ color }) => <Ionicons name="paper-plane" size={22} color={color} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="fees"       options={{ title: 'Fees',       tabBarIcon: ({ color }) => <Ionicons name="cash" size={22} color={color} /> }} />
    </Tabs>
  );
}
