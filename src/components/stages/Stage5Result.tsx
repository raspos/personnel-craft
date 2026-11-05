import React, { useState, useEffect, useRef } from 'react';
import {
  CharacterProfile,
  CareerRecord,
  WishSelection,
  FinalAppointmentResult,
  SimulationProbabilities,
  FarmingState
} from '../../types/game';
import { drawFinalAppointment } from '../../utils/simulationEngine';
import { analyzeCareer } from '../../utils/careerAnalysis';
import { sound } from '../../utils/sound';
import { recordCompletedRun, PersonalRunBadge } from '../VisitorCounter';
import { getDepartmentByName } from '../../data/departments';
import { useLanguage } from '../../i18n/LanguageContext';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Share2,
  Calendar,
  Sparkles,
  Trophy,
  AlertOctagon,
  Briefcase,
  HelpCircle,
  Clock,
  Stamp,
  Mail,
  FileCheck,
  MessageSquareText
} from 'lucide-react';

interface Stage5Props {
  profile: CharacterProfile;
  careers: CareerRecord[];
  wishes: WishSelection;
  probabilities: SimulationProbabilities;
  farmingState: FarmingState;
  onRestart: () => void;
  onOpenShareModal: (result: FinalAppointmentResult) => void;
  onOpenTenYearModal: () => void;
  onOpenBoardModal?: (result: FinalAppointmentResult) => void;
  onActionChange: (action: 'nervous' | 'celebrate' | 'frustrated' | 'stay_desk') => void;
}

