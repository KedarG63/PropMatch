import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';

interface Props {
  onPosted: () => void;
}

const Pill = ({ active, onPress, children, danger = false }: {
  active: boolean; onPress: () => void; children: React.ReactNode; danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.pill,
      active && (danger ? styles.pillActiveDanger : styles.pillActiveDefault),
    ]}
  >
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text>
  </TouchableOpacity>
);

const SectionLabel = ({ n, title, hint }: { n: string; title: string; hint?: string }) => (
  <View style={styles.sectionLabelRow}>
    <Text style={styles.sectionN}>{n}</Text>
    <Text style={styles.sectionTitle}>{title}</Text>
    {hint && <Text style={styles.sectionHint}>{hint}</Text>}
  </View>
);

const Toggle = ({ value, onToggle, label, sub, danger = false }: {
  value: boolean; onToggle: () => void; label: string; sub: string; danger?: boolean;
}) => (
  <TouchableOpacity onPress={onToggle} style={[styles.toggleRow, value && danger && styles.toggleRowDanger]}>
    <View style={[styles.toggleTrack, { backgroundColor: value ? (danger ? Colors.rust : Colors.ink) : Colors.line2 }]}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </View>
    <View style={styles.toggleBody}>
      <Text style={[styles.toggleLabel, value && danger && { color: Colors.rust }]}>{label}</Text>
      <Text style={styles.toggleSub}>{sub}</Text>
    </View>
  </TouchableOpacity>
);

