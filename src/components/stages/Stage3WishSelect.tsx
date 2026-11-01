import React, { useState, useEffect } from 'react';
import {
  WishSelection,
  WishDeptConfig,
  DeptTO,
  LongTermWorkers,
  DeptBossRelation,
  RelationTemp,
  BossRecruitIntent,
  CurrentBossIntent,
  CompetitorCount
} from '../../types/game';
import { DEFAULT_DEPARTMENTS, getDepartmentByName } from '../../data/departments';
import { ArrowRight, ArrowLeft, MessageSquare, AlertTriangle, Building2, UserCheck, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n/LanguageContext';

interface Stage3Props {
  wishes: WishSelection;
  setWishes: (w: WishSelection) => void;
  currentDeptName: string;
  onNext: () => void;
  onPrev: () => void;
}

export const Stage3WishSelect: React.FC<Stage3Props> = ({
  wishes,
  setWishes,
  currentDeptName,
  onNext,
  onPrev
}) => {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  // 부서장 NPC 가상 게임 대사 생성기
  const generateBossDialogue = (cfg: WishDeptConfig, isStay: boolean): string => {
    if (isStay) {
      if (cfg.relationTemp === '매우 좋은 관계' || cfg.relationTemp === '좋은 관계') {
        return isEn
          ? '“You want to stay on our beat instead of jumping ship? Fantastic! Lead our investigative series to the finish line. I will personally defend your desk in the Managing Editor\'s council.”'
          : '“자네가 다른 데 안 가고 우리 부서에 더 남아주겠다고? 정말 든든하네! 지금 진행 중인 대형 기획 취재 자네가 중심 잡고 이끌어주게. 국장단 회의 때 자네는 절대 못 빼가도록 내가 단단히 방어하겠네.”';
      }
      if (cfg.relationTemp === '좋지 않은 관계' || cfg.relationTemp === '다소 껄끄러움') {
        return isEn
          ? '“...You wish to stay here longer? Frankly, I thought it was high time for a mutual change of scenery... We shall see what the Committee decides.”'
          : '“…자네가 우리 부서에 더 남겠다고? 글쎄, 서로 좀 분위기를 쇄신할 타이밍이 아닌가 싶었는데… 인사위 결과를 지켜보세.”';
      }
      return isEn
        ? '“So you requested to retain your current beat. Guard your sources and beat faithfully. We shall await the Committee order.”'
        : '“자네가 우리 부서 잔류를 희망했군. 지금 맡고 있는 출입처와 취재 라인을 잘 지켜주게. 인사위원회 결과를 지켜보세.”';
    }
    if (cfg.expectedTO === '0명') {
      return isEn
        ? '“I know your caliber full well, but our department has zero headcount openings this reshuffle. There is simply no vacant desk.”'
        : '“자네 실력이야 잘 알지만… 이번에 우리 부서 확정 TO가 0명이야. 마음은 굴뚝같은데 자리가 없어.”';
    }
    if (cfg.recruitIntent === '직접 함께 일하자고 제안') {
      return isEn
        ? '“If you want to come over, I will personally pitch your name to the Managing Editor. Let us work together this cycle!”'
        : '“자네가 온다면 내가 국장한테 직접 말해볼게. 이번에 자리 생기면 꼭 같이 일해보자!”';
    }
    if (cfg.recruitIntent === '부정적 반응') {
      return isEn
        ? '“Well... our desk is looking for a completely different profile of expertise this time around.”'
        : '“글쎄… 이번엔 우리 쪽에 다른 전문성을 가진 인력이 필요해서 말이지.”';
    }
    if (cfg.bossRelation === '술자리 친구·사적 친분') {
      return isEn
        ? '“Haha, we should definitely grab drinks soon! But you know newsroom personnel politics is an entirely separate beast, right?”'
        : '“하하, 우리 다음에 소주 한잔해야지! 근데… 인사는 또 완전히 다른 문제인 거 알지?”';
    }
    if (cfg.bossRelation === '대학 선후배') {
      return isEn
        ? '“Long time no see, fellow alumni! I would love to pull strings for you, but newsroom politics is cutthroat right now.”'
        : '“오, 오랜만이네! 선배로서 힘써주고 싶지만 편집국 분위기가 워낙 빡빡해서 장담은 못 해.”';
    }
    if (cfg.bossRelation === '과거 직속 부장·데스크') {
      return isEn
        ? '“We had phenomenal chemistry closing front-page deadlines together in the past. I hope the stars align again.”'
        : '“예전에 자네랑 마감 칠 때 호흡이 참 좋았지. 이번에도 기회가 닿으면 좋겠는데.”';
    }
    if (cfg.bossRelation === '안면이 전혀 없는 사이' || cfg.bossRelation === '얼굴만 아는 사이') {
      return isEn
        ? '“Let us see... you applied to our section? Mind sharing some clips of the stories you have been breaking lately?”'
        : '“어디 보자… 이번에 우리 부서 지원하셨다고요? 어떤 기사를 주로 쓰셨는지 좀 볼까요?”';
    }
    if (cfg.relationTemp === '다소 껄끄러움' || cfg.relationTemp === '좋지 않은 관계') {
      return isEn
        ? '“...We always had rather contrasting editorial temperaments. The Committee will decide what is best for the paper.”'
        : '“…서로 업무 스타일이 좀 다른 면이 있었죠. 이번 인사 결과는 뚜껑을 열어봐야 알겠네요.”';
    }
    return isEn
      ? '“Best of luck landing your preferred desk. Let us see what the Managing Editor decides.”'
      : '“원하는 부서에 꼭 배치되길 바라네. 인사위원회 결과를 지켜보자고.”';
  };

  const currentWishConfig = activeTab === 1 ? wishes.first : activeTab === 2 ? wishes.second : wishes.third;
  const isCurrentWishNone = currentWishConfig.deptName === '없음' || currentWishConfig.deptName === '선택 안 함';
  const isStayWish = activeTab === 1 && currentWishConfig.deptName === currentDeptName;

  const updateCurrentWish = (patch: Partial<WishDeptConfig>) => {
    sound.playBlip();
    const updated = { ...currentWishConfig, ...patch };
    if (activeTab === 1) {
      setWishes({ ...wishes, first: updated });
    } else if (activeTab === 2) {
      // 2지망을 '없음'으로 하면 3지망도 자동으로 '없음' 처리
      if (patch.deptName === '없음') {
        setWishes({
          ...wishes,
          second: updated,
          third: { ...wishes.third, deptName: '없음' }
        });
      } else {
        setWishes({ ...wishes, second: updated });
      }
    } else {
      setWishes({ ...wishes, third: updated });
    }
  };

  // 초기 마운트 시 2·3지망의 현재 부서 충돌 및 기피 부서 공란 자동 해소
  useEffect(() => {
    let needsUpdate = false;
    let newWishes = { ...wishes };

    // 2지망이 현재 부서와 겹칠 경우 자동 변경
    if (newWishes.second.deptName !== '없음' && newWishes.second.deptName === currentDeptName) {
      const alt = DEFAULT_DEPARTMENTS.find(d => d.name !== currentDeptName && d.name !== newWishes.first.deptName)?.name || '경제부';
      newWishes.second = { ...newWishes.second, deptName: alt };
      needsUpdate = true;
    }
    // 3지망이 현재 부서와 겹칠 경우 자동 변경
    if (newWishes.third.deptName !== '없음' && newWishes.third.deptName === currentDeptName) {
      const alt = DEFAULT_DEPARTMENTS.find(d => d.name !== currentDeptName && d.name !== newWishes.first.deptName && d.name !== newWishes.second.deptName)?.name || '산업부';
      newWishes.third = { ...newWishes.third, deptName: alt };
      needsUpdate = true;
    }
    // 기피 부서가 공란이거나 지망과 겹칠 경우 자동 설정
    const chosen = [newWishes.first.deptName, newWishes.second.deptName, newWishes.third.deptName];
    if (!newWishes.avoidDept || chosen.includes(newWishes.avoidDept)) {
      const altAvoid = DEFAULT_DEPARTMENTS.find(d => !chosen.includes(d.name))?.name || '문화부';
      newWishes.avoidDept = altAvoid;
      needsUpdate = true;
    }

    if (needsUpdate) {
      setWishes(newWishes);
    }
  }, [currentDeptName]);

  // 중복 부서 검증 ('없음'은 제외)
  const validDepartments = [wishes.first.deptName, wishes.second.deptName, wishes.third.deptName].filter(
    (name) => name && name !== '없음' && name !== '선택 안 함'
  );
  const hasDuplicateWish = new Set(validDepartments).size !== validDepartments.length;
  const hasAvoidConflict = validDepartments.includes(wishes.avoidDept);
  const hasAvoidEmpty = !wishes.avoidDept || wishes.avoidDept.trim() === '';
  const hasSecondWishCurrentConflict = wishes.second.deptName !== '없음' && wishes.second.deptName === currentDeptName;
  const hasThirdWishCurrentConflict = wishes.third.deptName !== '없음' && wishes.third.deptName === currentDeptName;
  const isFormInvalid = hasDuplicateWish || hasAvoidConflict || hasAvoidEmpty || hasSecondWishCurrentConflict || hasThirdWishCurrentConflict;

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 안내 */}
      <div className="pixel-card p-4 border-amber-500/40 bg-slate-900/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-pixel text-lg text-amber-300 font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>{isEn ? 'STAGE 3. Preference Wishlist & Desk Politics' : 'STAGE 3. 희망 부서 선택 및 부서장 접촉'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEn
              ? 'Select your 1st preference (or stay on current beat), and 2nd/3rd choices (or leave unfilled).'
              : '1지망은 \'현 부서 잔류\' 또는 희망 부서를 선택하며, 2·3지망은 이동 희망 부서 또는 \'없음(미지원)\'을 선택합니다.'}
          </p>
        </div>
      </div>

      {/* 중복 & 오류 경고 알림 */}
      {isFormInvalid && (
        <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-lg text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <div className="space-y-0.5">
            {hasDuplicateWish && (
              <div>• {isEn ? 'Duplicate departments selected across wishes. Please choose distinct desks.' : '희망 지망 부서 간에 중복 선택된 부서가 있습니다. 서로 다른 부서를 선택해 주세요.'}</div>
            )}
            {(hasSecondWishCurrentConflict || hasThirdWishCurrentConflict) && (
              <div>• {isEn ? `2nd and 3rd wishes cannot be your current beat (${currentDeptName}). Retention is only allowed in 1st wish.` : `2지망과 3지망에는 현재 소속 부서(${currentDeptName})를 선택할 수 없습니다. (현재 부서 잔류 희망은 1지망에서만 가능)`}</div>
            )}
            {hasAvoidConflict && (
              <div>• {isEn ? 'Graveyard beat cannot overlap with your 1st, 2nd, or 3rd wishlist choices.' : '기피 부서는 희망 지망 부서(1·2·3지망)와 중복될 수 없습니다.'}</div>
            )}
            {hasAvoidEmpty && (
              <div>• {isEn ? 'Please choose 1 graveyard beat you strictly wish to avoid.' : '기피 부서를 1곳 반드시 선택해 주세요. (절대 가고 싶지 않은 부서)'}</div>
            )}
          </div>
        </div>
      )}

      {/* 1지망 / 2지망 / 3지망 탭 버튼 */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((num) => {
          const cfg = num === 1 ? wishes.first : num === 2 ? wishes.second : wishes.third;
          const isNone = cfg.deptName === '없음' || cfg.deptName === '선택 안 함';
          const isActive = activeTab === num;
          const dDef = getDepartmentByName(cfg.deptName);
          const displayName = isEn ? (dDef ? dDef.nameEn : cfg.deptName) : cfg.deptName;

          return (
            <button
              key={num}
              onClick={() => {
                sound.playClick();
                setActiveTab(num as 1 | 2 | 3);
              }}
              className={`pixel-btn-mc py-3 px-2 rounded text-center transition-all ${
                isActive
                  ? 'border-amber-400 bg-amber-950/50 text-amber-300 font-bold shadow-[2px_2px_0_#000]'
                  : 'text-slate-300'
              }`}
            >
              <div className="font-pixel text-xs text-slate-400">
                {isEn
                  ? `${num === 1 ? '1st' : num === 2 ? '2nd' : '3rd'} Wish ${isNone ? '(None)' : (num === 1 && cfg.deptName === currentDeptName ? '(Stay)' : '')}`
                  : `${num}지망 ${isNone ? '(미지원)' : (num === 1 && cfg.deptName === currentDeptName ? '(현 부서 잔류)' : '희망부서')}`}
              </div>
              <div className={`font-pixel text-sm sm:text-base font-bold mt-0.5 truncate ${isNone ? 'text-slate-400 italic' : ''}`}>
                {isNone ? (isEn ? 'None' : '없음') : (num === 1 && cfg.deptName === currentDeptName ? (isEn ? `Stay (${displayName})` : `잔류 (${cfg.deptName})`) : displayName)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isNone ? (isEn ? 'Excluded (0%)' : '가중치 0% (제외)') : (num === 1 && cfg.deptName === currentDeptName ? (isEn ? 'Retention' : '잔류 지망') : `TO: ${cfg.expectedTO}`)}
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 지망 부서 상세 설정 카드 */}
      <div className="pixel-card p-5 space-y-5 border-blue-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-pixel text-sm font-bold">
              {activeTab}
            </span>
            <span className="font-pixel text-lg text-slate-100 font-bold">
              {isEn ? `${activeTab === 1 ? '1st' : activeTab === 2 ? '2nd' : '3rd'} Wish Configuration ` : `${activeTab}지망 부서 설정 `}
              {isCurrentWishNone ? (
                <span className="text-amber-300 text-sm font-normal">({isEn ? 'Unfilled' : '없음'})</span>
              ) : activeTab === 1 && currentWishConfig.deptName === currentDeptName ? (
                <span className="text-amber-300 text-sm font-normal">({isEn ? 'Stay on Current Beat' : '현 부서 잔류 희망'})</span>
              ) : null}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">{isEn ? 'Change Desk:' : '부서 변경:'}</label>
            <select
              value={currentWishConfig.deptName}
              onChange={(e) => updateCurrentWish({ deptName: e.target.value })}
              className="voxel-input text-xs py-1 font-bold"
            >
              {activeTab === 1 && currentDeptName && (
                <option value={currentDeptName}>
                  📌 현 부서 잔류 ({currentDeptName})
                </option>
              )}
              {activeTab !== 1 && (
                <option value="없음">
                  {activeTab === 2 ? '없음 (1지망 올인 / 미지원)' : '없음 (선택 안 함 / 미지원)'}
                </option>
              )}
              {DEFAULT_DEPARTMENTS.filter(d => activeTab === 1 || d.name !== currentDeptName).map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} {activeTab === 1 && d.name === currentDeptName ? '(현재 소속 부서)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isCurrentWishNone ? (
          /* 지망 없음(미지원) 안내 카드 */
          <div className="p-8 text-center bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="text-4xl">📭</div>
            <div className="font-pixel text-slate-200 text-base font-bold">
              {activeTab}지망을 선택하지 않았습니다 (공란 접수)
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {activeTab === 2
                ? '2지망과 3지망을 모두 비워두고 1지망에 올인합니다. 1지망에 배치되지 않을 경우 현재 부서 잔류 또는 기타 부서 발령을 감수합니다.'
                : '3지망을 비워둡니다. 1지망 및 2지망 내에서 승부를 보며, 3지망으로의 분산 이동을 원하지 않습니다.'}
            </p>
            <div className="inline-block px-3 py-1 bg-blue-950/70 text-blue-300 border border-blue-800 rounded text-[11px] font-pixel">
              * 해당 지망의 발령 확률 및 가중치는 0%로 고정됩니다.
            </div>
          </div>
        ) : (
          <>
            {/* 부서장 NPC 가상 게임 대사 말풍선 */}
            <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/80 p-4 rounded-xl border-2 border-sky-500/40 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-blue-700 to-blue-900 border-2 border-blue-400 flex flex-col items-center justify-center text-xl flex-shrink-0 shadow-lg relative">
                  <span className="text-2xl drop-shadow">👔</span>
                  <span className="absolute -bottom-1.5 px-1 bg-amber-400 text-slate-950 text-[9px] font-pixel font-bold rounded">
                    {isStayWish ? (isEn ? 'Boss' : '현부장') : (isEn ? 'Chief' : '부장')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-pixel text-sky-300 mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">
                      [{isEn ? (getDepartmentByName(currentWishConfig.deptName)?.nameEn || currentWishConfig.deptName) : currentWishConfig.deptName}] {isStayWish ? (isEn ? 'Current Direct Desk Chief NPC' : '현 직속 부서장 NPC') : (isEn ? 'Section Chief NPC' : '부서장 NPC')}
                    </span>
                    <span className="text-[10px] bg-sky-950/80 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800 font-pixel">
                      💬 {isStayWish ? (isEn ? '1-on-1 Memo' : '면담 메모') : (isEn ? 'Virtual Interview' : '가상 인터뷰')}
                    </span>
                    <span className="text-[10px] text-amber-300 ml-auto font-pixel">
                      {isStayWish
                        ? (isEn ? `Current Boss Ties: ${currentWishConfig.bossRelation}` : `현 부서장과의 관계: ${currentWishConfig.bossRelation} (${currentWishConfig.relationTemp})`)
                        : (isEn ? `Chief Ties: ${currentWishConfig.bossRelation}` : `관계: ${currentWishConfig.bossRelation} (${currentWishConfig.relationTemp})`)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-100 text-sm font-medium leading-relaxed italic relative">
                    <span className="text-sky-400 font-pixel text-base mr-1">“</span>
                    {generateBossDialogue(currentWishConfig, isStayWish)}
                    <span className="text-sky-400 font-pixel text-base ml-1">”</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 text-right font-pixel">
                {isEn ? '* Generated by the newsroom AI algorithm based on relations and status.' : '* 실제 인물이 아닌 게임 알고리즘에 의해 자동 생성된 가상 대사입니다.'}
              </div>
            </div>

            {/* 변수 드롭다운 그리드 (현 부서 잔류 선택 시 영입 의사 신호 자동 제외) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {/* ① 예상 TO */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isStayWish 
                    ? (isEn ? '① Current Desk Openings / Retention Climate' : '① 현 부서 정원 및 잔류 여건') 
                    : (isEn ? '① Estimated Headcount (Open Seats)' : '① 이번 인사 예상 TO')}
                </label>
                <select
                  value={currentWishConfig.expectedTO}
                  onChange={(e) => updateCurrentWish({ expectedTO: e.target.value as DeptTO })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="모름">{isEn ? 'Unknown (Reflects uncertainty)' : '모름 (불확실성 반영)'}</option>
                  <option value="0명">{isEn ? '0 Seats (No Vacancy)' : '0명 (확정 결원 없음)'}</option>
                  <option value="1명">{isEn ? '1 Seat (Slight Movement)' : '1명 (소폭 이동)'}</option>
                  <option value="2명">{isEn ? '2 Seats (Standard Scale)' : '2명 (표준 규모)'}</option>
                  <option value="3명">{isEn ? '3 Seats (Major Expansion)' : '3명 (대폭 확대)'}</option>
                  <option value="4명 이상">{isEn ? '4+ Seats (Massive Shakeup)' : '4명 이상 (대규모 개편)'}</option>
                </select>
                {isStayWish && (
                  <div className="text-[10px] text-emerald-400/90 mt-1 font-pixel">
                    {isEn ? '* Retaining desk bypasses external TO limits unless forced transfer occurs.' : '* 잔류 희망 시 외부 이동 TO 제약을 받지 않고 원직 유지가 우선 검토됩니다.'}
                  </div>
                )}
              </div>

              {/* ② 2년 이상 장기근무자 수 */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isStayWish 
                    ? (isEn ? '② Peers with 2+ Years on Current Desk' : '② 부서 내 2년 이상 장기근무 동료 수') 
                    : (isEn ? '② Veterans on Target Desk (2+ Years)' : '② 2년 이상 장기근무자 수')}
                </label>
                <select
                  value={currentWishConfig.longTermWorkers}
                  onChange={(e) => updateCurrentWish({ longTermWorkers: e.target.value as LongTermWorkers })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="모름">{isEn ? 'Unknown' : '모름'}</option>
                  <option value="없음">{isEn ? 'None (Low Rotation)' : '없음 (순환 가능성 낮음)'}</option>
                  <option value="1명">{isEn ? '1 person' : '1명'}</option>
                  <option value="2명">{isEn ? '2 people' : '2명'}</option>
                  <option value="3명 이상">{isEn ? '3+ people (High Turnover)' : '3명 이상 (유동성 높음)'}</option>
                </select>
                <div className="text-[10px] text-slate-500 mt-1">
                  {isEn ? '* More veterans on desk increases rotation and slot availability.' : '* 부서 내 장기근속자가 많을수록 타 부서 순환 압력이 분산됩니다.'}
                </div>
              </div>

              {/* ③ 부서장과의 관계 (현 부서 잔류 시 '현 부서장과의 관계'로 전환) */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isStayWish 
                    ? (isEn ? '③ Relationship with Current Chief' : '③ 현 부서장과의 관계') 
                    : (isEn ? '③ Relationship with Target Chief' : '③ 희망 부서장과의 관계')}
                </label>
                <select
                  value={currentWishConfig.bossRelation}
                  onChange={(e) => updateCurrentWish({ bossRelation: e.target.value as DeptBossRelation })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="과거 직속 부장·데스크">{isEn ? 'Former Direct Desk Chief (+12)' : '과거 직속 부장·데스크 (+12점)'}</option>
                  <option value="과거 같은 부서에서 근무한 동료">{isEn ? 'Former Department Colleague (+8)' : '과거 같은 부서에서 근무한 동료 (+8점)'}</option>
                  <option value="다른 부서에서 업무상 협업">{isEn ? 'Cross-Desk Collaborator (+5)' : '다른 부서에서 업무상 협업 (+5점)'}</option>
                  <option value="대학 선후배">{isEn ? 'Alumni / University Junior/Senior (+4)' : '대학 선후배 (+4점)'}</option>
                  <option value="술자리 친구·사적 친분">{isEn ? 'Drinking Buddy / Close Friend (+4)' : '술자리 친구·사적 친분 (+4점)'}</option>
                  <option value="인사만 하는 사이">{isEn ? 'Casual Acquaintance (+1)' : '인사만 하는 사이 (+1점)'}</option>
                  <option value="얼굴만 아는 사이">{isEn ? 'Know by face only (0)' : '얼굴만 아는 사이 (0점)'}</option>
                  <option value="안면이 전혀 없는 사이">{isEn ? 'Complete Stranger (-4)' : '안면이 전혀 없는 사이 (-4점)'}</option>
                </select>
              </div>

              {/* ④ 부서장과의 친밀도/신뢰도 (현 부서 잔류 시 '현 부서장과의 친밀도'로 전환) */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isStayWish 
                    ? (isEn ? '④ Affinity with Current Chief' : '④ 현 부서장과의 친밀도') 
                    : (isEn ? '④ Chief Affinity / Rapport' : '④ 부서장과의 친밀도 / 온도')}
                </label>
                <select
                  value={currentWishConfig.relationTemp}
                  onChange={(e) => updateCurrentWish({ relationTemp: e.target.value as RelationTemp })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="매우 좋은 관계">{isEn ? 'Excellent (+10)' : '매우 좋은 관계 (+10점)'}</option>
                  <option value="좋은 관계">{isEn ? 'Good (+6)' : '좋은 관계 (+6점)'}</option>
                  <option value="보통">{isEn ? 'Neutral (0)' : '보통 (0점)'}</option>
                  <option value="잘 모름">{isEn ? 'Unknown (0)' : '잘 모름 (0점)'}</option>
                  <option value="다소 껄끄러움">{isEn ? 'Slightly Awkward (-6)' : '다소 껄끄러움 (-6점)'}</option>
                  <option value="좋지 않은 관계">{isEn ? 'Strained (-12)' : '좋지 않은 관계 (-12점)'}</option>
                </select>
              </div>

              {/* ⑤ 부서장의 영입 의사 신호 (현 부서 잔류 시에는 다른 부서로 영입되는 것이 아니므로 숨김 처리) */}
              {!isStayWish && (
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {isEn ? '⑤ Chief Recruiting Intent (Strongest Factor)' : '⑤ 부서장의 영입 의사 신호 (가장 강력)'}
                  </label>
                  <select
                    value={currentWishConfig.recruitIntent}
                    onChange={(e) => updateCurrentWish({ recruitIntent: e.target.value as BossRecruitIntent })}
                    className="voxel-input w-full text-xs"
                  >
                    <option value="전혀 모름">{isEn ? 'No idea (Neutral)' : '전혀 모름 (중립)'}</option>
                    <option value="직접 함께 일하자고 제안">{isEn ? 'Personally Asked to Join (+20)' : '직접 함께 일하자고 제안 (+20점 강력 추천)'}</option>
                    <option value="긍정적 의사 표현">{isEn ? 'Positive Interest (+12)' : '긍정적 의사 표현 (+12점 호의적)'}</option>
                    <option value="관심은 있어 보임">{isEn ? 'Seems Interested (+5)' : '관심은 있어 보임 (+5점)'}</option>
                    <option value="특별한 의사 표현 없음">{isEn ? 'No Particular Opinion (0)' : '특별한 의사 표현 없음 (0점)'}</option>
                    <option value="부정적 반응">{isEn ? 'Negative / Reluctant (-15)' : '부정적 반응 (-15점 사실상 거부)'}</option>
                  </select>
                </div>
              )}

              {/* ⑥ 지원 예상 경쟁자 수 (경쟁률 모델) */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isStayWish 
                    ? (isEn ? '⑤ External Competition for Your Desk' : '⑤ 외부 타 기자들의 부서 진입 경쟁률') 
                    : (isEn ? '⑥ Estimated Competitors Applying' : '⑥ 이번 인사 예상 경쟁 기자 수')}
                </label>
                <select
                  value={currentWishConfig.competitors || '모름'}
                  onChange={(e) => updateCurrentWish({ competitors: e.target.value as CompetitorCount })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="모름">{isEn ? 'Unknown (Standard Estimate)' : '모름 (표준 추정 경쟁률)'}</option>
                  <option value="0명 (단독 지원)">{isEn ? '0 Competitors (Sole Applicant)' : '0명 (단독 지원 - 무혈입성 우대)'}</option>
                  <option value="1~2명 (보통)">{isEn ? '1~2 (Moderate Competition)' : '1~2명 (보통 수준 경쟁)'}</option>
                  <option value="3~4명 (경쟁 치열)">{isEn ? '3~4 (Fierce Battlefield)' : '3~4명 (경쟁 치열 - 격전지)'}</option>
                  <option value="5명 이상 (바늘구멍)">{isEn ? '5+ (Eye of a Needle)' : '5명 이상 (바늘구멍 - 극심한 경쟁)'}</option>
                </select>
                <div className="text-[10px] text-slate-500 mt-1">
                  {isStayWish
                    ? (isEn ? '* More external contenders applying puts pressure on the desk to rotate you.' : '* 외부 지원 경쟁자가 많을수록 인사위원회에서 자리를 비워주어야 할 압박이 발생할 수 있습니다.')
                    : (isEn ? '* More contenders reduces placement odds directly against openings.' : '* TO 대비 지원 경쟁자 수에 따라 실질적인 발령 확률이 직접 변동합니다.')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ⑦ 현재 부서장 이동 의사 & ⑧ 기피 부서 설정 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ⑦ 현재 부서장의 이동 의사 */}
        <div className="pixel-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <h3 className="font-pixel text-sm text-slate-100 font-bold">
              {isStayWish
                ? (isEn ? `⑦ Current Chief (${currentDeptName}) Retention Support` : `⑦ 현재 부서장(${currentDeptName})의 방출 / 잔류 지지 의향`)
                : (isEn ? `⑦ Current Chief (${currentDeptName}) Release Willingness` : `⑦ 현재 부서장(${currentDeptName})의 방출 의사`)}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            {isStayWish
              ? (isEn ? 'Whether your current boss backs your stay or pushes for staff circulation.' : '본인의 잔류 희망에 대해 현재 부서장이 지켜줄지(남기려 함), 인력 순환을 위해 내보내려 할지(방출)를 설정합니다.')
              : (isEn ? 'Whether your current chief willingly lets you go or blocks your transfer.' : '현재 부서에서 순순히 놓아줄지 여부가 인사이동 성사율에 영향을 줍니다.')}
          </p>
          <select
            value={wishes.currentBossIntent}
            onChange={(e) => {
              sound.playBlip();
              setWishes({ ...wishes, currentBossIntent: e.target.value as CurrentBossIntent });
            }}
            className="voxel-input w-full text-xs"
          >
            <option value="적극적으로 보내주려 한다">{isEn ? 'Eagerly Supports Transfer / Release' : '적극적으로 보내주려 한다 (길 터주기 / 방출 의향)'}</option>
            <option value="이동을 허용할 가능성이 높다">{isEn ? 'Likely to Allow Move' : '이동을 허용할 가능성이 높다'}</option>
            <option value="잘 모르겠다">{isEn ? 'Unclear / Neutral' : '잘 모르겠다'}</option>
            <option value="잔류를 원하는 분위기다">{isEn ? 'Wants You to Stay (Short-staffed)' : '잔류를 원하는 분위기다 (인력 부족 등 잔류 지지)'}</option>
            <option value="반드시 남기려고 한다">{isEn ? 'Adamantly Defends Retention' : '반드시 남기려고 한다 (철통 방어 / 잔류 절대 지지)'}</option>
          </select>
        </div>

        {/* ⑧ 기피 부서 (1곳) */}
        <div className="pixel-card p-4 border-rose-500/40 bg-slate-900/90">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="font-pixel text-sm text-amber-300 font-bold">
              {isEn ? '⑧ Blacklisted Department (Avoid at all costs)' : '⑧ 절대 가고 싶지 않은 기피 부서 (1곳)'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            {isEn ? 'Calculates risk odds of being exiled here if all wishes fail.' : '희망 부서 탈락 시 밀려날 수 있는 기피 부서 확률을 별도로 계산합니다.'}
          </p>
          <select
            value={wishes.avoidDept}
            onChange={(e) => {
              sound.playBlip();
              setWishes({ ...wishes, avoidDept: e.target.value });
            }}
            className="voxel-input w-full text-xs font-bold text-rose-300"
          >
            {DEFAULT_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.name}>
                {isEn ? (d.nameEn || d.name) : d.name} {validDepartments.includes(d.name) ? (isEn ? '(Cannot match wish)' : '(희망 부서와 중복 불가)') : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 하단 이동 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            sound.playBlip();
            onPrev();
          }}
          className="pixel-btn-mc text-slate-300 py-3 px-5 rounded-lg text-sm font-pixel flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEn ? 'Back' : '이전'}</span>
        </button>

        <button
          disabled={isFormInvalid}
          onClick={() => {
            sound.playClick();
            onNext();
          }}
          className={`pixel-btn-mc flex-1 py-3 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-500 ${
            isFormInvalid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span>{isEn ? 'Start Post-Chuseok Beat Politicking (STAGE 3.5)' : '추석 이후 인사 농사 시작하기 (STAGE 3.5)'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
