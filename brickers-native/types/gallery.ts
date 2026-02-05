export type GalleryItem = {
  id: string;
  title: string;
  content?: string;
  tags?: string[];
  thumbnailUrl?: string;
  sourceImageUrl?: string;
  ldrUrl?: string;
  glbUrl?: string;
  authorId?: string;
  authorNickname?: string;
  authorProfileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  brickCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  viewCount?: number;
  commentCount?: number;
  bookmarked?: boolean;
  myReaction?: 'LIKE' | 'DISLIKE' | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
};

export type PageResponse<T> = {
  content: T[];
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;
};

export type GalleryComment = {
  id: string;
  postId: string;
  authorId?: string;
  authorNickname?: string;
  authorProfileImage?: string;
  content: string;
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
};
