import React, { useState, useCallback } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';

import { Colors } from './src/theme';
import BottomNav from './src/components/BottomNav';
import BottomSheet from './src/components/BottomSheet';
import Toast from './src/components/Toast';
import ConnectSheet from './src/components/ConnectSheet';

import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import MyPropertiesScreen from './src/screens/buyer/MyPropertiesScreen';
import PostRequirementScreen from './src/screens/buyer/PostRequirementScreen';
import DiscoverScreen from './src/screens/buyer/DiscoverScreen';
import ChatScreen from './src/screens/shared/ChatScreen';
import ChatsListScreen from './src/screens/shared/ChatsListScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';
import BrokerDashboardScreen from './src/screens/broker/BrokerDashboardScreen';
import PostListingScreen from './src/screens/broker/PostListingScreen';

import type { Role, ChatThread, Listing } from './src/types';

type Tab = 'home' | 'discover' | 'post' | 'chats' | 'profile' | 'broker' | 'matched';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  const [role, setRole] = useState<Role | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);
  const [connectSheet, setConnectSheet] = useState<Listing | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const openChat = useCallback((thread: ChatThread) => {
    setChatThread(thread);
    setTab('chats');
  }, []);

  const handleSetRole = useCallback((r: Role) => {
    setRole(r);
    setTab(r === 'broker' ? 'broker' : 'home');
  }, []);

  const handleTabChange = useCallback((t: Tab) => {
    setChatThread(null);
    setTab(t);
  }, []);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading} />
      </SafeAreaProvider>
    );
  }

  if (!role) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={Colors.cream} />
          <OnboardingScreen onPick={handleSetRole} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  let screen: React.ReactNode;

  if (role === 'buyer') {
    if (chatThread && tab === 'chats') {
      screen = <ChatScreen thread={chatThread} onBack={() => setChatThread(null)} role="buyer" />;
    } else if (tab === 'home') {
      screen = <MyPropertiesScreen openChat={openChat} />;
    } else if (tab === 'discover') {
      screen = <DiscoverScreen openConnect={(l) => setConnectSheet(l)} />;
    } else if (tab === 'post') {
      screen = (
        <PostRequirementScreen
          onPosted={() => {
            showToast('Requirement posted. Verified brokers can now reach you.');
            setTab('home');
          }}
        />
      );
    } else if (tab === 'chats') {
      screen = <ChatsListScreen onOpen={openChat} role="buyer" />;
    } else {
      screen = <ProfileScreen role={role} setRole={handleSetRole} />;
    }
  } else {
    if (chatThread && tab === 'chats') {
      screen = <ChatScreen thread={chatThread} onBack={() => setChatThread(null)} role="broker" />;
    } else if (tab === 'broker' || tab === 'matched') {
      screen = (
        <BrokerDashboardScreen
          onConnectBuyer={() => showToast('Connection request sent. Awaiting buyer approval.')}
        />
      );
    } else if (tab === 'post') {
      screen = (
        <PostListingScreen
          onPosted={() => {
            showToast('Listing posted to verified buyers.');
            setTab('broker');
          }}
        />
      );
    } else if (tab === 'chats') {
      screen = <ChatsListScreen onOpen={openChat} role="broker" />;
    } else {
      screen = <ProfileScreen role={role} setRole={handleSetRole} />;
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.paper} />
        <View style={styles.appContainer}>
          <View style={styles.screenArea}>{screen}</View>
          <BottomNav
            tab={tab}
            setTab={handleTabChange}
            role={role}
            badges={role === 'buyer' ? { chats: 2 } : { chats: 3, matched: 3 }}
          />
        </View>

        <BottomSheet open={!!connectSheet} onClose={() => setConnectSheet(null)}>
          {connectSheet && (
            <ConnectSheet
              listing={connectSheet}
              onSend={() => {
                setConnectSheet(null);
                showToast('Request sent — broker can reply once you approve.');
              }}
              onClose={() => setConnectSheet(null)}
            />
          )}
        </BottomSheet>

        <Toast message={toast} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.cream },
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  appContainer: { flex: 1, backgroundColor: Colors.cream },
  screenArea: { flex: 1 },
});
