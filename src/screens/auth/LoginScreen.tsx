import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Colors, Fonts, Shadow } from '../../theme';

interface Props {
  onSuccess: () => void;
  onSignUp: () => void;
}

export default function LoginScreen({ onSuccess, onSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    const e = email.trim().toLowerCase();
    if (!e.includes('@')) { Alert.alert('Invalid email', 'Please enter your email address.'); return; }
    if (!password) { Alert.alert('Password required', 'Please enter your password.'); return; }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, e, password);
      onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const msg = code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential'
        ? 'Incorrect email or password.'
        : (err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      Alert.alert('Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const e = email.trim().toLowerCase();
    if (!e.includes('@')) {
      Alert.alert('Enter your email', 'Type your email above first, then tap Forgot password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, e);
      Alert.alert('Email sent', `A password reset link has been sent to ${e}.`);
    } catch {
      Alert.alert('Error', 'Could not send reset email. Check the address and try again.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>— Welcome back —</Text>
          <Text style={styles.title}>
            Sign in to{'\n'}
            <Text style={styles.titleRust}>PropMatch</Text>
          </Text>
          <Text style={styles.sub}>
            Your properties, requirements and connections are waiting.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.cream} />
              : <Text style={styles.btnPrimaryText}>Sign In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={onSignUp} activeOpacity={0.7}>
            <Text style={styles.linkText}>New to PropMatch? </Text>
            <Text style={[styles.linkText, styles.linkUnderline]}>Create an account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>No spam · Your control · Verified only</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 36,
  },
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.rust,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: Colors.ink,
    marginBottom: 10,
  },
  titleRust: {
    color: Colors.rust,
    fontFamily: Fonts.serifItalic,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ink3,
  },
  form: {
    gap: 4,
  },
  field: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.ink3,
    textTransform: 'uppercase',
  },
  forgotText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.rust,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    ...Shadow.sm,
  },
  btnPrimary: {
    backgroundColor: Colors.rust,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    ...Shadow.md,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnPrimaryText: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.cream,
    letterSpacing: 0.3,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink3,
  },
  linkUnderline: {
    textDecorationLine: 'underline',
    color: Colors.rust,
  },
  footer: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Colors.muted,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 48,
  },
});
