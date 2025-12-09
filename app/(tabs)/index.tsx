import { useState } from 'react';
import { StyleSheet } from 'react-native';

import PendingRequestsModal from '@/components/pub/PendingRequestsModal';
import PubQuestionButton from '@/components/pub/PubQuestionButton';
import { View } from '@/components/Themed';

export default function PubScreen() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleQuestionSent = (groupId: string, groupName: string) => {
    console.log(`Pub question sent to group ${groupName} (${groupId})`);
    // Trigger refresh of pending requests
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.modalContainer}>
        <PendingRequestsModal refreshTrigger={refreshTrigger} />
      </View>
      <View style={styles.buttonContainer}>
        <PubQuestionButton onQuestionSent={handleQuestionSent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  buttonContainer: {
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
