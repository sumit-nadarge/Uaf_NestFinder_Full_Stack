// app/(owner)/properties.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, ScrollView, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, API_URL } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function OwnerPropertiesScreen() {
  const { token } = useAuth();
  const [props, setProps]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [saving, setSaving]     = useState(false);
  const [imgUri, setImgUri]     = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'PG', title: '', location: '', rent: '',
    total_rooms: '', available_rooms: '', vacancy_status: 'available',
    facilities: '', description: ''
  });

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/owner/properties`, { headers: { Authorization: `Bearer ${token}` } });
      setProps(await res.json());
    } catch (e) {}
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null); setImgUri(null);
    setForm({ type: 'PG', title: '', location: '', rent: '', total_rooms: '', available_rooms: '', vacancy_status: 'available', facilities: '', description: '' });
    setModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p); setImgUri(null);
    setForm({ type: p.type, title: p.title, location: p.location, rent: String(p.rent), total_rooms: String(p.total_rooms), available_rooms: String(p.available_rooms), vacancy_status: p.vacancy_status, facilities: p.facilities || '', description: p.description || '' });
    setModal(true);
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled) setImgUri(r.assets[0].uri);
  };

  const save = async () => {
    if (!form.title || !form.location || !form.rent) return Alert.alert('Error', 'Title, location, and rent are required');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imgUri) fd.append('image', { uri: imgUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    try {
      const url    = editing ? `${API_URL}/properties/${editing.id}` : `${API_URL}/properties`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModal(false); load();
      Alert.alert('✅', editing ? 'Property updated!' : 'Property added!');
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSaving(false);
  };

  const del = (id: number) => Alert.alert('Delete', 'Delete this property?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await fetch(`${API_URL}/properties/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        load();
      } catch (e) {}
    }}
  ]);

  const F = ({ label, field, ...rest }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={form[field as keyof typeof form]} onChangeText={v => setForm(f => ({ ...f, [field]: v }))} placeholderTextColor={Colors.textMuted} {...rest} />
    </View>
  );

  const PillSelect = ({ label, field, options }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((o: string) => (
          <TouchableOpacity key={o} style={[styles.pill, form[field as keyof typeof form] === o && styles.pillActive]} onPress={() => setForm(f => ({ ...f, [field]: o }))}>
            <Text style={[styles.pillText, form[field as keyof typeof form] === o && styles.pillTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProp = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.image_path
        ? <Image source={{ uri: `${API_URL.replace('/api', '')}${item.image_path}` }} style={styles.cardImg} />
        : <View style={[styles.cardImg, { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg3 }]}><Text style={{ fontSize: 32 }}>🏠</Text></View>}
      <View style={styles.cardInfo}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardMeta}>📍 {item.location}</Text>
          </View>
          <View style={[styles.vacBadge, { backgroundColor: item.vacancy_status === 'available' ? Colors.success + '22' : Colors.danger + '22' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: item.vacancy_status === 'available' ? Colors.success : Colors.danger }}>{item.vacancy_status}</Text>
          </View>
        </View>
        <Text style={styles.cardRent}>₹{Number(item.rent).toLocaleString('en-IN')}<Text style={styles.cardRentSub}>/mo</Text></Text>
        <Text style={styles.cardRooms}>🚪 {item.available_rooms}/{item.total_rooms} rooms · {item.type}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil" size={14} color={Colors.gold} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.delBtn} onPress={() => del(item.id)}>
            <Ionicons name="trash" size={14} color={Colors.danger} />
            <Text style={styles.delBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏘️ My Properties</Text>
          <Text style={styles.headerSub}>{props.length} listing{props.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={18} color="#000" /><Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} size="large" />
        : <FlatList data={props} keyExtractor={i => i.id.toString()} renderItem={renderProp}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
            ListEmptyComponent={<View style={styles.empty}><Text style={{ fontSize: 36 }}>🏘️</Text><Text style={styles.emptyText}>No properties yet. Add one!</Text></View>}
          />}

      {/* Add/Edit Modal */}
      <Modal visible={modal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: Colors.bg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Property' : 'Add Property'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={24} color={Colors.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <PillSelect label="TYPE" field="type" options={['PG', 'Hostel', 'Flat']} />
            <PillSelect label="VACANCY STATUS" field="vacancy_status" options={['available', 'full']} />
            <F label="TITLE *" field="title" placeholder="e.g. Sunrise Boys PG" />
            <F label="LOCATION *" field="location" placeholder="e.g. Koregaon Park, Pune" />
            <F label="MONTHLY RENT (₹) *" field="rent" placeholder="e.g. 7000" keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><F label="TOTAL ROOMS" field="total_rooms" placeholder="10" keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><F label="AVAILABLE" field="available_rooms" placeholder="3" keyboardType="numeric" /></View>
            </View>
            <F label="FACILITIES (comma separated)" field="facilities" placeholder="WiFi, AC, Meals" />
            <F label="DESCRIPTION" field="description" placeholder="Describe the property..." multiline />

            {/* Image Picker */}
            <Text style={styles.label}>PROPERTY IMAGE</Text>
            <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
              {imgUri
                ? <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                : <><Ionicons name="camera" size={28} color={Colors.textMuted} /><Text style={{ color: Colors.textMuted, marginTop: 8 }}>Tap to pick image</Text></>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>{editing ? 'Update Property' : 'Save Property'}</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.bg2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: Colors.gold, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 14, overflow: 'hidden' },
  cardImg: { height: 150, width: '100%' },
  cardInfo: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  vacBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  cardRent: { fontSize: 18, fontWeight: '800', color: Colors.gold, marginBottom: 4 },
  cardRentSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '400' },
  cardRooms: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.gold + '18', borderWidth: 1, borderColor: Colors.gold + '44', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { color: Colors.gold, fontWeight: '700', fontSize: 13 },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.danger + '18', borderWidth: 1, borderColor: Colors.danger + '44', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  delBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
  modalHeader: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.bg2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  label: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, fontWeight: '600', marginBottom: 7 },
  input: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 14 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3 },
  pillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#000' },
  imgPicker: { height: 120, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg3, marginBottom: 14, overflow: 'hidden' },
  saveBtn: { backgroundColor: Colors.gold, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
