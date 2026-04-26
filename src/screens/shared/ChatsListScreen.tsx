import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Fonts, Shadow } from '../../theme';
import EditorialHeader from '../../components/EditorialHeader';
import {
  subscribeBuyerConnections, subscribeBrokerConnections,
  respondToConnection, type Connection,
} from '../../services/connectionsService';
import type { ChatThread, Role, AppUser } from '../../types';

interface Props {
  onOpen: (thread: ChatThread) => void;
  role: Role;
  appUser: AppUser;
}

export default function ChatsListScreen({ onOpen, role, appUser }: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'buyer') {
      const unsub = subscribeBuyerConnections(appUser.uid, (conns) => {
        setConnections(conns);
        setLoading(false);
      });
      return unsub;
    } else {
      const unsub = subscribeBrokerConnections(appUser.uid, 'all', (conns) => {
        setConnections(conns);
        setLoading(false);
      });
      return unsub;
    }
  }, [appUser.uid, role]);

  const accepted = connections.filter(c => c.status === 'accepted');
  const pending = connections.filter(c => c.status === 'pending');
  const unreadCount = accepted.length;

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const openThread = (conn: Connection) => {
    const name = role === 'buyer' ? conn.brokerName : conn.buyerName;
    onOpen({ name, who: initials(name), connId: conn.id });
  };

  return (
    <View style={styles.container}>
      <EditorialHeader
        kicker={role === 'broker' ? 'Broker · Inbox' : 'Buyer · Inbox'}
        title="Conversations"
        right={
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} ACTIVE</Text>
          </View>
        }
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.rust} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Accepted connections — full chat threads */}
          {accepted.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Active chats</Text>
              {accepted.map(conn => {
                const name = role === 'buyer' ? conn.brokerName : conn.buyerName;
                return (
                  <TouchableOpacity
                    key={conn.id}
                    onPress={() => openThread(conn)}
                    style={styles.chatItem}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(name)}</Text>
                    </View>
                    <View style={styles.chatBody}>
                      <View style={styles.chatTopRow}>
                        <View style={styles.chatNameRow}>
                          <Text style={styles.chatName}>{name}</Text>
                          <Text style={styles.verifiedIcon}>✓</Text>
                        </View>
                        <Text style={styles.statusChip}>Connected</Text>
                      </View>
                      <Text style={styles.chatContext}>
                        RE: {conn.listingTitle.toUpperCase()} · {conn.listingPrice}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Pending connections — broker can accept/reject; buyer sees waiting state */}
          {pending.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>
                {role === 'broker' ? 'Connection requests' : 'Awaiting response'}
              </Text>
              {pending.map(conn => {
                const name = role === 'buyer' ? conn.brokerName : conn.buyerName;
                return (
                  <View key={conn.id} style={styles.pendingItem}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(name)}</Text>
                    </View>
                    <View style={styles.chatBody}>
                      <View style={styles.chatTopRow}>
                        <Text style={styles.chatName}>{name}</Text>
                        <Text style={styles.pendingChip}>Pending</Text>
                      </View>
                      <Text style={styles.chatContext}>
                        RE: {conn.listingTitle.toUpperCase()} · {conn.listingPrice}
                      </Text>
                      {conn.message ? (
                        <Text style={styles.pendingMsg} numberOfLines={2}>{conn.message}</Text>
                      ) : null}
                    </View>
                    {role === 'broker' && (
                      <View style={styles.actionBtns}>
                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => respondToConnection(conn.id, 'accepted')}
                        >
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => respondToConnection(conn.id, 'rejected')}
                        >
                          <Text style={styles.rejectBtnText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {connections.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>
                {role === 'buyer'
                  ? 'Send a connection request from the Discover tab to start chatting with brokers.'
                  : 'When buyers connect with your listings, their requests will appear here.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  sectionLabel: {
    fontFamily: Fonts.mono, fontSize: 9.5, color: Colors.muted,
    letterSpacing: 2, textTransform: 'uppercase', marginTop: 8, marginBottom: 4, marginLeft: 2,
  },
  chatItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line,
    ...Shadow.sm,
  },
  pendingItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.line2,
    ...Shadow.sm,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 999,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: Fonts.serifItalic, fontWeight: '700', fontSize: 15, color: Colors.cream },
  chatBody: { flex: 1, minWidth: 0 },
  chatTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 8, marginBottom: 2,
  },
  chatNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatName: { fontFamily: Fonts.sansBold, fontSize: 13.5, color: Colors.ink },
  verifiedIcon: { fontSize: 10, color: Colors.sage },
  chatContext: {
    fontFamily: Fonts.mono, fontSize: 9.5, color: Colors.rust,
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 1,
  },
  statusChip: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.sage,
    letterSpacing: 1, textTransform: 'uppercase',
    backgroundColor: Colors.sageSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  pendingChip: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted,
    letterSpacing: 1, textTransform: 'uppercase',
    backgroundColor: Colors.cream2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    borderWidth: 1, borderColor: Colors.line2,
  },
  pendingMsg: {
    fontFamily: Fonts.sans, fontSize: 12, color: Colors.ink3, marginTop: 6, lineHeight: 17,
  },
  actionBtns: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  acceptBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    backgroundColor: Colors.ink, alignItems: 'center',
  },
  acceptBtnText: { fontFamily: Fonts.sansBold, fontSize: 11, color: Colors.cream },
  rejectBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.line2, alignItems: 'center',
  },
  rejectBtnText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.muted },
  emptyState: {
    padding: 48, alignItems: 'center',
    backgroundColor: Colors.paper, borderRadius: 16,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.line2,
    marginTop: 16,
  },
  emptyTitle: { fontFamily: Fonts.serif, fontSize: 18, color: Colors.ink, marginBottom: 8 },
  emptySub: {
    fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted,
    textAlign: 'center', lineHeight: 18,
  },
});
