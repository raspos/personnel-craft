import React, { useState, useEffect, useMemo } from 'react';
import { BoardPost, BoardCategory, FinalAppointmentResult, CharacterProfile } from '../types/game';
import {
  fetchCommunityPosts,
  submitCommunityPost,
  reactToPost,
  getFirebaseUrl,
  setFirebaseUrl
} from '../utils/communityApi';
import { getDepartmentByName } from '../data/departments';
import {
  X,
  MessageSquareText,
  Send,
  Sparkles,
  Flame,
  Beer,
  Award,
  Settings,
  RefreshCw,
  PlusCircle,
  ThumbsUp,
  Tag,
  Check,
  Globe
} from 'lucide-react';
import { sound } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialResult?: FinalAppointmentResult | null;
  profile?: CharacterProfile;
}

export const CommunityBoardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialResult,
  profile
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BoardCategory>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // 작성 폼 상태
  const [isWriting, setIsWriting] = useState(false);
  const [authorName, setAuthorName] = useState(profile?.nickname || '');
  const [category, setCategory] = useState<'triumph' | 'retention' | 'behind' | 'quit'>('triumph');
  const [content, setContent] = useState('');
  const [attachResult, setAttachResult] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firebase DB 설정 모달 상태
  const [showConfig, setShowConfig] = useState(false);
  const [firebaseUrlInput, setFirebaseUrlInput] = useState(getFirebaseUrl());
  const [configSaved, setConfigSaved] = useState(false);

  // 유저가 이미 누른 리액션 캐시 추적
  const [userVotedKeys, setUserVotedKeys] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('pcraft_user_reactions_v1') || '{}');
    } catch {
      return {};
    }
  });

  // 데이터 로딩
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCommunityPosts();
      setPosts(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPosts();
      // 결과가 전달되었고 글쓰기 기본 닉네임이 비어있다면 자동 세팅
      if (profile?.nickname && !authorName) {
        setAuthorName(profile.nickname);
      }
      // 결과 종류에 따라 기본 카테고리 추천
      if (initialResult) {
        if (initialResult.resultType === 'first' || initialResult.resultType === 'second') {
          setCategory('triumph');
        } else if (initialResult.resultType === 'avoid') {
          setCategory('quit');
        } else if (initialResult.resultType === 'stay') {
          setCategory('retention');
        }
      }
    }
  }, [isOpen, initialResult, profile]);

  // 글 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    sound.playClick();

    const nick = authorName.trim() || (isEn ? 'Anonymous Reporter' : '익명의 기자');
    const resultTag = attachResult && initialResult ? initialResult.resultType : undefined;
    const deptTag = attachResult && initialResult ? initialResult.assignedDept : undefined;

    try {
      const created = await submitCommunityPost({
        authorNickname: nick,
        assignedDept: deptTag,
        resultType: resultTag,
        category,
        content: content.trim()
      });

      setPosts(prev => [created, ...prev]);
      setContent('');
      setIsWriting(false);
      sound.playPaperDesk();
    } catch (err) {
      console.error('Failed to submit post', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 리액션 버튼 클릭
  const handleReact = async (postId: string, reactionType: 'beer' | 'cheer' | 'fire') => {
    const key = `${postId}_${reactionType}`;
    if (userVotedKeys[key]) return; // 중복 방지

    sound.playBlip();

    // 옵티미스틱 UI 업데이트
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            reactions: {
              ...p.reactions,
              [reactionType]: p.reactions[reactionType] + 1
            }
          };
        }
        return p;
      })
    );

    setUserVotedKeys(prev => ({ ...prev, [key]: true }));
    await reactToPost(postId, reactionType);
  };

  // Firebase URL 저장
  const handleSaveConfig = () => {
    setFirebaseUrl(firebaseUrlInput);
    setConfigSaved(true);
    sound.playSuccessFanfare();
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfig(false);
      loadPosts();
    }, 1200);
  };

  // 상대 시간 계산 헬퍼
  const formatTimeAgo = (ts: number): string => {
    const diff = Math.max(0, Date.now() - ts);
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return isEn ? 'Just now' : '방금 전';
    if (mins < 60) return isEn ? `${mins}m ago` : `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isEn ? `${hours}h ago` : `${hours}시간 전`;
    const date = new Date(ts);
    return isEn
      ? `${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 필터 및 정렬 적용
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    if (sortBy === 'popular') {
      list.sort((a, b) => {
        const scoreA = a.reactions.beer + a.reactions.cheer + a.reactions.fire;
        const scoreB = b.reactions.beer + b.reactions.cheer + b.reactions.fire;
        return scoreB - scoreA;
      });
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }, [posts, selectedCategory, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="pixel-card bg-slate-950 border-4 border-emerald-500/80 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
        
        {/* 모달 상단 헤더 */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-lg shadow-inner">
              🎋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-pixel text-base sm:text-lg text-emerald-300 font-extrabold">
                  {isEn ? 'Newsroom Anonymous Lounge' : '편집국 익명 대나무숲'}
                </h2>
                <span className="text-[10px] bg-emerald-900/90 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-pixel flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                {isEn
                  ? 'Real-time anonymous whispers, reshuffle complaints, and survival tips.'
                  : '실시간으로 쏟아지는 기자들의 인사발령 후기와 뒷이야기 대나무숲'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playClick();
                setShowConfig(!showConfig);
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-400 text-slate-400 hover:text-emerald-300 transition-colors"
              title={isEn ? 'Online Sync DB Settings' : '실시간 온라인 DB 연동 설정'}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                loadPosts();
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-400 text-slate-400 hover:text-emerald-300 transition-colors"
              title={isEn ? 'Refresh posts' : '새로고침'}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                sound.playBlip();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 온라인 실시간 DB 설정 패널 (접기/펼치기) */}
        {showConfig && (
          <div className="p-4 bg-slate-900/95 border-b border-emerald-500/40 text-xs space-y-2.5 font-sans">
            <div className="flex items-center justify-between">
              <span className="font-pixel font-bold text-emerald-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>{isEn ? 'Firebase Realtime DB Cloud Sync' : '실시간 전역 온라인 DB 연동 (Firebase)'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {isEn ? 'Zero-setup default active' : '미입력 시 기본 내장 저장소 작동'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isEn
                ? 'Connect your free Firebase Realtime Database URL to sync posts instantly across all users and mobile devices.'
                : '무료 Firebase Realtime Database URL을 연결하시면 전 세계 모든 접속자들의 글이 실시간으로 동기화됩니다.'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={firebaseUrlInput}
                onChange={e => setFirebaseUrlInput(e.target.value)}
                placeholder="https://your-project-default-rtdb.firebaseio.com"
                className="voxel-input flex-1 text-xs py-1.5 px-3 font-mono"
              />
              <button
                onClick={handleSaveConfig}
                className="pixel-btn-mc pixel-btn-mc-primary text-xs py-1.5 px-4 font-pixel flex items-center gap-1"
              >
                {configSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <SaveIcon className="w-3.5 h-3.5" />}
                <span>{configSaved ? (isEn ? 'Saved!' : '저장됨!') : (isEn ? 'Save' : '저장')}</span>
              </button>
            </div>
          </div>
        )}

        {/* 필터 카테고리 탭 & 정렬 바 */}
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {[
              { id: 'all', ko: '전체', en: 'All' },
              { id: 'triumph', ko: '🎉 영전·합격', en: '🎉 Triumph' },
              { id: 'retention', ko: '😭 잔류·격오지', en: '😭 Retained' },
              { id: 'behind', ko: '☕ 인사 비화·썰', en: '☕ Rumors' },
              { id: 'quit', ko: '💼 사표·탈출각', en: '💼 Resign' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playBlip();
                  setSelectedCategory(cat.id as BoardCategory);
                }}
                className={`px-2.5 py-1 rounded text-xs font-pixel whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {isEn ? cat.en : cat.ko}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playBlip();
                setSortBy(sortBy === 'latest' ? 'popular' : 'latest');
              }}
              className="text-[11px] font-pixel text-slate-400 hover:text-emerald-300 transition-colors"
            >
              {sortBy === 'latest'
                ? (isEn ? 'Sort: Latest ▼' : '정렬: 최신순 ▼')
                : (isEn ? 'Sort: Popular 🔥' : '정렬: 공감순 🔥')}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsWriting(!isWriting);
              }}
              className="pixel-btn-mc pixel-btn-mc-primary text-xs py-1 px-3 font-pixel flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isEn ? 'Write' : '글쓰기'}</span>
            </button>
          </div>
        </div>

        {/* 글 작성 폼 (토글) */}
        {isWriting && (
          <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-b-2 border-emerald-500/50 space-y-3 font-sans animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder={isEn ? 'Nickname (e.g. Crime Beat Rookie)' : '닉네임 (예: 마와리 2년차)'}
                  maxLength={15}
                  className="voxel-input text-xs py-1.5 px-3 max-w-[180px] font-pixel"
                />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="voxel-input text-xs py-1.5 px-2 font-pixel"
                >
                  <option value="triumph">{isEn ? '🎉 Triumph' : '🎉 영전·합격'}</option>
                  <option value="retention">{isEn ? '😭 Retained' : '😭 잔류·격오지'}</option>
                  <option value="behind">{isEn ? '☕ Rumors' : '☕ 인사 비화·썰'}</option>
                  <option value="quit">{isEn ? '💼 Resign' : '💼 사표·탈출각'}</option>
                </select>
              </div>

              {initialResult && (
                <label className="flex items-center gap-1.5 text-xs text-slate-300 font-pixel cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={attachResult}
                    onChange={e => setAttachResult(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>
                    {isEn
                      ? `Attach [${initialResult.assignedDept}] result badge`
                      : `내 [${initialResult.assignedDept}] 발령 뱃지 달기`}
                  </span>
                </label>
              )}
            </div>

            <div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder={
                  isEn
                    ? 'Whisper your candid reshuffle thoughts, desk lobbying tales, or words of encouragement...'
                    : '인사발령 소감, 부서장과의 면담 후기, 억울한 잔류 넋두리나 동기들을 향한 응원을 자유롭게 남겨보세요...'
                }
                className="voxel-input w-full text-xs p-3 font-sans leading-relaxed resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-pixel pt-1">
                <span>* {isEn ? 'No hate speech or real names' : '비방 및 실명 언급 금지'}</span>
                <span>{content.length} / 300</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWriting(false)}
                className="pixel-btn-mc text-slate-400 py-1.5 px-4 text-xs font-pixel"
              >
                {isEn ? 'Cancel' : '취소'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="pixel-btn-mc pixel-btn-mc-primary text-xs py-1.5 px-5 font-pixel flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? (isEn ? 'Posting...' : '등록 중...') : (isEn ? 'Post Whisper' : '소감 남기기')}</span>
              </button>
            </div>
          </form>
        )}

        {/* 게시글 피드 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-pixel space-y-2">
              <div className="text-3xl">📭</div>
              <p>{isEn ? 'No whispers found in this category.' : '해당 카테고리에 등록된 글이 없습니다.'}</p>
              <p className="text-xs text-slate-400">
                {isEn ? 'Be the first journalist to break the silence!' : '첫 번째 넋두리를 남겨보세요!'}
              </p>
            </div>
          ) : (
            filteredPosts.map(post => {
              const isBeerVoted = userVotedKeys[`${post.id}_beer`];
              const isCheerVoted = userVotedKeys[`${post.id}_cheer`];
              const isFireVoted = userVotedKeys[`${post.id}_fire`];

              return (
                <div
                  key={post.id}
                  className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2.5 shadow-md"
                >
                  {/* 작성자 & 뱃지 헤더 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel font-bold text-slate-200">
                        {post.authorNickname}
                      </span>
                      {post.reporterArchetype && (
                        <span className="text-[10px] text-slate-400 font-pixel bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 hidden sm:inline">
                          {post.reporterArchetype}
                        </span>
                      )}
                      {post.assignedDept && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-pixel font-bold border ${
                          post.resultType === 'first'
                            ? 'bg-blue-950 text-cyan-300 border-cyan-500/60'
                            : post.resultType === 'avoid'
                            ? 'bg-red-950 text-red-300 border-red-500/60'
                            : post.resultType === 'stay'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                        }`}>
                          {post.assignedDept} {post.resultType === 'first' ? (isEn ? '1st Landed' : '1지망 영전') : post.resultType === 'stay' ? (isEn ? 'Retained' : '잔류') : post.resultType === 'avoid' ? (isEn ? 'Blacklist' : '기피') : (isEn ? 'Transferred' : '발령')}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500 font-pixel">
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>

                  {/* 본문 내용 */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* 리액션 버튼 바 */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => handleReact(post.id, 'beer')}
                      className={`px-2.5 py-1 rounded text-xs font-pixel flex items-center gap-1.5 border transition-all ${
                        isBeerVoted
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500 font-bold scale-105'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-amber-300'
                      }`}
                      title={isEn ? "Buy a drink (Cheer up)" : "소주 한잔 (위로)"}
                    >
                      <Beer className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isEn ? 'Drink' : '소주 한잔'}</span>
                      <span className="text-amber-300 font-bold">{post.reactions.beer}</span>
                    </button>

                    <button
                      onClick={() => handleReact(post.id, 'cheer')}
                      className={`px-2.5 py-1 rounded text-xs font-pixel flex items-center gap-1.5 border transition-all ${
                        isCheerVoted
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 font-bold scale-105'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-cyan-300'
                      }`}
                      title={isEn ? "Congratulations" : "축하해요"}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isEn ? 'Congrats' : '축하'}</span>
                      <span className="text-cyan-300 font-bold">{post.reactions.cheer}</span>
                    </button>

                    <button
                      onClick={() => handleReact(post.id, 'fire')}
                      className={`px-2.5 py-1 rounded text-xs font-pixel flex items-center gap-1.5 border transition-all ${
                        isFireVoted
                          ? 'bg-rose-950/80 text-rose-300 border-rose-500 font-bold scale-105'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-rose-400'
                      }`}
                      title={isEn ? "Summon Chief (Anger)" : "부장 소환 (분노)"}
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isEn ? 'Rage' : '부장 소환'}</span>
                      <span className="text-rose-400 font-bold">{post.reactions.fire}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-pixel">
          <span>* {isEn ? 'Anonymous Newsroom Bamboo Grove · Freedom of Expression' : '언론사 편집국 대나무숲 · 표현의 자유 보장'}</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="pixel-btn-mc text-slate-300 py-1.5 px-4 text-xs font-pixel"
          >
            {isEn ? 'Close' : '닫기'}
          </button>
        </div>

      </div>
    </div>
  );
};

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}