export const Stage5Result: React.FC<Stage5Props> = ({
  profile,
  careers,
  wishes,
  probabilities,
  farmingState,
  onRestart,
  onOpenShareModal,
  onOpenTenYearModal,
  onOpenBoardModal,
  onActionChange
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [phase, setPhase] = useState<'envelope' | 'revealed'>('envelope');
  const [countdown, setCountdown] = useState<number>(3);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [result, setResult] = useState<FinalAppointmentResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDeptName = profile.currentDept || (careers.length > 0 ? careers[careers.length - 1].deptName : '사회부');
  const analysis = analyzeCareer(careers, isEn);

  // 결과 개봉 함수 (타이머 중복 실행 완벽 방지)
  const revealResult = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsOpening(true);
    sound.playPaperDesk();
    recordCompletedRun(); // 정직한 실제 완주 횟수 집계
    const finalOutcome = drawFinalAppointment(probabilities, wishes, currentDeptName, isEn);
    setResult(finalOutcome);

    setTimeout(() => {
      setPhase('revealed');
      if (finalOutcome.resultType === 'first' || finalOutcome.resultType === 'second' || finalOutcome.resultType === 'third') {
        sound.playSuccessFanfare();
        onActionChange('celebrate');
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 }
        });
      } else if (finalOutcome.resultType === 'avoid') {
        sound.playFailSound();
        onActionChange('frustrated');
      } else {
        onActionChange('stay_desk');
      }
    }, 400);
  };

  // 인사발령 개봉 시작
  const startEnvelopeCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase('envelope');
    setCountdown(3);
    setIsOpening(false);
    onActionChange('nervous');

    sound.playHeartbeat();
    timerRef.current = setInterval(() => {
      sound.playHeartbeat();
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          revealResult();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startEnvelopeCountdown();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStampData = (type: string) => {
    switch (type) {
      case 'first':
        return { text: isEn ? '1st Wish Confirmed' : '1지망 영전 확정', color: 'stamp-green' };
      case 'second':
        return { text: isEn ? '2nd Wish Approved' : '2지망 안착 승인', color: 'stamp-green' };
      case 'third':
        return { text: isEn ? '3rd Wish Squeaked By' : '3지망 턱걸이', color: 'stamp-amber' };
      case 'stay':
        return { text: isEn ? 'Current Desk Retained' : '원직 잔류 조치', color: 'stamp-amber' };
      case 'avoid':
        return { text: isEn ? 'Exiled to Blacklist' : '격오지 기피 유입', color: '' };
      default:
        return { text: isEn ? 'Executive Order' : '인사위 직권 발령', color: 'stamp-amber' };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {phase === 'envelope' ? (
        // 황금 실링 왁스 비밀 봉투 연출
        <div className="pixel-card p-8 border-4 border-amber-500/80 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-400 to-red-600 animate-pulse"></div>

          <div className="inline-block p-5 pixel-card border-2 border-amber-500/80 shadow-xl relative bg-amber-950/40">
            <Mail className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <div className="w-8 h-8 rounded bg-red-600 border-2 border-red-300 absolute -bottom-2 -right-2 flex items-center justify-center text-xs font-bold text-white shadow font-pixel">
              {isEn ? 'SEAL' : '封'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-pixel text-xs text-red-400 tracking-widest uppercase">
              {isEn ? '★ [TOP SECRET] CONFIDENTIAL RESHUFFLE NOTICE ★' : '★ [TOP SECRET] 대외비 편집국 정기인사 통지서 ★'}
            </div>
            <h2 className="font-pixel text-2xl sm:text-3xl text-slate-100 font-extrabold">
              {isEn
                ? `${profile.hireYear + Math.floor(analysis.totalMonths / 12)} ${profile.currentHalf === '하반기' ? 'Autumn' : 'Spring'} Reshuffle Order`
                : `${profile.hireYear + Math.floor(analysis.totalMonths / 12)}년도 ${profile.currentHalf} 인사발령`}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-pixel">
              {isEn
                ? 'Unsealing the confidential appointment envelope stamped by the Managing Editor...'
                : '편집국장의 결재 도장이 찍힌 인사발령 봉투를 개봉하고 있습니다...'}
            </p>
          </div>

          <div className="py-4">
            <div className="inline-flex items-center justify-center w-24 h-24 pixel-card border-4 border-amber-400/90 font-pixel text-5xl text-amber-300 shadow-2xl bg-slate-950">
              {countdown}
            </div>
            <div className="text-xs text-slate-400 mt-3 font-pixel">
              {countdown > 0 ? (isEn ? `Unsealing in ${countdown}s...` : '봉투 개봉 3초 전...') : (isEn ? 'Unsealed!' : '개봉 완료!')}
            </div>
          </div>

          <button
            onClick={revealResult}
            className="text-xs text-slate-400 hover:text-amber-300 underline font-pixel"
          >
            {isEn ? 'Skip countdown and open now ➔' : '카운트다운 건너뛰고 바로 열기 ➔'}
          </button>
        </div>
      ) : result ? (
        // 최종 결과: 특별 호외 신문(THE NEWSROOM EXTRA) 1면 스타일 결과 카드
        <div className="space-y-6">
          <div className={`pixel-card p-6 sm:p-8 border-4 text-center relative overflow-hidden transition-all shadow-2xl ${
            result.resultType === 'first'
              ? 'border-blue-400 bg-gradient-to-b from-blue-950/80 via-slate-900 to-slate-950'
              : result.resultType === 'avoid'
              ? 'border-red-500 bg-gradient-to-b from-red-950/80 via-slate-900 to-slate-950'
              : result.resultType === 'stay'
              ? 'border-amber-500 bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950'
              : 'border-emerald-500 bg-gradient-to-b from-emerald-950/60 via-slate-900 to-slate-950'
          }`}>
            {/* 호외 신문 상단 헤더 바 */}
            <div className="border-b-2 border-slate-700/80 pb-3 mb-5 flex flex-wrap items-center justify-between gap-2 text-xs font-pixel text-slate-400">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-black px-2 py-0.5 border border-red-300 text-[11px]">{isEn ? 'EXTRA!' : '호외 (號外)'}</span>
                <span className="font-bold text-slate-200">{isEn ? 'NEWSROOM SPECIAL BULLETIN' : '편집국 인사 특별 속보'}</span>
              </div>
              <div className="flex items-center gap-3">
                <PersonalRunBadge />
                <span>
                  {isEn
                    ? `Issued: ${profile.hireYear + Math.floor(analysis.totalMonths / 12)} Reshuffle Council`
                    : `발행: ${profile.hireYear + Math.floor(analysis.totalMonths / 12)}년 ${profile.currentHalf} 정기인사위원회`}
                </span>
              </div>
            </div>

            {/* 인장 스탬프 */}
            {(() => {
              const stamp = getStampData(result.resultType);
              return (
                <div className={`newspaper-stamp right-4 top-16 ${stamp.color}`}>
                  {stamp.text}
                </div>
              );
            })()}

            {/* 상단 뱃지 */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 pixel-slot text-xs font-pixel mb-3">
              {result.resultType === 'first' && <span className="text-cyan-400 font-bold">{isEn ? '🎉 1st Wish Triumph' : '🎉 1지망 대성공'}</span>}
              {result.resultType === 'second' && <span className="text-blue-300 font-bold">{isEn ? '✨ 2nd Wish Landed' : '✨ 2지망 안착'}</span>}
              {result.resultType === 'third' && <span className="text-indigo-300 font-bold">{isEn ? '🛡️ 3rd Wish Survivor' : '🛡️ 3지망 턱걸이'}</span>}
              {result.resultType === 'avoid' && <span className="text-red-400 font-bold">{isEn ? '⚠️ Exiled to Blacklist' : '⚠️ 기피 부서 유입'}</span>}
              {result.resultType === 'stay' && <span className="text-amber-400 font-bold">{isEn ? '📌 Desk Retained' : '📌 현 부서 잔류'}</span>}
              {result.resultType === 'other' && <span className="text-purple-400 font-bold">{isEn ? '🎲 Transferred to Other Desk' : '🎲 기타 부서 발령'}</span>}
            </div>

            {/* 헤드라인 & 발령 부서 */}
            <h2 className="font-pixel text-xl sm:text-3xl text-slate-100 font-extrabold mb-2 tracking-tight break-keep">
              {result.messageHeadline}
            </h2>
            <div className="font-pixel text-2xl sm:text-5xl text-amber-300 font-black my-3 sm:my-4 drop-shadow-lg tracking-wider break-keep">
              [ {isEn ? (getDepartmentByName(result.assignedDept)?.nameEn || result.assignedDept) : result.assignedDept} ] {isEn ? 'ORDER ISSUED!' : '발령!'}
            </div>
            <p className="text-slate-300 text-xs sm:text-base font-medium max-w-xl mx-auto leading-relaxed mb-4 break-keep">
              {result.messageSubtitle}
            </p>

            {/* 풍자적인 한마디 명언 */}
            <div className="pixel-slot p-3 sm:p-3.5 text-slate-200 text-xs sm:text-sm font-pixel italic max-w-md mx-auto mb-5 break-keep">
              "{result.flavorQuote}"
            </div>

            {/* 인사 확률 리뷰 배지 바 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 max-w-lg mx-auto">
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[10px] font-pixel">{isEn ? '1st Wish Odds' : '1지망 확률'}</div>
                <div className="font-pixel text-cyan-400 font-bold text-sm mt-0.5">{probabilities.firstWish}%</div>
              </div>
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[10px] font-pixel">{isEn ? 'Total Wish Combined' : '희망부서 합산'}</div>
                <div className="font-pixel text-emerald-400 font-bold text-sm mt-0.5">{probabilities.totalWish}%</div>
              </div>
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[10px] font-pixel">{isEn ? 'Retention Odds' : '현부서 잔류'}</div>
                <div className="font-pixel text-amber-400 font-bold text-sm mt-0.5">{probabilities.stayCurrent}%</div>
              </div>
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[10px] font-pixel">{isEn ? 'Blacklist Risk' : '기피부서 위험'}</div>
                <div className="font-pixel text-red-400 font-bold text-sm mt-0.5">{probabilities.avoidDept}%</div>
              </div>
            </div>
          </div>

          {/* 인사 농사 종합 성적표 */}
          <div className="pixel-card p-5 border-amber-500/50 text-xs space-y-3">
            <div className="font-pixel text-sm text-amber-300 font-bold flex items-center justify-between border-b-2 border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span>🌾</span>
                <span>{isEn ? 'Newsroom Politicking Report Card' : '나의 인사 농사 성적표 종합 리포트'}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {isEn ? 'Comprehensive Season Review' : (profile.currentHalf === '하반기' ? '추석 이후 4주 활동 총결산' : '상반기 활동 총결산')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-slate-300">
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[11px] font-pixel">{isEn ? 'Chief Meetings' : '부서장 면담'}</div>
                <div className="font-pixel text-blue-400 font-bold text-sm mt-0.5">
                  {Object.values(farmingState.bossVisitCount).reduce((a, b) => a + b, 0)}{isEn ? ' times' : '회 접촉'}
                </div>
              </div>
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[11px] font-pixel">{isEn ? '1st Wish Awareness' : '1지망 부서 인지도'}</div>
                <div className="font-pixel text-cyan-400 font-bold text-sm mt-0.5">
                  {typeof farmingState.metrics.deptAwareness === 'number'
                    ? farmingState.metrics.deptAwareness
                    : farmingState.metrics.deptAwareness.first}%
                </div>
              </div>
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[11px] font-pixel">{isEn ? 'Retention Pressure' : '현 부서 잔류 압력'}</div>
                <div className="font-pixel text-rose-400 font-bold text-sm mt-0.5">{farmingState.metrics.stayPressure}%</div>
              </div>
              <div className="pixel-slot p-2.5">
                <div className="text-slate-400 text-[11px] font-pixel">{isEn ? 'Scoop Score' : '기사 작성 성과'}</div>
                <div className="font-pixel text-emerald-400 font-bold text-sm mt-0.5">{farmingState.metrics.articleScore}P</div>
              </div>
            </div>

            {/* 농사 최종 유머 평가 문구 */}
            <div className="p-3 pixel-slot text-slate-200 text-xs italic font-pixel leading-relaxed">
              {result.resultType === 'first' && (
                wishes.first.deptName === currentDeptName
                  ? (isEn ? '“Your unshakeable resolve to retain your beat prevailed! You have defended your desk to finish your big investigative series.”' : '“당신의 강력한 잔류 의지가 마침내 관철되었습니다! 진행 중이던 대형 기획 취재를 성공적으로 마무리할 무대를 지켜냈습니다.”')
                  : wishes.second.deptName === '없음' || wishes.second.deptName === '선택 안 함'
                  ? (isEn ? '“Betting everything on 1st wish without a backup paid off! You made an indelible statement across the newsroom.”' : '“2·3지망 없이 1지망에 승부수를 던진 당신의 배포가 통했습니다! 편집국에 확실한 존재감을 각인시켰습니다.”')
                  : (isEn ? '“Groundwork nurtured rich harvest! Your backroom lobbying and the newsroom council aligned perfectly.”' : '“밭을 갈았더니 정말 탐스러운 싹이 났습니다! 당신의 물밑 노력과 편집국의 뜻이 완벽히 맞아떨어졌습니다.”')
              )}
              {result.resultType === 'second' && (isEn ? '“The 1st wish narrowly missed, but your 2nd wish yielded a surprisingly rich harvest!”' : '“1지망 밭은 아쉽게 비껴갔지만, 2지망 밭에서 뜻밖의 풍성한 수확을 거두었습니다!”')}
              {result.resultType === 'third' && (isEn ? '“You squeaked into your 3rd wish despite a brutal reshuffle drought. Ultimate survivor!”' : '“치열한 인사 가뭄 속에서도 턱걸이 수확에 성공했습니다. 생존력 만점입니다!”')}
              {result.resultType === 'stay' && (
                wishes.second.deptName === '없음' || wishes.second.deptName === '선택 안 함'
                  ? (isEn ? '“Your all-in 1st wish gambit fell through, holding you in your current desk. Having burned the bridges, your justification to move next cycle is ironclad.”' : '“1지망 올인이 불발되어 현 부서에 잔류합니다. 배수의 진을 쳤던 만큼 다음 인사의 이동 명분이 더욱 강력해졌습니다.”')
                  : (isEn ? '“You cultivated your connections diligently, but could not break the current desk\'s retention grip. Prepare for the spring reshuffle!”' : '“밭은 열심히 갈았는데… 결국 현 부서의 잔류 벽을 넘지 못했습니다. 내년 봄 인사를 기약합니다.”')
              )}
              {result.resultType === 'avoid' && (isEn ? '“Fiercer than any reshuffle politicking was the newsroom typhoon. Reborn as a battle-hardened veteran in exile!”' : '“인사 농사보다 무서운 건 편집국의 돌발 태풍이었습니다. 기피 부서에서 진정한 대기자(大記者)로 거듭납니다.”')}
              {result.resultType === 'other' && (isEn ? '“Sprouts emerge from the most unexpected soil. Life, like newsroom reshuffles, is full of mysteries.”' : '“예상하지 못한 곳에서 싹이 틉니다. 인생도 인사도 언제나 미지의 연속입니다.”')}
            </div>
          </div>

          {/* 기자 커리어 요약 브리핑 */}
          <div className="pixel-card p-4 text-xs space-y-2">
            <div className="font-pixel text-sm text-slate-200 font-bold flex items-center gap-1.5 border-b-2 border-slate-800 pb-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>{isEn ? 'Reporter Dossier Summary' : '기자 프로필 요약'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-300 font-pixel">
              <div>{isEn ? 'Byline:' : '기자 닉네임:'} <strong className="text-white">{profile.nickname}</strong></div>
              <div>{isEn ? 'Experience:' : '기자 연차:'} <strong className="text-white">{analysis.totalYearsText}</strong></div>
              <div>{isEn ? 'Archetype:' : '기자 유형:'} <strong className="text-amber-300">{analysis.reporterType}</strong></div>
              {analysis.careerSynergy && (
                <div className="col-span-full pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold font-pixel">
                    ⚡ {isEn ? 'Synergy' : '시너지'}
                  </span>
                  <span className="text-cyan-200 font-bold">{analysis.careerSynergy.title}</span>
                  <span className="text-slate-400">({analysis.careerSynergy.combination})</span>
                </div>
              )}
            </div>
          </div>

          {/* 편집국 익명 대나무숲 (사내 게시판) 바로가기 배너 */}
          {onOpenBoardModal && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 p-4 rounded-xl border-2 border-emerald-500/60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-left animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                  🎋
                </div>
                <div>
                  <div className="font-pixel text-sm text-emerald-300 font-bold flex items-center gap-1.5">
                    <span>{isEn ? 'Newsroom Anonymous Lounge' : '편집국 익명 대나무숲 게시판'}</span>
                    <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-700 font-pixel animate-pulse">LIVE</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isEn ? 'Share your reshuffle reactions and see what other journalists are whispering!' : '나의 인사발령 소감을 남기고 다른 기자들의 실시간 넋두리와 썰을 확인하세요!'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenBoardModal(result);
                }}
                className="pixel-btn-mc bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 px-4 text-xs font-pixel whitespace-nowrap flex items-center justify-center gap-1.5 shadow-md flex-shrink-0 w-full sm:w-auto"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>{isEn ? 'Post & View Lounge ➔' : '소감 남기기 & 글 보기 ➔'}</span>
              </button>
            </div>
          )}

          {/* 조작 버튼 액션 그룹 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                sound.playClick();
                startEnvelopeCountdown();
              }}
              className="pixel-btn-mc text-slate-200 py-3.5 px-4 text-xs font-pixel flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>{isEn ? 'Reroll (Same Odds)' : '동일 조건으로 다시 뽑기'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenShareModal(result);
              }}
              className="pixel-btn-mc pixel-btn-mc-primary py-3.5 px-4 text-xs font-pixel flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>{isEn ? 'Save Result Card (Image)' : '결과 카드 이미지 저장'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenTenYearModal();
              }}
              className="pixel-btn-mc text-amber-300 py-3.5 px-4 text-xs font-pixel flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{isEn ? '10-Year Career Simulation' : '10년 기자 인생 모드'}</span>
            </button>
          </div>

          {/* 처음부터 다시 하기 버튼 */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                sound.playClick();
                onRestart();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 underline font-pixel"
            >
              {isEn ? 'Reset and re-configure character & career from Stage 1' : '캐릭터 및 경력 처음부터 다시 설정하기'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
