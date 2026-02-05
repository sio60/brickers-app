import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ThreeDPreview from '@/components/preview/ThreeDPreview';
import GlbPreview from '@/components/preview/GlbPreview';
import type { GalleryComment, GalleryItem, PageResponse } from '@/types/gallery';

export default function GalleryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn, login } = useAuth();
  const insets = useSafeAreaInsets();

  const [item, setItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'IMG' | 'LDR' | 'GLB'>('IMG');

  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const imageUrl = useMemo(() => item?.sourceImageUrl || item?.thumbnailUrl, [item]);

  const ensureLogin = async () => {
    if (isLoggedIn) return true;
    try {
      await login();
      return true;
    } catch (e) {
      Alert.alert('로그인 필요', '로그인이 필요합니다.');
      return false;
    }
  };

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.getGalleryDetail(String(id));
      const data = res.data as GalleryItem;
      setItem(data);
      setLikeCount(data.likeCount ?? 0);
      setCommentCount(data.commentCount ?? 0);
      setIsLiked(data.myReaction === 'LIKE');
      setIsBookmarked(Boolean(data.bookmarked));
    } catch (err) {
      console.error('[GalleryDetail] fetch failed:', err);
      Alert.alert('오류', '상세 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    try {
      const res = await api.getGalleryComments(String(id), 0, 20);
      const data = res.data as PageResponse<GalleryComment>;
      const content = data.content || [];
      setComments(content);
      if (typeof data.totalElements === 'number') {
        setCommentCount(data.totalElements);
      } else if (content.length) {
        setCommentCount(content.length);
      }
    } catch (err) {
      console.error('[GalleryDetail] comments failed:', err);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchComments();
  }, [id]);

  const handleLikeToggle = async () => {
    if (!(await ensureLogin())) return;
    try {
      const res = await api.toggleGalleryReaction(String(id), 'LIKE');
      const data = res.data;
      setIsLiked(data.myReaction === 'LIKE');
      if (data.likeCount !== undefined) setLikeCount(data.likeCount);
    } catch (err) {
      console.error('[GalleryDetail] like failed:', err);
      Alert.alert('오류', '좋아요 처리에 실패했어요.');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!(await ensureLogin())) return;
    try {
      const res = await api.toggleGalleryBookmark(String(id));
      const data = res.data;
      setIsBookmarked(Boolean(data.bookmarked));
    } catch (err) {
      console.error('[GalleryDetail] bookmark failed:', err);
      Alert.alert('오류', '북마크 처리에 실패했어요.');
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) return;
    if (!(await ensureLogin())) return;
    setCommentLoading(true);
    try {
      const res = await api.postGalleryComment(String(id), { content: commentInput.trim() });
      const newComment = res.data as GalleryComment;
      setComments((prev) => [newComment, ...prev]);
      setCommentCount((prev) => prev + 1);
      setCommentInput('');
    } catch (err) {
      console.error('[GalleryDetail] comment failed:', err);
      Alert.alert('오류', '댓글 작성에 실패했어요.');
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="small" color="#111" />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>콘텐츠를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={[styles.topBar, { paddingTop: insets.top, height: 56 + insets.top }]}>
          <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>갤러리</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.preview}>
            <View style={styles.tabRow}>
              {(['IMG', 'LDR', 'GLB'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'IMG' ? '원본' : tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewArea}>
              {activeTab === 'IMG' && (
                imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} contentFit="contain" />
                ) : (
                  <View style={styles.previewEmpty}><Text style={styles.previewEmptyText}>이미지가 없습니다</Text></View>
                )
              )}
              {activeTab === 'LDR' && (
                item.ldrUrl ? <ThreeDPreview url={item.ldrUrl} /> : (
                  <View style={styles.previewEmpty}><Text style={styles.previewEmptyText}>LDR 모델이 없습니다</Text></View>
                )
              )}
              {activeTab === 'GLB' && (
                item.glbUrl ? <GlbPreview url={item.glbUrl} /> : (
                  <View style={styles.previewEmpty}><Text style={styles.previewEmptyText}>GLB 모델이 없습니다</Text></View>
                )
              )}
            </View>
          </View>

          <View style={styles.meta}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.author}>@{item.authorNickname || 'Anonymous'}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleLikeToggle} style={styles.actionButton}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#FF4D4F' : '#111'} />
                <Text style={styles.actionText}>{likeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBookmarkToggle} style={styles.actionButton}>
                <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color="#111" />
                <Text style={styles.actionText}>저장</Text>
              </TouchableOpacity>
              <View style={styles.actionStat}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#555" />
                <Text style={styles.actionText}>{commentCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>댓글 {commentCount}</Text>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder={isLoggedIn ? '댓글을 입력하세요' : '로그인 후 댓글 작성 가능'}
                placeholderTextColor="#999"
                value={commentInput}
                onChangeText={setCommentInput}
                editable={isLoggedIn && !commentLoading}
              />
              <TouchableOpacity
                style={[styles.commentSubmit, (!commentInput.trim() || commentLoading) && styles.commentSubmitDisabled]}
                onPress={handleCommentSubmit}
                disabled={!commentInput.trim() || commentLoading}
              >
                <Text style={styles.commentSubmitText}>{commentLoading ? '...' : '등록'}</Text>
              </TouchableOpacity>
            </View>

            {comments.length === 0 ? (
              <View style={styles.commentEmpty}>
                <Text style={styles.commentEmptyText}>첫 댓글을 남겨보세요</Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{(c.authorNickname || '?')[0]}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>@{c.authorNickname || 'Anonymous'}</Text>
                      <Text style={styles.commentDate}>{formatDate(c.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentContent}>{c.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  headerBack: {
    position: 'absolute',
    left: 12,
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'NotoSansKR_700Bold',
  },
  content: {
    paddingBottom: 40,
  },
  preview: {
    backgroundColor: '#111',
    paddingBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  tabActive: {
    backgroundColor: '#FFC400',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ddd',
  },
  tabTextActive: {
    color: '#111',
  },
  previewArea: {
    height: 320,
    backgroundColor: '#f3f3f3',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmptyText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  author: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  actionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  commentSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    color: '#111',
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  commentSubmit: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  commentSubmitDisabled: {
    opacity: 0.5,
  },
  commentSubmitText: {
    color: '#FFC400',
    fontSize: 12,
    fontWeight: '800',
  },
  commentEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  commentEmptyText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#FFC400',
    fontWeight: '800',
    fontSize: 12,
  },
  commentBody: {
    flex: 1,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  commentDate: {
    fontSize: 10,
    color: '#999',
  },
  commentContent: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
});
