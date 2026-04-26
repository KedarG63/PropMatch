import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import type { Role } from '../../types';

interface Props {
  role: Role;
  setRole: (role: Role) => void;
}

export default function ProfileScreen({ role, setRole }: Props) {
  const isBuyer = role === 'buyer';

  return (
    <View style={styles.container}>
      <EditorialHeader kicker="Account" title="Profile" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{isBuyer ? 'AB' : 'RM'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{isBuyer ? 'Aanya Bhatia' : 'Rahul Mehta'}</Text>
            <View style={styles.profileMeta}>
              <Text style={styles.verifiedIcon}>✓</Text>
              <Text style={styles.profileMetaText}>
                Verified · {isBuyer ? 'Buyer since Mar 2026' : 'Golden Keys Realty'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        {[
          { label: 'Privacy & control', sub: 'Who can reach you, mute history' },
          { label: 'Verified credentials', sub: 'PAN · Aadhaar · RERA' },
          { label: 'Notification preferences', sub: 'Quiet hours, digest' },
          { label: 'Help & guidelines', sub: 'How PropMatch keeps spam out' },
        ].map(r => (
          <TouchableOpacity key={r.label} style={styles.menuItem}>
            <View style={styles.menuItemBody}>
              <Text style={styles.menuItemLabel}>{r.label}</Text>
              <Text style={styles.menuItemSub}>{r.sub}</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Switch role */}
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => setRole(isBuyer ? 'broker' : 'buyer')}
        >
          <Text style={styles.switchBtnText}>
            ↻ Switch to {isBuyer ? 'Broker' : 'Buyer'} view (demo)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 100, gap: 8 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderRadius: 16,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
    marginBottom: 10, ...Shadow.sm,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 999,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.serifItalic, fontWeight: '700', fontSize: 22, color: Colors.cream,
  },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: Fonts.serif, fontSize: 19, fontWeight: '600', color: Colors.ink, marginBottom: 4 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  verifiedIcon: { fontSize: 11, color: Colors.sage },
  profileMetaText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, letterSpacing: 0.5 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, paddingHorizontal: 16,
    borderRadius: 12, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
  },
  menuItemBody: { flex: 1 },
  menuItemLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  menuItemSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, marginTop: 2 },
  menuChevron: { fontSize: 18, color: Colors.muted },
  switchBtn: {
    marginTop: 6, padding: 12, borderRadius: 12,
    backgroundColor: 'transparent', borderWidth: 1,
    borderStyle: 'dashed', borderColor: Colors.line2,
    alignItems: 'center',
  },
  switchBtnText: {
    fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1.8,
    color: Colors.ink3, textTransform: 'uppercase',
  },
});
