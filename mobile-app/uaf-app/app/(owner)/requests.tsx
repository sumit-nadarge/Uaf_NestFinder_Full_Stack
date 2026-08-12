// app/(owner)/requests.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning, accepted: Colors.success, rejected: Colors.danger
};

export default function OwnerRequestsScreen() {
  const { token } = useAuth();
  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('all');

  const load = async () => {
    try { setRequests(await apiFetch('/requests/owner', token)); } catch (e) {}
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = (id: number, status: string, studentName: string) => {
    Alert.alert(
      status === 'accepted' ? 'Accept Request' : 'Reject Request',
      `${status === 'accepted' ? 'Accept' : 'Reject'} request from ${studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'accepted' ? 'Accept' : 'Reject',
          style: status === 'accepted' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/requests/${id}/status`, token, {
                method: 'PUT',
                body: JSON.stringify({ status }),
              });
              load();
              Alert.alert('✅', `Request ${status}!`);
            } catch (e: any) { Alert.alert('Error', e.message); }
          }
        }
      ]
    );
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { borderLeftColor: STATUS_COLOR[item.status], borderLeftWidth: 3 }]}>
      {/* Student info */}
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.student_name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.studentName}>{item.student_name}</Text>
          <Text style={styles.studentEmail}>{item.student_email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '22', borderColor: STATUS_COLOR[item.status] + '55' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Property */}
      <View style={styles.propRow}>
        <Ionicons name="home" size={14} color={Colors.gold} />
        <Text style={styles.propName}>{item.property_title}</Text>
      </View>

      {/* Message */}
      {item.message ? (
        <View style={styles.msgBox}>
          <Text style={styles.msgLabel}>Message:</Text>
          <Text style={styles.msgText}>"{item.message}"</Text>
        </View>
      ) : null}

      {/* Contact */}
      {item.contact ? (
        <View style={styles.contactRow}>
          <Ionicons name="call" size={14} color={Colors.teal} />
          <Text style={styles.contactText}>{item.contact}</Text>
        </View>
      ) : null}

      {/* Date */}
      <Text style={styles.dateText}>
        {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </Text>

      {/* Actions */}
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => updateStatus(item.id, 'accepted', item.student_name)}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => updateStatus(item.id, 'rejected', item.student_name)}>
            <Ionicons name="close-circle" size={16} color={Colors.danger} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📨 Student Requests</Text>
        <Text style={styles.headerSub}>{requests.filter(r => r.status === 'pending').length} pending</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'pending', 'accepted', 'rejected'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} size="large" />
        : <FlatList
            data={filtered}
            keyExtractor={i => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor={Colors.gold}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 36 }}>📨</Text>
                <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} requests</Text>
              </View>
            }
          />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: Colors.bg2,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: Colors.bg2, gap: 6,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bg3, alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: '#000' },
  card: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.teal,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#000', fontWeight: '800', fontSize: 17 },
  studentName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  studentEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  propRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
  },
  propName: { fontSize: 13, color: Colors.gold, fontWeight: '600' },
  msgBox: {
    backgroundColor: Colors.bg3, borderRadius: 8,
    padding: 10, marginBottom: 8,
  },
  msgLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  msgText: { fontSize: 13, color: Colors.text, fontStyle: 'italic' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  contactText: { fontSize: 13, color: Colors.teal, fontWeight: '600' },
  dateText: { fontSize: 11, color: Colors.textMuted, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.success + '18',
    borderWidth: 1, borderColor: Colors.success + '44',
    padding: 11, borderRadius: 9,
  },
  acceptBtnText: { color: Colors.success, fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.danger + '18',
    borderWidth: 1, borderColor: Colors.danger + '44',
    padding: 11, borderRadius: 9,
  },
  rejectBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
