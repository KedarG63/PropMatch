import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';

interface Props {
  onPosted: () => void;
}

export default function PostListingScreen({ onPosted }: Props) {
  const [fields, setFields] = useState({
    title: '3 BHK · Baner',
    price: '₹1.38 Cr',
    area: '1,250 sq ft',
    rera: 'P52100012345',
    floor: '6th floor',
    facing: 'East',
  });

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

        {/* Fields */}
        {[
          { key: 'title' as const, label: 'Property title' },
          { key: 'price' as const, label: 'Price' },
          { key: 'area' as const, label: 'Carpet area' },
          { key: 'rera' as const, label: 'RERA number' },
          { key: 'floor' as const, label: 'Floor' },
          { key: 'facing' as const, label: 'Facing' },
        ].map(f => (
          <View key={f.key} style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
            <TextInput
              value={fields[f.key]}
              onChangeText={v => update(f.key, v)}
              style={styles.fieldInput}
              placeholderTextColor={Colors.muted}
            />
          </View>
        ))}

        {/* Post button */}
        <TouchableOpacity style={styles.postBtn} onPress={onPosted}>
          <Text style={styles.postBtnText}>Post listing</Text>
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
    height: 160, borderRadius: 14,
    backgroundColor: Colors.paper,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  photoIcon: { fontSize: 28, marginBottom: 8 },
  photoTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.muted },
  photoHint: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 1, color: Colors.muted, marginTop: 2 },
  fieldBox: {
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
  },
  fieldLabel: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8, color: Colors.muted, textTransform: 'uppercase', marginBottom: 3 },
  fieldInput: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
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
