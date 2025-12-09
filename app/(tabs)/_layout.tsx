import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { usePendingRequestCount } from '@/hooks/usePendingRequestCount';

export default function TabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const pendingCount = usePendingRequestCount();

  if (isIOS) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index" badge={pendingCount > 0 ? pendingCount : undefined}>
          <Icon sf="mug.fill" />
          <Label>Pub?</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="groups">
          <Icon sf="person.3.fill" />
          <Label>My groups</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="me">
          <Icon sf="person.fill" />
          <Label>Me</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        ...(isWeb && {
          tabBarStyle: {
            position: 'fixed' as const,
            bottom: 0,
            left: 0,
            right: 0,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pub?',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="beer" size={size} color={color} />
          ),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'My groups',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
