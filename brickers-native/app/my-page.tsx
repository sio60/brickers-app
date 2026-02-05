import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Language } from '@/locales';

const MENU = ['profile', 'membership', 'jobs', 'inquiries', 'reports', 'settings', 'delete'] as const;
type Menu = typeof MENU[number];

export default function MyPageScreen() {
  const { isLoggedIn, login, logout, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const [active, setActive] = useState<Menu>('profile');
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [editNickname, setEditNickname] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const isPro = (profile?.membershipPlan || membership?.membershipPlan) === 'PRO';

  const ensureLogin = async () => {
    if (!isLoggedIn) {
      await login();
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      await ensureLogin();
      const [pRes, mRes, oRes] = await Promise.allSettled([
        api.getMyProfile(),
        api.getMyMembership(),
        api.getMyOverview(),
      ]);
      if (pRes.status === 'fulfilled') {
        setProfile(pRes.value.data);
        setEditNickname(pRes.value.data?.nickname || '');
        setEditBio(pRes.value.data?.bio || '');
      }
      if (mRes.status === 'fulfilled') {
        setMembership(mRes.value.data);
      }
      if (oRes.status === 'fulfilled') {
        setOverview(oRes.value.data);
      }
    } catch (err) {
      console.error('[MyPage] loadAll failed', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    const res = await api.getMyJobs(0, 20);
    setJobs(res.data?.content || []);
  };

  const loadInquiries = async () => {
    const res = await api.getMyInquiries(0, 20);
    setInquiries(res.data?.content || res.data || []);
  };

  const loadReports = async () => {
    const res = await api.getMyReports(0, 20);
    setReports(res.data?.content || res.data || []);
  };

  const loadPlans = async () => {
    const res = await api.getPaymentPlans();
    setPlans(res.data || []);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const localeMap = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' };
    return date.toLocaleDateString(localeMap[language] || 'ko-KR');
  };

  const getJobThumbUrl = (job: any) =>
    job.previewImageUrl || job.correctedImageUrl || job.sourceImageUrl || '';

  const getStatusMeta = (status?: string) => {
    const map: Record<string, { label: string; color: string }> = {
      QUEUED: { label: t.jobs.status.QUEUED, color: '#6B7280' },
      RUNNING: { label: t.jobs.status.RUNNING, color: '#2563EB' },
      DONE: { label: t.jobs.status.DONE, color: '#15803D' },
      FAILED: { label: t.jobs.status.FAILED, color: '#DC2626' },
      CANCELED: { label: t.jobs.status.CANCELED, color: '#9CA3AF' },
    };
    return map[status || ''] || { label: status || '-', color: '#9CA3AF' };
  };

  const handleOpenJob = (job: any) => {
    if (job?.status === 'DONE' && (job?.ldrUrl || job?.ldr_url)) {
      router.push({
        pathname: '/result',
        params: {
          ldrUrl: job.ldrUrl || job.ldr_url,
          jobId: job.id || job.jobId,
        },
      });
      return;
    }
    if (job?.status === 'FAILED') {
      Alert.alert('작업 실패', job?.errorMessage || '작업이 실패했습니다.');
      return;
    }
    Alert.alert('처리 중', '작업이 아직 완료되지 않았습니다.');
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (active === 'jobs') loadJobs();
    if (active === 'inquiries') loadInquiries();
    if (active === 'reports') loadReports();
    if (active === 'membership') loadPlans();
  }, [active]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await api.updateMyProfile({ nickname: editNickname, bio: editBio });
      setProfile(res.data);
      setIsEditing(false);
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
    } catch (err) {
      console.error('[MyPage] update profile failed', err);
      Alert.alert('저장 실패', '프로필 업데이트에 실패했습니다.');
    } finally {
      setSavingProfile(false);
    }
  };

  const startEditing = () => {
    setEditNickname(profile?.nickname || '');
    setEditBio(profile?.bio || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditNickname(profile?.nickname || '');
    setEditBio(profile?.bio || '');
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await api.retryJob(jobId);
      await loadJobs();
      Alert.alert('재시도 완료', '작업을 다시 요청했습니다.');
    } catch (err) {
      console.error('[MyPage] retry failed', err);
      Alert.alert('재시도 실패', '작업 재시도에 실패했습니다.');
    }
  };

  const handleCheckout = async (planId: string) => {
    if (isPro) return;
    try {
      setIsCheckingOut(true);
      const res = await api.createCheckout(planId);
      const url = res.data?.checkoutUrl;
      if (!url) {
        Alert.alert('결제 실패', '결제 URL을 찾을 수 없습니다.');
        return;
      }
      await WebBrowser.openBrowserAsync(url);
      const mRes = await api.getMyMembership();
      setMembership(mRes.data);
      await refreshUser();
      Alert.alert('결제 완료', '업그레이드가 반영되었습니다.');
    } catch (err) {
      console.error('[MyPage] checkout failed', err);
      Alert.alert('결제 실패', '결제에 실패했습니다.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert('탈퇴 확인', '정말 탈퇴하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteMyAccount();
            await logout();
          } catch (err) {
            console.error('[MyPage] delete failed', err);
            Alert.alert('오류', '탈퇴에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const renderProfile = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.profile.title}</Text>
        {!isEditing && (
          <TouchableOpacity style={styles.editBtn} onPress={startEditing}>
            <Text style={styles.editBtnText}>{t.profile.edit}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          {profile?.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Ionicons name="person-circle-outline" size={64} color="#c4c4c4" />
          )}
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{profile?.nickname || t.profile.defaultNickname}</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{profile?.membershipPlan || membership?.membershipPlan || '-'}</Text>
            </View>
          </View>
          <Text style={styles.profileEmail}>{profile?.email || '-'}</Text>
          <Text style={styles.profileBio}>{profile?.bio || t.profile.bioPlaceholder}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t.stats.jobs}</Text>
          <Text style={styles.statValue}>{overview?.jobs?.totalCount ?? jobs.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t.stats.gallery}</Text>
          <Text style={styles.statValue}>{overview?.gallery?.totalCount ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t.stats.joinedAt}</Text>
          <Text style={styles.statValue}>{formatDate(profile?.createdAt)}</Text>
        </View>
      </View>

      {isEditing && (
        <View style={styles.editSection}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.profile.nickname}</Text>
            <TextInput
              value={editNickname}
              onChangeText={setEditNickname}
              style={styles.input}
              placeholder={t.profile.nicknamePlaceholder}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.profile.bio}</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              style={[styles.input, styles.multiline]}
              placeholder={t.profile.bioPlaceholder}
              multiline
            />
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.outlineBtn} onPress={cancelEditing} disabled={savingProfile}>
              <Text style={styles.outlineBtnText}>{t.profile.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={savingProfile}>
              <Text style={styles.primaryBtnText}>{savingProfile ? t.profile.saving : t.profile.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderMembership = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t.membership.title}</Text>
      <Text style={styles.value}>{t.membership.plan}: {membership?.membershipPlan || profile?.membershipPlan || 'FREE'}</Text>
      {isPro ? (
        <Text style={styles.helper}>{t.membership.proUser}</Text>
      ) : (
        <View style={{ gap: 12, marginTop: 12 }}>
          {plans.map((p: any) => (
            <TouchableOpacity key={p.id} style={styles.primaryBtn} onPress={() => handleCheckout(p.id)} disabled={isCheckingOut}>
              <Text style={styles.primaryBtnText}>{p.name || p.planName || 'PRO'} - {p.price ? `${p.price}` : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderJobs = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t.jobs.title}</Text>
      {jobs.length === 0 ? (
        <Text style={styles.helper}>{t.jobs.empty}</Text>
      ) : (
        <View style={styles.jobsGrid}>
          {jobs.map((job) => {
            const jobId = job.id || job.jobId;
            const thumbUrl = getJobThumbUrl(job);
            const statusMeta = getStatusMeta(job.status);
            const canRetry = ['FAILED', 'CANCELED', 'QUEUED'].includes(job.status);
            return (
              <TouchableOpacity
                key={jobId}
                style={styles.jobCard}
                activeOpacity={0.9}
                onPress={() => handleOpenJob(job)}
              >
                <View style={styles.jobThumbWrap}>
                  {thumbUrl ? (
                    <Image source={{ uri: thumbUrl }} style={styles.jobThumb} contentFit="cover" />
                  ) : (
                    <View style={styles.jobThumbPlaceholder}>
                      <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={[styles.jobStatusBadge, { backgroundColor: statusMeta.color }]}>
                    <Text style={styles.jobStatusText}>{statusMeta.label}</Text>
                  </View>
                  {canRetry && (
                    <TouchableOpacity style={styles.jobRetryBtn} onPress={() => handleRetryJob(jobId)}>
                      <Text style={styles.jobRetryText}>{t.jobs.retry}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {job.title || t.jobs.noTitle}
                  </Text>
                  <Text style={styles.jobDate}>{formatDate(job.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderInquiries = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t.inquiries.title}</Text>
      {inquiries.length === 0 ? (
        <Text style={styles.helper}>{t.inquiries.empty}</Text>
      ) : inquiries.map((inq: any) => (
        <View key={inq.id} style={styles.listItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.value}>{inq.title}</Text>
            <Text style={styles.helper}>{t.inquiries.status}: {inq.status}</Text>
            <Text style={styles.helper}>{inq.content}</Text>
            {inq.answer && <Text style={styles.helper}>{t.inquiries.answer}: {typeof inq.answer === 'string' ? inq.answer : inq.answer?.content}</Text>}
          </View>
        </View>
      ))}
    </View>
  );

  const renderReports = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t.reports.title}</Text>
      {reports.length === 0 ? (
        <Text style={styles.helper}>{t.reports.empty}</Text>
      ) : reports.map((rep: any) => (
        <View key={rep.id} style={styles.listItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.value}>{rep.reason || rep.targetType}</Text>
            <Text style={styles.helper}>{t.reports.status}: {rep.status}</Text>
            <Text style={styles.helper}>{rep.details || rep.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSettings = () => {
    const languageOptions: { key: Language; label: string }[] = [
      { key: 'ko', label: '한국어' },
      { key: 'en', label: 'English' },
      { key: 'ja', label: '日本語' },
    ];

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.settings.title}</Text>

        {/* Language Settings */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t.settings.language}</Text>
          <View style={styles.segmentedControl}>
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                style={[
                  styles.segmentBtn,
                  language === opt.key && styles.segmentBtnActive,
                ]}
                onPress={() => setLanguage(opt.key)}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    language === opt.key && styles.segmentBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>{t.settings.logout}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDelete = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t.delete.title}</Text>
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#ff3b30' }]} onPress={handleDeleteAccount}>
        <Text style={styles.primaryBtnText}>{t.delete.btn}</Text>
      </TouchableOpacity>
    </View>
  );

  const content = useMemo(() => {
    if (loading) return <ActivityIndicator />;
    switch (active) {
      case 'profile': return renderProfile();
      case 'membership': return renderMembership();
      case 'jobs': return renderJobs();
      case 'inquiries': return renderInquiries();
      case 'reports': return renderReports();
      case 'settings': return renderSettings();
      case 'delete': return renderDelete();
      default: return null;
    }
  }, [
    active,
    loading,
    profile,
    membership,
    overview,
    jobs,
    inquiries,
    reports,
    plans,
    isEditing,
    savingProfile,
    isCheckingOut,
    editNickname,
    editBio,
    language,
    t,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuRow} keyboardShouldPersistTaps="handled">
            {MENU.map((m) => (
              <TouchableOpacity key={m} style={[styles.menuItem, active === m && styles.menuItemActive]} onPress={() => setActive(m)}>
                <Text style={[styles.menuText, active === m && styles.menuTextActive]}>{menuLabel(m, t)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {content}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function menuLabel(m: Menu, t: any) {
  switch (m) {
    case 'profile': return t.menu.profile;
    case 'membership': return t.membership.title;
    case 'jobs': return t.menu.jobs;
    case 'inquiries': return t.menu.inquiries;
    case 'reports': return t.menu.reports;
    case 'settings': return t.menu.settings;
    case 'delete': return t.menu.delete;
    default: return m;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },
  menuRow: { marginBottom: 16 },
  menuItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f3f3f3', marginRight: 8 },
  menuItemActive: { backgroundColor: '#ffe135', borderWidth: 1, borderColor: '#000' },
  menuText: { fontSize: 12, fontWeight: '700', color: '#333', fontFamily: 'NotoSansKR_500Medium' },
  menuTextActive: { color: '#000' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'NotoSansKR_700Bold' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f3f3f3' },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#333', fontFamily: 'NotoSansKR_500Medium' },
  profileHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  profileInfo: { flex: 1, gap: 4 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  profileName: { fontSize: 16, fontWeight: '800', color: '#111', fontFamily: 'NotoSansKR_700Bold' },
  planBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: '#ffe135' },
  planBadgeText: { fontSize: 11, fontWeight: '800', color: '#000', fontFamily: 'NotoSansKR_700Bold' },
  profileEmail: { fontSize: 12, color: '#666', fontFamily: 'NotoSansKR_400Regular' },
  profileBio: { fontSize: 12, color: '#333', fontFamily: 'NotoSansKR_400Regular' },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: { fontSize: 11, color: '#666', fontFamily: 'NotoSansKR_400Regular' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#111', fontFamily: 'NotoSansKR_700Bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#666', fontFamily: 'NotoSansKR_400Regular' },
  value: { color: '#111', fontWeight: '700', fontFamily: 'NotoSansKR_500Medium' },
  helper: { color: '#666', fontSize: 12, fontFamily: 'NotoSansKR_400Regular' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, color: '#666', fontFamily: 'NotoSansKR_400Regular' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'NotoSansKR_400Regular' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  editSection: { gap: 12 },
  editActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  primaryBtn: { backgroundColor: '#000', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontFamily: 'NotoSansKR_700Bold' },
  outlineBtn: { borderWidth: 1, borderColor: '#000', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  outlineBtnText: { color: '#000', fontWeight: '700', fontFamily: 'NotoSansKR_500Medium' },
  listItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', flexDirection: 'row', gap: 12, alignItems: 'center' },
  jobsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  jobCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  jobThumbWrap: { position: 'relative' },
  jobThumb: { width: '100%', height: 120, backgroundColor: '#f4f4f4' },
  jobThumbPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobStatusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  jobStatusText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: 'NotoSansKR_500Medium' },
  jobRetryBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  jobRetryText: { fontSize: 11, fontWeight: '700', color: '#000', fontFamily: 'NotoSansKR_500Medium' },
  jobInfo: { padding: 10, gap: 4 },
  jobTitle: { fontSize: 13, fontWeight: '700', color: '#111', fontFamily: 'NotoSansKR_500Medium' },
  jobDate: { fontSize: 11, color: '#666', fontFamily: 'NotoSansKR_400Regular' },
  // Language settings styles
  settingItem: { gap: 12, marginBottom: 24 },
  settingLabel: { fontSize: 13, fontWeight: '600', color: '#666', fontFamily: 'NotoSansKR_500Medium', marginLeft: 4 },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 14,
    padding: 4,
    height: 48,
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    fontFamily: 'NotoSansKR_500Medium',
  },
  segmentBtnTextActive: {
    color: '#000',
    fontWeight: '800',
    fontFamily: 'NotoSansKR_700Bold',
  },
  logoutBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff3b30',
    fontFamily: 'NotoSansKR_700Bold',
  },
});
