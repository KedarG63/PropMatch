import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../theme';
import PropertyPhoto from './PropertyPhoto';
import type { Listing } from '../types';

interface Props {
  listing: Listing;
  onSend: () => void;
  onClose: () => void;
}

export default function ConnectSheet({ listing, onSend, onClose }: Props) {
  const [draft, setDraft] = useState(
    "Hi, I'm interested in this property. My budget is ₹1.4 Cr and I'm looking in Baner only."
  );

  return (
    <View>
      <Text style={styles.kicker}>Send connection request</Text>
      <Text style={styles.title}>
        Reach <Text style={styles.titleItalic}>{listing.broker}</Text>
      </Text>

      {/* Property preview */}
      <View style={styles.preview}>
        <View style={styles.previewPhoto}>
          <PropertyPhoto tone={listing.tone} idx={listing.idx} height={50} />
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>{listing.title}</Text>
          <Text style={styles.previewPrice}>{listing.price}</Text>
        </View>
      </View>

      <TextInput
        value={draft}
        onChangeText={t => setDraft(t.slice(0, 240))}
        multiline
        style={styles.textInput}
        placeholderTextColor={Colors.muted}
      />
      <View style={styles.inputFooter}>
        <Text style={styles.charCount}>{draft.length}/240</Text>
        <Text style={styles.privacyNote}>🔒  Broker sees only after you connect</Text>
      </View>

      <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
        <Text style={styles.sendBtnText}>Send request</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 2.2,
    color: Colors.rust, textTransform: 'uppercase', marginBottom: 6,
  },
  title: {
    fontFamily: Fonts.serif, fontSize: 22, letterSpacing: -0.3,
    color: Colors.ink, marginBottom: 14,
  },
  titleItalic: { fontFamily: Fonts.serifItalic, color: Colors.ink },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12,
    backgroundColor: Colors.cream2, borderWidth: 1, borderColor: Colors.line2, marginBottom: 14,
  },
  previewPhoto: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden' },
  previewInfo: { flex: 1, minWidth: 0 },
  previewTitle: { fontFamily: Fonts.serif, fontSize: 14, fontWeight: '600', lineHeight: 18, color: Colors.ink },
  previewPrice: { fontFamily: Fonts.serifItalic, fontSize: 13, color: Colors.rust, fontWeight: '600', marginTop: 1 },
  textInput: {
    width: '100%', minHeight: 100, padding: 14,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
    borderRadius: 12, fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 4, marginTop: 8, marginBottom: 16,
  },
  charCount: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.8 },
  privacyNote: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 0.5 },
  sendBtn: {
    width: '100%', padding: 14, borderRadius: 12, backgroundColor: Colors.rust,
    alignItems: 'center',
    shadowColor: Colors.rust,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },
  sendBtnText: { fontFamily: Fonts.sansBold, fontSize: 14, color: Colors.cream },
});
