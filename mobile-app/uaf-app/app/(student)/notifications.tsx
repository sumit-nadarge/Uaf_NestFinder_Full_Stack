// app/(student)/notifications.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

const TABS = [
  { key: 'accommodation', label: '🏠 Stays' },
  { key: 'received',      label: '📨 Received' },
  { key: 'sent',          label: '📤 Sent' },
];

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [tab, setTab]             = useState('accommodation');
  const [accData, setAccData]     = useState<any[]>([]);
  const [recvData, setRecvData]   = useState<any[]>([]);
  const [sentData, setSentData]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [acc, recv, sent] = await Promise.all([
        apiFetch('/requests/my', token),
        apiFetch('/flatmate-connects/received', token),
        apiFetch('/flatmate-connects/sent', token),
      ]);
      setAccData(acc); setRecvData(recv); setSentData(sent);
    } catch (e) {}
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const respond = async (id: number, status: string) => {
    try {
      await apiFetch(`/flatmate-connects/${id}/status`, token, {
        method: 'PUT', body: JSON.stringify({ status }),
      });
      Alert.alert(status === 'accepted' ? '✅ Accepted!' : '❌ Declined');
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const renderAcc = ({ item }: { item: any }) => (
    <View style={[styles.card, item.status === 'accepted' && styles.cardAccepted, item.status === 'rejected' && styles.cardRejected, item.status === 'pending' && styles.cardPending]}>
      <View style={styles.cardRow}>
        <Text style={styles.cardIcon}>{item.property_type === 'PG' ? '🛏️' : item.property_type === 'Hostel' ? '🏠' : '🏢'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.property_title}</Text>
          <Text style={styles.cardSub}>📍 {item.property_location} · ₹{Number(item.property_rent).toLocaleString('en-IN')}/mo</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.status === 'accepted' ? Colors.success + '22' : item.status === 'rejected' ? Colors.danger + '22' : Colors.warning + '22' }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: item.status === 'accepted' ? Colors.success : item.status === 'rejected' ? Colors.danger : Colors.warning }}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      {item.status === 'accepted' && (
        <View style={styles.acceptInfo}>
          <Text style={styles.acceptTitle}>🎉 Owner Accepted Your Request!</Text>
          <Text style={styles.infoLine}>👤 <Text style={styles.bold}>{item.owner_name}</Text></Text>
          <Text style={styles.infoLine}>📞 <Text style={styles.bold}>{item.owner_phone || 'N/A'}</Text></Text>
          <Text style={styles.infoLine}>✉️ <Text style={styles.bold}>{item.owner_email}</Text></Text>
          <Text style={styles.tip}>Contact the owner to finalize your accommodation!</Text>
        </View>
      )}
      {item.status === 'rejected' && <View style={styles.rejectInfo}><Text style={styles.rejectTxt}>Owner declined. Try another property.</Text></View>}
      {item.status === 'pending'  && <View style={styles.pendInfo}><Text style={styles.pendTxt}>⏳ Waiting for owner to respond...</Text></View>}
      <Text style={styles.dateText}>Sent {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
    </View>
  );

  const renderReceived = ({ item }: { item: any }) => (
    <View style={[styles.card, item.status === 'pending' && styles.cardPending, item.status === 'accepted' && styles.cardAccepted, item.status === 'rejected' && styles.cardRejected]}>
      <View style={styles.cardRow}>
        <View style={styles.miniAvatar}><Text style={{ color: '#000', fontWeight: '800', fontSize: 15 }}>{item.sender_name[0].toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.sender_name} wants to be your flatmate</Text>
          <Text style={styles.cardSub}>Post: {item.post_name} · {item.post_location}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.status === 'accepted' ? Colors.success + '22' : item.status === 'rejected' ? Colors.danger + '22' : Colors.warning + '22' }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: item.status === 'accepted' ? Colors.success : item.status === 'rejected' ? Colors.danger : Colors.warning }}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      {item.message ? <Text style={styles.message}>"{item.message}"</Text> : null}
      <Text style={styles.infoLine}>📞 <Text style={styles.bold}>{item.contact || 'Not provided'}</Text></Text>
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => respond(item.id, 'accepted')}>
            <Text style={styles.acceptBtnText}>✅ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={() => respond(item.id, 'rejected')}>
            <Text style={styles.declineBtnText}>❌ Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'accepted' && <Text style={{ color: Colors.success, fontSize: 13, marginTop: 8, fontWeight: '600' }}>✅ You accepted this request</Text>}
      {item.status === 'rejected' && <Text style={{ color: Colors.danger, fontSize: 13, marginTop: 8 }}>❌ You declined this request</Text>}
      <Text style={styles.dateText}>Received {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
    </View>
  );

  const renderSent = ({ item }: { item: any }) => (
    <View style={[styles.card, item.status === 'accepted' && styles.cardAccepted, item.status === 'rejected' && styles.cardRejected, item.status === 'pending' && styles.cardPending]}>
      <View style={styles.cardRow}>
        <Text style={{ fontSize: 28 }}>📤</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>Request to {item.target_name}</Text>
          <Text style={styles.cardSub}>Post: {item.post_name} · {item.post_location}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.status === 'accepted' ? Colors.success + '22' : item.status === 'rejected' ? Colors.danger + '22' : Colors.warning + '22' }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: item.status === 'accepted' ? Colors.success : item.status === 'rejected' ? Colors.danger : Colors.warning }}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      {item.status === 'accepted' && <View style={styles.acceptInfo}><Text style={styles.acceptTitle}>🎉 They accepted your request!</Text><Text style={styles.tip}>Connect with them to find your flat!</Text></View>}
      {item.status === 'rejected' && <View style={styles.rejectInfo}><Text style={styles.rejectTxt}>They declined your request.</Text></View>}
      {item.status === 'pending'  && <View style={styles.pendInfo}><Text style={styles.pendTxt}>⏳ Waiting for their response...</Text></View>}
      <Text style={styles.dateText}>Sent {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
    </View>
  );

  const currentData = tab === 'accommodation' ? accData : tab === 'received' ? recvData : sentData;
  const renderFn = tab === 'accommodation' ? renderAcc : tab === 'received' ? renderReceived : renderSent;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
        <Text style={styles.headerSub}>Request updates & responses</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} size="large" />
        : <FlatList
            data={currentData}
            keyExtractor={i => i.id.toString()}
            renderItem={renderFn as any}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
            ListEmptyComponent={<View style={styles.empty}><Text style={{ fontSize: 36 }}>🔔</Text><Text style={styles.emptyText}>No notifications yet</Text></View>}
          />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.bg2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.bg3, margin: 16, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 9, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.card },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.gold },
  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, padding: 16, marginBottom: 12 },
  cardAccepted: { borderLeftColor: Colors.success },
  cardRejected: { borderLeftColor: Colors.danger },
  cardPending:  { borderLeftColor: Colors.warning },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  cardIcon: { fontSize: 28 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  cardSub: { fontSize: 12, color: Colors.textMuted },
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  miniAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  message: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  acceptInfo: { backgroundColor: Colors.success + '12', borderRadius: 10, padding: 12, marginBottom: 8 },
  acceptTitle: { color: Colors.success, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  infoLine: { fontSize: 13, color: Colors.textMuted, marginBottom: 3 },
  bold: { color: Colors.text, fontWeight: '600' },
  tip: { color: Colors.success, fontSize: 12, fontStyle: 'italic', marginTop: 6 },
  rejectInfo: { backgroundColor: Colors.danger + '12', borderRadius: 10, padding: 10, marginBottom: 8 },
  rejectTxt: { color: Colors.danger, fontSize: 13 },
  pendInfo: { backgroundColor: Colors.warning + '12', borderRadius: 10, padding: 10, marginBottom: 8 },
  pendTxt: { color: Colors.warning, fontSize: 13 },
  dateText: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 6 },
  acceptBtn: { flex: 1, backgroundColor: Colors.success + '22', borderWidth: 1, borderColor: Colors.success + '44', padding: 11, borderRadius: 9, alignItems: 'center' },
  acceptBtnText: { color: Colors.success, fontWeight: '700', fontSize: 14 },
  declineBtn: { flex: 1, backgroundColor: Colors.danger + '22', borderWidth: 1, borderColor: Colors.danger + '44', padding: 11, borderRadius: 9, alignItems: 'center' },
  declineBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
});
