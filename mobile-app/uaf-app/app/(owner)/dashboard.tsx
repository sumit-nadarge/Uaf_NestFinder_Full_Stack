// app/(owner)/dashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

export default function OwnerDashboard() {
  const { user, token, logout } = useAuth();
  const [stats, setStats]           = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setStats(await apiFetch('/owner/stats', token)); } catch (e) {}
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const handleLogout = () => Alert.alert('Logout', 'Sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Logout', style: 'destructive', onPress: logout },
  ]);

  const StatCard = ({ label, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 2 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statVal, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const QuickCard = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={[styles.quickCard, { borderColor: color + '44' }]} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Property Owner</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>📊 Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Properties"   value={stats.total_properties}   icon="🏘️" color={Colors.gold} />
        <StatCard label="Available"    value={stats.available_properties} icon="✅" color={Colors.success} />
        <StatCard label="Requests"     value={stats.pending_requests}    icon="📨" color={Colors.teal} />
        <StatCard label="Unpaid Fees"  value={stats.unpaid_fees}         icon="💰" color={Colors.danger} />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.quickGrid}>
        <QuickCard icon="➕" label="Add Property" color={Colors.gold}    onPress={() => {}} />
        <QuickCard icon="📋" label="View Requests" color={Colors.teal}   onPress={() => {}} />
        <QuickCard icon="📅" label="Attendance"    color={Colors.success} onPress={() => {}} />
        <QuickCard icon="💰" label="Manage Fees"   color={Colors.warning} onPress={() => {}} />
      </View>

      {/* Tips */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Tips</Text>
        <Text style={styles.tipText}>• Add photos to your listings to attract more students</Text>
        <Text style={styles.tipText}>• Keep vacancy status updated for accurate listings</Text>
        <Text style={styles.tipText}>• Respond to requests quickly to secure tenants</Text>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24, backgroundColor: Colors.bg2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: Colors.textMuted },
  name: { fontSize: 24, fontWeight: '900', color: Colors.text, marginTop: 2 },
  role: { fontSize: 13, color: Colors.gold, marginTop: 4, fontWeight: '600' },
  logoutBtn: { backgroundColor: Colors.danger + '18', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.danger + '44' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  statCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, width: '46%', marginHorizontal: 4, alignItems: 'center' },
  statIcon: { fontSize: 26, marginBottom: 8 },
  statVal: { fontSize: 30, fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  quickCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, width: '46%', marginHorizontal: 4, padding: 18, alignItems: 'center', gap: 8 },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  tipCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 24, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 18 },
  tipTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  tipText: { fontSize: 13, color: Colors.textMuted, marginBottom: 6, lineHeight: 19 },
});
