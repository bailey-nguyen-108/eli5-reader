import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Path, Text, TextPath } from 'react-native-svg';

export default function ImportSticker() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ rotate }] }]}>
      <Svg width="80" height="80" viewBox="0 0 100 100">
        <Defs>
          <Path
            id="circle-path"
            d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
          />
        </Defs>
        <Circle cx="50" cy="50" r="48" fill="#4DFF7E" />
        <Text
          fill="black"
          fontSize="14"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="Inter"
        >
          <TextPath href="#circle-path">Explain • Like • I'm • Five • </TextPath>
        </Text>
        <Circle cx="50" cy="50" r="15" fill="black" />
        <Path
          d="M45 50L55 50M50 45L50 55"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
  },
});
