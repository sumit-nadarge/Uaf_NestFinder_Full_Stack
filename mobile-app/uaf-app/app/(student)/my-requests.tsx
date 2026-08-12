// app/(student)/my-requests.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning, accepted: Colors.success, rejected: Colors.danger
};
const STATUS_ICON: Record<string, string> = {
  pending: '⏳', accepted: '✅', rejected: '❌'
};
const TYPE_ICON: Record<string, string> = { PG: '🛏️', Hostel: '🏠', Flat: '🏢' };

export default function MyRequestsScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setRequests(await apiFetch('/requests/my', token)); } catch (e) {}
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { borderLeftColor: STATUS_COLOR[item.status], borderLeftWidth: 3 }]}>
      <View style={styles.cardTop}>
        <View style={styles.typeIcon}><Text style={{ fontSize: 22 }}>{TYPE_ICON[item.property_type] || '🏘️'}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.propName} numberOfLines={1}>{item.property_title}</Text>
          <Text style={styles.propMeta}>📍 {item.property_location}</Text>
          <Text style={styles.propRent}>₹{Number(item.property_rent).toLocaleString('en-IN')}/month</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '22', borderColor: STATUS_COLOR[item.status] + '55' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
            {STATUS_ICON[item.status]} {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Status message */}
      {item.status === 'accepted' && (
        <View style={styles.acceptBox}>
          <Text style={styles.acceptTitle}>🎉 Request Accepted!</Text>
          <Text style={styles.acceptDetail}>Owner: <Text style={styles.highlight}>{item.owner_name}</Text></Text>
          <Text style={styles.acceptDetail}>📞 <Text style={styles.highlight}>{item.owner_phone || 'N/A'}</Text></Text>
          <Text style={styles.acceptDetail}>✉️ <Text style={styles.highlight}>{item.owner_email}</Text></Text>
          <Text style={styles.acceptTip}>Contact the owner to finalize your stay!</Text>
        </View>
      )}
      {item.status === 'rejected' && (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectText}>❌ Owner declined. Try another property.</Text>
        </View>
      )}
      {item.status === 'pending' && (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingText}>⏳ Waiting for owner to respond...</Text>
        </View>
      )}

      <Text style={styles.date}>Sent: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📨 My Requests</Text>
        <Text style={styles.headerSub}>Track your accommodation requests</Text>
      </View>
      {loading
        ? <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} size="large" />
        : <FlatList
            data={requests}
            keyExtractor={i => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 36 }}>📨</Text>
                <Text style={styles.emptyText}>No requests yet</Text>
                <Text style={styles.emptyHint}>Browse properties and send requests</Text>
              </View>
            }
          />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.bg2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  typeIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: Colors.bg3, justifyContent: 'center', alignItems: 'center' },
  propName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  propMeta: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  propRent: { fontSize: 13, fontWeight: '600', color: Colors.gold },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  acceptBox: { backgroundColor: Colors.success + '12', borderWidth: 1, borderColor: Colors.success + '33', borderRadius: 10, padding: 14, marginBottom: 10 },
  acceptTitle: { color: Colors.success, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  acceptDetail: { fontSize: 13, color: Colors.textMuted, marginBottom: 3 },
  highlight: { color: Colors.text, fontWeight: '600' },
  acceptTip: { color: Colors.success, fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  rejectBox: { backgroundColor: Colors.danger + '12', borderWidth: 1, borderColor: Colors.danger + '33', borderRadius: 10, padding: 12, marginBottom: 10 },
  rejectText: { color: Colors.danger, fontSize: 13 },
  pendingBox: { backgroundColor: Colors.warning + '12', borderWidth: 1, borderColor: Colors.warning + '33', borderRadius: 10, padding: 12, marginBottom: 10 },
  pendingText: { color: Colors.warning, fontSize: 13 },
  date: { fontSize: 12, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  emptyHint: { color: Colors.textMuted, fontSize: 13 },
});
