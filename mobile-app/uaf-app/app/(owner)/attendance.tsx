// app/(owner)/attendance.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

export default function AttendanceScreen() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [selProp, setSelProp]       = useState<any>(null);
  const [records, setRecords]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    tenant_name: '', room_no: '',
    date: today, status: 'present',
  });

  // Load PG/Hostel properties
  useEffect(() => {
    (async () => {
      try {
        const all = await apiFetch('/owner/properties', token);
        const pgHostel = all.filter((p: any) => ['PG', 'Hostel'].includes(p.type));
        setProperties(pgHostel);
        if (pgHostel.length > 0) { setSelProp(pgHostel[0]); }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (selProp) loadRecords();
  }, [selProp]);

  const loadRecords = async () => {
    if (!selProp) return;
    setLoading(true);
    try {
      setRecords(await apiFetch(`/attendance/${selProp.id}`, token));
    } catch (e) {}
    setLoading(false); setRefreshing(false);
  };

  const markAttendance = async () => {
    if (!form.tenant_name || !form.room_no) return Alert.alert('Error', 'Tenant name and room are required');
    setSaving(true);
    try {
      await apiFetch('/attendance', token, {
        method: 'POST',
        body: JSON.stringify({ ...form, property_id: selProp.id }),
      });
      setModal(false);
      setForm({ tenant_name: '', room_no: '', date: today, status: 'present' });
      loadRecords();
      Alert.alert('✅', 'Attendance marked!');
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSaving(false);
  };

  const renderRecord = ({ item }: { item: any }) => (
    <View style={styles.record}>
      <View style={styles.recordLeft}>
        <Text style={styles.recordName}>{item.tenant_name}</Text>
        <Text style={styles.recordMeta}>Room {item.room_no} · {item.date}</Text>
      </View>
      <View style={[styles.statusBadge, {
        backgroundColor: item.status === 'present' ? Colors.success + '22' : Colors.danger + '22',
        borderColor: item.status === 'present' ? Colors.success + '55' : Colors.danger + '55',
      }]}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: item.status === 'present' ? Colors.success : Colors.danger }}>
          {item.status === 'present' ? '✅ Present' : '❌ Absent'}
        </Text>
      </View>
    </View>
  );

  if (properties.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📅 Attendance</Text>
          <Text style={styles.headerSub}>PG & Hostel only</Text>
        </View>
        <View style={styles.empty}>
          <Text style={{ fontSize: 36 }}>🏠</Text>
          <Text style={styles.emptyText}>No PG or Hostel properties found</Text>
          <Text style={styles.emptyHint}>Add a PG or Hostel property first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Attendance</Text>
        <Text style={styles.headerSub}>Mark tenant attendance</Text>
      </View>

      {/* Property Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {properties.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.propPill, selProp?.id === p.id && styles.propPillActive]}
            onPress={() => setSelProp(p)}>
            <Text style={[styles.propPillText, selProp?.id === p.id && styles.propPillTextActive]}>
              {p.type === 'PG' ? '🛏️' : '🏠'} {p.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats bar */}
      {selProp && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.success }]}>
              {records.filter(r => r.status === 'present').length}
            </Text>
            <Text style={styles.statLbl}>Present</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.danger }]}>
              {records.filter(r => r.status === 'absent').length}
            </Text>
            <Text style={styles.statLbl}>Absent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.gold }]}>{records.length}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
          <TouchableOpacity style={styles.markBtn} onPress={() => setModal(true)}>
            <Ionicons name="add" size={16} color="#000" />
            <Text style={styles.markBtnText}>Mark</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading
        ? <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} size="large" />
        : <FlatList
            data={records}
            keyExtractor={i => i.id.toString()}
            renderItem={renderRecord}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRecords(); }} tintColor={Colors.gold} />}
            ListEmptyComponent={<View style={styles.empty}><Text style={{ fontSize: 32 }}>📋</Text><Text style={styles.emptyText}>No records yet</Text></View>}
          />}

      {/* Mark Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Mark Attendance</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>TENANT NAME</Text>
            <TextInput style={styles.input} value={form.tenant_name} onChangeText={v => setForm(f => ({ ...f, tenant_name: v }))} placeholder="Tenant name" placeholderTextColor={Colors.textMuted} />

            <Text style={[styles.label, { marginTop: 12 }]}>ROOM NO.</Text>
            <TextInput style={styles.input} value={form.room_no} onChangeText={v => setForm(f => ({ ...f, room_no: v }))} placeholder="e.g. 101" placeholderTextColor={Colors.textMuted} />

            <Text style={[styles.label, { marginTop: 12 }]}>DATE</Text>
            <TextInput style={styles.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />

            <Text style={[styles.label, { marginTop: 12 }]}>STATUS</Text>
            <View style={styles.statusRow}>
              {['present', 'absent'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn,
                    form.status === s && { backgroundColor: s === 'present' ? Colors.success : Colors.danger, borderColor: s === 'present' ? Colors.success : Colors.danger }
                  ]}
                  onPress={() => setForm(f => ({ ...f, status: s }))}>
                  <Text style={[styles.statusBtnText, form.status === s && { color: '#fff' }]}>
                    {s === 'present' ? '✅ Present' : '❌ Absent'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={markAttendance} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Mark Attendance'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.bg2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  propScroll: { paddingVertical: 12, flexGrow: 0, backgroundColor: Colors.bg2 },
  propPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3, marginRight: 8 },
  propPillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  propPillText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  propPillTextActive: { color: '#000' },
  statsBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16, paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  markBtn: { backgroundColor: Colors.gold, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, marginLeft: 12 },
  markBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  record: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  recordLeft: {},
  recordName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  recordMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: Colors.border },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  label: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, fontWeight: '600', marginBottom: 7 },
  input: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 14, marginBottom: 0 },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3, alignItems: 'center' },
  statusBtnText: { color: Colors.textMuted, fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: Colors.gold, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 18 },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
