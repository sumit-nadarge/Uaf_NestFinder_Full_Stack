// app/(owner)/fees.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

export default function FeesScreen() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [selProp, setSelProp]       = useState<any>(null);
  const [records, setRecords]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);

  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [form, setForm] = useState({
    tenant_name: '', room_no: '',
    rent: '', month: thisMonth, status: 'unpaid',
  });

  useEffect(() => {
    (async () => {
      try {
        const all = await apiFetch('/owner/properties', token);
        setProperties(all);
        if (all.length > 0) setSelProp(all[0]);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => { if (selProp) loadRecords(); }, [selProp]);

  const loadRecords = async () => {
    if (!selProp) return;
    setLoading(true);
    try { setRecords(await apiFetch(`/fees/${selProp.id}`, token)); } catch (e) {}
    setLoading(false); setRefreshing(false);
  };

  const saveFee = async () => {
    if (!form.tenant_name || !form.room_no || !form.rent) return Alert.alert('Error', 'Fill all required fields');
    setSaving(true);
    try {
      await apiFetch('/fees', token, {
        method: 'POST',
        body: JSON.stringify({ ...form, property_id: selProp.id }),
      });
      setModal(false);
      setForm({ tenant_name: '', room_no: '', rent: '', month: thisMonth, status: 'unpaid' });
      loadRecords();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSaving(false);
  };

  const toggleStatus = async (id: number, current: string) => {
    const next = current === 'paid' ? 'unpaid' : 'paid';
    try {
      await apiFetch(`/fees/${id}/status`, token, {
        method: 'PUT', body: JSON.stringify({ status: next }),
      });
      loadRecords();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const totalRent  = records.reduce((s, r) => s + Number(r.rent), 0);
  const totalPaid  = records.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.rent), 0);
  const totalUnpaid = totalRent - totalPaid;

  const renderRecord = ({ item }: { item: any }) => (
    <View style={styles.record}>
      <View style={styles.recordLeft}>
        <Text style={styles.recordName}>{item.tenant_name}</Text>
        <Text style={styles.recordMeta}>Room {item.room_no} · {item.month}</Text>
        <Text style={styles.recordRent}>₹{Number(item.rent).toLocaleString('en-IN')}</Text>
      </View>
      <TouchableOpacity
        style={[styles.toggleBtn, { backgroundColor: item.status === 'paid' ? Colors.success + '18' : Colors.danger + '18', borderColor: item.status === 'paid' ? Colors.success + '55' : Colors.danger + '55' }]}
        onPress={() => toggleStatus(item.id, item.status)}>
        <Text style={{ color: item.status === 'paid' ? Colors.success : Colors.danger, fontSize: 12, fontWeight: '700' }}>
          {item.status === 'paid' ? '✅ Paid' : '❌ Unpaid'}
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 2 }}>tap to toggle</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Fees</Text>
        <Text style={styles.headerSub}>Monthly rent tracking</Text>
      </View>

      {/* Property Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {properties.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.propPill, selProp?.id === p.id && styles.propPillActive]}
            onPress={() => setSelProp(p)}>
            <Text style={[styles.propPillText, selProp?.id === p.id && styles.propPillTextActive]}>
              {p.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Bar */}
      {selProp && (
        <View style={styles.summaryBar}>
          <View style={styles.sumItem}>
            <Text style={[styles.sumVal, { color: Colors.gold }]}>₹{totalRent.toLocaleString('en-IN')}</Text>
            <Text style={styles.sumLbl}>Total</Text>
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumItem}>
            <Text style={[styles.sumVal, { color: Colors.success }]}>₹{totalPaid.toLocaleString('en-IN')}</Text>
            <Text style={styles.sumLbl}>Collected</Text>
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumItem}>
            <Text style={[styles.sumVal, { color: Colors.danger }]}>₹{totalUnpaid.toLocaleString('en-IN')}</Text>
            <Text style={styles.sumLbl}>Pending</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
            <Ionicons name="add" size={16} color="#000" />
            <Text style={styles.addBtnText}>Add</Text>
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
            ListEmptyComponent={<View style={styles.empty}><Text style={{ fontSize: 32 }}>💰</Text><Text style={styles.emptyText}>No fee records yet</Text></View>}
          />}

      {/* Add Fee Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add Fee Record</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>TENANT NAME *</Text>
                <TextInput style={styles.input} value={form.tenant_name} onChangeText={v => setForm(f => ({ ...f, tenant_name: v }))} placeholder="Name" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ROOM NO. *</Text>
                <TextInput style={styles.input} value={form.room_no} onChangeText={v => setForm(f => ({ ...f, room_no: v }))} placeholder="101" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>RENT (₹) *</Text>
                <TextInput style={styles.input} value={form.rent} onChangeText={v => setForm(f => ({ ...f, rent: v }))} placeholder="7000" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>MONTH</Text>
                <TextInput style={styles.input} value={form.month} onChangeText={v => setForm(f => ({ ...f, month: v }))} placeholder="YYYY-MM" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <Text style={styles.label}>STATUS</Text>
            <View style={styles.statusRow}>
              {['unpaid', 'paid'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, form.status === s && {
                    backgroundColor: s === 'paid' ? Colors.success : Colors.danger,
                    borderColor: s === 'paid' ? Colors.success : Colors.danger,
                  }]}
                  onPress={() => setForm(f => ({ ...f, status: s }))}>
                  <Text style={[styles.statusBtnText, form.status === s && { color: '#fff' }]}>
                    {s === 'paid' ? '✅ Paid' : '❌ Unpaid'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveFee} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Fee Record'}</Text>
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
  summaryBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16, paddingVertical: 12 },
  sumItem: { flex: 1, alignItems: 'center' },
  sumVal: { fontSize: 16, fontWeight: '800' },
  sumLbl: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  sumDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  addBtn: { backgroundColor: Colors.gold, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, marginLeft: 12 },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  record: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  recordLeft: {},
  recordName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  recordMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  recordRent: { fontSize: 15, fontWeight: '800', color: Colors.gold, marginTop: 4 },
  toggleBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: Colors.border },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  label: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, fontWeight: '600', marginBottom: 7 },
  input: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 14 },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  statusBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3, alignItems: 'center' },
  statusBtnText: { color: Colors.textMuted, fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: Colors.gold, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 18 },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
