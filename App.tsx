import React, { useState, useCallback, useEffect } from 'react';
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
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, saveUid, loadStoredUid, clearStoredUid } from './src/services/firebase';
import { getUserDoc } from './src/services/userService';
import { sendConnectionRequest } from './src/services/connectionsService';
import { registerForPushNotifications, addNotificationTapListener } from './src/services/notificationsService';

import { Colors } from './src/theme';
import BottomNav from './src/components/BottomNav';
import BottomSheet from './src/components/BottomSheet';
import Toast from './src/components/Toast';
import ConnectSheet from './src/components/ConnectSheet';

import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import MyPropertiesScreen from './src/screens/buyer/MyPropertiesScreen';
import PostRequirementScreen from './src/screens/buyer/PostRequirementScreen';
import DiscoverScreen from './src/screens/buyer/DiscoverScreen';
import ChatScreen from './src/screens/shared/ChatScreen';
import ChatsListScreen from './src/screens/shared/ChatsListScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';
import BrokerDashboardScreen from './src/screens/broker/BrokerDashboardScreen';
import PostListingScreen from './src/screens/broker/PostListingScreen';

import type { Role, ChatThread, Listing, AppUser } from './src/types';

type Tab = 'home' | 'discover' | 'post' | 'chats' | 'profile' | 'broker' | 'matched';
type AuthView = 'welcome' | 'signup' | 'login';

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

  // Firebase auth state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth flow navigation
  const [authView, setAuthView] = useState<AuthView>('welcome');

  // App navigation
  const [tab, setTab] = useState<Tab>('home');
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);
  const [connectSheet, setConnectSheet] = useState<Listing | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Register push token and wire tap → navigate to chats
  useEffect(() => {
    if (!appUser) return;
    registerForPushNotifications(appUser.uid);
    const sub = addNotificationTapListener((data) => {
      if (data.type === 'connection' || data.type === 'message') {
        setTab('chats');
        setChatThread(null);
      }
    });
    return () => sub.remove();
  }, [appUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // On cold start: if Firebase auth is in-memory (lost after kill), try restoring
    // the session from the UID we persisted in AsyncStorage.
    async function tryRestoreSession() {
      const storedUid = await loadStoredUid();
      if (storedUid && !auth.currentUser) {
        const doc = await getUserDoc(storedUid);
        if (doc) {
          setAppUser(doc);
          setTab(doc.role === 'broker' ? 'broker' : 'home');
          setAuthLoading(false);
          return;
        }
      }
      setAuthLoading(false);
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await saveUid(user.uid);
        const doc = await getUserDoc(user.uid);
        setAppUser(doc);
        if (doc) setTab(doc.role === 'broker' ? 'broker' : 'home');
      } else {
        // Only clear stored state if this was an explicit sign-out (not a cold start)
        if (!authLoading) {
          setAppUser(null);
          await clearStoredUid();
        }
      }
      setAuthLoading(false);
    });

    tryRestoreSession();
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  const openChat = useCallback((thread: ChatThread) => {
    setChatThread(thread);
    setTab('chats');
  }, []);

  const handleTabChange = useCallback((t: Tab) => {
    setChatThread(null);
    setTab(t);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    // onAuthStateChanged fires automatically — nothing to do here
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    await clearStoredUid();
    setFirebaseUser(null);
    setAppUser(null);
    setAuthView('welcome');
    setChatThread(null);
    setTab('home');
  }, []);

  // Splash while fonts or auth state are loading
  if (!fontsLoaded || authLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading} />
      </SafeAreaProvider>
    );
  }

  // Not authenticated — show auth flow
  if (!firebaseUser || !appUser) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={Colors.cream} />
          {authView === 'welcome' && (
            <WelcomeScreen
              onGetStarted={() => setAuthView('signup')}
              onSignIn={() => setAuthView('login')}
            />
          )}
          {authView === 'signup' && (
            <SignUpScreen
              onSuccess={handleAuthSuccess}
              onSignIn={() => setAuthView('login')}
            />
          )}
          {authView === 'login' && (
            <LoginScreen
              onSuccess={handleAuthSuccess}
              onSignUp={() => setAuthView('signup')}
            />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const role: Role = appUser.role;

  let screen: React.ReactNode;

  if (role === 'buyer') {
    if (chatThread && tab === 'chats') {
      screen = <ChatScreen thread={chatThread} onBack={() => setChatThread(null)} role="buyer" appUser={appUser} />;
    } else if (tab === 'home') {
      screen = <MyPropertiesScreen openChat={openChat} appUser={appUser} />;
    } else if (tab === 'discover') {
      screen = <DiscoverScreen openConnect={(l) => setConnectSheet(l)} appUser={appUser} />;
    } else if (tab === 'post') {
      screen = (
        <PostRequirementScreen
          appUser={appUser}
          onPosted={() => {
            showToast('Requirement posted. Verified brokers can now reach you.');
            setTab('home');
          }}
        />
      );
    } else if (tab === 'chats') {
      screen = <ChatsListScreen onOpen={openChat} role="buyer" appUser={appUser} />;
    } else {
      screen = (
        <ProfileScreen
          role={role}
          appUser={appUser}
          onSignOut={handleSignOut}
          setRole={(r) => {
            setAppUser({ ...appUser, role: r });
            setTab(r === 'broker' ? 'broker' : 'home');
          }}
        />
      );
    }
  } else {
    if (chatThread && tab === 'chats') {
      screen = <ChatScreen thread={chatThread} onBack={() => setChatThread(null)} role="broker" appUser={appUser} />;
    } else if (tab === 'broker' || tab === 'matched') {
      screen = (
        <BrokerDashboardScreen
          appUser={appUser}
          onConnectBuyer={() => showToast('Connection request sent. Awaiting buyer approval.')}
        />
      );
    } else if (tab === 'post') {
      screen = (
        <PostListingScreen
          appUser={appUser}
          onPosted={() => {
            showToast('Listing posted to verified buyers.');
            setTab('broker');
          }}
        />
      );
    } else if (tab === 'chats') {
      screen = <ChatsListScreen onOpen={openChat} role="broker" appUser={appUser} />;
    } else {
      screen = (
        <ProfileScreen
          role={role}
          appUser={appUser}
          onSignOut={handleSignOut}
          setRole={(r) => {
            setAppUser({ ...appUser, role: r });
            setTab(r === 'broker' ? 'broker' : 'home');
          }}
        />
      );
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
              onSend={async (message) => {
                await sendConnectionRequest({
                  buyerUid: appUser.uid,
                  buyerName: appUser.name,
                  brokerUid: connectSheet.uid,
                  brokerName: connectSheet.broker,
                  listingId: connectSheet.id,
                  listingTitle: connectSheet.title,
                  listingPrice: connectSheet.price,
                  message,
                });
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
