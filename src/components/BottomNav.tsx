import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Fonts } from '../theme';
import type { Role } from '../types';

type BuyerTab = 'home' | 'discover' | 'post' | 'chats' | 'profile';
type BrokerTab = 'broker' | 'matched' | 'post' | 'chats' | 'profile';
type Tab = BuyerTab | BrokerTab;

const BUYER_TABS: { id: BuyerTab; label: string; icon: string; primary?: boolean }[] = [
  { id: 'home',     label: 'Home',    icon: '⌂' },
  { id: 'discover', label: 'Discover',icon: '⊙' },
  { id: 'post',     label: 'Post',    icon: '+', primary: true },
  { id: 'chats',    label: 'Chats',   icon: '◻' },
  { id: 'profile',  label: 'Profile', icon: '○' },
];

const BROKER_TABS: { id: BrokerTab; label: string; icon: string; primary?: boolean }[] = [
  { id: 'broker',  label: 'Listings', icon: '⌂' },
  { id: 'matched', label: 'Matched',  icon: '⊙' },
  { id: 'post',    label: 'Post',     icon: '+', primary: true },
  { id: 'chats',   label: 'Chats',    icon: '◻' },
  { id: 'profile', label: 'Profile',  icon: '○' },
];

interface Props {
  tab: Tab;
  setTab: (tab: Tab) => void;
  role: Role;
  badges?: Record<string, number>;
}

export default function BottomNav({ tab, setTab, role, badges = {} }: Props) {
  const tabs = role === 'broker' ? BROKER_TABS : BUYER_TABS;

  return (
    <View style={styles.container}>
      {tabs.map(t => {
        const active = tab === t.id;
        if (t.primary) {
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={styles.primaryBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{t.icon}</Text>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={styles.tabBtn}
            activeOpacity={0.7}
          >
            {active && <View style={styles.activeIndicator} />}
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            {(badges[t.id] || 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badges[t.id]}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: 'rgba(245,240,232,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(28,28,30,0.08)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    position: 'relative',
    gap: 3,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 18,
    height: 2,
    backgroundColor: Colors.rust,
    borderRadius: 2,
  },
  tabIcon: {
    fontSize: 20,
    color: Colors.muted,
  },
  tabIconActive: {
    color: Colors.ink,
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.muted,
  },
  tabLabelActive: {
    color: Colors.ink,
  },
  primaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.rust,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: Colors.rust,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 24,
    color: Colors.cream,
    lineHeight: 28,
    marginTop: -2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    backgroundColor: Colors.rust,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});
