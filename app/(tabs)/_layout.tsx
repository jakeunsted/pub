import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

export default function TabLayout() {
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          ...(Platform.OS === 'web' && {
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

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf="mug.fill" drawable="ic_local_bar" />
        <Label>Pub?</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="groups">
        <Icon sf="person.3.fill" drawable="ic_group" />
        <Label>My groups</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me">
        <Icon sf="person.fill" drawable="ic_person" />
        <Label>Me</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
