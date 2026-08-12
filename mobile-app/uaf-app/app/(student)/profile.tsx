// app/(student)/profile.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, color = Colors.text }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} style={{ width: 28 }} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
      </View>

      {/* Avatar card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>👨‍🎓 Student</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        <MenuItem icon="home-outline" label="Browse Properties" onPress={() => {}} />
        <MenuItem icon="people-outline" label="Find Flatmates" onPress={() => {}} />
        <MenuItem icon="paper-plane-outline" label="My Requests" onPress={() => {}} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
      </View>

      <View style={styles.menuCard}>
        <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} color={Colors.danger} />
      </View>

      <Text style={styles.version}>UAF v1.0.0 · Unified Accommodation Finder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.bg2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  profileCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 24, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#000' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.text },
  email: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  roleBadge: { marginTop: 12, backgroundColor: Colors.teal + '22', borderWidth: 1, borderColor: Colors.teal + '55', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  roleText: { color: Colors.teal, fontWeight: '600', fontSize: 13 },
  menuCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', marginLeft: 4 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 8 },
});