export default function PostRequirementScreen({ onPosted }: Props) {
  const [bhk, setBhk] = useState(['3']);
  const [budgetMin, setBudgetMin] = useState(125);
  const [budgetMax, setBudgetMax] = useState(150);
  const [localities, setLocalities] = useState(['Aundh', 'Baner']);
  const [strict, setStrict] = useState(true);
  const [possession, setPossession] = useState('ready');
  const [pType, setPType] = useState('flat');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [notes, setNotes] = useState('');
  const [localityInput, setLocalityInput] = useState('');

  const fmtCr = (lakh: number) =>
    lakh >= 100 ? `₹${(lakh / 100).toFixed(2)} Cr` : `₹${lakh} L`;

  const toggleBhk = (v: string) =>
    setBhk(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const addLocality = (l: string) => {
    if (l.trim() && !localities.includes(l.trim())) {
      setLocalities(prev => [...prev, l.trim()]);
    }
  };

  const SUGGESTED = ['Balewadi', 'Wakad', 'Hinjewadi', 'Pashan', 'Kothrud'].filter(s => !localities.includes(s));

  return (
    <View style={styles.container}>
      <EditorialHeader kicker="Brief · The home you seek" title="What are you looking for?" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Tell us once. We'll match brokers to you — never the other way around.
        </Text>

        {/* BHK */}
        <SectionLabel n="01" title="Configuration" hint="Multi-select" />
        <View style={styles.pillRow}>
          {['1', '2', '3', '4+', 'Studio'].map(v => (
            <Pill key={v} active={bhk.includes(v)} onPress={() => toggleBhk(v)}>{v} BHK</Pill>
          ))}
        </View>

        {/* Budget */}
        <SectionLabel n="02" title="Budget" />
        <View style={styles.budgetBox}>
          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.budgetLabel}>MIN</Text>
              <Text style={styles.budgetValue}>{fmtCr(budgetMin)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.budgetLabel}>MAX</Text>
              <Text style={[styles.budgetValue, { color: Colors.rust }]}>{fmtCr(budgetMax)}</Text>
            </View>
          </View>
          {/* Simple budget stepper controls */}
          <View style={styles.budgetControls}>
            <View style={styles.budgetStepper}>
              <TouchableOpacity onPress={() => setBudgetMin(Math.max(50, budgetMin - 5))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepLabel}>Min</Text>
              <TouchableOpacity onPress={() => setBudgetMin(Math.min(budgetMax - 5, budgetMin + 5))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.budgetTrack}>
              <View style={[styles.budgetFill, {
                left: `${((budgetMin - 50) / 450) * 100}%`,
                right: `${100 - ((budgetMax - 50) / 450) * 100}%`,
              } as any]} />
            </View>
            <View style={styles.budgetStepper}>
              <TouchableOpacity onPress={() => setBudgetMax(Math.max(budgetMin + 5, budgetMax - 5))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepLabel}>Max</Text>
              <TouchableOpacity onPress={() => setBudgetMax(Math.min(500, budgetMax + 5))} style={styles.stepBtn}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.budgetRange}>
            <Text style={styles.budgetRangeText}>₹50 L</Text>
            <Text style={styles.budgetRangeText}>₹5 Cr</Text>
          </View>
        </View>

        {/* Localities */}
        <SectionLabel n="03" title="Preferred localities" />
        <View style={styles.localityBox}>
          <View style={styles.localityTags}>
            {localities.map(l => (
              <View key={l} style={styles.localityChip}>
                <Text style={styles.localityChipText}>📍 {l}</Text>
                <TouchableOpacity
                  onPress={() => setLocalities(prev => prev.filter(x => x !== l))}
                  style={styles.localityRemove}
                >
                  <Text style={styles.localityRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TextInput
            value={localityInput}
            onChangeText={setLocalityInput}
            onSubmitEditing={() => { addLocality(localityInput); setLocalityInput(''); }}
            placeholder="Type a locality + Enter…"
            style={styles.localityInput}
            placeholderTextColor={Colors.muted}
          />
          <View style={styles.suggestedRow}>
            {SUGGESTED.map(s => (
              <TouchableOpacity key={s} onPress={() => addLocality(s)} style={styles.suggestBtn}>
                <Text style={styles.suggestBtnText}>+ {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Toggle
          value={strict}
          onToggle={() => setStrict(s => !s)}
          label="🚫 Strict locality only"
          sub="Brokers offering Wakad, Hinjewadi etc. will be hidden."
          danger
        />

        {/* Possession */}
        <SectionLabel n="04" title="Possession" />
        <View style={styles.segmented}>
          {[
            { id: 'ready', label: 'Ready' },
            { id: '6m', label: '≤ 6 mo' },
            { id: '1y', label: '≤ 1 yr' },
            { id: 'uc', label: 'Under const.' },
          ].map(o => (
            <TouchableOpacity
              key={o.id}
              onPress={() => setPossession(o.id)}
              style={[styles.segBtn, possession === o.id && styles.segBtnActive]}
            >
              <Text style={[styles.segBtnText, possession === o.id && styles.segBtnTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Property type */}
        <SectionLabel n="05" title="Property type" />
        <View style={styles.typeGrid}>
          {[
            { id: 'flat', label: 'Flat', glyph: '▭' },
            { id: 'row',  label: 'Row Hse', glyph: '⌂' },
            { id: 'villa',label: 'Villa', glyph: '⌘' },
            { id: 'plot', label: 'Plot', glyph: '▢' },
          ].map(o => (
            <TouchableOpacity
              key={o.id}
              onPress={() => setPType(o.id)}
              style={[styles.typeBtn, pType === o.id && styles.typeBtnActive]}
            >
              <Text style={[styles.typeGlyph, pType === o.id && { color: Colors.cream }]}>{o.glyph}</Text>
              <Text style={[styles.typeBtnText, pType === o.id && { color: Colors.cream }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <SectionLabel n="06" title="Additional notes" hint="Optional" />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Must have covered parking, south-facing preferred…"
          multiline
          numberOfLines={4}
          style={styles.notesInput}
          placeholderTextColor={Colors.muted}
        />

        {/* Visibility toggle */}
        <Toggle
          value={verifiedOnly}
          onToggle={() => setVerifiedOnly(v => !v)}
          label="🔒 Visible to verified brokers only"
          sub="RERA-registered. ID-verified. Reputation tracked."
        />

        {/* Post button */}
        <TouchableOpacity style={styles.postBtn} onPress={onPosted}>
          <Text style={styles.postBtnText}>Post requirement</Text>
        </TouchableOpacity>

        <Text style={styles.postNote}>
          Brokers matching your criteria can send a connection request.{' '}
          <Text style={{ color: Colors.rust, fontStyle: 'italic' }}>You</Text> decide whom to talk to.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 0 },
  intro: {
    fontFamily: Fonts.serifItalic, fontSize: 14, color: Colors.ink3,
    lineHeight: 21, marginBottom: 22,
  },
  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10, marginTop: 4,
  },
  sectionN: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2, color: Colors.rust, textTransform: 'uppercase',
  },
  sectionTitle: { fontFamily: Fonts.serif, fontSize: 17, letterSpacing: -0.2, color: Colors.ink },
  sectionHint: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted, marginLeft: 'auto' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 24 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2, backgroundColor: 'transparent',
  },
  pillActiveDefault: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  pillActiveDanger: { backgroundColor: Colors.rust, borderColor: Colors.rust },
  pillText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink2 },
  pillTextActive: { color: Colors.cream },
  budgetBox: {
    padding: 20, backgroundColor: Colors.paper,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.line, marginBottom: 24,
  },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  budgetLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8, color: Colors.muted },
  budgetValue: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '600', color: Colors.ink },
  budgetControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 28, height: 28, borderRadius: 999, borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream2,
  },
  stepBtnText: { fontFamily: Fonts.mono, fontSize: 14, color: Colors.ink },
  stepLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
  budgetTrack: {
    flex: 1, height: 4, backgroundColor: Colors.line2, borderRadius: 4, position: 'relative',
  },
  budgetFill: {
    position: 'absolute', top: 0, bottom: 0, backgroundColor: Colors.ink, borderRadius: 4,
  },
  budgetRange: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  budgetRangeText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  localityBox: {
    padding: 14, backgroundColor: Colors.paper,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.line, marginBottom: 12,
  },
  localityTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  localityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingLeft: 12, paddingRight: 6, paddingVertical: 5,
    backgroundColor: Colors.ink, borderRadius: 999,
  },
  localityChipText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.cream },
  localityRemove: {
    width: 18, height: 18, borderRadius: 999,
    backgroundColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  localityRemoveText: { fontSize: 9, color: Colors.cream },
  localityInput: {
    width: '100%', paddingVertical: 8,
    fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink,
    borderTopWidth: 1, borderTopColor: Colors.line,
  },
  suggestedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  suggestBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: Colors.cream2, borderWidth: 1, borderColor: Colors.line2,
  },
  suggestBtnText: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.ink3 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line2,
    marginBottom: 24,
  },
  toggleRowDanger: {
    backgroundColor: 'rgba(200,85,61,0.08)',
    borderColor: 'rgba(200,85,61,0.4)',
  },
  toggleTrack: {
    width: 38, height: 22, borderRadius: 999, padding: 2,
  },
  toggleThumb: {
    width: 18, height: 18, borderRadius: 999, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 16 }] },
  toggleBody: { flex: 1 },
  toggleLabel: { fontFamily: Fonts.sansBold, fontSize: 12.5, color: Colors.ink2 },
  toggleSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.ink3, marginTop: 2, lineHeight: 16 },
  segmented: {
    flexDirection: 'row', padding: 4, backgroundColor: Colors.paper,
    borderWidth: 1, borderColor: Colors.line2, borderRadius: 999, marginBottom: 24,
  },
  segBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: Colors.ink },
  segBtnText: { fontFamily: Fonts.sansMedium, fontSize: 11.5, color: Colors.ink3 },
  segBtnTextActive: { color: Colors.cream },
  typeGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 24,
  },
  typeBtn: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', gap: 6,
  },
  typeBtnActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  typeGlyph: { fontFamily: Fonts.serif, fontSize: 22, color: Colors.ink2 },
  typeBtnText: { fontFamily: Fonts.sansMedium, fontSize: 11.5, color: Colors.ink2 },
  notesInput: {
    width: '100%', minHeight: 84, padding: 14,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
    borderRadius: 12, fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink,
    textAlignVertical: 'top', marginBottom: 16,
  },
  postBtn: {
    width: '100%', padding: 16, borderRadius: 14,
    backgroundColor: Colors.rust, alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.rust,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 11,
    elevation: 6,
  },
  postBtnText: { fontFamily: Fonts.sansBold, fontSize: 15, color: Colors.cream, letterSpacing: 0.1 },
  postNote: {
    fontFamily: Fonts.sans, fontSize: 11, color: Colors.muted,
    textAlign: 'center', lineHeight: 17, marginHorizontal: 4,
  },
});
