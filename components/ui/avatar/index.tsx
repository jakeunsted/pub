import { StyleSheet, Text, View } from 'react-native';

interface AvatarProps {
  name: string | null | undefined;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) {
    return '??';
  }

  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) {
    return '??';
  }

  if (words.length === 1) {
    // Single word: take first two characters
    const firstTwo = trimmed.substring(0, 2).toUpperCase();
    return firstTwo.length === 1 ? firstTwo + firstTwo : firstTwo;
  }

  // Multiple words: take first letter of first and last word
  const first = words[0][0].toUpperCase();
  const last = words[words.length - 1][0].toUpperCase();
  return first + last;
}

function getSizeStyles(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return { size: 32, fontSize: 12 };
    case 'large':
      return { size: 80, fontSize: 32 };
    case 'medium':
    default:
      return { size: 48, fontSize: 18 };
  }
}

export function Avatar({ name, size = 'medium', style }: AvatarProps) {
  const initials = getInitials(name);
  const { size: avatarSize, fontSize } = getSizeStyles(size);

  // Generate a consistent color based on the name
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  const backgroundColor = colors[colorIndex];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

