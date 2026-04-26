import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import PropertyPhoto from '../../components/PropertyPhoto';
import type { BrokerListing, MatchedBuyer } from '../../types';

const BROKER_LISTINGS: BrokerListing[] = [
  { id: 'b1', tone: 'a', idx: 0, title: '3 BHK · Baner', price: '₹1.38 Cr', status: 'Active', views: 142 },
  { id: 'b2', tone: 'c', idx: 2, title: '2 BHK · Aundh', price: '₹98 L', status: 'Active', views: 89 },
  { id: 'b3', tone: 'b', idx: 1, title: '4 BHK · K. Park', price: '₹3.10 Cr', status: 'Paused', views: 56 },
  { id: 'b4', tone: 'd', idx: 0, title: '2 BHK · Kothrud', price: '₹1.10 Cr', status: 'Sold', views: 234 },
];

const MATCHED_BUYERS: MatchedBuyer[] = [
  {
    id: 'm47', anon: 'Buyer #47', name: 'Ananya G.', revealed: false,
    bhk: '3 BHK', budget: '₹1.2 – 1.5 Cr', loc: ['Aundh', 'Baner'],
    possession: 'Ready to Move', strict: true, postedAt: '2h ago', match: 96,
  },
  {
    id: 'm51', anon: 'Buyer #51', name: 'Karan M.', revealed: false,
    bhk: '2 BHK', budget: '₹85 L – 1.1 Cr', loc: ['Baner', 'Pashan'],
    possession: '≤ 6 mo', strict: false, postedAt: '5h ago', match: 88,
  },
  {
    id: 'm58', anon: 'Buyer #58', name: 'Rhea & Vikram', revealed: false,
    bhk: '3/4 BHK', budget: '₹1.5 – 2.2 Cr', loc: ['Koregaon Park', 'Kalyani Nagar'],
    possession: 'Ready to Move', strict: true, postedAt: '1d ago', match: 82,
  },
];

interface Props {
  onConnectBuyer: () => void;
}

