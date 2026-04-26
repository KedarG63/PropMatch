import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../theme';

interface ChipItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface Props {
  items: ChipItem[];
  value: string;
  onChange: (id: string) => void;
}

export default function ChipRow({ items, value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {items.map(item => {
        const active = value === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            {item.icon && <View>{item.icon}</View>}
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
              {item.label}
            </Text>
            {item.count !== undefined && (
              <Text style={[styles.chipCount, active && styles.chipCountActive]}>
                {item.count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.line2,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ink2,
  },
  chipLabelActive: {
    color: Colors.cream,
  },
  chipCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    opacity: 0.7,
  },
  chipCountActive: {
    color: Colors.cream,
    opacity: 0.8,
  },
});
