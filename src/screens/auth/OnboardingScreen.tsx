import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import PropertyPhoto from '../../components/PropertyPhoto';
import type { Role } from '../../types';

interface Props {
  onPick: (role: Role) => void;
}

export default function OnboardingScreen({ onPick }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const options = [
    {
      id: 'buyer' as Role,
      title: "I'm a Buyer",
      sub: 'Track properties, post requirements,\nstay in control of who reaches you.',
      icon: '🏠',
    },
    {
      id: 'broker' as Role,
      title: "I'm a Broker",
      sub: 'Reach genuinely interested buyers.\nNo cold calls, only matched intent.',
      icon: '🔑',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero photo */}
        <View style={styles.heroContainer}>
          <PropertyPhoto tone="b" idx={2} height={240} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroIssue}>Issue No. 01 · Spring 2026</Text>
            <Text style={styles.heroTagline}>
              The home you remember,{'\n'}
              <Text style={styles.heroTaglineItalic}>finally remembers you.</Text>
            </Text>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeKicker}>— Welcome to PropMatch —</Text>
          <Text style={styles.welcomeTitle}>
            How will you be{'\n'}
            <Text style={styles.welcomeTitleRust}>arriving today?</Text>
          </Text>
        </View>

        {/* Role cards */}
        <View style={styles.cards}>
          {options.map(opt => {
            const active = hover === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPressIn={() => setHover(opt.id)}
                onPressOut={() => setHover(null)}
                onPress={() => onPick(opt.id)}
                style={[styles.card, active && styles.cardActive]}
                activeOpacity={0.9}
              >
                <View style={[styles.cardIcon, active && styles.cardIconActive]}>
                  <Text style={styles.iconEmoji}>{opt.icon}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                    {opt.title}
                  </Text>
                  <Text style={[styles.cardSub, active && styles.cardSubActive]}>
                    {opt.sub}
                  </Text>
                </View>
                <Text style={[styles.cardArrow, active && styles.cardArrowActive]}>→</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>No spam · Your control · Verified only</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heroContainer: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 28,
    position: 'relative',
    ...Shadow.md,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(28,28,30,0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 18,
    right: 18,
  },
  heroIssue: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(245,240,232,0.75)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTagline: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.cream,
  },
  heroTaglineItalic: {
    fontFamily: Fonts.serifItalic,
    fontSize: 22,
  },
  welcomeBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeKicker: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.rust,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  welcomeTitle: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: 'center',
    color: Colors.ink,
  },
  welcomeTitleRust: {
    color: Colors.rust,
    fontFamily: Fonts.serifItalic,
  },
  cards: {
    gap: 12,
    marginBottom: 'auto',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.sm,
  },
  cardActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
    ...Shadow.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: Colors.cream2,
    borderWidth: 1,
    borderColor: Colors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconActive: {
    backgroundColor: 'rgba(245,240,232,0.1)',
    borderColor: 'rgba(245,240,232,0.18)',
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    lineHeight: 22,
    marginBottom: 4,
    color: Colors.ink,
  },
  cardTitleActive: {
    color: Colors.cream,
  },
  cardSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.ink3,
    opacity: 0.8,
  },
  cardSubActive: {
    color: Colors.cream,
  },
  cardArrow: {
    fontSize: 18,
    color: Colors.ink,
  },
  cardArrowActive: {
    color: Colors.cream,
  },
  footer: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Colors.muted,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 24,
  },
});