export default function BrokerDashboardScreen({ onConnectBuyer }: Props) {
  const [activeTab, setActiveTab] = useState<'matched' | 'connections' | 'pending'>('matched');
  const [requests, setRequests] = useState<Record<string, { sent: boolean; msg: string }>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [draftMsg, setDraftMsg] = useState('Hi, I have a 3 BHK in Baner that fits your requirement exactly. Happy to share details.');

  const sendRequest = (b: MatchedBuyer) => {
    setRequests(r => ({ ...r, [b.id]: { sent: true, msg: draftMsg } }));
    setDrafting(null);
    onConnectBuyer();
  };

  const statusColor = (s: BrokerListing['status']) =>
    s === 'Active' ? 'rgba(107,142,90,0.95)'
    : s === 'Paused' ? 'rgba(184,147,90,0.95)'
    : 'rgba(28,28,30,0.85)';

  const CONNECTIONS = [
    { n: 'Ananya G.', last: 'Sounds great — what time on Saturday?', when: '2m', unread: 2, ctx: '3 BHK · Baner' },
    { n: 'Suresh K.', last: 'Will the price include parking?', when: '1h', unread: 1, ctx: '2 BHK · Aundh' },
    { n: 'Mira & Devesh', last: 'Thanks for the brochure!', when: 'Yesterday', unread: 0, ctx: '4 BHK · K. Park' },
  ];

  const PENDING = [
    { n: 'Buyer #62', match: 91 },
    { n: 'Buyer #69', match: 84 },
  ];

  return (
    <View style={styles.container}>
      <EditorialHeader
        kicker="Broker Studio · Today"
        title="Good morning, Rahul"
        right={
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓ VERIFIED</Text>
          </View>
        }
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* KPI strip */}
        <View style={styles.kpiRow}>
          {[
            { label: 'Active', n: '2', sub: 'listings' },
            { label: 'New matches', n: '3', sub: 'today' },
            { label: 'Replies', n: '12', sub: 'pending' },
          ].map(k => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiN}>{k.n}</Text>
              <Text style={styles.kpiSub}>{k.sub}</Text>
            </View>
          ))}
        </View>

        {/* My Listings */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>My Listings</Text>
            <Text style={styles.sectionTitle}>4 properties</Text>
          </View>
          <TouchableOpacity style={styles.postNewBtn}>
            <Text style={styles.postNewBtnText}>+ Post new</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.listingsScroll}
          contentContainerStyle={styles.listingsContent}
        >
          {BROKER_LISTINGS.map(l => (
            <View key={l.id} style={styles.listingCard}>
              <View style={{ position: 'relative' }}>
                <PropertyPhoto tone={l.tone} idx={l.idx} height={108} />
                <View style={[styles.listingStatusBadge, { backgroundColor: statusColor(l.status) }]}>
                  <Text style={styles.listingStatusText}>{l.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.listingCardBody}>
                <Text style={styles.listingTitle} numberOfLines={1}>{l.title}</Text>
                <Text style={styles.listingPrice}>{l.price}</Text>
                <View style={styles.listingFooter}>
                  <Text style={styles.listingViews}>{l.views} views</Text>
                  <Text style={styles.listingDots}>•••</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>DEMAND · LIVE</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Matched Buyers */}
        <View style={styles.matchedHeader}>
          <Text style={styles.sectionKicker}>Matched Buyers</Text>
          <Text style={[styles.sectionTitle, { fontSize: 22 }]}>Buyers looking for what you sell</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            { id: 'matched' as const, label: 'Matched', count: 3 },
            { id: 'connections' as const, label: 'Connections', count: 7 },
            { id: 'pending' as const, label: 'Pending', count: 2, badge: true },
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === t.id && styles.tabBtnTextActive]}>
                {t.label}
              </Text>
              <Text style={[styles.tabCount, activeTab === t.id && { color: Colors.cream, opacity: 0.8 }]}>
                {t.count}
              </Text>
              {t.badge && <View style={styles.tabDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'matched' && MATCHED_BUYERS.map((b, i) => {
            const sent = requests[b.id]?.sent;
            return (
              <View key={b.id} style={styles.buyerCard}>
                <View style={styles.buyerHeader}>
                  <View style={styles.buyerAvatar}>
                    <Text style={styles.buyerAvatarText}>
                      {sent ? b.name.split(' ').map(w => w[0]).join('') : '?'}
                    </Text>
                  </View>
                  <View style={styles.buyerInfo}>
                    <View style={styles.buyerNameRow}>
                      <Text style={styles.buyerName}>{sent ? b.name : b.anon}</Text>
                      <View style={styles.matchBadge}>
                        <Text style={styles.matchBadgeText}>{b.match}% MATCH</Text>
                      </View>
                    </View>
                    <Text style={styles.buyerPosted}>Posted {b.postedAt}</Text>
                  </View>
                </View>

                <View style={styles.buyerDetails}>
                  {[
                    { label: 'BHK', value: b.bhk },
                    { label: 'BUDGET', value: b.budget },
                    { label: 'WHERE', value: b.loc.join(' · ') },
                    { label: 'WHEN', value: b.possession },
                  ].map(row => (
                    <React.Fragment key={row.label}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </React.Fragment>
                  ))}
                </View>

                {b.strict && (
                  <View style={styles.strictWarning}>
                    <Text style={styles.strictWarningText}>⚠️ Strict locality only — no surrounding areas</Text>
                  </View>
                )}

                {sent ? (
                  <View style={styles.sentConfirm}>
                    <View style={styles.sentIcon}><Text>✓</Text></View>
                    <Text style={styles.sentText}>
                      <Text style={{ fontWeight: '600', color: Colors.ink }}>Request sent.</Text>
                      {' '}Awaiting buyer's confirmation.
                    </Text>
                  </View>
                ) : drafting === b.id ? (
                  <View style={styles.draftBox}>
                    <TextInput
                      value={draftMsg}
                      onChangeText={t => setDraftMsg(t.slice(0, 160))}
                      multiline
                      style={styles.draftInput}
                      placeholderTextColor={Colors.muted}
                    />
                    <View style={styles.draftFooter}>
                      <Text style={styles.draftCount}>{draftMsg.length}/160</Text>
                      <View style={styles.draftActions}>
                        <TouchableOpacity onPress={() => setDrafting(null)} style={styles.cancelBtn}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => sendRequest(b)} style={styles.sendRequestBtn}>
                          <Text style={styles.sendRequestBtnText}>Send request</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setDrafting(b.id)} style={styles.connectBtn}>
                    <Text style={styles.connectBtnText}>➤  Send connection request</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {activeTab === 'connections' && CONNECTIONS.map((c, i) => (
            <View key={i} style={styles.connectionItem}>
              <View style={styles.connectionAvatar}>
                <Text style={styles.connectionAvatarText}>
                  {c.n.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View style={styles.connectionBody}>
                <View style={styles.connectionTopRow}>
                  <Text style={styles.connectionName}>{c.n}</Text>
                  <Text style={styles.connectionTime}>{c.when}</Text>
                </View>
                <Text style={styles.connectionCtx}>RE: {c.ctx.toUpperCase()}</Text>
                <Text style={[styles.connectionLast, c.unread > 0 && { color: Colors.ink, fontWeight: '500' }]}
                  numberOfLines={1}>
                  {c.last}
                </Text>
              </View>
              {c.unread > 0 && (
                <View style={styles.unreadBubble}>
                  <Text style={styles.unreadBubbleText}>{c.unread}</Text>
                </View>
              )}
            </View>
          ))}

          {activeTab === 'pending' && PENDING.map((b, i) => (
            <View key={i} style={styles.pendingItem}>
              <View style={styles.pendingAvatar}>
                <Text style={styles.pendingAvatarText}>?</Text>
              </View>
              <View style={styles.pendingBody}>
                <Text style={styles.pendingName}>{b.n}</Text>
                <Text style={styles.pendingMeta}>Awaiting buyer · {b.match}% match</Text>
              </View>
              <TouchableOpacity style={styles.withdrawBtn}>
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: Colors.sageSoft,
    borderWidth: 1, borderColor: 'rgba(107,142,90,0.3)',
  },
  verifiedBadgeText: { fontFamily: Fonts.mono, fontSize: 11, color: '#3F5933', letterSpacing: 0.8 },
  kpiRow: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 4 },
  kpiCard: {
    flex: 1, padding: 12, paddingBottom: 10,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line, borderRadius: 12,
  },
  kpiLabel: { fontFamily: Fonts.mono, fontSize: 8.5, letterSpacing: 2, color: Colors.muted, textTransform: 'uppercase' },
  kpiN: { fontFamily: Fonts.serif, fontSize: 24, color: Colors.ink, lineHeight: 30, marginTop: 4 },
  kpiSub: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.muted, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10,
  },
  sectionKicker: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, color: Colors.rust, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: Fonts.serif, fontSize: 19, fontWeight: '600', marginTop: 2, letterSpacing: -0.3, color: Colors.ink },
  postNewBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.ink,
  },
  postNewBtnText: { fontFamily: Fonts.sansMedium, fontSize: 11.5, color: Colors.cream },
  listingsScroll: { flexGrow: 0 },
  listingsContent: { gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  listingCard: {
    width: 168, borderRadius: 12, backgroundColor: Colors.paper,
    borderWidth: 1, borderColor: Colors.line, overflow: 'hidden',
  },
  listingStatusBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  listingStatusText: { fontFamily: Fonts.mono, fontSize: 8.5, letterSpacing: 1.8, color: Colors.cream },
  listingCardBody: { padding: 12 },
  listingTitle: { fontFamily: Fonts.serif, fontSize: 14, fontWeight: '600', lineHeight: 18, color: Colors.ink },
  listingPrice: { fontFamily: Fonts.serifItalic, fontSize: 14, color: Colors.rust, fontWeight: '600', marginTop: 2 },
  listingFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.line,
  },
  listingViews: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
  listingDots: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.line2 },
  dividerLabel: { fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 2, color: Colors.muted, textTransform: 'uppercase' },
  matchedHeader: { paddingHorizontal: 20, paddingBottom: 10 },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 6 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2,
  },
  tabBtnActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  tabBtnText: { fontFamily: Fonts.sansMedium, fontSize: 11.5, color: Colors.ink2 },
  tabBtnTextActive: { color: Colors.cream },
  tabCount: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, opacity: 0.8 },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.rust, marginLeft: 2 },
  tabContent: { padding: 10, paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  buyerCard: {
    padding: 16, borderRadius: 16,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line, ...Shadow.sm,
  },
  buyerHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  buyerAvatar: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  buyerAvatarText: { fontFamily: Fonts.serifItalic, fontWeight: '700', fontSize: 16, color: Colors.cream },
  buyerInfo: { flex: 1, minWidth: 0 },
  buyerNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  buyerName: { fontFamily: Fonts.serif, fontSize: 16, fontWeight: '600', color: Colors.ink },
  matchBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: Colors.sageSoft, borderWidth: 1, borderColor: 'rgba(107,142,90,0.3)',
  },
  matchBadgeText: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700', color: '#3F5933', letterSpacing: 0.8 },
  buyerPosted: { fontFamily: Fonts.mono, fontSize: 10.5, color: Colors.muted, letterSpacing: 0.5 },
  buyerDetails: {
    display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
    rowGap: 7, columnGap: 12, marginBottom: 10,
  } as any,
  detailLabel: { fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1.5, color: Colors.muted, width: '30%' },
  detailValue: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink2, width: '65%' },
  strictWarning: {
    padding: 10, borderRadius: 8,
    backgroundColor: 'rgba(200,85,61,0.07)',
    borderWidth: 1, borderColor: 'rgba(200,85,61,0.25)', marginBottom: 10,
  },
  strictWarningText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.rustDeep },
  sentConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 10,
    backgroundColor: Colors.cream2, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.line2,
  },
  sentIcon: {
    width: 26, height: 26, borderRadius: 999, backgroundColor: Colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  sentText: { flex: 1, fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.ink3 },
  draftBox: { padding: 12, borderRadius: 12, backgroundColor: Colors.cream2, borderWidth: 1, borderColor: Colors.line2 },
  draftInput: {
    minHeight: 60, padding: 10,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
    borderRadius: 8, fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink,
    textAlignVertical: 'top',
  },
  draftFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  draftCount: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
  draftActions: { flexDirection: 'row', gap: 6 },
  cancelBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.line2,
  },
  cancelBtnText: { fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.ink },
  sendRequestBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.rust,
  },
  sendRequestBtnText: { fontFamily: Fonts.sansBold, fontSize: 11.5, color: Colors.cream },
  connectBtn: {
    padding: 11, borderRadius: 10, backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  connectBtnText: { fontFamily: Fonts.sansBold, fontSize: 12, color: Colors.cream },
  connectionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
  },
  connectionAvatar: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  connectionAvatarText: { fontFamily: Fonts.serifItalic, fontWeight: '700', fontSize: 14, color: Colors.cream },
  connectionBody: { flex: 1, minWidth: 0 },
  connectionTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  connectionName: { fontFamily: Fonts.sansBold, fontSize: 13, color: Colors.ink },
  connectionTime: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
  connectionCtx: { fontFamily: Fonts.mono, fontSize: 9.5, color: Colors.rust, letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 },
  connectionLast: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginTop: 4 },
  unreadBubble: {
    minWidth: 18, height: 18, paddingHorizontal: 6, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  unreadBubbleText: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700', color: Colors.cream },
  pendingItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
  },
  pendingAvatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.cream2, borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingAvatarText: { fontFamily: Fonts.serifItalic, fontSize: 16, color: Colors.muted },
  pendingBody: { flex: 1 },
  pendingName: { fontFamily: Fonts.sansBold, fontSize: 13, color: Colors.ink },
  pendingMeta: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, letterSpacing: 0.5 },
  withdrawBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2,
  },
  withdrawBtnText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.ink },
});
