import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import ChipRow from '../../components/ChipRow';
import PropertyPhoto from '../../components/PropertyPhoto';
import { ProTag, ConTag } from '../../components/Tags';
import type { VisitedProperty, PropertyStatus, ChatThread } from '../../types';

const VISITED_SEED: VisitedProperty[] = [
  {
    id: 'v1', title: '3 BHK · Aundh', price: '₹1.42 Cr', tone: 'a', idx: 0,
    photos: 4, video: true, visited: '14 Apr', broker: 'Orchid Realty', agent: 'Rajesh Patil',
    pros: ['Good ventilation', 'Corner flat', 'RERA approved'],
    cons: ['No parking', 'West facing'],
    notes: 'Kitchen feels small, check water pressure again. Society maintenance is high but amenities are good.',
    status: 'shortlisted',
  },
  {
    id: 'v2', title: '2 BHK · Baner', price: '₹98 L', tone: 'b', idx: 1,
    photos: 5, video: false, visited: '11 Apr', broker: 'Skyline Homes', agent: 'Priya Shah',
    pros: ['East facing', 'Two balconies', 'Park view'],
    cons: ['Busy road', 'Old construction', 'No gym'],
    notes: 'Owner is flexible on price. Builder was not on site, ask the agent.',
    status: 'undecided',
  },
  {
    id: 'v3', title: '3 BHK · Balewadi', price: '₹1.55 Cr', tone: 'c', idx: 2,
    photos: 6, video: true, visited: '08 Apr', broker: 'Maple Estates', agent: 'Anil Kumar',
    pros: ['Clubhouse', 'Modular kitchen', 'Gated community', 'Power backup'],
    cons: ['Top floor heat issue', 'Far from station'],
    notes: '',
    status: 'undecided',
  },
  {
    id: 'v4', title: '4 BHK Penthouse · Koregaon Park', price: '₹3.10 Cr', tone: 'd', idx: 0,
    photos: 7, video: true, visited: '05 Apr', broker: 'Heritage Realty', agent: 'Sneha Iyer',
    pros: ['Terrace garden', 'Private lift', 'Premium fittings'],
    cons: ['Way over budget', 'Maintenance ₹28k/mo'],
    notes: 'Beautiful but unrealistic. Saving as reference for finishings.',
    status: 'rejected',
  },
];

interface Props {
  openChat: (thread: ChatThread) => void;
}

