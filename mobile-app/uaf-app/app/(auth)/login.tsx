// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router    = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // router handled by _layout
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🏠</Text>
          <Text style={styles.logoText}>UAF</Text>
          <Text style={styles.logoSub}>Unified Accommodation Finder</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.sub}>Sign in to your account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity><Text style={styles.switchLink}>Register</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoIcon: { fontSize: 48, marginBottom: 8 },
  logoText: {
    fontSize: 32, fontWeight: '900', color: Colors.gold,
    letterSpacing: 2,
  },
  logoSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, padding: 28,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: Colors.textMuted, marginBottom: 24 },
  field: { marginBottom: 18 },
  label: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, fontWeight: '600', marginBottom: 7 },
  input: {
    backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 13, color: Colors.text, fontSize: 15,
  },
  btn: {
    backgroundColor: Colors.gold, borderRadius: 10,
    padding: 15, alignItems: 'center', marginTop: 6,
  },
  btnText: { fontWeight: '800', fontSize: 15, color: '#000' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: Colors.textMuted, fontSize: 14 },
  switchLink: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
});
