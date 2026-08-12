// app/(auth)/register.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';

export default function RegisterScreen() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone]       = useState('');
  const [role, setRole]         = useState<'user' | 'owner'>('user');
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Please fill required fields');
    setLoading(true);
    try {
      await register({ name, email: email.trim(), password, phone, role });
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🏠</Text>
          <Text style={styles.logoText}>UAF</Text>
          <Text style={styles.logoSub}>Create your account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Get Started</Text>

          {/* Role Selector */}
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
              onPress={() => setRole('user')}>
              <Text style={[styles.roleText, role === 'user' && styles.roleTextActive]}>👨‍🎓 Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'owner' && styles.roleBtnActive]}
              onPress={() => setRole('owner')}>
              <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>🏠 Owner</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>FULL NAME *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName}
              placeholder="Your full name" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>EMAIL *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor={Colors.textMuted}
              keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD *</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              placeholder="Min 6 characters" placeholderTextColor={Colors.textMuted} secureTextEntry />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>PHONE</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone}
              placeholder="10-digit number" placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad" />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <Text style={styles.switchLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoIcon: { fontSize: 40, marginBottom: 6 },
  logoText: { fontSize: 28, fontWeight: '900', color: Colors.gold, letterSpacing: 2 },
  logoSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  card: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 20, backgroundColor: Colors.bg3, borderRadius: 12, padding: 4 },
  roleBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  roleBtnActive: { backgroundColor: Colors.gold },
  roleText: { color: Colors.textMuted, fontWeight: '600', fontSize: 14 },
  roleTextActive: { color: '#000' },
  field: { marginBottom: 16 },
  label: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 15 },
  btn: { backgroundColor: Colors.gold, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  btnText: { fontWeight: '800', fontSize: 15, color: '#000' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  switchText: { color: Colors.textMuted, fontSize: 14 },
  switchLink: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
});
