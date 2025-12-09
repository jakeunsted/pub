import { StyleSheet } from 'react-native';

import PubQuestionButton from '@/components/pub/PubQuestionButton';
import { View } from '@/components/Themed';

export default function PubScreen() {
  const handleQuestionSent = (groupId: string, groupName: string) => {
    console.log(`Pub question sent to group ${groupName} (${groupId})`);
  };

  return (
    <View style={styles.container}>
      <PubQuestionButton onQuestionSent={handleQuestionSent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
