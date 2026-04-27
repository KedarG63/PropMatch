import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import ChipRow from '../../components/ChipRow';
import PropertyPhoto from '../../components/PropertyPhoto';
import { getDiscoverListings } from '../../services/listingsService';
import { fetchRankedListings } from '../../services/apiService';
import type { Listing, AppUser } from '../../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Props {
  openConnect: (listing: Listing) => void;
  appUser?: AppUser;
}

export default function DiscoverScreen({ openConnect, appUser }: Props) {
  const [sort, setSort] = useState('budget');
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<Parameters<typeof getDiscoverListings>[1]>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [ranked, setRanked] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      // Use backend ranked results when API URL + appUser are available
      if (API_URL && appUser) {
        const results = await fetchRankedListings(appUser.uid);
        if (results) {
          setListings(results);
          setHasMore(false);
          setRanked(true);
          return;
        }
      }
      // Fall back to chronological Firestore feed
      const result = await getDiscoverListings(10);
      setListings(result.listings);
      setLastDoc(result.lastDoc ?? undefined);
      setHasMore(result.lastDoc !== null);
      setRanked(false);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || ranked) return;
    setLoadingMore(true);
    try {
      const result = await getDiscoverListings(10, lastDoc);
      setListings(prev => [...prev, ...result.listings]);
      setLastDoc(result.lastDoc ?? undefined);
      setHasMore(result.lastDoc !== null);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, lastDoc, loadingMore, ranked]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('');

  return (
    <View style={styles.container}>
      <EditorialHeader
        kicker={ranked ? 'Discover · Matched for you' : 'Discover · Curated for you'}
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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.rust} />
        </View>
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {listings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySub}>Listings posted by brokers will appear here. Check back soon.</Text>
          </View>
        )}
        {listings.map(l => (
          <View key={l.id} style={styles.card}>
            {/* Photo zone */}
            <View style={styles.photoContainer}>
              <PropertyPhoto tone={l.tone} idx={l.idx} height={210} video={l.video} photos={l.photos} />
              {/* Match score badge (ranked mode) */}
              {l.score != null && l.score > 0 && (
                <View style={[styles.badge, { backgroundColor: Colors.sage }]}>
                  <Text style={styles.badgeText}>{l.score}% MATCH</Text>
                </View>
              )}
              {/* Status badge */}
              {l.badge && !l.score && (
                <View style={[
                  styles.badge,
                  { backgroundColor: l.badge === 'NEW' ? Colors.ink : Colors.rust },
                ]}>
                  <Text style={styles.badgeText}>
                    {l.badge === 'PRICE DROP' ? '↓ PRICE DROPPED' : l.badge}
                  </Text>
                </View>
              )}
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

        {hasMore ? (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
            {loadingMore
              ? <ActivityIndicator color={Colors.rust} />
              : <Text style={styles.loadMoreText}>Load more listings</Text>
            }
          </TouchableOpacity>
        ) : listings.length > 0 ? (
          <Text style={styles.endLabel}>— End of curated listings —</Text>
        ) : null}
      </ScrollView>
      )}
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
  loadMoreBtn: {
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', marginBottom: 8,
  },
  loadMoreText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.rust },
  emptyState: {
    padding: 48, alignItems: 'center',
    backgroundColor: Colors.paper, borderRadius: 16,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.line2,
  },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink, marginBottom: 8 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
});
