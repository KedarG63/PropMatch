import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import PropertyPhoto from '../../components/PropertyPhoto';

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function WelcomeScreen({ onGetStarted, onSignIn }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <PropertyPhoto tone="c" idx={1} height={300} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroIssue}>PropMatch · Pune</Text>
            <Text style={styles.heroTagline}>
              Real estate,{'\n'}
              <Text style={styles.heroTaglineItalic}>without the noise.</Text>
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.kicker}>— Your property journey starts here —</Text>
          <Text style={styles.title}>
            Find your home.{'\n'}
            <Text style={styles.titleRust}>On your terms.</Text>
          </Text>
          <Text style={styles.sub}>
            Connect with verified brokers who match your exact requirement.
            No cold calls. No spam. Just properties worth your time.
          </Text>

          <View style={styles.pillRow}>
            {['Verified Brokers', 'No Spam', 'Pune Market'].map(p => (
              <View key={p} style={styles.pill}>
                <Text style={styles.pillText}>{p}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={onGetStarted} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={onSignIn} activeOpacity={0.75}>
            <Text style={styles.btnSecondaryText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

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
    paddingBottom: 40,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(28,28,30,0.55)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 28,
    left: 28,
    right: 28,
  },
  heroIssue: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    color: 'rgba(245,240,232,0.65)',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTagline: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.cream,
  },
  heroTaglineItalic: {
    fontFamily: Fonts.serifItalic,
    fontSize: 30,
  },
  body: {
    padding: 28,
    paddingTop: 32,
  },
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.rust,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  titleRust: {
    color: Colors.rust,
    fontFamily: Fonts.serifItalic,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink3,
    textAlign: 'center',
    marginBottom: 24,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.cream2,
    borderWidth: 1,
    borderColor: Colors.line2,
  },
  pillText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.ink3,
    textTransform: 'uppercase',
  },
  btnPrimary: {
    backgroundColor: Colors.rust,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 12,
    ...Shadow.md,
  },
  btnPrimaryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.cream,
    letterSpacing: 0.3,
  },
  btnSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.ink3,
    textDecorationLine: 'underline',
  },
  footer: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Colors.muted,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
