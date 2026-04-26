import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import PropertyPhoto from '../../components/PropertyPhoto';
import { subscribeChatThread, sendTextMessage } from '../../services/chatService';
import type { ChatThread, ChatMessage, Role, AppUser } from '../../types';

interface Props {
  thread: ChatThread | null;
  onBack: () => void;
  role: Role;
  appUser: AppUser;
}

export default function ChatScreen({ thread, onBack, role, appUser }: Props) {
  const [muted, setMuted] = useState(false);
  const [draft, setDraft] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(!!thread?.connId);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!thread?.connId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeChatThread(thread.connId, appUser.uid, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return unsub;
  }, [thread?.connId, appUser.uid]);

  const displayName = thread?.name || '';
  const displayWho = thread?.who || '?';
  const connId = thread?.connId;

  const send = async () => {
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    if (connId) {
      await sendTextMessage(connId, appUser.uid, text);
    } else {
      setMessages(m => [...m, { id: Date.now(), who: 'me', t: text, time: 'now' }]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayWho}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={styles.headerName}>{displayName}</Text>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
          <Text style={styles.headerContext}>
            {thread?.connId ? 'CONNECTED' : 'RE: PROPERTY'}
          </Text>
        </View>
      </View>

      {/* Mute banner (buyer only) */}
      {role === 'buyer' && (
        <TouchableOpacity
          onPress={() => setMuted(m => !m)}
          style={[styles.muteBanner, muted && styles.muteBannerActive]}
        >
          <Text style={[styles.muteBannerText, muted && styles.muteBannerTextActive]}>
            🔇 {muted ? 'Messages from this broker are paused' : 'Stop messages from this broker'}
          </Text>
          <Text style={[styles.muteBannerHint, muted && { color: Colors.cream }]}>
            {muted ? 'Tap to resume' : 'One tap'}
          </Text>
        </TouchableOpacity>
      )}

      {role === 'broker' && muted && (
        <View style={styles.brokerMutedNotice}>
          <Text style={styles.brokerMutedText}>This buyer has paused communication.</Text>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.rust} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.connectedLabel}>— Connected —</Text>

          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          )}

          {messages.map(m => {
            const mine = m.who === 'me';
            if (m.card) {
              return (
                <View key={m.id} style={[styles.cardMessage, mine ? styles.mine : styles.theirs]}>
                  <View style={{ borderRadius: 14, overflow: 'hidden' }}>
                    <PropertyPhoto tone={m.card.tone} idx={m.card.idx} height={120} />
                  </View>
                  <View style={styles.cardMsgContent}>
                    <Text style={styles.cardMsgLabel}>Property card · shared</Text>
                    <Text style={styles.cardMsgTitle}>{m.card.title}</Text>
                    <Text style={styles.cardMsgPrice}>{m.card.price}</Text>
                    <Text style={styles.cardMsgSub}>{m.card.sub}</Text>
                    <TouchableOpacity style={styles.viewListingBtn}>
                      <Text style={styles.viewListingBtnText}>View full listing →</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.msgTime, mine ? styles.msgTimeRight : styles.msgTimeLeft]}>
                    {m.time}
                  </Text>
                </View>
              );
            }
            return (
              <View key={m.id} style={mine ? styles.mine : styles.theirs}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.t}</Text>
                </View>
                <Text style={[styles.msgTime, mine ? styles.msgTimeRight : styles.msgTimeLeft]}>
                  {m.time}
                </Text>
              </View>
            );
          })}

          {muted && role === 'buyer' && (
            <View style={styles.mutedNotice}>
              <Text style={styles.mutedNoticeText}>🔇 BROKER CANNOT SEND NEW MESSAGES</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Composer */}
      <View style={styles.composer}>
        {showAttach && (
          <View style={styles.attachPanel}>
            <TouchableOpacity style={styles.attachOption} onPress={() => setShowAttach(false)}>
              <Text style={styles.attachOptionText}>🏠 Property card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={() => setShowAttach(false)}>
              <Text style={styles.attachOptionText}>🖼 Image</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={() => setShowAttach(s => !s)} style={styles.plusBtn}>
            <Text style={styles.plusBtnText}>+</Text>
          </TouchableOpacity>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            editable={!muted}
            placeholder={muted ? 'Messaging is paused' : 'Message…'}
            placeholderTextColor={Colors.muted}
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={send}
            disabled={muted || !draft.trim()}
            style={[styles.sendBtn, (muted || !draft.trim()) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.composerFooter}>
          End-to-end · No bulk media · Buyer in control
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingTop: 14, paddingBottom: 14,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.line2,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 22, color: Colors.ink, lineHeight: 28, marginTop: -2 },
  avatar: {
    width: 38, height: 38, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.serifItalic, fontWeight: '700', fontSize: 15, color: Colors.cream },
  headerInfo: { flex: 1, minWidth: 0 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerName: { fontFamily: Fonts.serif, fontSize: 16, color: Colors.ink, fontWeight: '600' },
  verifiedIcon: { fontSize: 12, color: Colors.sage },
  headerContext: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.rust,
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3,
  },
  muteBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(28,28,30,0.04)',
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  muteBannerActive: { backgroundColor: Colors.ink, borderBottomColor: Colors.ink },
  muteBannerText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.ink2 },
  muteBannerTextActive: { color: Colors.cream },
  muteBannerHint: {
    fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1.8,
    color: Colors.muted, textTransform: 'uppercase', opacity: 0.7,
  },
  brokerMutedNotice: {
    padding: 10, backgroundColor: 'rgba(168,90,74,0.08)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,90,74,0.2)',
  },
  brokerMutedText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.clay, textAlign: 'center' },
  messageList: { flex: 1 },
  messageContent: { padding: 16, gap: 10, paddingBottom: 20 },
  connectedLabel: {
    textAlign: 'center',
    fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 2.2,
    color: Colors.muted, textTransform: 'uppercase', paddingBottom: 10,
  },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  mine: { alignItems: 'flex-end' },
  theirs: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 13, paddingVertical: 10 },
  bubbleMine: {
    backgroundColor: Colors.ink,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 4,
    ...Shadow.sm,
  },
  bubbleTheirs: {
    backgroundColor: Colors.paper,
    borderWidth: 1, borderColor: Colors.line,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 16,
    ...Shadow.sm,
  },
  bubbleText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, color: Colors.ink },
  bubbleTextMine: { color: Colors.cream },
  msgTime: { fontFamily: Fonts.mono, fontSize: 9.5, color: Colors.muted, marginTop: 3, paddingHorizontal: 4 },
  msgTimeRight: { textAlign: 'right' },
  msgTimeLeft: { textAlign: 'left' },
  cardMessage: { maxWidth: '78%' },
  cardMsgContent: { padding: 12 },
  cardMsgLabel: {
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    color: Colors.rust, textTransform: 'uppercase', marginBottom: 4,
  },
  cardMsgTitle: { fontFamily: Fonts.serif, fontSize: 15, fontWeight: '600', lineHeight: 18, color: Colors.ink },
  cardMsgPrice: { fontFamily: Fonts.serifItalic, fontSize: 14, color: Colors.rust, fontWeight: '600', marginTop: 2 },
  cardMsgSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.ink3, marginTop: 3 },
  viewListingBtn: {
    marginTop: 10, padding: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.line2, backgroundColor: Colors.cream2,
  },
  viewListingBtnText: { fontFamily: Fonts.sansMedium, fontSize: 11.5, color: Colors.ink, textAlign: 'center' },
  mutedNotice: {
    alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(28,28,30,0.06)', borderWidth: 1, borderColor: Colors.line2, marginTop: 8,
  },
  mutedNoticeText: { fontFamily: Fonts.mono, fontSize: 10.5, color: Colors.ink3, letterSpacing: 1 },
  composer: {
    padding: 10, paddingHorizontal: 12, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: Colors.line, backgroundColor: Colors.paper,
  },
  attachPanel: { flexDirection: 'row', gap: 8, paddingBottom: 10 },
  attachOption: {
    flex: 1, padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.line2, backgroundColor: Colors.cream2,
    alignItems: 'center', justifyContent: 'center',
  },
  attachOptionText: { fontFamily: Fonts.sansMedium, fontSize: 11.5, color: Colors.ink },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 4, paddingLeft: 14, borderRadius: 999,
    backgroundColor: Colors.cream2, borderWidth: 1, borderColor: Colors.line2,
  },
  plusBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  plusBtnText: { fontSize: 22, color: Colors.ink3, lineHeight: 26 },
  textInput: {
    flex: 1, paddingVertical: 10,
    fontFamily: Fonts.sans, fontSize: 13, color: Colors.ink,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.line2 },
  sendBtnText: { fontSize: 14, color: Colors.cream },
  composerFooter: {
    textAlign: 'center', marginTop: 6,
    fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.8,
    color: Colors.muted, textTransform: 'uppercase',
  },
});
