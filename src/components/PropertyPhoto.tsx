import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PropertyTone } from '../types';
import { Fonts } from '../theme';

const PALETTES: Record<PropertyTone, string[]> = {
  a: ['#D4C5A9', '#A8957A', '#7C6B53', '#4A3F30'],
  b: ['#C9B8A0', '#8B7560', '#5B4A38', '#33271C'],
  c: ['#E0CFB6', '#B8A088', '#7E6B53', '#3F3324'],
  d: ['#CBB89E', '#9C8568', '#6B5841', '#352B1E'],
  e: ['#D9C7AC', '#A0876A', '#665440', '#2E2516'],
};

interface Props {
  tone?: PropertyTone;
  idx?: number;
  height?: number;
  label?: string;
  video?: boolean;
  photos?: string[];
}

export default function PropertyPhoto({ tone = 'a', idx = 0, height = 200, label, video, photos }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [width, setWidth] = useState(0);
  const p = PALETTES[tone];
  const hasPhotos = photos && photos.length > 0;

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
    >
      {hasPhotos && width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          style={{ width, height }}
        >
          {photos.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={{ width, height }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : (
        <>
          <LinearGradient colors={[p[0], p[1]]} style={StyleSheet.absoluteFill} />
          <View style={[styles.horizon, { backgroundColor: p[2], top: height * 0.6 }]} />
          {idx % 3 === 0 && <>
            <View style={[styles.building, { left: '10%', width: '22%', height: height * 0.5, backgroundColor: p[3], bottom: 0 }]} />
            <View style={[styles.building, { left: '37%', width: '30%', height: height * 0.58, backgroundColor: p[2], bottom: 0 }]} />
            <View style={[styles.building, { right: '8%', width: '20%', height: height * 0.44, backgroundColor: p[3], bottom: 0 }]} />
          </>}
          {idx % 3 === 1 && <>
            <View style={[styles.building, { left: '5%', width: '35%', height: height * 0.42, backgroundColor: p[3], bottom: 0 }]} />
            <View style={[styles.building, { left: '45%', width: '25%', height: height * 0.6, backgroundColor: p[2], bottom: 0 }]} />
            <View style={[styles.building, { right: '5%', width: '20%', height: height * 0.34, backgroundColor: p[3], bottom: 0 }]} />
          </>}
          {idx % 3 === 2 && <>
            <View style={[styles.building, { left: '12%', width: '20%', height: height * 0.55, backgroundColor: p[2], bottom: 0 }]} />
            <View style={[styles.building, { left: '37%', width: '28%', height: height * 0.4, backgroundColor: p[3], bottom: 0 }]} />
            <View style={[styles.building, { right: '7%', width: '25%', height: height * 0.54, backgroundColor: p[2], bottom: 0 }]} />
          </>}
          <View style={[styles.ground, { backgroundColor: p[3], height: height * 0.16 }]} />
          <LinearGradient
            colors={['transparent', 'rgba(28,28,30,0.28)']}
            style={[StyleSheet.absoluteFill, { bottom: 0 }]}
          />
        </>
      )}

      {/* Overlays always on top */}
      {label && (
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}
      {video && (
        <View style={styles.videoBadge}>
          <Text style={styles.videoText}>▶ WALKTHROUGH</Text>
        </View>
      )}

      {/* Dots — only shown when multiple real photos */}
      {hasPhotos && photos.length > 1 && (
        <View style={styles.photoDots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIdx && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#D4C5A9',
  },
  horizon: {
    position: 'absolute',
    left: 0, right: 0,
    height: 40,
    opacity: 0.55,
  },
  building: { position: 'absolute' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  labelBadge: {
    position: 'absolute', bottom: 10, left: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(28,28,30,0.55)', borderRadius: 4,
  },
  labelText: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5,
    color: '#F5F0E8', textTransform: 'uppercase',
  },
  videoBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(28,28,30,0.7)', borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  videoText: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, color: '#F5F0E8',
  },
  photoDots: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    flexDirection: 'row', gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { width: 16, backgroundColor: 'rgba(255,255,255,0.95)' },
});
