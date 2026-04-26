import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import { postListing } from '../../services/listingsService';
import type { AppUser } from '../../types';

interface Props {
  onPosted: () => void;
  appUser: AppUser;
}

const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];

export default function PostListingScreen({ onPosted, appUser }: Props) {
  const [fields, setFields] = useState({
    title: '',
    price: '',
    area: '',
    rera: '',
    floor: '',
    facing: '',
  });
  const [bhk, setBhk] = useState('');
  const [posting, setPosting] = useState(false);

  const update = (key: keyof typeof fields, val: string) =>
    setFields(f => ({ ...f, [key]: val }));

  return (
    <View style={styles.container}>
      <EditorialHeader kicker="Broker · New Listing" title="Post a property" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Photo upload zone */}
        <TouchableOpacity style={styles.photoZone}>
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoTitle}>Add up to 12 photos + 1 video</Text>
          <Text style={styles.photoHint}>JPG · MP4 · MAX 25MB</Text>
        </TouchableOpacity>

        {/* BHK picker */}
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>BHK TYPE</Text>
          <View style={styles.bhkRow}>
            {BHK_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => setBhk(opt)}
                style={[styles.bhkChip, bhk === opt && styles.bhkChipActive]}
              >
                <Text style={[styles.bhkChipText, bhk === opt && styles.bhkChipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text fields */}
        {[
          { key: 'title' as const, label: 'Property title', hint: 'e.g. 3 BHK Flat in Baner' },
          { key: 'price' as const, label: 'Price', hint: 'e.g. ₹1.38 Cr' },
          { key: 'area' as const, label: 'Locality / Area', hint: 'e.g. Baner' },
          { key: 'rera' as const, label: 'RERA number', hint: 'Optional' },
          { key: 'floor' as const, label: 'Floor', hint: 'e.g. 6th' },
          { key: 'facing' as const, label: 'Facing', hint: 'e.g. East' },
        ].map(f => (
          <View key={f.key} style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
            <TextInput
              value={fields[f.key]}
              onChangeText={v => update(f.key, v)}
              style={styles.fieldInput}
              placeholder={f.hint}
              placeholderTextColor={Colors.muted}
            />
          </View>
        ))}

        {/* Post button */}
        <TouchableOpacity
          style={[styles.postBtn, posting && { opacity: 0.6 }]}
          disabled={posting}
          onPress={async () => {
            if (!fields.title.trim()) {
              Alert.alert('Title required', 'Add a property title before posting.');
              return;
            }
            if (!bhk) {
              Alert.alert('BHK required', 'Select the BHK type before posting.');
              return;
            }
            setPosting(true);
            try {
              await postListing(appUser.uid, {
                title: fields.title.trim(),
                price: fields.price.trim(),
                area: fields.area.trim(),
                bhk,
                rera: fields.rera.trim(),
                floor: fields.floor.trim(),
                facing: fields.facing.trim(),
                brokerName: appUser.name,
                brokerFirm: '',
              });
              onPosted();
            } catch {
              Alert.alert('Error', 'Could not post listing. Please try again.');
            } finally {
              setPosting(false);
            }
          }}
        >
          {posting
            ? <ActivityIndicator color={Colors.cream} />
            : <Text style={styles.postBtnText}>Post listing</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 8 },
  photoZone: {
    height: 140, borderRadius: 14,
    backgroundColor: Colors.paper,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  photoIcon: { fontSize: 26, marginBottom: 6 },
  photoTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.muted },
  photoHint: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1, color: Colors.muted, marginTop: 2 },
  fieldBox: {
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
  },
  fieldLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    color: Colors.muted, textTransform: 'uppercase', marginBottom: 3,
  },
  fieldInput: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  bhkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  bhkChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2,
  },
  bhkChipActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  bhkChipText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink },
  bhkChipTextActive: { color: Colors.cream },
  postBtn: {
    marginTop: 6, padding: 15, borderRadius: 14, backgroundColor: Colors.rust,
    alignItems: 'center',
    shadowColor: Colors.rust,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },
  postBtnText: { fontFamily: Fonts.sansBold, fontSize: 14, color: Colors.cream },
});
