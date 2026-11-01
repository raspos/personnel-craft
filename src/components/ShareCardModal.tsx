import React, { useRef, useState } from 'react';
import { CharacterProfile, FinalAppointmentResult, CareerRecord, WishSelection } from '../types/game';
import { analyzeCareer } from '../utils/careerAnalysis';
import { toPng } from 'html-to-image';
import { X, Download, Share2, Check, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: FinalAppointmentResult;
  profile: CharacterProfile;
  careers: CareerRecord[];
  wishes: WishSelection;
}

export const ShareCardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  result,
  profile,
  careers,
  wishes
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const analysis = analyzeCareer(careers);
  const topField = analysis.topFields[0]?.field || '현장 취재';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      sound.playClick();
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `인사크래프트_인사발령_${profile.nickname}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export image', err);
      alert('이미지 생성 중 문제가 발생했습니다. 화면 캡처 기능을 이용해 주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="voxel-card bg-slate-900 border-blue-500/60 max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-400" />
            <span className="font-pixel text-sm text-slate-100 font-bold">인사발령 결과 카드 공유</span>
          </div>
          <button
            onClick={() => {
              sound.playBlip();
              onClose();
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 캡처 대상 카드 (고해상도 복셀 스타일 카드) */}
        <div
          ref={cardRef}
          className="bg-slate-950 p-6 rounded-2xl border-2 border-blue-400/80 shadow-2xl relative overflow-hidden text-slate-100"
          style={{ fontFamily: 'Pretendard, sans-serif' }}
        >
          {/* 장식용 레트로 그리드 & 헤더 */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📰</span>
              <div>
                <div className="font-pixel text-xs text-blue-400 font-bold tracking-wider">PERSONNEL CRAFT</div>
                <div className="text-[11px] text-slate-400 font-medium">인사 크래프트 — 편집국 생존기</div>
              </div>
            </div>
            <div className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-pixel">
              정기인사 리포트
            </div>
          </div>

          {/* 기자 캐릭터 & 유형 */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600/30 border border-blue-400 flex items-center justify-center text-2xl shadow-inner">
              🧑‍💼
            </div>
            <div>
              <div className="text-xs text-slate-400">나의 기자 유형</div>
              <div className="font-pixel text-amber-300 font-bold text-sm">
                {analysis.reporterType}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                총 경력 {analysis.totalYearsText} · 주력 분야 [{topField}]
              </div>
              {analysis.careerSynergy && (
                <div className="text-[10px] text-cyan-300 font-pixel mt-1 flex items-center gap-1">
                  <span>⚡</span>
                  <span className="font-bold">{analysis.careerSynergy.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* 희망 부서 3곳 vs 최종 발령 */}
          <div className="space-y-2 mb-4 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center">
              <span className="text-slate-400">희망 지망 부서:</span>
              <span className="font-pixel text-slate-200">
                1지망 {wishes.first.deptName} · 2지망 {wishes.second.deptName} · 3지망 {wishes.third.deptName}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center">
              <span className="text-slate-400">희망 부서 합산 확률:</span>
              <span className="font-pixel text-blue-400 font-bold">{result.probabilities.totalWish}%</span>
            </div>

            {/* 최종 발령 결과 하이라이트 */}
            <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-4 rounded-xl border border-blue-400/60 text-center my-2">
              <div className="text-[11px] text-blue-300 font-pixel">최종 인사발령 결과</div>
              <div className="font-pixel text-2xl text-amber-300 font-black my-1">
                [ {result.assignedDept} ]
              </div>
              <div className="text-xs text-slate-200 font-medium">
                {result.messageSubtitle}
              </div>
            </div>
          </div>

          {/* 풍자 명언 */}
          <div className="text-center font-pixel text-xs text-slate-400 italic pt-1 border-t border-slate-800/80">
            "{result.flavorQuote}"
          </div>
          <div className="text-right text-[9px] text-slate-600 mt-2 font-pixel">
            * PERSONNEL CRAFT — 한국 언론사 가상 인사 시뮬레이터
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="voxel-btn voxel-btn-primary flex-1 py-2.5 rounded-lg text-xs font-pixel flex items-center justify-center gap-1.5"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>저장 완료!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? '이미지 생성 중...' : 'PNG 이미지 다운로드'}</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              sound.playBlip();
              onClose();
            }}
            className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2.5 px-4 rounded-lg text-xs font-pixel"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
