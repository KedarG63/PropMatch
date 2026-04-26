import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadow } from '../theme';

interface Props {
  kicker?: string;
  title: string;
  count?: string;
  right?: React.ReactNode;
}

export default function EditorialHeader({ kicker, title, count, right }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {kicker && <Text style={styles.kicker}>{kicker}</Text>}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {count && <Text style={styles.count}>· {count}</Text>}
        </View>
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: Colors.paper,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 2,
    color: Colors.rust,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 30,
    color: Colors.ink,
  },
  count: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.8,
  },
});
