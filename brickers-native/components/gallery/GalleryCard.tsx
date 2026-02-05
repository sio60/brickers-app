import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { GalleryItem } from '@/types/gallery';

type Props = {
  item: GalleryItem;
  onPress: (item: GalleryItem) => void;
};

export default function GalleryCard({ item, onPress }: Props) {
  const imageUrl = item.thumbnailUrl || item.sourceImageUrl;
  const author = item.authorNickname || 'Anonymous';
  const likeCount = item.likeCount ?? 0;
  const commentCount = item.commentCount ?? 0;
  const viewCount = item.viewCount ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.9}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={22} color="#999" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BRICK</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          @{author}
        </Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={12} color="#FF4D4F" />
            <Text style={styles.statText}>{likeCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-ellipses" size={12} color="#444" />
            <Text style={styles.statText}>{commentCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={12} color="#444" />
            <Text style={styles.statText}>{viewCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#111',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  imageWrap: {
    height: 140,
    backgroundColor: '#f1f1f1',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    fontFamily: 'NotoSansKR_400Regular',
  },
  badge: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: '#FFC400',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#111',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#111',
    letterSpacing: 0.5,
    fontFamily: 'NotoSansKR_700Bold',
  },
  body: {
    padding: 12,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    fontFamily: 'NotoSansKR_700Bold',
  },
  author: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    fontFamily: 'NotoSansKR_500Medium',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'NotoSansKR_500Medium',
  },
});
