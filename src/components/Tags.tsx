import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../theme';

export function ProTag({ children }: { children: string }) {
  return (
    <View style={styles.proContainer}>
      <View style={styles.proDot} />
      <Text style={styles.proText}>{children}</Text>
    </View>
  );
}

export function ConTag({ children }: { children: string }) {
  return (
    <View style={styles.conContainer}>
      <View style={styles.conDot} />
      <Text style={styles.conText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  proContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.sageSoft,
    borderWidth: 1,
    borderColor: 'rgba(107,142,90,0.25)',
  },
  proDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.sage,
  },
  proText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: '#3F5933',
    letterSpacing: 0.1,
  },
  conContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.claySoft,
    borderWidth: 1,
    borderColor: 'rgba(168,90,74,0.22)',
  },
  conDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.clay,
  },
  conText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: '#7B3A2E',
    letterSpacing: 0.1,
  },
});
