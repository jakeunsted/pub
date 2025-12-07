import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
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
