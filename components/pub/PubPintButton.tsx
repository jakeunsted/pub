import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { Button } from '@/components/ui/button';

type PubPintStatus = 'idle' | 'cheer';

interface PubPintButtonProps {
  status?: PubPintStatus;
  onPress?: () => void;
}

export default function PubPintButton({ status = 'idle', onPress }: PubPintButtonProps) {
  const cheerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'cheer') {
      cheerAnim.setValue(0);

      Animated.timing(cheerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [status, cheerAnim]);

  // Continuous pulsing animation
  useEffect(() => {
    const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulseAnimation(pulseAnim1, 0);
    const pulse2 = createPulseAnimation(pulseAnim2, 667);
    const pulse3 = createPulseAnimation(pulseAnim3, 1334);

    pulse1.start();
    pulse2.start();
    pulse3.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      pulse3.stop();
    };
  }, [pulseAnim1, pulseAnim2, pulseAnim3]);

  // Beer SVG component
  const BeerSvg = ({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) => (
    <Svg width={30} height={38} viewBox="0 0 30 38">
      <Path
        d="M27.3442657,10.9323999 L27.3442657,30.4083463 C27.3442657,30.6656011 27.3885964,30.9208753 27.475256,31.1626416 L28.4584173,33.9055044 C28.8690541,35.0511154 28.286502,36.317526 27.1572509,36.7341117 C26.9189371,36.8220268 26.6673082,36.8669997 26.4137272,36.8669997 L8.6936804,36.8669997 C7.49208526,36.8669997 6.51799995,35.8788026 6.51799995,34.6597997 C6.51799995,34.402545 6.56233068,34.1472707 6.64899021,33.9055044 L7.63215163,31.1626416 C7.71881116,30.9208753 7.76314189,30.6656011 7.76314189,30.4083463 L7.76314189,10.9323999"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.37976466,10.7050955 C4.03739944,7.21236807 7.37976466,4.43127908 9.62402739,4.68029805 C10.9707312,-0.311641291 16.3416716,-0.14115035 17.4789469,4.68029805 C19.1709488,-0.486993238 25.0730464,0.289582317 25.3338664,5.22597205 C29.5557705,3.93166238 30.2108846,9.27699993 27.5781291,10.7050955 L17.4789469,10.7050955 C17.8529907,15.2710317 16.7308593,17.5539999 14.1125529,17.5539999 C11.4942463,17.5539999 10.5591369,15.2710317 11.3072244,10.7050955 L7.37976466,10.7050955 Z"
        fill="#FFFDF5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.62159994,12.5877999 C-4.64593547,12.5877999 3.03123906,24.2813068 7.62159994,28.5899998 L7.62159994,23.890911 C3.60560163,21.0340593 1.29269476,15.5984013 7.62159994,15.5984013 L7.62159994,12.5877999 Z"
        fill={fillColor}
        opacity="0.6"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12.3051233"
        y1="20.3129998"
        x2="12.3186765"
        y2="29.1054606"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="17.8231233"
        y1="20.3129998"
        x2="17.8366765"
        y2="29.1054606"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="23.3411232"
        y1="16.4503999"
        x2="23.3546764"
        y2="29.1054606"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  // Left beer transform
  const leftTranslateX = cheerAnim.interpolate({
    inputRange: [0, 0.35, 0.55, 1],
    outputRange: [-11, -18, -9, -11],
  });

  const leftRotate = cheerAnim.interpolate({
    inputRange: [0, 0.35, 0.55, 1],
    outputRange: ['10deg', '16deg', '6deg', '10deg'],
  });

  // Right beer transform
  const rightTranslateX = cheerAnim.interpolate({
    inputRange: [0, 0.35, 0.55, 1],
    outputRange: [-11, -18, -9, -11],
  });

  const rightRotate = cheerAnim.interpolate({
    inputRange: [0, 0.35, 0.55, 1],
    outputRange: ['-10deg', '-16deg', '-6deg', '-10deg'],
  });

  // Pulsing ring animations
  const pulseScale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const pulseOpacity1 = pulseAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const pulseScale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const pulseOpacity2 = pulseAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const pulseScale3 = pulseAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const pulseOpacity3 = pulseAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={styles.buttonWrapper}>
      {/* Pulsing rings */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseScale1 }],
            opacity: pulseOpacity1,
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseScale2 }],
            opacity: pulseOpacity2,
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseScale3 }],
            opacity: pulseOpacity3,
          },
        ]}
        pointerEvents="none"
      />

      <Button
        onPress={onPress}
        style={[styles.button, status === 'cheer' && styles.buttonCheer]}
        className="rounded-full"
        variant="outline"
        action="secondary"
      >
        <View style={styles.container} pointerEvents="none">
          {/* Left beer SVG */}
          <Animated.View
            style={[
              styles.beerLeft,
              {
                transform: [
                  { translateX: leftTranslateX },
                  { translateY: 4 },
                  { rotate: leftRotate },
                ],
              },
            ]}
          >
            <BeerSvg strokeColor="#FFD700" fillColor="#FFA500" />
          </Animated.View>

          {/* Right beer SVG */}
          <Animated.View
            style={[
              styles.beerRight,
              {
                transform: [
                  { translateX: rightTranslateX },
                  { translateY: -4 },
                  { rotate: rightRotate },
                  { scaleX: -1 },
                ],
              },
            ]}
          >
            <BeerSvg strokeColor="#FF8C00" fillColor="#FFD700" />
          </Animated.View>
        </View>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#D1D6EE',
    backgroundColor: 'transparent',
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D6EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 13, 88, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    padding: 0,
    zIndex: 10,
    ...(Platform.OS === 'web' && {
      minWidth: 100,
      maxWidth: 100,
      minHeight: 100,
      maxHeight: 100,
      aspectRatio: 1,
      overflow: 'hidden',
    }),
  },
  buttonCheer: {
    shadowRadius: 14,
    elevation: 7,
  },
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beerLeft: {
    position: 'absolute',
    left:12,
    top: 31,
    zIndex: 1,
  },
  beerRight: {
    position: 'absolute',
    left: 42,
    top: 31,
    zIndex: 1,
  },
});
