import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View as RNView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InviteForm } from '@/components/group/InviteForm';
import { Button, ButtonText } from '@/components/ui/button';
import { Text, View, useThemeColor } from '@/components/Themed';
import { type InviteData } from '@/lib/invites';
import { PendingInvitesList } from './PendingInvitesList';

interface InviteSectionProps {
  groupId: string;
  inviterId: string;
  pendingInvites: InviteData[];
  onInvitesChanged: () => void;
}

export function InviteSection({
  groupId,
  inviterId,
  pendingInvites,
  onInvitesChanged,
}: InviteSectionProps) {
  const { t } = useTranslation();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const backgroundColor = useThemeColor(
    { light: '#fff', dark: '#121212' },
    'background'
  );

  const handleCloseModal = () => {
    setShowInviteModal(false);
  };

  const handleSuccess = () => {
    setShowInviteModal(false);
    onInvitesChanged();
  };

  return (
    <View style={styles.inviteSection}>
      <Button
        onPress={() => setShowInviteModal(true)}
        size="lg"
        action="primary"
        style={styles.inviteButton}
      >
        <ButtonText>{t('groups.invite.invite')}</ButtonText>
      </Button>

      <PendingInvitesList invites={pendingInvites} onInviteCancelled={onInvitesChanged} />

      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <RNView style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={handleCloseModal} />
          <View style={[styles.modalContent, { backgroundColor }]}>
            <Text style={styles.modalTitle}>{t('groups.invite.sendInvite')}</Text>
            <InviteForm
              groupId={groupId}
              inviterId={inviterId}
              onSuccess={handleSuccess}
              onCancel={handleCloseModal}
            />
          </View>
        </RNView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inviteSection: {
    marginBottom: 30,
  },
  inviteButton: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: '40%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

