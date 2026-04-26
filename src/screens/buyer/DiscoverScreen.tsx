import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import ChipRow from '../../components/ChipRow';
import PropertyPhoto from '../../components/PropertyPhoto';
import type { Listing } from '../../types';

const LISTINGS: Listing[] = [
  {
    id: 'l1', tone: 'c', idx: 1, photos: 6, video: true, badge: 'NEW',
    title: '3 BHK Flat · Baner', price: '₹1.38 Cr',
    sub: '1,250 sq ft · 6th floor · East facing · Semi-furnished',
    broker: 'Rahul Mehta', firm: 'Golden Keys Realty', verified: true,
    rera: 'P52100012345',
  },
  {
    id: 'l2', tone: 'a', idx: 0, photos: 5, video: false, badge: 'PRICE DROP',
    title: '2 BHK · Aundh', price: '₹1.05 Cr',
    sub: '920 sq ft · 4th floor · North-east · Unfurnished',
    broker: 'Devika Rao', firm: 'Cedar Estates', verified: true,
    rera: 'P52100029988', dropFrom: '₹1.18 Cr',
  },
  {
    id: 'l3', tone: 'd', idx: 2, photos: 7, video: true,
    title: '3 BHK · Balewadi High St.', price: '₹1.62 Cr',
    sub: '1,420 sq ft · 9th floor · West facing · Fully furnished',
    broker: 'Imran Sayyed', firm: 'Northwind Realty', verified: false,
    rera: null,
  },
];

interface Props {
  openConnect: (listing: Listing) => void;
}

export default function DiscoverScreen({ openConnect }: Props) {
  const [sort, setSort] = useState('budget');
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('');

  return (
    <View style={styles.container}>
      <EditorialHeader
        kicker="Discover · Curated for you"
        title="Browse Properties"
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.locationBtn}>
              <Text style={styles.locationBtnText}>📍 Pune ∨</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterIconBtn}>
              <Text>⊟</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ChipRow
        value={sort}
        onChange={setSort}
        items={[
          { id: 'budget', label: 'Budget' },
          { id: 'bhk', label: 'BHK' },
          { id: 'possession', label: 'Possession' },
          { id: 'new', label: 'New listings' },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {LISTINGS.map(l => (
          <View key={l.id} style={styles.card}>
            {/* Photo zone */}
            <View style={styles.photoContainer}>
              <PropertyPhoto tone={l.tone} idx={l.idx} height={210} video={l.video} />
              {/* Badge */}
              {l.badge && (
                <View style={[
                  styles.badge,
                  { backgroundColor: l.badge === 'NEW' ? Colors.ink : Colors.rust },
                ]}>
                  <Text style={styles.badgeText}>
                    {l.badge === 'PRICE DROP' ? '↓ PRICE DROPPED' : l.badge}
                  </Text>
                </View>
              )}
              {/* Photo dots */}
              <View style={styles.photoDots}>
                {[...Array(l.photos)].map((_, k) => (
                  <View key={k} style={[styles.dot, k === 0 && styles.dotActive]} />
                ))}
              </View>
              {/* Save button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => setSaved(s => ({ ...s, [l.id]: !s[l.id] }))}
              >
                <Text style={{ fontSize: 14, color: saved[l.id] ? Colors.rust : Colors.ink }}>
                  {saved[l.id] ? '🔖' : '📄'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.propertyTitle} numberOfLines={1}>{l.title}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  {l.dropFrom && (
                    <Text style={styles.dropFrom}>{l.dropFrom}</Text>
                  )}
                  <Text style={styles.price}>{l.price}</Text>
                </View>
              </View>
              <Text style={styles.sub}>{l.sub}</Text>

              {/* Broker strip */}
              <View style={styles.brokerStrip}>
                <View style={styles.brokerAvatar}>
                  <Text style={styles.brokerAvatarText}>{initials(l.broker)}</Text>
                </View>
                <View style={styles.brokerInfo}>
                  <View style={styles.brokerNameRow}>
                    <Text style={styles.brokerName}>{l.broker}</Text>
                    {l.verified && <Text style={styles.verifiedBadge}>✓</Text>}
                  </View>
                  <Text style={styles.brokerFirm}>
                    {l.firm}{l.rera ? ` · RERA ${l.rera.slice(-5)}` : ''}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => openConnect(l)}
                >
                  <Text style={styles.connectBtnText}>💬  Send connection request</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveActionBtn}
                  onPress={() => setSaved(s => ({ ...s, [l.id]: !s[l.id] }))}
                >
                  <Text style={[styles.saveActionBtnText, saved[l.id] && { color: Colors.rust }]}>
                    {saved[l.id] ? '🔖 Saved' : '📄 Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.endLabel}>— End of curated listings —</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 18 },
  headerRight: { flexDirection: 'row', gap: 8 },
  locationBtn: {
    height: 34, paddingHorizontal: 10, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2, backgroundColor: Colors.paper,
    justifyContent: 'center', alignItems: 'center',
  },
  locationBtnText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink },
  filterIconBtn: {
    width: 34, height: 34, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2, backgroundColor: Colors.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  photoContainer: { position: 'relative' },
  badge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4,
  },
  badgeText: {
    fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8, color: Colors.cream,
  },
  photoDots: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    flexDirection: 'row', gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { width: 16, backgroundColor: 'rgba(255,255,255,0.95)' },
  saveBtn: {
    position: 'absolute', top: 12, left: 12,
    width: 34, height: 34, borderRadius: 999,
    backgroundColor: 'rgba(245,240,232,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 18 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 5,
  },
  propertyTitle: {
    fontFamily: Fonts.serif, fontSize: 19, letterSpacing: -0.3,
    color: Colors.ink, flex: 1,
  },
  dropFrom: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted,
    textDecorationLine: 'line-through', textAlign: 'right',
  },
  price: {
    fontFamily: Fonts.serifItalic, fontSize: 19, color: Colors.rust, fontWeight: '600',
  },
  sub: { fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.ink3, marginBottom: 14 },
  brokerStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10,
    backgroundColor: Colors.cream2, borderWidth: 1, borderColor: Colors.line,
    marginBottom: 14,
  },
  brokerAvatar: {
    width: 34, height: 34, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  brokerAvatarText: {
    fontFamily: Fonts.serifItalic, fontWeight: '700', fontSize: 14, color: Colors.cream,
  },
  brokerInfo: { flex: 1, minWidth: 0 },
  brokerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  brokerName: { fontFamily: Fonts.sansBold, fontSize: 12.5, color: Colors.ink },
  verifiedBadge: {
    fontSize: 10, color: Colors.sage,
    backgroundColor: Colors.sageSoft, paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 4,
  },
  brokerFirm: { fontFamily: Fonts.mono, fontSize: 10.5, color: Colors.muted, letterSpacing: 0.4 },
  actions: { flexDirection: 'row', gap: 8 },
  connectBtn: {
    flex: 1, padding: 12, borderRadius: 12, backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  connectBtnText: { fontFamily: Fonts.sansBold, fontSize: 12.5, color: Colors.cream },
  saveActionBtn: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.line2, backgroundColor: Colors.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  saveActionBtnText: { fontFamily: Fonts.sansMedium, fontSize: 12.5, color: Colors.ink },
  endLabel: {
    textAlign: 'center', padding: 16,
    fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 2.2,
    color: Colors.muted, textTransform: 'uppercase',
  },
});
