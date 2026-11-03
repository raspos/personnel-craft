import { BoardPost } from '../types/game';

const STORAGE_POSTS_KEY = 'pcraft_community_posts_v3';
const STORAGE_USER_REACTIONS_KEY = 'pcraft_user_reactions_v3';
const STORAGE_CUSTOM_FIREBASE_KEY = 'pcraft_firebase_db_url';

// 기본 Firebase Realtime Database URL
export const DEFAULT_FIREBASE_URL = 'https://personnel-craft-default-rtdb.firebaseio.com';

// 구버전 로컬 캐시 잔재 청소
try {
  localStorage.removeItem('pcraft_community_posts_v1');
  localStorage.removeItem('pcraft_community_posts_v2');
  localStorage.removeItem('pcraft_user_reactions_v1');
} catch {}

export function getFirebaseUrl(): string {
  try {
    return localStorage.getItem(STORAGE_CUSTOM_FIREBASE_KEY) || DEFAULT_FIREBASE_URL;
  } catch {
    return DEFAULT_FIREBASE_URL;
  }
}

export function setFirebaseUrl(url: string): void {
  try {
    const cleaned = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_CUSTOM_FIREBASE_KEY, cleaned);
  } catch (e) {
    console.error('Failed to set firebase URL', e);
  }
}

// 로컬 캐시 글 목록 불러오기 (실제 사용자 글만)
export function getLocalPosts(): BoardPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(p => p && typeof p === 'object' && typeof p.content === 'string' && p.content.trim().length > 0);
  } catch {
    return [];
  }
}

// 실시간 글 목록 가져오기 (실제 사용자 글만 엄격 필터링)
export async function fetchCommunityPosts(): Promise<BoardPost[]> {
  const firebaseUrl = getFirebaseUrl();
  if (firebaseUrl) {
    try {
      const res = await fetch(`${firebaseUrl}/posts.json`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          const list: BoardPost[] = [];
          for (const [key, val] of Object.entries(data)) {
            // 유효한 본문(content)이 있는 실제 사용자 글만 엄격 필터링 (가짜/빈 프리셋 엔트리 완벽 차단)
            if (
              val &&
              typeof val === 'object' &&
              typeof (val as any).content === 'string' &&
              (val as any).content.trim().length > 0
            ) {
              const p = val as any;
              list.push({
                id: key,
                authorNickname: p.authorNickname || '익명의 기자',
                reporterArchetype: p.reporterArchetype || undefined,
                assignedDept: p.assignedDept || undefined,
                resultType: p.resultType || undefined,
                category: p.category || 'behind',
                content: p.content.trim(),
                createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
                reactions: {
                  beer: Number(p.reactions?.beer) || 0,
                  cheer: Number(p.reactions?.cheer) || 0,
                  fire: Number(p.reactions?.fire) || 0
                }
              });
            }
          }
          // 최신순 정렬
          list.sort((a, b) => b.createdAt - a.createdAt);

          // 로컬 캐시 백업
          localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(list));
          return list;
        }
      }
    } catch (err) {
      console.warn('Firebase fetch failed, falling back to local posts', err);
    }
  }

  return getLocalPosts();
}

// 글 작성하기
export async function submitCommunityPost(newPost: Omit<BoardPost, 'id' | 'createdAt' | 'reactions'>): Promise<BoardPost> {
  const post: BoardPost = {
    ...newPost,
    content: newPost.content.trim(),
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    reactions: { beer: 0, cheer: 0, fire: 0 }
  };

  const firebaseUrl = getFirebaseUrl();
  if (firebaseUrl) {
    try {
      const res = await fetch(`${firebaseUrl}/posts.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          post.id = data.name; // Firebase 생성 ID 매핑
        }
      }
    } catch (err) {
      console.warn('Firebase submit failed, saved locally', err);
    }
  }

  // 로컬 캐시 갱신
  try {
    const existing = getLocalPosts();
    const updated = [post, ...existing.filter(p => p.id !== post.id)];
    localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save post locally', e);
  }

  return post;
}

// 리액션(공감) 추가하기
export async function reactToPost(postId: string, reactionType: 'beer' | 'cheer' | 'fire'): Promise<{ success: boolean; newCount: number }> {
  // 중복 공감 방지 체크 (로컬스토리지 기록)
  let userReactions: Record<string, boolean> = {};
  try {
    userReactions = JSON.parse(localStorage.getItem(STORAGE_USER_REACTIONS_KEY) || '{}');
  } catch {}

  const reactionKey = `${postId}_${reactionType}`;
  if (userReactions[reactionKey]) {
    return { success: false, newCount: 0 };
  }

  userReactions[reactionKey] = true;
  try {
    localStorage.setItem(STORAGE_USER_REACTIONS_KEY, JSON.stringify(userReactions));
  } catch {}

  // 1. 로컬 캐시 갱신
  let updatedCount = 1;
  try {
    const posts = getLocalPosts();
    const target = posts.find(p => p.id === postId);
    if (target) {
      target.reactions[reactionType] = (target.reactions[reactionType] || 0) + 1;
      updatedCount = target.reactions[reactionType];
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(posts));
    }
  } catch {}

  // 2. Firebase 원격 동기화
  const firebaseUrl = getFirebaseUrl();
  if (firebaseUrl && postId) {
    try {
      // Firebase에서 현재 count 조회 후 +1 업데이트
      const currentRes = await fetch(`${firebaseUrl}/posts/${postId}/reactions/${reactionType}.json`);
      const currentVal = await currentRes.json();
      const nextVal = typeof currentVal === 'number' ? currentVal + 1 : updatedCount;
      await fetch(`${firebaseUrl}/posts/${postId}/reactions/${reactionType}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextVal)
      });
      return { success: true, newCount: nextVal };
    } catch (err) {
      console.warn('Firebase reaction sync failed', err);
    }
  }

  return { success: true, newCount: updatedCount };
}
