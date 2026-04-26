import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import type { ChatThread, Role } from '../../types';

const BUYER_CHATS = [
  { n: 'Rajesh Patil',  last: 'Saturday 11am works? I can also show—', when: '10:47', unread: 2, ctx: '3 BHK · Aundh' },
  { n: 'Priya Shah',    last: "Owner is open to ₹95L.",                when: 'Yd',    unread: 0, ctx: '2 BHK · Baner' },
  { n: 'Anil Kumar',    last: 'Sharing brochure now.',                 when: 'Mon',   unread: 0, ctx: '3 BHK · Balewadi' },
];

const BROKER_CHATS = [
  { n: 'Ananya G.',     last: 'Sounds great — what time on Saturday?', when: '2m', unread: 2, ctx: '3 BHK · Baner' },
  { n: 'Suresh K.',     last: 'Will the price include parking?',       when: '1h', unread: 1, ctx: '2 BHK · Aundh' },
  { n: 'Mira & Devesh', last: 'Thanks for the brochure!',              when: 'Yd', unread: 0, ctx: '4 BHK · K. Park' },
];

interface Props {
  onOpen: (thread: ChatThread) => void;
  role: Role;
}

export default function ChatsListScreen({ onOpen, role }: Props) {
  const items = role === 'broker' ? BROKER_CHATS : BUYER_CHATS;
  const unreadCount = items.filter(i => i.unread > 0).length;

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <View style={styles.container}>
      <EditorialHeader
        kicker={role === 'broker' ? 'Broker · Inbox' : 'Buyer · Inbox'}
        title="Conversations"
        right={
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} UNREAD</Text>
          </View>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {items.map((c, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onOpen({ name: c.n, who: initials(c.n) })}
            style={styles.chatItem}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(c.n)}</Text>
            </View>
            <View style={styles.chatBody}>
              <View style={styles.chatTopRow}>
                <View style={styles.chatNameRow}>
                  <Text style={styles.chatName}>{c.n}</Text>
                  <Text style={styles.verifiedIcon}>✓</Text>
                </View>
                <Text style={styles.chatTime}>{c.when}</Text>
              </View>
              <Text style={styles.chatContext}>RE: {c.ctx.toUpperCase()}</Text>
              <Text
                style={[styles.chatLast, c.unread > 0 && styles.chatLastUnread]}
                numberOfLines={1}
              >
                {c.last}
              </Text>
            </View>
            {c.unread > 0 && (
              <View style={styles.unreadBubble}>
                <Text style={styles.unreadBubbleText}>{c.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 8 },
  unreadBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: Colors.cream2, borderWidth: 1, borderColor: Colors.line2,
  },
  unreadBadgeText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.ink3, letterSpacing: 0.8 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
    ...Shadow.sm,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.serifItalic, fontWeight: '700', fontSize: 15, color: Colors.cream,
  },
  chatBody: { flex: 1, minWidth: 0 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 1 },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatName: { fontFamily: Fonts.sansBold, fontSize: 13.5, color: Colors.ink },
  verifiedIcon: { fontSize: 10, color: Colors.sage },
  chatTime: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
  chatContext: {
    fontFamily: Fonts.mono, fontSize: 9.5, color: Colors.rust,
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 1,
  },
  chatLast: {
    fontFamily: Fonts.sans, fontSize: 12.5, color: Colors.muted, marginTop: 4,
  },
  chatLastUnread: { fontFamily: Fonts.sansMedium, color: Colors.ink },
  unreadBubble: {
    minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  unreadBubbleText: { fontFamily: Fonts.mono, fontSize: 10.5, fontWeight: '700', color: Colors.cream },
});
