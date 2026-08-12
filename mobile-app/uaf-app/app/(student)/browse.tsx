// app/(student)/browse.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, API_URL } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

const CATS = ['All', 'PG', 'Hostel', 'Flat'];
const TYPE_ICON: Record<string, string> = { PG: '🛏️', Hostel: '🏠', Flat: '🏢' };
const TYPE_COLOR: Record<string, string> = { PG: Colors.gold, Hostel: Colors.teal, Flat: '#b89fe8' };

export default function BrowseScreen() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [cat, setCat]               = useState('All');
  const [reqModal, setReqModal]     = useState(false);
  const [selProp, setSelProp]       = useState<any>(null);
  const [reqMsg, setReqMsg]         = useState('');
  const [reqPhone, setReqPhone]     = useState('');
  const [sending, setSending]       = useState(false);

  const load = useCallback(async () => {
    try {
      let url = '/properties?';
      if (cat !== 'All') url += `type=${cat}&`;
      if (search)        url += `location=${encodeURIComponent(search)}&`;
      const data = await apiFetch(url, token);
      setProperties(data);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }, [cat, search, token]);

  useEffect(() => { load(); }, [cat]);

  const sendRequest = async () => {
    if (!selProp) return;
    setSending(true);
    try {
      await apiFetch('/requests', token, {
        method: 'POST',
        body: JSON.stringify({ property_id: selProp.id, message: reqMsg, contact: reqPhone }),
      });
      setReqModal(false);
      setReqMsg(''); setReqPhone('');
      alert('✅ Request sent to owner!');
    } catch (e: any) { alert(e.message); }
    setSending(false);
  };

  const renderProperty = ({ item }: { item: any }) => (
    <View style={styles.propCard}>
      {/* Image */}
      <View style={styles.propImg}>
        {item.image_path
          ? <Image source={{ uri: `${API_URL.replace('/api', '')}${item.image_path}` }} style={styles.propImgFull} />
          : <View style={styles.propImgPlaceholder}><Text style={{ fontSize: 36 }}>🏠</Text></View>}
        <View style={[styles.typeBadge, { borderColor: TYPE_COLOR[item.type] }]}>
          <Text style={[styles.typeBadgeText, { color: TYPE_COLOR[item.type] }]}>{item.type}</Text>
        </View>
        <View style={[styles.vacDot, { backgroundColor: item.vacancy_status === 'available' ? Colors.success : Colors.danger }]} />
      </View>

      <View style={styles.propInfo}>
        <Text style={styles.propTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.propLoc}>📍 {item.location}</Text>
        <Text style={styles.propRent}>₹{Number(item.rent).toLocaleString('en-IN')}<Text style={styles.propRentSub}>/month</Text></Text>

        {/* Facilities */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(item.facilities || '').split(',').filter(Boolean).slice(0, 4).map((f: string, i: number) => (
            <View key={i} style={styles.facTag}><Text style={styles.facText}>{f.trim()}</Text></View>
          ))}
        </ScrollView>

        <View style={styles.propFooter}>
          <Text style={styles.roomsText}>🚪 {item.available_rooms}/{item.total_rooms} rooms</Text>
          <TouchableOpacity style={styles.reqBtn} onPress={() => { setSelProp(item); setReqModal(true); }}>
            <Text style={styles.reqBtnText}>Send Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Find Accommodation</Text>
        <Text style={styles.headerSub}>Browse PGs, Hostels & Flats</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by location..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={load}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={load}>
          <Ionicons name="search" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {CATS.map(c => (
          <TouchableOpacity key={c} style={[styles.pill, cat === c && styles.pillActive]} onPress={() => setCat(c)}>
            <Text style={[styles.pillText, cat === c && styles.pillTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading
        ? <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} size="large" />
        : <FlatList
            data={properties}
            keyExtractor={i => i.id.toString()}
            renderItem={renderProperty}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
            ListEmptyComponent={<View style={styles.empty}><Text style={{ fontSize: 32 }}>🔍</Text><Text style={styles.emptyText}>No properties found</Text></View>}
            showsVerticalScrollIndicator={false}
          />}

      {/* Request Modal */}
      <Modal visible={reqModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Send Request</Text>
            {selProp && (
              <View style={styles.modalPropInfo}>
                <Text style={styles.modalPropName}>{selProp.title}</Text>
                <Text style={styles.modalPropMeta}>📍 {selProp.location} · ₹{Number(selProp.rent).toLocaleString('en-IN')}/mo</Text>
              </View>
            )}
            <Text style={styles.label}>MESSAGE</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={reqMsg} onChangeText={setReqMsg}
              placeholder="Tell the owner about yourself..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <Text style={[styles.label, { marginTop: 12 }]}>YOUR CONTACT</Text>
            <TextInput
              style={styles.input}
              value={reqPhone} onChangeText={setReqPhone}
              placeholder="Phone number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReqModal(false)}>
                <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn} onPress={sendRequest} disabled={sending}>
                {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.sendBtnText}>Send</Text>}
              </TouchableOpacity>
            </View>
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
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bg2 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 10 },
  searchBtn: { backgroundColor: Colors.gold, borderRadius: 10, padding: 12, justifyContent: 'center', alignItems: 'center' },
  pills: { paddingVertical: 12, backgroundColor: Colors.bg2, flexGrow: 0 },
  pill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.card },
  pillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#000' },
  propCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, overflow: 'hidden' },
  propImg: { height: 180, position: 'relative' },
  propImgFull: { width: '100%', height: '100%' },
  propImgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg3 },
  typeBadge: { position: 'absolute', top: 10, left: 10, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.bg + 'cc' },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  vacDot: { position: 'absolute', top: 14, right: 14, width: 10, height: 10, borderRadius: 5 },
  propInfo: { padding: 14 },
  propTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  propLoc: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  propRent: { fontSize: 20, fontWeight: '800', color: Colors.gold, marginBottom: 10 },
  propRentSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '400' },
  facTag: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  facText: { fontSize: 12, color: Colors.textMuted },
  propFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomsText: { fontSize: 13, color: Colors.textMuted },
  reqBtn: { backgroundColor: Colors.gold, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
  reqBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  modalPropInfo: { backgroundColor: Colors.bg3, borderRadius: 10, padding: 12, marginBottom: 16 },
  modalPropName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  modalPropMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  label: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, fontWeight: '600', marginBottom: 7 },
  input: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  sendBtn: { flex: 2, padding: 14, borderRadius: 10, backgroundColor: Colors.gold, alignItems: 'center' },
  sendBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
