// app/(student)/flatmates.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth, apiFetch } from '../../context/AuthContext';

export default function FlatmatesScreen() {
  const { token, user } = useAuth();
  const [posts, setPosts]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postModal, setPostModal] = useState(false);
  const [connectModal, setConnectModal] = useState(false);
  const [selPost, setSelPost]     = useState<any>(null);
  const [sending, setSending]     = useState(false);

  // Post form
  const [flName, setFlName]       = useState('');
  const [flBudget, setFlBudget]   = useState('');
  const [flLoc, setFlLoc]         = useState('');
  const [flGender, setFlGender]   = useState('any');
  const [flContact, setFlContact] = useState('');
  const [flDesc, setFlDesc]       = useState('');

  // Connect form
  const [conMsg, setConMsg]       = useState('');
  const [conPhone, setConPhone]   = useState('');

  const load = async () => {
    try { setPosts(await apiFetch('/flatmates', token)); } catch (e) {}
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const postFlatmate = async () => {
    if (!flName) return Alert.alert('Error', 'Name is required');
    setSending(true);
    try {
      await apiFetch('/flatmates', token, {
        method: 'POST',
        body: JSON.stringify({ name: flName, budget: flBudget, location: flLoc, gender: flGender, contact: flContact, description: flDesc }),
      });
      setPostModal(false);
      [setFlName, setFlBudget, setFlLoc, setFlContact, setFlDesc].forEach(fn => fn(''));
      Alert.alert('✅', 'Flatmate request posted!');
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSending(false);
  };

  const sendConnect = async () => {
    if (!conPhone) return Alert.alert('Error', 'Please enter your contact number');
    setSending(true);
    try {
      await apiFetch('/flatmate-connects', token, {
        method: 'POST',
        body: JSON.stringify({ flatmate_request_id: selPost.id, message: conMsg, contact: conPhone }),
      });
      setConnectModal(false); setConMsg(''); setConPhone('');
      Alert.alert('✅', `Request sent to ${selPost.name}! Check Notifications for updates.`);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSending(false);
  };

  const deleteFlatmate = (id: number) => {
    Alert.alert('Delete', 'Delete your flatmate post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await apiFetch(`/flatmates/${id}`, token, { method: 'DELETE' }); load(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const GENDERS = ['any', 'male', 'female'];
  const genderIcon = (g: string) => g === 'male' ? '👨' : g === 'female' ? '👩' : '👤';

  const renderPost = ({ item }: { item: any }) => {
    const isOwn = user?.id === item.user_id;
    return (
      <View style={[styles.postCard, isOwn && styles.ownCard]}>
        {isOwn && <View style={styles.ownBadge}><Text style={styles.ownBadgeText}>YOUR POST</Text></View>}
        <View style={styles.postHead}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.postName}>{item.name}</Text>
            <Text style={styles.postMeta}>{genderIcon(item.gender)} {item.gender} · {item.location || 'Location TBD'}</Text>
          </View>
          <Text style={styles.budget}>₹{Number(item.budget || 0).toLocaleString('en-IN')}/mo</Text>
        </View>
        {item.description ? <Text style={styles.desc} numberOfLines={3}>{item.description}</Text> : null}
        <Text style={styles.contact}>📞 {item.contact || 'Not provided'}</Text>
        <View style={styles.postActions}>
          {!isOwn && (
            <TouchableOpacity style={styles.connectBtn} onPress={() => { setSelPost(item); setConnectModal(true); }}>
              <Ionicons name="chatbubble-ellipses" size={15} color="#000" />
              <Text style={styles.connectBtnText}>Send Request</Text>
            </TouchableOpacity>
          )}
          {isOwn && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteFlatmate(item.id)}>
              <Ionicons name="trash" size={15} color={Colors.danger} />
              <Text style={styles.deleteBtnText}>Delete My Post</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>👥 Flatmates</Text>
          <Text style={styles.headerSub}>Find your perfect roommate</Text>
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => setPostModal(true)}>
          <Ionicons name="add" size={18} color="#000" />
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} size="large" />
        : <FlatList
            data={posts}
            keyExtractor={i => i.id.toString()}
            renderItem={renderPost}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
            ListEmptyComponent={<View style={styles.empty}><Text style={{ fontSize: 32 }}>👥</Text><Text style={styles.emptyText}>No flatmate posts yet</Text></View>}
          />}

      {/* Post Flatmate Modal */}
      <Modal visible={postModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Flatmate Request</Text>
              <TouchableOpacity onPress={() => setPostModal(false)}><Ionicons name="close" size={24} color={Colors.textMuted} /></TouchableOpacity>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>NAME *</Text>
                <TextInput style={styles.input} value={flName} onChangeText={setFlName} placeholder="Your name" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>BUDGET (₹)</Text>
                <TextInput style={styles.input} value={flBudget} onChangeText={setFlBudget} placeholder="7000" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
              </View>
            </View>
            <Text style={styles.label}>LOCATION</Text>
            <TextInput style={styles.input} value={flLoc} onChangeText={setFlLoc} placeholder="e.g. Baner, Pune" placeholderTextColor={Colors.textMuted} />
            <Text style={[styles.label, { marginTop: 12 }]}>GENDER PREFERENCE</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <TouchableOpacity key={g} style={[styles.genderBtn, flGender === g && styles.genderBtnActive]} onPress={() => setFlGender(g)}>
                  <Text style={[styles.genderText, flGender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { marginTop: 12 }]}>CONTACT</Text>
            <TextInput style={styles.input} value={flContact} onChangeText={setFlContact} placeholder="Phone number" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
            <Text style={[styles.label, { marginTop: 12 }]}>ABOUT YOU</Text>
            <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} value={flDesc} onChangeText={setFlDesc} placeholder="Share about yourself..." placeholderTextColor={Colors.textMuted} multiline />
            <TouchableOpacity style={[styles.postBtn, { marginTop: 16, borderRadius: 10, justifyContent: 'center', paddingVertical: 14 }]} onPress={postFlatmate} disabled={sending}>
              {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.postBtnText}>Post Request</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Connect Modal */}
      <Modal visible={connectModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Flatmate Request</Text>
              <TouchableOpacity onPress={() => setConnectModal(false)}><Ionicons name="close" size={24} color={Colors.textMuted} /></TouchableOpacity>
            </View>
            {selPost && (
              <View style={styles.selPostInfo}>
                <Text style={styles.selPostName}>{selPost.name}</Text>
                <Text style={styles.selPostMeta}>{selPost.location} · ₹{Number(selPost.budget || 0).toLocaleString('en-IN')}/mo</Text>
              </View>
            )}
            <Text style={styles.label}>YOUR MESSAGE</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={conMsg} onChangeText={setConMsg} placeholder="Hi! I'm interested in being your flatmate..." placeholderTextColor={Colors.textMuted} multiline />
            <Text style={[styles.label, { marginTop: 12 }]}>YOUR CONTACT *</Text>
            <TextInput style={styles.input} value={conPhone} onChangeText={setConPhone} placeholder="Your phone number" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setConnectModal(false)}>
                <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.connectBtn, { flex: 2, justifyContent: 'center', paddingVertical: 13 }]} onPress={sendConnect} disabled={sending}>
                {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.connectBtnText}>Send Request</Text>}
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
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.bg2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  postBtn: { backgroundColor: Colors.gold, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  postBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  postCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 14 },
  ownCard: { borderColor: Colors.gold + '44' },
  ownBadge: { alignSelf: 'flex-start', backgroundColor: Colors.gold + '22', borderWidth: 1, borderColor: Colors.gold + '55', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  ownBadgeText: { color: Colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#000', fontWeight: '800', fontSize: 18 },
  postName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  postMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  budget: { fontSize: 15, fontWeight: '700', color: Colors.teal },
  desc: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 10 },
  contact: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 8 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.teal, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  connectBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.danger + '18', borderWidth: 1, borderColor: Colors.danger + '44', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  deleteBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: Colors.border, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  label: { fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, fontWeight: '600', marginBottom: 7 },
  input: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 14, marginBottom: 0 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, padding: 9, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.bg3 },
  genderBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  genderText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  genderTextActive: { color: '#000' },
  selPostInfo: { backgroundColor: Colors.bg3, borderRadius: 10, padding: 12, marginBottom: 16 },
  selPostName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  selPostMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cancelBtn: { padding: 13, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
});
