import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InviteForm } from '@/components/group/InviteForm';
import { Button, ButtonText } from '@/components/ui/button';
import { type InviteData } from '@/lib/invites';
import { useTranslation } from 'react-i18next';
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
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <View style={styles.inviteSection}>
      {!showInviteForm ? (
        <Button
          onPress={() => setShowInviteForm(true)}
          size="lg"
          action="primary"
          style={styles.inviteButton}
        >
          <ButtonText>{t('groups.invite.invite')}</ButtonText>
        </Button>
      ) : (
        <InviteForm
          groupId={groupId}
          inviterId={inviterId}
          onSuccess={() => {
            setShowInviteForm(false);
            onInvitesChanged();
          }}
          onCancel={() => setShowInviteForm(false)}
        />
      )}

      <PendingInvitesList invites={pendingInvites} onInviteCancelled={onInvitesChanged} />
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
});

