import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { createUserDoc } from '../../services/userService';
import { Colors, Fonts, Shadow } from '../../theme';
import type { Role } from '../../types';

interface Props {
  onSuccess: () => void;
  onSignIn: () => void;
}

type Step = 'role' | 'details';

const ROLE_OPTIONS: { id: Role; title: string; sub: string; icon: string }[] = [
  {
    id: 'buyer',
    title: "I'm a Buyer",
    sub: 'Track properties, post requirements,\nstay in control of who reaches you.',
    icon: '🏠',
  },
  {
    id: 'broker',
    title: "I'm a Broker",
    sub: 'Reach genuinely interested buyers.\nNo cold calls, only matched intent.',
    icon: '🔑',
  },
];

export default function SignUpScreen({ onSuccess, onSignIn }: Props) {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!role) return;
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (!n) { Alert.alert('Name required', 'Please enter your full name.'); return; }
    if (!e.includes('@')) { Alert.alert('Invalid email', 'Please enter a valid email address.'); return; }
    if (password.length < 6) { Alert.alert('Weak password', 'Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, password);
      await createUserDoc(cred.user.uid, { name: n, email: e, role });
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'role') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.kicker}>— Step 1 of 2 —</Text>
            <Text style={styles.title}>
              How will you be{'\n'}
              <Text style={styles.titleRust}>arriving today?</Text>
            </Text>
            <Text style={styles.sub}>This helps us tailor your experience.</Text>
          </View>

          <View style={styles.cards}>
            {ROLE_OPTIONS.map(opt => {
              const active = hover === opt.id || role === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPressIn={() => setHover(opt.id)}
                  onPressOut={() => setHover(null)}
                  onPress={() => setRole(opt.id)}
                  style={[styles.card, active && styles.cardActive]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.cardIcon, active && styles.cardIconActive]}>
                    <Text style={styles.iconEmoji}>{opt.icon}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                      {opt.title}
                    </Text>
                    <Text style={[styles.cardSub, active && styles.cardSubActive]}>
                      {opt.sub}
                    </Text>
                  </View>
                  {role === opt.id && (
                    <View style={styles.selectedDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, !role && styles.btnDisabled]}
            onPress={() => role && setStep('details')}
            activeOpacity={0.85}
            disabled={!role}
          >
            <Text style={styles.btnPrimaryText}>Continue →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={onSignIn} activeOpacity={0.7}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Text style={[styles.linkText, styles.linkUnderline]}>Sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('role')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.kicker}>— Step 2 of 2 —</Text>
          <Text style={styles.title}>
            Create your{'\n'}
            <Text style={styles.titleRust}>account</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kedar Gaikwad"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

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
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor={Colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
          </View>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              Signing up as {role === 'buyer' ? '🏠 Buyer' : '🔑 Broker'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.cream} />
              : <Text style={styles.btnPrimaryText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={onSignIn} activeOpacity={0.7}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Text style={[styles.linkText, styles.linkUnderline]}>Sign in</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    marginBottom: 20,
  },
  backBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.rust,
    letterSpacing: 0.5,
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
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: Colors.ink,
    marginBottom: 8,
  },
  titleRust: {
    color: Colors.rust,
    fontFamily: Fonts.serifItalic,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.ink3,
    marginTop: 4,
  },
  cards: {
    gap: 12,
    marginBottom: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadow.sm,
  },
  cardActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
    ...Shadow.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: Colors.cream2,
    borderWidth: 1,
    borderColor: Colors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconActive: {
    backgroundColor: 'rgba(245,240,232,0.1)',
    borderColor: 'rgba(245,240,232,0.18)',
  },
  iconEmoji: { fontSize: 24 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    lineHeight: 22,
    marginBottom: 4,
    color: Colors.ink,
  },
  cardTitleActive: { color: Colors.cream },
  cardSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.ink3,
  },
  cardSubActive: { color: Colors.cream },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.rust,
  },
  form: {
    gap: 4,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.ink3,
    textTransform: 'uppercase',
    marginBottom: 8,
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
  roleBadge: {
    backgroundColor: Colors.cream2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.line2,
    marginBottom: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.ink3,
    letterSpacing: 0.5,
  },
  btnPrimary: {
    backgroundColor: Colors.rust,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 12,
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
});
