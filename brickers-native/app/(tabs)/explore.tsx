import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import GalleryCard from '@/components/gallery/GalleryCard';
import type { GalleryItem, PageResponse } from '@/types/gallery';

const PAGE_SIZE = 20;

export default function GalleryListScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [category, setCategory] = useState<'all' | 'bookmarks'>('all');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const isSearching = activeQuery.trim().length > 0;

  const fetchPage = useCallback(
    async (targetPage: number, replace = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        let res;

        if (category === 'bookmarks') {
          if (!isLoggedIn) {
            Alert.alert('로그인 필요', '북마크를 보려면 로그인해주세요.');
            setCategory('all');
            return;
          }
          res = await api.getMyBookmarks(targetPage, PAGE_SIZE);
        } else if (isSearching) {
          res = await api.searchGallery(activeQuery, undefined, targetPage, PAGE_SIZE, sort);
        } else {
          res = await api.getGallery(targetPage, PAGE_SIZE, sort);
        }

        const data = res.data as PageResponse<GalleryItem>;
        const content = data.content || [];

        setItems((prev) => (replace ? content : [...prev, ...content]));
        setPage(data.number ?? targetPage);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        console.error('[Gallery] fetch failed:', err);
        Alert.alert('오류', '갤러리를 불러오지 못했습니다.');
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeQuery, category, isLoggedIn, isSearching, sort]
  );

  useEffect(() => {
    fetchPage(0, true);
  }, [category, sort, activeQuery, fetchPage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(0, true);
  };

  const onEndReached = () => {
    if (loading) return;
    if (page + 1 >= totalPages) return;
    fetchPage(page + 1);
  };

  const handleSearchSubmit = () => {
    setActiveQuery(query.trim());
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveQuery('');
  };

  const handleCategoryChange = (next: 'all' | 'bookmarks') => {
    if (next === category) return;
    if (next === 'bookmarks' && !isLoggedIn) {
      Alert.alert('로그인 필요', '북마크를 보려면 로그인해주세요.');
      return;
    }
    setCategory(next);
  };

  const handleCardPress = (item: GalleryItem) => {
    router.push({ pathname: '/(tabs)/explore/[id]', params: { id: item.id } });
  };

  const headerTitle = useMemo(() => (category === 'bookmarks' ? '내 북마크' : '갤러리'), [category]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#888" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="제목/태그 검색"
            placeholderTextColor="#999"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {activeQuery ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={18} color="#444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSearchSubmit}>
              <Ionicons name="arrow-forward" size={18} color="#111" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentItem, category === 'all' && styles.segmentActive]}
              onPress={() => handleCategoryChange('all')}
            >
              <Text style={[styles.segmentText, category === 'all' && styles.segmentTextActive]}>전체</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentItem, category === 'bookmarks' && styles.segmentActive]}
              onPress={() => handleCategoryChange('bookmarks')}
            >
              <Text style={[styles.segmentText, category === 'bookmarks' && styles.segmentTextActive]}>북마크</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentItem, sort === 'latest' && styles.segmentActive]}
              onPress={() => setSort('latest')}
            >
              <Text style={[styles.segmentText, sort === 'latest' && styles.segmentTextActive]}>최신</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentItem, sort === 'popular' && styles.segmentActive]}
              onPress={() => setSort('popular')}
            >
              <Text style={[styles.segmentText, sort === 'popular' && styles.segmentTextActive]}>인기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <GalleryCard item={item} onPress={handleCardPress} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="images" size={38} color="#bbb" />
              <Text style={styles.emptyText}>표시할 항목이 없습니다</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color="#111" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBack: {
    position: 'absolute',
    left: 16,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'NotoSansKR_700Bold',
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    borderRadius: 14,
    padding: 3,
    flex: 1,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#111',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  segmentTextActive: {
    color: '#FFC400',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  column: {
    gap: 12,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
});