export default function MyPropertiesScreen({ openChat }: Props) {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<VisitedProperty[]>(VISITED_SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => ({
    all: items.length,
    shortlisted: items.filter(i => i.status === 'shortlisted').length,
    rejected: items.filter(i => i.status === 'rejected').length,
    undecided: items.filter(i => i.status === 'undecided').length,
  }), [items]);

  const visible = useMemo(
    () => filter === 'all' ? items : items.filter(i => i.status === filter),
    [filter, items]
  );

  const setStatus = (id: string, status: PropertyStatus) =>
    setItems(prev => prev.map(p => p.id === id ? { ...p, status } : p));

  const statusColor = (s: PropertyStatus) =>
    s === 'shortlisted' ? 'rgba(184,147,90,0.95)'
    : s === 'rejected'  ? 'rgba(168,90,74,0.95)'
    :                     'rgba(28,28,30,0.65)';

  return (
    <View style={styles.container}>
      <EditorialHeader
        kicker="Memory · Buyer Journal"
        title="My Visited Properties"
        count={`${items.length} properties`}
        right={
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterBtnIcon}>⊞</Text>
          </TouchableOpacity>
        }
      />

      <ChipRow
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: 'All', count: counts.all },
          { id: 'shortlisted', label: 'Shortlisted', count: counts.shortlisted },
          { id: 'rejected', label: 'Rejected', count: counts.rejected },
          { id: 'undecided', label: 'Undecided', count: counts.undecided },
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {visible.map(p => (
          <View key={p.id} style={styles.card}>
            {/* Photo */}
            <View style={styles.photoContainer}>
              <PropertyPhoto tone={p.tone} idx={p.idx} height={184} video={p.video} />
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusColor(p.status) }]}>
                <Text style={styles.statusText}>
                  {p.status === 'shortlisted' ? '★ ' : p.status === 'rejected' ? '✕ ' : '? '}
                  {p.status}
                </Text>
              </View>
              {/* Photo dots */}
              <View style={styles.photoDots}>
                {[...Array(p.photos)].map((_, k) => (
                  <View key={k} style={[styles.dot, k === 0 && styles.dotActive]} />
                ))}
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.propertyTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.price}>{p.price}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>📅 Viewed {p.visited}</Text>
                <Text style={styles.separator}>·</Text>
                <Text style={styles.metaBroker}>{p.broker}</Text>
                <Text style={styles.separator}>·</Text>
                <Text style={styles.metaText}>{p.agent}</Text>
              </View>

              {p.pros.length > 0 && (
                <View style={styles.tagsSection}>
                  <Text style={styles.tagsSectionLabel}>+ PROS</Text>
                  <View style={styles.tagsRow}>
                    {p.pros.map(t => <ProTag key={t}>{t}</ProTag>)}
                  </View>
                </View>
              )}

              {p.cons.length > 0 && (
                <View style={styles.tagsSection}>
                  <Text style={[styles.tagsSectionLabel, { color: Colors.clay }]}>− CONS</Text>
                  <View style={styles.tagsRow}>
                    {p.cons.map(t => <ConTag key={t}>{t}</ConTag>)}
                  </View>
                </View>
              )}

              {p.notes !== '' && (
                <TouchableOpacity
                  onPress={() => setExpanded(e => ({ ...e, [p.id]: !e[p.id] }))}
                  style={styles.notesBox}
                >
                  <View style={styles.notesHeader}>
                    <Text style={styles.notesLabel}>📝  My Notes</Text>
                    <Text style={styles.notesChevron}>{expanded[p.id] ? '∧' : '∨'}</Text>
                  </View>
                  <Text
                    style={styles.notesText}
                    numberOfLines={expanded[p.id] ? undefined : 2}
                  >
                    "{p.notes}"
                  </Text>
                </TouchableOpacity>
              )}

              {/* Action row */}
              <View style={styles.actionRow}>
                <View style={styles.statusToggle}>
                  {([
                    { id: 'shortlisted', label: 'Shortlist' },
                    { id: 'undecided',   label: 'Undecided' },
                    { id: 'rejected',    label: 'Reject' },
                  ] as { id: PropertyStatus; label: string }[]).map(b => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setStatus(p.id, b.id)}
                      style={[styles.toggleBtn, p.status === b.id && styles.toggleBtnActive]}
                    >
                      <Text style={[styles.toggleBtnText, p.status === b.id && styles.toggleBtnTextActive]}>
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => openChat({ name: p.agent, who: p.agent.split(' ').map(w => w[0]).join('') })}
                >
                  <Text style={styles.iconBtnText}>💬</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {visible.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>𓉐</Text>
            <Text style={styles.emptyTitle}>No properties here yet</Text>
            <Text style={styles.emptySub}>
              When you visit a place worth remembering, log it here with photos, pros, and notes.
            </Text>
            <TouchableOpacity style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>+ Add a property</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <View style={styles.fabDot}>
          <Text style={styles.fabDotText}>+</Text>
        </View>
        <Text style={styles.fabText}>Add property visited</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 16 },
  card: {
    backgroundColor: Colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  photoContainer: { position: 'relative' },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.cream,
  },
  photoDots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  content: { padding: 18 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  propertyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    letterSpacing: -0.3,
    lineHeight: 22,
    color: Colors.ink,
    flex: 1,
  },
  price: {
    fontFamily: Fonts.serifItalic,
    fontSize: 18,
    color: Colors.rust,
    fontWeight: '600',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 2 },
  metaText: { fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.ink3 },
  metaBroker: { fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.ink2 },
  separator: { color: Colors.line2, fontSize: 11.5 },
  tagsSection: { marginTop: 14 },
  tagsSectionLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2,
    color: Colors.sage, textTransform: 'uppercase', marginBottom: 6,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  notesBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: Colors.cream2,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.line2,
  },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notesLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2,
    color: Colors.ink3, textTransform: 'uppercase',
  },
  notesChevron: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.ink3 },
  notesText: {
    fontFamily: Fonts.serifItalic, fontSize: 13,
    color: Colors.ink2, lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  statusToggle: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.cream2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.line2,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.paper,
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtnText: {
    fontFamily: Fonts.sans, fontSize: 10.5, fontWeight: '500', color: Colors.ink3,
  },
  toggleBtnTextActive: { fontWeight: '700', color: Colors.ink },
  iconBtn: {
    width: 34, height: 34, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 14 },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.line2,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12, opacity: 0.4 },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 18, marginBottom: 6, color: Colors.ink },
  emptySub: {
    fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted,
    textAlign: 'center', lineHeight: 18, marginBottom: 14, maxWidth: 260,
  },
  emptyBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    backgroundColor: Colors.ink,
  },
  emptyBtnText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.cream },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 999,
    backgroundColor: Colors.ink,
    ...Shadow.lg,
  },
  fabDot: {
    width: 26, height: 26, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  fabDotText: { color: Colors.cream, fontSize: 18, lineHeight: 22, fontWeight: '700' },
  fabText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.cream },
  filterBtn: {
    width: 36, height: 36, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnIcon: { fontSize: 16, color: Colors.ink },
});
