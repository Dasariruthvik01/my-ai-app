import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import { tokens } from '../../theme/tokens';

interface RoleCarouselProps {
  children: React.ReactNode[];
  cardWidth: number;
  gap: number;
}

export const RoleCarousel: React.FC<RoleCarouselProps> = ({ children, cardWidth, gap }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  
  // To allow snapping properly with the gap, the interval should be cardWidth + gap
  const snapInterval = cardWidth + gap;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / snapInterval);
    if (index !== activeIndex && index >= 0 && index < children.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingLeft: 24, // first card aligned with page left padding
          paddingRight: windowWidth - cardWidth - 24, // allows the last card to reach the start
          gap: gap,
        }}
        accessibilityRole="scrollbar"
        accessibilityLabel="Roles"
      >
        {children}
      </ScrollView>
      
      <View style={styles.pagination} accessibilityRole="tablist">
        {children.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.activeDot]}
            accessibilityRole="tab"
            accessibilityLabel={`Role ${i + 1} of ${children.length}`}
            accessibilityState={{ selected: i === activeIndex }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.textMuted,
    opacity: 0.5,
  },
  activeDot: {
    width: 24, // elongated white pill
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.textPrimary,
    opacity: 1,
  },
});
