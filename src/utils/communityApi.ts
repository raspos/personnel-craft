import { BoardPost } from '../types/game';

const STORAGE_POSTS_KEY = 'pcraft_community_posts_v1';
const STORAGE_USER_REACTIONS_KEY = 'pcraft_user_reactions_v1';
const STORAGE_CUSTOM_FIREBASE_KEY = 'pcraft_firebase_db_url';

// 기본 Firebase Realtime Database URL (필요 시 사용자 지정 URL로 교체 가능)
export const DEFAULT_FIREBASE_URL = 'https://personnel-craft-default-rtdb.firebaseio.com';

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

// 현업 언론사 현실 고증 기본 프리셋 게시글
export const INITIAL_PRESET_POSTS: BoardPost[] = [
  {
    id: 'preset_1',
    authorNickname: '마와리탈출꿈나무',
    reporterArchetype: '열혈 사건팀 막내·현장 기동형',
    assignedDept: '사회부',
    resultType: 'stay',
    category: 'retention',
    content: '사회부만 벌써 3년차인데 이번에도 또 잔류 통보 받았습니다... 부장님 지난 추석 때 면담하면서 "다음 인사 땐 네가 원하는 곳 1순위로 밀어준다"고 하셨잖아요 ㅠㅠ 소주 땡기는 밤입니다.',
    createdAt: Date.now() - 1000 * 60 * 18,
    reactions: { beer: 68, cheer: 4, fire: 24 }
  },
  {
    id: 'preset_2',
    authorNickname: '여의도신입',
    reporterArchetype: '의사당 베테랑 정치통',
    assignedDept: '정치부',
    resultType: 'first',
    category: 'triumph',
    content: '2·3지망 다 비우고 1지망 정치부 올인 배수의 진 쳤는데 통했습니다!! 인사 농사 때 정치부장님 2번 뵙고 티타임 때 공천 취재 기획안 보여드린 게 결정타였던 것 같아요. 동기들아 축하해줘!',
    createdAt: Date.now() - 1000 * 60 * 45,
    reactions: { cheer: 84, beer: 5, fire: 2 }
  },
  {
    id: 'preset_3',
    authorNickname: '세종시저승사자',
    reporterArchetype: '관가 저승사자·세종시 정책통',
    assignedDept: '문화부',
    resultType: 'avoid',
    category: 'quit',
    content: '기재부 예산 파헤치겠다고 거시경제 데이터 분석 2년 동안 빡세게 갈았는데... 기피 부서로 찍어뒀던 문화부 깜짝 직권 발령 떴습니다. 넷플릭스 리뷰 쓰러 갑니다. 사직서 양식 사내 인트라넷 어디서 받나요?',
    createdAt: Date.now() - 1000 * 60 * 120,
    reactions: { beer: 112, fire: 45, cheer: 3 }
  },
  {
    id: 'preset_4',
    authorNickname: '자판기앞요정',
    reporterArchetype: '편집국 마당발 올라운더 (멀티플레이어)',
    assignedDept: '경제부',
    resultType: 'second',
    category: 'behind',
    content: '이번 인사철 휴게실 자판기 앞에서 들은 건데 모 부서장님이 자기 라인 후배들 잔류시키려고 인사위에 락(Lock) 걸었다는 썰이 돌더군요 ㅋㅋㅋ 눈치싸움 살벌합니다 진짜.',
    createdAt: Date.now() - 1000 * 60 * 240,
    reactions: { cheer: 39, beer: 14, fire: 19 }
  },
  {
    id: 'preset_5',
    authorNickname: '데이터헌터',
    reporterArchetype: '상복 터진 탐사보도 헌터',
    assignedDept: '기획취재부',
    resultType: 'first',
    category: 'triumph',
    content: '정보공개청구 데이터 기획서 들고 찾아간 보람이 있네요. 1지망 기획취재부 입성 성공! 올해 한국기자상 꼭 타서 편집국장 코를 납작하게 해주겠습니다.',
    createdAt: Date.now() - 1000 * 60 * 400,
    reactions: { cheer: 95, beer: 7, fire: 1 }
  },
  {
    id: 'preset_6',
    authorNickname: '밤샘당직러',
    reporterArchetype: '사건캡 출신 야전사령관',
    assignedDept: '사회부',
    resultType: 'stay',
    category: 'behind',
    content: '부서장이 면담 자리에서 "자네 없으면 우리 캡 누가 하냐"며 눈빛으로 붙잡을 때부터 쎄했습니다. 결국 원직 잔류 조치... 역시 인사는 실력보다 결원 타이밍이네요.',
    createdAt: Date.now() - 1000 * 60 * 600,
    reactions: { beer: 73, cheer: 8, fire: 31 }
  }
];

// 로컬 저장소에서 글 목록 불러오기
export function getLocalPosts(): BoardPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_POSTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(INITIAL_PRESET_POSTS));
      return INITIAL_PRESET_POSTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_PRESET_POSTS;
  } catch {
    return INITIAL_PRESET_POSTS;
  }
}

// 실시간 글 목록 가져오기 (Firebase 연동 또는 로컬 캐시)
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
          const list: BoardPost[] = Object.entries(data).map(([key, val]: [string, any]) => ({
            ...val,
            id: key,
            createdAt: typeof val.createdAt === 'number' ? val.createdAt : Date.now(),
            reactions: val.reactions || { beer: 0, cheer: 0, fire: 0 }
          }));
          // 최신순 정렬
          list.sort((a, b) => b.createdAt - a.createdAt);

          // 프리셋 글들과 병합 (Firebase에 아직 글이 적을 때도 풍성하게 유지)
          const liveIds = new Set(list.map(p => p.id));
          const merged = [...list, ...INITIAL_PRESET_POSTS.filter(p => !liveIds.has(p.id))];
          merged.sort((a, b) => b.createdAt - a.createdAt);

          // 로컬에도 백업 캐시
          localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(merged));
          return merged;
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
          post.id = data.name; // Firebase 생성 키 부여
        }
      }
    } catch (err) {
      console.warn('Firebase submit failed, saved to local', err);
    }
  }

  // 로컬에도 저장 (오프라인 및 즉시 갱신 보장)
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
    return { success: false, newCount: 0 }; // 이미 클릭함
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
  if (firebaseUrl) {
    try {
      await fetch(`${firebaseUrl}/posts/${postId}/reactions/${reactionType}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCount)
      });
    } catch (err) {
      console.warn('Firebase reaction sync failed', err);
    }
  }

  return { success: true, newCount: updatedCount };
}
