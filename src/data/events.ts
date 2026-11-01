import { SuddenEvent } from '../types/game';

export const SUDDEN_EVENTS: SuddenEvent[] = [
  {
    id: 'event_none',
    title: '평온한 편집국',
    type: 'flavor',
    description: '특이 사항 없이 정기 인사위원회가 원안대로 소집되었습니다.',
    effectDescription: '확률 변동 없음 (표준 시뮬레이션 적용)'
  },
  {
    id: 'event_opening_1st',
    title: '1지망 부서 긴급 결원 발생!',
    type: 'scenario',
    description: '1지망 부서의 핵심 선배가 해외 특파원 또는 기업 홍보실로 급작스레 이직했습니다!',
    effectDescription: '1지망 부서의 TO 계산 가중치 +25% 증가!',
    affectedWish: 1,
    toBonus: 25,
    intentBonus: 10
  },
  {
    id: 'event_reorg',
    title: '편집국 전격 조직개편 단행',
    type: 'scenario',
    description: '디지털 및 심층 취재 역량 강화를 위해 대규모 순환 보직 원칙이 발표되었습니다.',
    effectDescription: '현 부서 잔류 확률이 대폭 감소하고 이동 가능성이 상승합니다.',
    toBonus: 0,
    intentBonus: 15
  },
  {
    id: 'event_downsize',
    title: '인사 규모 최소화 지침',
    type: 'scenario',
    description: '불안한 대내외 여건으로 인해 "이번 인사는 꼭 필요한 소폭 교체만 진행한다"는 데스크 메모가 전달되었습니다.',
    effectDescription: '모든 희망 부서 이동 경쟁률 상승, 현 부서 잔류 확률 증가.',
    toBonus: -15,
    intentBonus: -10
  },
  {
    id: 'event_boss_change',
    title: '2지망 부서장 긴급 교체설',
    type: 'scenario',
    description: '2지망 부서장이 국장단 회의 후 교체 대상에 올랐다는 소문이 복도에 파다합니다.',
    effectDescription: '2지망 부서장의 기존 영입 의사 변수의 영향력이 중립화됩니다.',
    affectedWish: 2,
    toBonus: 0,
    intentBonus: -15
  },
  {
    id: 'event_senior_move',
    title: '선배 기자의 대거 복귀',
    type: 'flavor',
    description: '연수 및 해외 파견을 마치고 돌아온 고연차 선배들이 데스크 라인에 합류합니다.',
    effectDescription: '편집국 내 자리 쟁탈전이 더욱 치열해집니다.'
  }
];
