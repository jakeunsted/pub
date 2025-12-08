import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cancelInvite, resendInviteEmail, type InviteData } from '@/lib/invites';

interface PendingInviteItemProps {
  invite: InviteData;
  onInviteCancelled: () => void;
}

export function PendingInviteItem({ invite, onInviteCancelled }: PendingInviteItemProps) {
  const { t } = useTranslation();

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleInviteLongPress = () => {
    Alert.alert(
      invite.email,
      t('groups.invite.inviteOptions'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('groups.invite.resend'),
          onPress: async () => {
            const { success, error } = await resendInviteEmail(invite);
            if (success) {
              Alert.alert(t('common.success'), t('groups.invite.inviteResent'));
            } else {
              Alert.alert(t('common.error'), error?.message || t('groups.invite.failedToResend'));
            }
          },
        },
        {
          text: t('groups.invite.delete'),
          style: 'destructive',
          onPress: () => handleCancelInvite(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleCancelInvite = async () => {
    Alert.alert(
      t('groups.invite.cancelInvite'),
      t('groups.invite.confirmCancel'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await cancelInvite(invite.id);
            if (success) {
              onInviteCancelled();
            } else {
              Alert.alert(t('common.error'), error?.message || 'Failed to cancel invite');
            }
          },
        },
      ]
    );
  };

  const daysLeft = getDaysUntilExpiry(invite.expires_at);
  const isExpired = daysLeft < 0;

  return (
    <Pressable
      onPress={handleInviteLongPress}
      onLongPress={handleInviteLongPress}
      style={({ pressed }) => [
        styles.inviteItem,
        pressed && styles.inviteItemPressed,
      ]}
    >
      <Card>
        <View style={styles.inviteItemContent}>
          <View style={styles.inviteItemText}>
            <Text style={styles.inviteEmail}>{invite.email}</Text>
            <Text style={styles.inviteExpiry}>
              {isExpired
                ? t('groups.invite.inviteExpired')
                : `${t('groups.invite.expiresIn')} ${daysLeft} ${t('groups.invite.days')}`}
            </Text>
          </View>
          <FontAwesome name="ellipsis-v" size={16} color="#999" style={styles.menuIcon} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  inviteItemPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  inviteItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteItemText: {
    flex: 1,
  },
  inviteEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  inviteExpiry: {
    fontSize: 12,
    opacity: 0.6,
  },
  menuIcon: {
    marginLeft: 12,
    opacity: 0.5,
  },
});

