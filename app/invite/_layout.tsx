import { Stack } from 'expo-router';

export default function InviteLayout() {
  return (
    <Stack>
      <Stack.Screen name="[token]" options={{ headerShown: false }} />
    </Stack>
  );
}

