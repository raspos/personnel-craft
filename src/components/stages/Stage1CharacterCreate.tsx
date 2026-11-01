import React from 'react';
import { CharacterProfile, CharacterAppearance, CareerRecord } from '../../types/game';
import { Sparkles, User, Calendar, Glasses, Award, ArrowRight, Building2 } from 'lucide-react';
import { DEFAULT_DEPARTMENTS, getDepartmentByName } from '../../data/departments';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n/LanguageContext';

interface Stage1Props {
  profile: CharacterProfile;
  setProfile: (p: CharacterProfile) => void;
  careers: CareerRecord[];
  setCareers: (c: CareerRecord[]) => void;
  onNext: () => void;
}

export const Stage1CharacterCreate: React.FC<Stage1Props> = ({
  profile,
  setProfile,
  careers,
  setCareers,
  onNext
}) => {
  const currentYear = new Date().getFullYear();
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  // 다음 단계 이동 시 유효성 검사 (커리어 블록에 강제 삽입하지 않고 독립성 유지)
  const handleProceed = () => {
    if (!profile.nickname.trim()) {
      alert(isEn ? 'Please enter a byline / journalist nickname.' : '기자 닉네임(성함)을 입력해 주세요.');
      return;
    }
    if (!profile.currentDept) {
      alert(isEn ? 'Please select your current beat / department.' : '현재 소속 부서를 선택해 주세요.');
      return;
    }

    sound.playClick();
    onNext();
  };

  // 현재 부서 드롭다운 변경 (프로필 정보만 갱신)
  const handleDeptChange = (newDept: string) => {
    sound.playBlip();
    setProfile({ ...profile, currentDept: newDept });
  };

  // 프리셋 3종
  const applyPreset = (presetName: string) => {
    sound.playBlip();
    let newApp: CharacterAppearance = { ...profile.appearance };

    if (presetName === 'rookie') {
      // 열정 신입형
      newApp = {
        hairStyle: 'neat',
        hairColor: '#0f172a',
        skinTone: '#fed7aa',
        shirtColor: '#2563eb', // 파란 셔츠
        pantsColor: '#1e293b',
        glasses: false,
        pressCardColor: '#3b82f6',
        expression: 'happy'
      };
      setProfile({
        ...profile,
        nickname: profile.nickname || '한열정',
        hireYear: currentYear - 1,
        appearance: newApp
      });
    } else if (presetName === 'veteran') {
      // 야근 베테랑형
      newApp = {
        hairStyle: 'messy',
        hairColor: '#475569', // 살짝 희끗희끗한 애쉬
        skinTone: '#fde047',
        shirtColor: '#475569',
        pantsColor: '#0f172a',
        glasses: true,
        pressCardColor: '#ef4444',
        expression: 'exhausted'
      };
      setProfile({
        ...profile,
        nickname: profile.nickname || '최마감',
        hireYear: currentYear - 8,
        appearance: newApp
      });
    } else {
      // 특종 탐사형
      newApp = {
        hairStyle: 'parted',
        hairColor: '#1e293b',
        skinTone: '#fed7aa',
        shirtColor: '#059669', // 짙은 녹색 점퍼 느낌
        pantsColor: '#334155',
        glasses: true,
        pressCardColor: '#f59e0b',
        expression: 'normal'
      };
      setProfile({
        ...profile,
        nickname: profile.nickname || '박특종',
        hireYear: currentYear - 4,
        appearance: newApp
      });
    }
  };

  const updateApp = (patch: Partial<CharacterAppearance>) => {
    sound.playBlip();
    setProfile({
      ...profile,
      appearance: {
        ...profile.appearance,
        ...patch
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 인트로 스토리 배너 */}
      <div className="pixel-card p-5 border-blue-500/50 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950">
        <h2 className="font-pixel text-xl sm:text-2xl text-blue-400 font-bold mb-2 flex items-center gap-2">
          <span>📰</span> {isEn ? '"Welcome to the Newsroom Battlefield."' : '"편집국에 오신 것을 환영합니다."'}
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          {isEn ? (
            <>
              You are an investigative journalist surviving relentless newsroom politics.<br />
              Past midnight deadlines and screaming section editors, can you escape your current beat this reshuffle?
            </>
          ) : (
            <>
              당신은 수많은 인사발령을 견뎌온 대한민국 기자입니다.<br />
              출입처의 밤샘 마감과 데스크의 불호령을 넘어, 이번 정기인사에서는 과연 원하던 부서로 갈 수 있을까요?
            </>
          )}
        </p>
      </div>

      {/* 프리셋 버튼 */}
      <div className="pixel-card p-4">
        <div className="text-xs font-pixel text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{isEn ? 'Quick Persona Presets' : '캐릭터 프리셋 선택 (원클릭)'}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => applyPreset('rookie')}
            className="pixel-btn-mc py-2 px-3 rounded text-xs text-center text-blue-300 font-pixel"
          >
            {isEn ? '🔥 Eager Rookie' : '🔥 열정 신입형'}
          </button>
          <button
            onClick={() => applyPreset('veteran')}
            className="pixel-btn-mc py-2 px-3 rounded text-xs text-center text-slate-300 font-pixel"
          >
            {isEn ? '☕ Burnt-out Veteran' : '☕ 야근 베테랑형'}
          </button>
          <button
            onClick={() => applyPreset('investigative')}
            className="pixel-btn-mc py-2 px-3 rounded text-xs text-center text-emerald-300 font-pixel"
          >
            {isEn ? '🕵️ Scoop Hunter' : '🕵️ 특종 탐사형'}
          </button>
        </div>
      </div>

      {/* 기본 정보 입력 */}
      <div className="pixel-card p-5 space-y-4">
        <h3 className="font-pixel text-base text-amber-300 border-b-2 border-slate-950 pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <span>{isEn ? 'Journalist Profile & Beat' : '기자 신상 정보'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-pixel">
              {isEn ? 'Byline / Nickname' : '기자 닉네임'}
            </label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              placeholder={isEn ? 'e.g. Reporter Kim' : '예: 김기자'}
              className="voxel-input w-full text-sm font-medium"
              maxLength={16}
            />
          </div>

          {/* 현재 소속 부서 선택 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1 font-pixel">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{isEn ? 'Current Beat / Desk' : '현재 소속 부서'}</span>
            </label>
            <select
              value={profile.currentDept || ''}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="voxel-input w-full text-sm font-bold text-amber-300"
            >
              <option value="">{isEn ? '-- Select Beat --' : '-- 소속 부서 선택 --'}</option>
              {DEFAULT_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.name}>
                  {isEn ? `${d.nameEn} (${d.name})` : d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1 font-pixel">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isEn ? 'Hiring Year (Class)' : '입사 연도'}</span>
            </label>
            <select
              value={profile.hireYear}
              onChange={(e) => setProfile({ ...profile, hireYear: Number(e.target.value) })}
              className="voxel-input w-full text-sm"
            >
              {Array.from({ length: 25 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>
                  {isEn ? `Class of ${y} (${currentYear - y} yr tenure)` : `${y}년 입사 (${currentYear - y}년차)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-pixel">
              {isEn ? 'Reshuffle Season' : '이번 인사 시점'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['상반기', '하반기'] as const).map((half) => (
                <button
                  key={half}
                  type="button"
                  onClick={() => {
                    sound.playBlip();
                    setProfile({ ...profile, currentHalf: half });
                  }}
                  className={`py-2 text-xs rounded font-pixel transition-all border ${
                    profile.currentHalf === half
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-[1px_1px_0_#000]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {half === '상반기' ? (isEn ? 'Spring' : '상반기') : (isEn ? 'Autumn' : '하반기')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 외형 커스터마이징 */}
      <div className="pixel-card p-5 space-y-4">
        <h3 className="font-pixel text-base text-amber-300 border-b-2 border-slate-950 pb-2 flex items-center gap-2">
          <span>🎨</span>
          <span>{isEn ? '3D Voxel Appearance Customization' : '3D 블록 외형 커스터마이징'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 머리 스타일 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-pixel">{isEn ? 'Hair Style' : '머리 모양'}</label>
            <select
              value={profile.appearance.hairStyle}
              onChange={(e) => updateApp({ hairStyle: e.target.value as any })}
              className="voxel-input w-full text-xs"
            >
              <option value="neat">{isEn ? 'Neat / Tidy' : '단정한 스타일'}</option>
              <option value="short">{isEn ? 'Short Cut' : '숏컷 / 깔끔형'}</option>
              <option value="parted">{isEn ? 'Side Parted' : '가르마 스타일'}</option>
              <option value="messy">{isEn ? 'All-nighter Messy' : '마감 철야 헝클어짐'}</option>
            </select>
          </div>

          {/* 머리 색상 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-pixel">{isEn ? 'Hair Color' : '머리 색상'}</label>
            <div className="flex gap-2 items-center">
              {['#0f172a', '#451a03', '#475569', '#b45309'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateApp({ hairColor: c })}
                  className={`w-7 h-7 rounded border-2 transition-transform ${
                    profile.appearance.hairColor === c ? 'border-amber-400 scale-110 shadow' : 'border-slate-800'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 상의 색상 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-pixel">{isEn ? 'Shirt Color' : '옷(셔츠) 색상'}</label>
            <div className="flex gap-2 items-center">
              {['#2563eb', '#dc2626', '#16a34a', '#475569', '#0f172a'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateApp({ shirtColor: c })}
                  className={`w-7 h-7 rounded border-2 transition-transform ${
                    profile.appearance.shirtColor === c ? 'border-amber-400 scale-110 shadow' : 'border-slate-800'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 기자증 줄 색상 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1 font-pixel">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>{isEn ? 'Press Pass Lanyard' : '기자증 색상'}</span>
            </label>
            <div className="flex gap-2 items-center">
              {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateApp({ pressCardColor: c })}
                  className={`w-7 h-7 rounded border-2 transition-transform ${
                    profile.appearance.pressCardColor === c ? 'border-amber-400 scale-110 shadow' : 'border-slate-800'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 안경 착용 토글 */}
        <div className="flex items-center gap-3 pt-2">
          <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer font-pixel">
            <input
              type="checkbox"
              checked={profile.appearance.glasses}
              onChange={(e) => updateApp({ glasses: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 w-4 h-4"
            />
            <Glasses className="w-4 h-4 text-slate-400" />
            <span>{isEn ? 'Wear Eyeglasses (Intellect +2)' : '기자 안경 착용'}</span>
          </label>
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      <button
        onClick={handleProceed}
        className="pixel-btn-mc w-full py-3.5 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2 mt-2 text-white bg-blue-600 hover:bg-blue-500"
      >
        <span>{isEn ? 'Enter Newsroom (Stack Career Blocks)' : '편집국 입장 (나의 커리어 구성)'}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
