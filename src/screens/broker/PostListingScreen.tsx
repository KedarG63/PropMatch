import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import { postListing, updateListingPhotos } from '../../services/listingsService';
import { uploadListingPhotos } from '../../services/storageService';
import type { AppUser } from '../../types';

interface Props {
  onPosted: () => void;
  appUser: AppUser;
}

const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];
const MAX_PHOTOS = 5;

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const update = (key: keyof typeof fields, val: string) =>
    setFields(f => ({ ...f, [key]: val }));

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to add listing photos.');
      return;
    }
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining === 0) {
      Alert.alert('Limit reached', `Maximum ${MAX_PHOTOS} photos per listing.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (idx: number) =>
    setPhotos(prev => prev.filter((_, i) => i !== idx));

  return (
    <View style={styles.container}>
      <EditorialHeader kicker="Broker · New Listing" title="Post a property" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Photo zone */}
        <TouchableOpacity style={styles.photoZone} onPress={pickPhotos} activeOpacity={0.75}>
          {photos.length === 0 ? (
            <>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoTitle}>Add up to {MAX_PHOTOS} photos</Text>
              <Text style={styles.photoHint}>TAP TO SELECT FROM GALLERY</Text>
            </>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
              // prevent the inner scroll from stealing the outer touch
              onStartShouldSetResponder={() => true}
            >
              {photos.map((uri, i) => (
                <View key={i} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removePhoto(i)}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.addMore} onPress={pickPhotos}>
                  <Text style={styles.addMoreIcon}>+</Text>
                  <Text style={styles.addMoreText}>Add</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </TouchableOpacity>
        {photos.length > 0 && (
          <Text style={styles.photoCount}>{photos.length}/{MAX_PHOTOS} photos selected</Text>
        )}

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
              // Create the listing doc first to get an ID
              const listingId = await postListing(appUser.uid, {
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

              // Upload photos if any, then update the doc
              if (photos.length > 0) {
                setUploadProgress(`Uploading ${photos.length} photo${photos.length > 1 ? 's' : ''}…`);
                const urls = await uploadListingPhotos(listingId, photos);
                await updateListingPhotos(listingId, urls);
              }

              onPosted();
            } catch {
              Alert.alert('Error', 'Could not post listing. Please try again.');
            } finally {
              setPosting(false);
              setUploadProgress('');
            }
          }}
        >
          {posting ? (
            <View style={styles.postingRow}>
              <ActivityIndicator color={Colors.cream} size="small" />
              {uploadProgress ? (
                <Text style={styles.postingLabel}>{uploadProgress}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.postBtnText}>Post listing</Text>
          )}
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
    minHeight: 140, borderRadius: 14,
    backgroundColor: Colors.paper,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 0, overflow: 'hidden',
    paddingVertical: 12,
  },
  photoIcon: { fontSize: 26, marginBottom: 6 },
  photoTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.muted },
  photoHint: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, color: Colors.muted, marginTop: 4 },
  photoCount: {
    fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1.2,
    color: Colors.muted, textAlign: 'right', marginBottom: 4,
  },
  thumbRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 12 },
  thumbWrapper: { position: 'relative' },
  thumb: { width: 100, height: 100, borderRadius: 10 },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 999,
    backgroundColor: 'rgba(28,28,30,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addMore: {
    width: 100, height: 100, borderRadius: 10,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cream,
  },
  addMoreIcon: { fontSize: 22, color: Colors.muted, lineHeight: 28 },
  addMoreText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, color: Colors.muted },
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
    ...Shadow.sm,
  },
  postBtnText: { fontFamily: Fonts.sansBold, fontSize: 14, color: Colors.cream },
  postingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postingLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.cream },
});
