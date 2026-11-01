import React, { useState } from 'react';
import {
  WishSelection,
  WishDeptConfig,
  DeptTO,
  LongTermWorkers,
  DeptBossRelation,
  RelationTemp,
  BossRecruitIntent,
  CurrentBossIntent
} from '../../types/game';
import { DEFAULT_DEPARTMENTS, getDepartmentByName } from '../../data/departments';
import { ArrowRight, ArrowLeft, MessageSquare, AlertTriangle, Building2, UserCheck, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/sound';

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

  // 부서장 NPC 가상 게임 대사 생성기
  const generateBossDialogue = (cfg: WishDeptConfig): string => {
    if (cfg.expectedTO === '0명') {
      return '“자네 실력이야 잘 알지만… 이번에 우리 부서 확정 TO가 0명이야. 마음은 굴뚝같은데 자리가 없어.”';
    }
    if (cfg.recruitIntent === '직접 함께 일하자고 제안') {
      return '“자네가 온다면 내가 국장한테 직접 말해볼게. 이번에 자리 생기면 꼭 같이 일해보자!”';
    }
    if (cfg.recruitIntent === '부정적 반응') {
      return '“글쎄… 이번엔 우리 쪽에 다른 전문성을 가진 인력이 필요해서 말이지.”';
    }
    if (cfg.bossRelation === '술자리 친구·사적 친분') {
      return '“하하, 우리 다음에 소주 한잔해야지! 근데… 인사는 또 완전히 다른 문제인 거 알지?”';
    }
    if (cfg.bossRelation === '대학 선후배') {
      return '“오, 오랜만이네! 선배로서 힘써주고 싶지만 편집국 분위기가 워낙 빡빡해서 장담은 못 해.”';
    }
    if (cfg.bossRelation === '과거 직속 부장·데스크') {
      return '“예전에 자네랑 마감 칠 때 호흡이 참 좋았지. 이번에도 기회가 닿으면 좋겠는데.”';
    }
    if (cfg.bossRelation === '안면이 전혀 없는 사이' || cfg.bossRelation === '얼굴만 아는 사이') {
      return '“어디 보자… 이번에 우리 부서 지원하셨다고요? 어떤 기사를 주로 쓰셨는지 좀 볼까요?”';
    }
    if (cfg.relationTemp === '다소 껄끄러움' || cfg.relationTemp === '좋지 않은 관계') {
      return '“…서로 업무 스타일이 좀 다른 면이 있었죠. 이번 인사 결과는 뚜껑을 열어봐야 알겠네요.”';
    }
    return '“원하는 부서에 꼭 배치되길 바라네. 인사위원회 결과를 지켜보자고.”';
  };

  const currentWishConfig = activeTab === 1 ? wishes.first : activeTab === 2 ? wishes.second : wishes.third;
  const isCurrentWishNone = currentWishConfig.deptName === '없음' || currentWishConfig.deptName === '선택 안 함';

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

  // 중복 부서 검증 ('없음'은 제외)
  const validDepartments = [wishes.first.deptName, wishes.second.deptName, wishes.third.deptName].filter(
    (name) => name && name !== '없음' && name !== '선택 안 함'
  );
  const hasDuplicateWish = new Set(validDepartments).size !== validDepartments.length;
  const hasAvoidConflict = validDepartments.includes(wishes.avoidDept);

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 안내 */}
      <div className="voxel-card p-4 border-blue-500/40 bg-slate-900/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-pixel text-lg text-blue-300 font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>STAGE 3. 희망 부서 선택 및 부서장 접촉</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            1지망은 필수이며, 2지망과 3지망은 '없음(1지망 올인 / 미지원)'을 선택할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 중복 경고 알림 */}
      {(hasDuplicateWish || hasAvoidConflict) && (
        <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-lg text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>
            {hasDuplicateWish && '희망 부서에 중복 선택된 부서가 있습니다. 서로 다른 부서를 선택해 주세요. '}
            {hasAvoidConflict && '기피 부서는 희망 부서(1·2·3지망)와 중복될 수 없습니다.'}
          </span>
        </div>
      )}

      {/* 1지망 / 2지망 / 3지망 탭 버튼 */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((num) => {
          const cfg = num === 1 ? wishes.first : num === 2 ? wishes.second : wishes.third;
          const isNone = cfg.deptName === '없음' || cfg.deptName === '선택 안 함';
          const isActive = activeTab === num;
          return (
            <button
              key={num}
              onClick={() => {
                sound.playClick();
                setActiveTab(num as 1 | 2 | 3);
              }}
              className={`voxel-btn py-3 px-2 rounded-lg text-center transition-all ${
                isActive
                  ? 'bg-blue-600 border-2 border-blue-300 text-white font-bold shadow-lg'
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <div className="font-pixel text-xs text-blue-200">
                {num}지망 {isNone ? '(미지원)' : '희망부서'}
              </div>
              <div className={`font-pixel text-sm sm:text-base font-bold mt-0.5 truncate ${isNone ? 'text-slate-400 italic' : ''}`}>
                {isNone ? '없음' : cfg.deptName}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {isNone ? '가중치 0% (제외)' : `TO: ${cfg.expectedTO}`}
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 지망 부서 상세 설정 카드 */}
      <div className="voxel-card p-5 space-y-5 border-blue-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-pixel text-sm font-bold">
              {activeTab}
            </span>
            <span className="font-pixel text-lg text-slate-100 font-bold">
              {activeTab}지망 부서 설정 {isCurrentWishNone && <span className="text-amber-300 text-sm font-normal">(없음)</span>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">부서 변경:</label>
            <select
              value={currentWishConfig.deptName}
              onChange={(e) => updateCurrentWish({ deptName: e.target.value })}
              className="voxel-input text-xs py-1 font-bold"
            >
              {activeTab !== 1 && (
                <option value="없음">
                  {activeTab === 2 ? '없음 (1지망 올인 / 미지원)' : '없음 (선택 안 함 / 미지원)'}
                </option>
              )}
              {DEFAULT_DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
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
                  <span className="absolute -bottom-1.5 px-1 bg-amber-400 text-slate-950 text-[9px] font-pixel font-bold rounded">부장</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-pixel text-sky-300 mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">[{currentWishConfig.deptName}] 부서장 NPC</span>
                    <span className="text-[10px] bg-sky-950/80 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800 font-pixel">
                      💬 가상 인터뷰
                    </span>
                    <span className="text-[10px] text-amber-300 ml-auto font-pixel">
                      관계: {currentWishConfig.bossRelation} ({currentWishConfig.relationTemp})
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-100 text-sm font-medium leading-relaxed italic relative">
                    <span className="text-sky-400 font-pixel text-base mr-1">“</span>
                    {generateBossDialogue(currentWishConfig)}
                    <span className="text-sky-400 font-pixel text-base ml-1">”</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 text-right font-pixel">
                * 실제 인물이 아닌 게임 알고리즘에 의해 자동 생성된 가상 대사입니다.
              </div>
            </div>

            {/* 5가지 변수 드롭다운 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {/* ① 예상 TO */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ① 이번 인사 예상 TO
                </label>
                <select
                  value={currentWishConfig.expectedTO}
                  onChange={(e) => updateCurrentWish({ expectedTO: e.target.value as DeptTO })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="모름">모름 (불확실성 반영)</option>
                  <option value="0명">0명 (확정 결원 없음 - 확률 0%)</option>
                  <option value="1명">1명 (소폭 이동)</option>
                  <option value="2명">2명 (표준 규모)</option>
                  <option value="3명">3명 (대폭 확대)</option>
                  <option value="4명 이상">4명 이상 (대규모 개편)</option>
                </select>
              </div>

              {/* ② 2년 이상 장기근무자 수 */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ② 2년 이상 장기근무자 수
                </label>
                <select
                  value={currentWishConfig.longTermWorkers}
                  onChange={(e) => updateCurrentWish({ longTermWorkers: e.target.value as LongTermWorkers })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="모름">모름</option>
                  <option value="없음">없음 (순환 가능성 낮음)</option>
                  <option value="1명">1명</option>
                  <option value="2명">2명</option>
                  <option value="3명 이상">3명 이상 (유동성 높음)</option>
                </select>
                <div className="text-[10px] text-slate-500 mt-1">
                  * 확정 TO가 0명일 때는 장기근무자가 있어도 이동 확률이 0%로 고정됩니다.
                </div>
              </div>

              {/* ③ 희망 부서장과의 관계 */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ③ 희망 부서장과의 관계
                </label>
                <select
                  value={currentWishConfig.bossRelation}
                  onChange={(e) => updateCurrentWish({ bossRelation: e.target.value as DeptBossRelation })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="과거 직속 부장·데스크">과거 직속 부장·데스크 (+12점)</option>
                  <option value="과거 같은 부서에서 근무한 동료">과거 같은 부서에서 근무한 동료 (+8점)</option>
                  <option value="다른 부서에서 업무상 협업">다른 부서에서 업무상 협업 (+5점)</option>
                  <option value="대학 선후배">대학 선후배 (+4점)</option>
                  <option value="술자리 친구·사적 친분">술자리 친구·사적 친분 (+4점)</option>
                  <option value="인사만 하는 사이">인사만 하는 사이 (+1점)</option>
                  <option value="얼굴만 아는 사이">얼굴만 아는 사이 (0점)</option>
                  <option value="안면이 전혀 없는 사이">안면이 전혀 없는 사이 (-4점)</option>
                </select>
              </div>

              {/* ④ 부서장과의 친밀도/온도 */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ④ 부서장과의 친밀도 / 온도
                </label>
                <select
                  value={currentWishConfig.relationTemp}
                  onChange={(e) => updateCurrentWish({ relationTemp: e.target.value as RelationTemp })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="매우 좋은 관계">매우 좋은 관계 (+10점)</option>
                  <option value="좋은 관계">좋은 관계 (+6점)</option>
                  <option value="보통">보통 (0점)</option>
                  <option value="잘 모름">잘 모름 (0점)</option>
                  <option value="다소 껄끄러움">다소 껄끄러움 (-6점)</option>
                  <option value="좋지 않은 관계">좋지 않은 관계 (-12점)</option>
                </select>
              </div>

              {/* ⑤ 부서장의 영입 의사 신호 */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ⑤ 부서장의 영입 의사 신호 (가장 강력)
                </label>
                <select
                  value={currentWishConfig.recruitIntent}
                  onChange={(e) => updateCurrentWish({ recruitIntent: e.target.value as BossRecruitIntent })}
                  className="voxel-input w-full text-xs"
                >
                  <option value="전혀 모름">전혀 모름 (중립)</option>
                  <option value="직접 함께 일하자고 제안">직접 함께 일하자고 제안 (+20점 강력 추천)</option>
                  <option value="긍정적 의사 표현">긍정적 의사 표현 (+12점 호의적)</option>
                  <option value="관심은 있어 보임">관심은 있어 보임 (+5점)</option>
                  <option value="특별한 의사 표현 없음">특별한 의사 표현 없음 (0점)</option>
                  <option value="부정적 반응">부정적 반응 (-15점 사실상 거부)</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ⑥ 현재 부서장 이동 의사 & ⑦ 기피 부서 설정 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ⑥ 현재 부서장의 이동 의사 */}
        <div className="voxel-card p-4 border-amber-500/40 bg-slate-900/90">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <h3 className="font-pixel text-sm text-slate-100 font-bold">
              ⑥ 현재 부서장({currentDeptName})의 방출 의사
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            현재 부서에서 순순히 놓아줄지 여부가 인사이동 성사율에 영향을 줍니다.
          </p>
          <select
            value={wishes.currentBossIntent}
            onChange={(e) => {
              sound.playBlip();
              setWishes({ ...wishes, currentBossIntent: e.target.value as CurrentBossIntent });
            }}
            className="voxel-input w-full text-xs"
          >
            <option value="적극적으로 보내주려 한다">적극적으로 보내주려 한다 (길 터주기)</option>
            <option value="이동을 허용할 가능성이 높다">이동을 허용할 가능성이 높다</option>
            <option value="잘 모르겠다">잘 모르겠다</option>
            <option value="잔류를 원하는 분위기다">잔류를 원하는 분위기다 (인력 부족 등)</option>
            <option value="반드시 남기려고 한다">반드시 남기려고 한다 (철통 방어)</option>
          </select>
        </div>

        {/* ⑦ 기피 부서 (1곳) */}
        <div className="voxel-card p-4 border-rose-500/40 bg-slate-900/90">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="font-pixel text-sm text-slate-100 font-bold">
              ⑦ 절대 가고 싶지 않은 기피 부서 (1곳)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            희망 부서 탈락 시 밀려날 수 있는 기피 부서 확률을 별도로 계산합니다.
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
                {d.name} {validDepartments.includes(d.name) ? '(희망 부서와 중복 불가)' : ''}
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
          className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 px-5 rounded-lg text-sm font-pixel flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전</span>
        </button>

        <button
          disabled={hasDuplicateWish || hasAvoidConflict}
          onClick={() => {
            sound.playClick();
            onNext();
          }}
          className={`voxel-btn voxel-btn-primary flex-1 py-3 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2 ${
            hasDuplicateWish || hasAvoidConflict ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span>추석 이후 인사 농사 시작하기 (STAGE 3.5)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
