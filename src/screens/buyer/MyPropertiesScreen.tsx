import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import ChipRow from '../../components/ChipRow';
import PropertyPhoto from '../../components/PropertyPhoto';
import { ProTag, ConTag } from '../../components/Tags';
import { subscribeVisits, updateVisitStatus, updateVisitNotes, addVisit } from '../../services/visitsService';
import type { VisitedProperty, PropertyStatus, ChatThread, AppUser } from '../../types';

interface Props {
  openChat: (thread: ChatThread) => void;
  appUser: AppUser;
}

export default function MyPropertiesScreen({ openChat, appUser }: Props) {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<VisitedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);

  // Add Visit form state
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newBroker, setNewBroker] = useState('');
  const [newAgent, setNewAgent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeVisits(appUser.uid, (visits) => {
      setItems(visits);
      setLoading(false);
    });
    return unsub;
  }, [appUser.uid]);

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

  const handleStatusChange = useCallback(async (id: string, status: PropertyStatus) => {
    await updateVisitStatus(id, status);
  }, []);

  const handleNotesBlur = useCallback(async (id: string, notes: string) => {
    await updateVisitNotes(id, notes);
  }, []);

  const handleAddVisit = useCallback(async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    await addVisit(appUser.uid, {
      title: newTitle.trim(),
      price: newPrice.trim(),
      broker: newBroker.trim(),
      agent: newAgent.trim(),
    });
    setSaving(false);
    setAddOpen(false);
    setNewTitle(''); setNewPrice(''); setNewBroker(''); setNewAgent('');
  }, [appUser.uid, newTitle, newPrice, newBroker, newAgent]);

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

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.rust} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {visible.map(p => (
            <VisitCard
              key={p.id}
              p={p}
              expanded={!!expanded[p.id]}
              onToggleExpand={() => setExpanded(e => ({ ...e, [p.id]: !e[p.id] }))}
              onStatusChange={handleStatusChange}
              onNotesBlur={handleNotesBlur}
              onChat={() => openChat({ name: p.agent || p.broker, who: (p.agent || p.broker).split(' ').map(w => w[0]).join('') })}
              statusColor={statusColor}
            />
          ))}

          {visible.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>𓉐</Text>
              <Text style={styles.emptyTitle}>No properties here yet</Text>
              <Text style={styles.emptySub}>
                {filter === 'all'
                  ? 'Tap the button below to log your first visited property.'
                  : `No ${filter} properties yet. Change the filter or add more visits.`}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddOpen(true)}>
                  <Text style={styles.emptyBtnText}>+ Add a property</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddOpen(true)}>
        <View style={styles.fabDot}>
          <Text style={styles.fabDotText}>+</Text>
        </View>
        <Text style={styles.fabText}>Add property visited</Text>
      </TouchableOpacity>

      {/* Add Visit Modal */}
      <Modal visible={addOpen} animationType="slide" transparent onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setAddOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Log a Property Visit</Text>
            <Text style={styles.sheetSub}>Add a property you visited to track it here.</Text>

            <View style={styles.sheetField}>
              <Text style={styles.sheetLabel}>Property (e.g. 3 BHK · Baner)</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="3 BHK · Baner"
                placeholderTextColor={Colors.muted}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
            </View>

            <View style={styles.sheetField}>
              <Text style={styles.sheetLabel}>Asking Price</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="₹98 L"
                placeholderTextColor={Colors.muted}
                value={newPrice}
                onChangeText={setNewPrice}
              />
            </View>

            <View style={styles.sheetField}>
              <Text style={styles.sheetLabel}>Broker / Firm</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="Skyline Homes"
                placeholderTextColor={Colors.muted}
                value={newBroker}
                onChangeText={setNewBroker}
              />
            </View>

            <View style={styles.sheetField}>
              <Text style={styles.sheetLabel}>Agent Name</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="Priya Shah"
                placeholderTextColor={Colors.muted}
                value={newAgent}
                onChangeText={setNewAgent}
                returnKeyType="done"
                onSubmitEditing={handleAddVisit}
              />
            </View>

            <TouchableOpacity
              style={[styles.sheetBtn, (!newTitle.trim() || saving) && styles.sheetBtnDisabled]}
              onPress={handleAddVisit}
              disabled={!newTitle.trim() || saving}
            >
              {saving
                ? <ActivityIndicator color={Colors.cream} />
                : <Text style={styles.sheetBtnText}>Add to my journal</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Visit card extracted to avoid closure-capturing stale state ──────────────
interface CardProps {
  p: VisitedProperty;
  expanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (id: string, s: PropertyStatus) => void;
  onNotesBlur: (id: string, notes: string) => void;
  onChat: () => void;
  statusColor: (s: PropertyStatus) => string;
}

function VisitCard({ p, expanded, onToggleExpand, onStatusChange, onNotesBlur, onChat, statusColor }: CardProps) {
  const [localNotes, setLocalNotes] = useState(p.notes);
  useEffect(() => { setLocalNotes(p.notes); }, [p.notes]);

  return (
    <View style={styles.card}>
      <View style={styles.photoContainer}>
        <PropertyPhoto tone={p.tone} idx={p.idx} height={184} video={p.video} />
        <View style={[styles.statusBadge, { backgroundColor: statusColor(p.status) }]}>
          <Text style={styles.statusText}>
            {p.status === 'shortlisted' ? '★ ' : p.status === 'rejected' ? '✕ ' : '? '}
            {p.status}
          </Text>
        </View>
        {p.photos > 0 && (
          <View style={styles.photoDots}>
            {[...Array(Math.min(p.photos, 6))].map((_, k) => (
              <View key={k} style={[styles.dot, k === 0 && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.propertyTitle} numberOfLines={1}>{p.title}</Text>
          {!!p.price && <Text style={styles.price}>{p.price}</Text>}
        </View>

        <View style={styles.metaRow}>
          {!!p.visited && <Text style={styles.metaText}>📅 {p.visited}</Text>}
          {!!p.visited && !!p.broker && <Text style={styles.separator}>·</Text>}
          {!!p.broker && <Text style={styles.metaBroker}>{p.broker}</Text>}
          {!!p.agent && <Text style={styles.separator}>·</Text>}
          {!!p.agent && <Text style={styles.metaText}>{p.agent}</Text>}
        </View>

        {p.pros.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionLabel}>+ PROS</Text>
            <View style={styles.tagsRow}>{p.pros.map(t => <ProTag key={t}>{t}</ProTag>)}</View>
          </View>
        )}

        {p.cons.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.tagsSectionLabel, { color: Colors.clay }]}>− CONS</Text>
            <View style={styles.tagsRow}>{p.cons.map(t => <ConTag key={t}>{t}</ConTag>)}</View>
          </View>
        )}

        {/* Notes — editable inline */}
        <TouchableOpacity onPress={onToggleExpand} style={styles.notesBox}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesLabel}>📝  My Notes</Text>
            <Text style={styles.notesChevron}>{expanded ? '∧' : '∨'}</Text>
          </View>
          {expanded ? (
            <TextInput
              style={styles.notesInput}
              value={localNotes}
              onChangeText={setLocalNotes}
              onBlur={() => onNotesBlur(p.id, localNotes)}
              multiline
              placeholder="Add your notes about this property…"
              placeholderTextColor={Colors.muted}
            />
          ) : (
            <Text style={styles.notesText} numberOfLines={2}>
              {localNotes ? `"${localNotes}"` : 'Tap to add notes…'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <View style={styles.statusToggle}>
            {([
              { id: 'shortlisted', label: 'Shortlist' },
              { id: 'undecided',   label: 'Undecided' },
              { id: 'rejected',    label: 'Reject' },
            ] as { id: PropertyStatus; label: string }[]).map(b => (
              <TouchableOpacity
                key={b.id}
                onPress={() => onStatusChange(p.id, b.id)}
                style={[styles.toggleBtn, p.status === b.id && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleBtnText, p.status === b.id && styles.toggleBtnTextActive]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={onChat}>
            <Text style={styles.iconBtnText}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 16 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: Colors.paper, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.line,
    overflow: 'hidden', ...Shadow.sm,
  },
  photoContainer: { position: 'relative' },
  statusBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  statusText: {
    fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', color: Colors.cream,
  },
  photoDots: {
    position: 'absolute', bottom: 12,
    alignSelf: 'center', flexDirection: 'row', gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { width: 16, backgroundColor: 'rgba(255,255,255,0.95)' },
  content: { padding: 18 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', gap: 8, marginBottom: 6,
  },
  propertyTitle: {
    fontFamily: Fonts.serif, fontSize: 19,
    letterSpacing: -0.3, lineHeight: 22, color: Colors.ink, flex: 1,
  },
  price: { fontFamily: Fonts.serifItalic, fontSize: 18, color: Colors.rust, fontWeight: '600' },
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
    marginTop: 14, padding: 12,
    backgroundColor: Colors.cream2, borderRadius: 10,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.line2,
  },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notesLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2,
    color: Colors.ink3, textTransform: 'uppercase',
  },
  notesChevron: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.ink3 },
  notesText: { fontFamily: Fonts.serifItalic, fontSize: 13, color: Colors.ink2, lineHeight: 19 },
  notesInput: {
    fontFamily: Fonts.serifItalic, fontSize: 13, color: Colors.ink2,
    lineHeight: 19, minHeight: 60, textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.line,
  },
  statusToggle: {
    flex: 1, flexDirection: 'row',
    backgroundColor: Colors.cream2, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2, padding: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 4,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.paper,
    shadowColor: '#1C1C1E', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  toggleBtnText: { fontFamily: Fonts.sans, fontSize: 10.5, fontWeight: '500', color: Colors.ink3 },
  toggleBtnTextActive: { fontWeight: '700', color: Colors.ink },
  iconBtn: {
    width: 34, height: 34, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 14 },
  emptyState: {
    padding: 60, alignItems: 'center',
    backgroundColor: Colors.paper, borderRadius: 16,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.line2,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12, opacity: 0.4 },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 18, marginBottom: 6, color: Colors.ink },
  emptySub: {
    fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted,
    textAlign: 'center', lineHeight: 18, marginBottom: 14, maxWidth: 260,
  },
  emptyBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: Colors.ink },
  emptyBtnText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.cream },
  fab: {
    position: 'absolute', bottom: 100, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 48, paddingLeft: 14, paddingRight: 18,
    borderRadius: 999, backgroundColor: Colors.ink, ...Shadow.lg,
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
  // Modal
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  sheet: {
    backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.line2, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink, marginBottom: 4 },
  sheetSub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink3, marginBottom: 20 },
  sheetField: { marginBottom: 14 },
  sheetLabel: {
    fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1.5,
    color: Colors.ink3, textTransform: 'uppercase', marginBottom: 7,
  },
  sheetInput: {
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.line,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: Fonts.sans, fontSize: 15, color: Colors.ink,
  },
  sheetBtn: {
    backgroundColor: Colors.rust, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, ...Shadow.sm,
  },
  sheetBtnDisabled: { opacity: 0.45 },
  sheetBtnText: { fontFamily: Fonts.sansBold, fontSize: 15, color: Colors.cream },
});
