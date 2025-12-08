import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { type InviteData } from '@/lib/invites';
import { PendingInviteItem } from './PendingInviteItem';

interface PendingInvitesListProps {
  invites: InviteData[];
  onInviteCancelled: () => void;
}

export function PendingInvitesList({ invites, onInviteCancelled }: PendingInvitesListProps) {
  const { t } = useTranslation();

  if (invites.length === 0) {
    return null;
  }

  return (
    <View style={styles.pendingInvitesSection}>
      <Text style={styles.sectionTitle}>{t('groups.invite.pendingInvites')}</Text>
      {invites.map((invite) => (
        <PendingInviteItem
          key={invite.id}
          invite={invite}
          onInviteCancelled={onInviteCancelled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pendingInvitesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
});

