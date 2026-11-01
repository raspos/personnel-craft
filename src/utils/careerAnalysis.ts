import { CareerRecord, CareerAnalysisResult, CareerPathRecommendation } from '../types/game';

interface ReporterProfileTemplate {
  reporterType: string;
  detailedSpecialty: string;
  description: string;
}

// 현업 언론사 100% 현실 고증 기자 유형 카탈로그
const REPORTER_PROFILE_CATALOG: Record<string, ReporterProfileTemplate> = {
  '사건캡 출신 야전사령관': {
    reporterType: '사건캡 출신 야전사령관',
    detailedSpecialty: '경찰서 마와리부터 다져진 동물적 취재 감각과 돌파력',
    description: '수습 시절 팩스방과 당직실을 전전하며 경찰서 라인을 뚫었던 야전형 기자입니다. 사건 냄새를 맡으면 물불 안 가리고 현장으로 뛰어가며, 취재원의 굳게 닫힌 입도 소주 한잔과 끈질긴 설득으로 열어젖히는 편집국의 든든한 돌격대장입니다.'
  },
  '서초동 법조 라인 단독 제조기': {
    reporterType: '서초동 법조 라인 단독 제조기',
    detailedSpecialty: '영장실질심사와 공소장 행간을 털어내는 법조통',
    description: '서울중앙지검과 대법원 기자실을 주 무대로 활약하는 엘리트 법조 기자입니다. 판·검사, 대형 로펌 변호사들과의 깊은 네트워크를 바탕으로 복잡한 법리 싸움 이면에 숨은 권력의 암투와 비리를 칼같이 단독 보도해 냅니다.'
  },
  '여의도 참새·정치 낭인형': {
    reporterType: '여의도 참새·정치 낭인형',
    detailedSpecialty: '의원회관 복도 죽돌이이자 백브리핑·지라시 판독의 신',
    description: '국회 본청과 여야 당사를 내 집처럼 드나들며 여의도 정가의 내밀한 귓속말을 실시간으로 낚아챕니다. 당 대표실 문고리부터 보좌진 네트워크까지 꽉 쥐고 있어 총선 공천이나 계파 갈등의 판세를 동물적으로 읽어냅니다.'
  },
  '관가 저승사자·세종시 정책통': {
    reporterType: '관가 저승사자·세종시 정책통',
    detailedSpecialty: '정부세종청사 보도자료의 허점을 까발리는 숫자 저격수',
    description: '기획재정부, 금융위, 복지부 등 관가 관료들이 가장 껄끄러워하는 분석가입니다. 복잡한 통계 수치와 정책 용어 뒤에 숨겨진 세수 펑크나 예산 낭비를 귀신같이 찾아내 1면 톱기사로 꽂아 넣는 냉철한 정책 감시자입니다.'
  },
  '대기업 홍보실의 친구? 산업부 에이스': {
    reporterType: '대기업 홍보실의 친구? 산업부 에이스',
    detailedSpecialty: '삼성·현대차 재벌 승계구도와 글로벌 공급망을 해부하는 기업통',
    description: '주요 그룹 총수의 일거수일투족과 IR 재무제표를 훤히 꿰뚫고 있습니다. 대기업 임원들과의 고급 조찬부터 공장 현장의 기름 냄새까지 넘나들며 글로벌 반도체·배터리 패권 전쟁의 숨은 속사정을 입체적으로 전합니다.'
  },
  '여의도 자본시장 파수꾼 (개미들의 구원투수)': {
    reporterType: '여의도 자본시장 파수꾼 (개미들의 구원투수)',
    detailedSpecialty: '공시 해독과 작전 세력 사냥, 장마감 시황 머신',
    description: '증권선물거래소와 여의도 증권가를 누비며 수상한 전환사채(CB) 발행, 사모펀드의 무자본 M&A 등 자본시장의 불공정 거래를 추적합니다. 복잡한 공시를 개미 투자자의 눈높이로 풀어내는 시장 파수꾼입니다.'
  },
  '상복 터진 탐사보도 헌터': {
    reporterType: '상복 터진 탐사보도 헌터',
    detailedSpecialty: '취재수첩 10권과 엑셀 데이터로 이달의 기자상을 싹쓸이하는 장인',
    description: '단발성 속보에 연연하지 않고 수개월간 정보공개 청구와 심층 취재를 통해 사회의 구조적 모순을 고발합니다. 한번 물면 놓지 않는 집념으로 법 개정과 사회적 파장을 이끌어내며 회사에 트로피를 안겨주는 탐사 에이스입니다.'
  },
  '판교 테크 덕후·스타트업 사냥꾼': {
    reporterType: '판교 테크 덕후·스타트업 사냥꾼',
    detailedSpecialty: 'AI 혁명과 플랫폼 빅테크의 알고리즘을 털어내는 테크너드',
    description: '테헤란로와 판교 테크노밸리의 밤을 함께 지새우는 혁신통입니다. 생성형 AI, 클라우드, 유니콘 스타트업의 지각 변동을 가장 발 빠르게 포착하여 난해한 기술 혁신을 독자들에게 친절하게 전달합니다.'
  },
  '더그아웃의 하이에나·스포츠 현장 승부사': {
    reporterType: '더그아웃의 하이에나·스포츠 현장 승부사',
    detailedSpecialty: '경기장 락커룸과 스토브리그 이적설을 쥐락펴락하는 현장 마당발',
    description: '프로야구·축구 경기장과 선수단 훈련장을 지키며 경기 결과 뒤에 숨은 선수와 감독의 인간 드라마를 포착합니다. 스토브리그 FA 계약과 사령탑 경질 등 굵직한 단독 특종을 터뜨리는 그라운드의 승부사입니다.'
  },
  '시사회 단골·대중문화 비평가': {
    reporterType: '시사회 단골·대중문화 비평가',
    detailedSpecialty: 'K-콘텐츠 생태계와 시대적 감수성을 꿰뚫는 트렌드세터',
    description: '칸 영화제부터 아이돌 쇼케이스, OTT 시리즈 신작까지 문화 콘텐츠의 전선을 누빕니다. 대중의 취향을 정확히 짚어내는 감각적인 문장력과 문화 비평을 결합하여 시대의 유행을 독자들에게 명쾌하게 해설합니다.'
  },
  '포털 랭킹 1위의 제왕·트래픽 폭격기': {
    reporterType: '포털 랭킹 1위의 제왕·트래픽 폭격기',
    detailedSpecialty: '실검과 포털 메인을 장악하는 헤드라인 연금술사',
    description: '어떤 이슈든 독자의 시선을 단숨에 사로잡는 마법 같은 제목과 속보 호흡으로 디지털 트래픽을 폭발시킵니다. SNS와 커뮤니티의 민심을 1초 만에 캐치하여 미디어의 도달 범위를 극대화하는 온라인 뉴스룸의 핵심 동력입니다.'
  },
  '외교관보다 바쁜 국제부 번역·분석 머신': {
    reporterType: '외교관보다 바쁜 국제부 번역·분석 머신',
    detailedSpecialty: '미 대선과 글로벌 지정학 리스크를 실시간 타전하는 엘리트',
    description: 'CNN, 블룸버그, 로이터의 긴급 타전을 24시간 모니터링하며 한반도 정세와 미·중 패권 전쟁의 여파를 정밀 분석합니다. 영어 원문 자료를 총알처럼 독해하며 해외 특파원 부임을 호시탐탐 노리는 글로벌 역량자입니다.'
  },
  '지역 민심 꿰뚫는 로컬 맹주 전국부': {
    reporterType: '지역 민심 꿰뚫는 로컬 맹주 전국부',
    detailedSpecialty: '지방 시·도청 토착 권력과 지역 현안의 숨은 내막을 아는 터줏대감',
    description: '서울 중심의 뉴스 프레임을 깨고 전국 각지의 생생한 현장 목소리를 전달합니다. 지역 단체장과 토착 유지들의 은밀한 결탁부터 지방 소멸의 아픈 현실까지 발로 뛰어 기록하는 풀뿌리 저널리즘의 버팀목입니다.'
  },
  '편집국 마당발 올라운더 (인사 땜빵 전문)': {
    reporterType: '편집국 마당발 올라운더 (인사 땜빵 전문)',
    detailedSpecialty: '어느 부서에 던져놓아도 첫날부터 1인분 하는 만능 생존왕',
    description: '사회부 현장 취재부터 산업부 기업 기사, 정치부 백브리핑까지 안 해본 출입처가 없는 베테랑입니다. 급작스러운 공석이나 대형 이슈가 터졌을 때 편집국장이 가장 먼저 찾는 구원투수이자 적응력의 끝판왕입니다.'
  },
  '새 영역 개척하는 호기심 천국형': {
    reporterType: '새 영역 개척하는 호기심 천국형',
    detailedSpecialty: '출입처 경계를 허물며 새로운 융합 기획을 파고드는 탐험가',
    description: '기존 출입처의 관행에 얽매이지 않고 인접 분야와의 시너지를 창출하는 다재다능한 기자입니다. 사회부 시각으로 경제를 보고, IT 감각으로 문화를 취재하며 차별화된 하이브리드 기사를 생산해 냅니다.'
  }
};

export function analyzeCareer(careers: CareerRecord[]): CareerAnalysisResult {
  const totalMonths = careers.reduce((sum, c) => sum + c.periodMonths, 0);
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  const totalYearsText = remainingMonths === 0 
    ? `${years}년` 
    : `${years}년 ${remainingMonths}개월`;

  // 기본 빈 경력 처리 (수습 기자)
  if (careers.length === 0 || totalMonths === 0) {
    return {
      totalMonths: 0,
      totalYearsText: '0년',
      reporterType: '세상 물정 모르는 풋내기 수습 (마와리 1일차)',
      detailedSpecialty: '경찰서 당직실에서 쪽잠 자며 선배에게 털려도 눈빛만은 살아있는 원석',
      description: '취재 수첩과 펜을 꼭 쥐고 경찰서 형사계와 지구대를 돌며 기자의 기본기를 배우는 중입니다. 선배의 불호령과 마감 압박 속에서도 특종 기자의 꿈을 품고 달리는 순도 100%의 열정 덩어리입니다.',
      topFields: [],
      skillTree: {
        '정치·정책': 10,
        '경제·금융': 10,
        '기업·산업': 10,
        '외교·국제': 10,
        '현장취재': 25,
        '탐사·기획': 10,
        '데이터 분석': 10,
        '기술·디지털': 10,
        '콘텐츠·편집': 10,
      },
      careerPaths: [
        {
          type: 'A',
          title: '정통 사회부 야전 코스',
          routeName: '사회부 → 전국부 → 정치부',
          description: '사건사고 현장에서 뼈를 깎는 취재 기본기를 다진 뒤 여의도 정치권으로 진출하는 정통 기자 코스입니다.',
          steps: ['사회부', '전국부', '정치부']
        },
        {
          type: 'B',
          title: '엘리트 경제·산업 코스',
          routeName: '산업부 → 경제부 → 증권부',
          description: '기업 현장과 거시 정책을 두루 섭렵하며 한국 자본주의의 핵심부를 감시하는 금융·산업 전문가 경로입니다.',
          steps: ['산업부', '경제부', '증권부']
        },
        {
          type: 'C',
          title: '트렌드 & 디지털 기획 코스',
          routeName: '디지털뉴스부 → IT산업부 → 기획취재부',
          description: '포털 트래픽 감각과 테크 생태계를 체득한 뒤 대형 데이터 탐사보도로 전환하는 현대적 성공 방정식입니다.',
          steps: ['디지털뉴스부', 'IT산업부', '기획취재부']
        }
      ]
    };
  }

  // 부서별 개월수 및 선택된 세부 분야 카운트
  const deptMonths: Record<string, number> = {};
  const subFieldCounts: Record<string, number> = {};

  careers.forEach(c => {
    deptMonths[c.deptName] = (deptMonths[c.deptName] || 0) + c.periodMonths;
    if (c.subFields && c.subFields.length > 0) {
      c.subFields.forEach(sf => {
        subFieldCounts[sf.name] = (subFieldCounts[sf.name] || 0) + (c.periodMonths / c.subFields.length);
      });
    }
  });

  const sortedSubFields = Object.entries(subFieldCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([field, months]) => ({
      field,
      months: Math.round(months),
      ratio: Math.round((months / totalMonths) * 1000) / 10
    }));

  // 주요 도메인별 비중 계산
  const ecoIndustryMonths = (deptMonths['경제부'] || 0) + (deptMonths['산업부'] || 0) + (deptMonths['증권부'] || 0) + (deptMonths['부동산부'] || 0) + (deptMonths['IT산업부'] || 0);
  const politicsPolicyMonths = (deptMonths['정치부'] || 0) + (deptMonths['외교안보부'] || 0) + (deptMonths['사회정책부'] || 0);
  const societyMonths = (deptMonths['사회부'] || 0) + (deptMonths['전국부'] || 0);
  const investDataMonths = (deptMonths['기획취재부'] || 0);
  const globalMonths = (deptMonths['국제부'] || 0) + (deptMonths['외교안보부'] || 0);
  const cultureMonths = (deptMonths['문화부'] || 0);
  const sportsMonths = (deptMonths['스포츠부'] || 0);
  const techDigitalMonths = (deptMonths['IT산업부'] || 0) + (deptMonths['디지털뉴스부'] || 0);

  // 1. 유형 매칭 로직 (현실적 카탈로그 키 매칭)
  let catalogKey = '편집국 마당발 올라운더 (인사 땜빵 전문)';

  // 법조 특화 체크 (사회부 세부 분야 중 검찰, 법원 키워드)
  const isLawFocus = sortedSubFields.some(s => s.field.includes('검찰') || s.field.includes('법원') || s.field.includes('사법'));

  if (sportsMonths / totalMonths >= 0.35) {
    catalogKey = '더그아웃의 하이에나·스포츠 현장 승부사';
  } else if (cultureMonths / totalMonths >= 0.35) {
    catalogKey = '시사회 단골·대중문화 비평가';
  } else if ((deptMonths['증권부'] || 0) >= 24 || (deptMonths['증권부'] || 0) / totalMonths >= 0.4) {
    catalogKey = '여의도 자본시장 파수꾼 (개미들의 구원투수)';
  } else if (investDataMonths / totalMonths >= 0.25) {
    catalogKey = '상복 터진 탐사보도 헌터';
  } else if (politicsPolicyMonths / totalMonths >= 0.45) {
    if ((deptMonths['외교안보부'] || 0) >= (deptMonths['정치부'] || 0)) {
      catalogKey = '외교관보다 바쁜 국제부 번역·분석 머신';
    } else {
      catalogKey = '여의도 참새·정치 낭인형';
    }
  } else if (globalMonths / totalMonths >= 0.45) {
    catalogKey = '외교관보다 바쁜 국제부 번역·분석 머신';
  } else if (societyMonths / totalMonths >= 0.4) {
    if (isLawFocus) {
      catalogKey = '서초동 법조 라인 단독 제조기';
    } else if ((deptMonths['전국부'] || 0) > (deptMonths['사회부'] || 0)) {
      catalogKey = '지역 민심 꿰뚫는 로컬 맹주 전국부';
    } else {
      catalogKey = '사건캡 출신 야전사령관';
    }
  } else if (techDigitalMonths / totalMonths >= 0.4) {
    if ((deptMonths['디지털뉴스부'] || 0) > (deptMonths['IT산업부'] || 0)) {
      catalogKey = '포털 랭킹 1위의 제왕·트래픽 폭격기';
    } else {
      catalogKey = '판교 테크 덕후·스타트업 사냥꾼';
    }
  } else if (ecoIndustryMonths / totalMonths >= 0.45) {
    if ((deptMonths['산업부'] || 0) >= (deptMonths['경제부'] || 0)) {
      catalogKey = '대기업 홍보실의 친구? 산업부 에이스';
    } else {
      catalogKey = '관가 저승사자·세종시 정책통';
    }
  } else if (careers.length >= 3) {
    catalogKey = '편집국 마당발 올라운더 (인사 땜빵 전문)';
  } else {
    catalogKey = '새 영역 개척하는 호기심 천국형';
  }

  // 카탈로그에서 완성형 문구 매칭
  const matchedTemplate = REPORTER_PROFILE_CATALOG[catalogKey] || REPORTER_PROFILE_CATALOG['편집국 마당발 올라운더 (인사 땜빵 전문)'];
  const reporterType = matchedTemplate.reporterType;
  const detailedSpecialty = matchedTemplate.detailedSpecialty;
  const description = matchedTemplate.description;

  // 2. 스킬트리 계산 (0 ~ 100 상대적 경험 축적치)
  const calcScore = (rawMonths: number, baseWeight: number = 1.0) => {
    const score = Math.min(95, Math.round(15 + (rawMonths * 2.2 * baseWeight)));
    return Math.max(15, score);
  };

  const skillTree: Record<string, number> = {
    '정치·정책': calcScore((deptMonths['정치부'] || 0) * 1.0 + (deptMonths['사회정책부'] || 0) * 0.6),
    '경제·금융': calcScore((deptMonths['경제부'] || 0) * 1.0 + (deptMonths['증권부'] || 0) * 0.9),
    '기업·산업': calcScore((deptMonths['산업부'] || 0) * 1.0 + (deptMonths['IT산업부'] || 0) * 0.8),
    '외교·국제': calcScore((deptMonths['국제부'] || 0) * 1.0 + (deptMonths['외교안보부'] || 0) * 1.0),
    '현장취재': calcScore((deptMonths['사회부'] || 0) * 1.1 + (deptMonths['전국부'] || 0) * 0.8),
    '탐사·기획': calcScore((deptMonths['기획취재부'] || 0) * 1.2 + (deptMonths['오피니언부'] || 0) * 0.5),
    '데이터 분석': calcScore((deptMonths['기획취재부'] || 0) * 0.8 + (deptMonths['디지털뉴스부'] || 0) * 0.6),
    '기술·디지털': calcScore((deptMonths['IT산업부'] || 0) * 1.0 + (deptMonths['디지털뉴스부'] || 0) * 1.0),
    '콘텐츠·편집': calcScore((deptMonths['편집부'] || 0) * 1.2 + (deptMonths['사진영상부'] || 0) * 0.8),
  };

  // 3. 커리어패스 3가지 (A, B, C) 추천 생성
  const recentDept = careers[careers.length - 1].deptName;

  let pathA: CareerPathRecommendation;
  let pathB: CareerPathRecommendation;
  let pathC: CareerPathRecommendation;

  if (ecoIndustryMonths > politicsPolicyMonths && ecoIndustryMonths > societyMonths) {
    pathA = {
      type: 'A',
      title: '거시경제 & 여의도 자본시장 전문가 코스',
      routeName: `${recentDept} → 증권부 → 기획취재부`,
      description: '산업 현장 취재 경험에 자본시장 공시 해독과 심층 회계 분석을 더해 시장의 큰손들을 감시하는 전문가 경로입니다.',
      steps: [recentDept, '증권부', '기획취재부']
    };
    pathB = {
      type: 'B',
      title: '글로벌 통상 & 대기업 패권 추적 코스',
      routeName: `${recentDept} → 국제부 → 산업부`,
      description: '국내 대기업 취재를 미국·중국 글로벌 공급망 전쟁과 국제 통상 무대로 확장하는 대형 기획 코스입니다.',
      steps: [recentDept, '국제부', '산업부']
    };
    pathC = {
      type: 'C',
      title: '경제 탐사 저널리스트 파격 전환',
      routeName: `${recentDept} → 기획취재부 → 사회정책부`,
      description: '기업 재무제표와 공공 데이터를 무기로 빈부격차, 연금 개혁, 노동 현안을 깊숙이 파헤치는 탐사보도 경로입니다.',
      steps: [recentDept, '기획취재부', '사회정책부']
    };
  } else if (politicsPolicyMonths >= societyMonths) {
    pathA = {
      type: 'A',
      title: '정치부 터줏대감 & 논설위원 코스',
      routeName: `${recentDept} → 정치부 → 오피니언부`,
      description: '국회와 대통령실을 누비며 쌓은 정국 분석력을 바탕으로 사설과 칼럼을 통해 여론을 주도하는 정통 코스입니다.',
      steps: [recentDept, '정치부', '오피니언부']
    };
    pathB = {
      type: 'B',
      title: '정치·경제 융합 정책통 코스',
      routeName: `${recentDept} → 경제부 → 사회정책부`,
      description: '여의도 정치 공학에 세제·예산 분석력을 결합하여 정책의 현실성을 입체적으로 검증하는 하이브리드 경로입니다.',
      steps: [recentDept, '경제부', '사회정책부']
    };
    pathC = {
      type: 'C',
      title: '디지털 선거 & 데이터 저널리스트',
      routeName: `${recentDept} → 디지털뉴스부 → 기획취재부`,
      description: '여론조사와 선거구 데이터, 국회 법안 발의 데이터를 시각화하여 대중과 실시간 소통하는 디지털 혁신 경로입니다.',
      steps: [recentDept, '디지털뉴스부', '기획취재부']
    };
  } else {
    pathA = {
      type: 'A',
      title: '탐사보도 & 권력 감시 특종 코스',
      routeName: `${recentDept} → 기획취재부 → 사회부`,
      description: '사건기자 시절 다져진 취재 근성과 취재원 발굴 능력을 대형 심층 기획과 권력 비리 고발로 집대성하는 에이스 경로입니다.',
      steps: [recentDept, '기획취재부', '사회부']
    };
    pathB = {
      type: 'B',
      title: '사회 현장 → 산업 현장 영토 확장',
      routeName: `${recentDept} → 산업부 → 경제부`,
      description: '거친 야전 취재력을 바탕으로 대기업 노사 갈등과 산업 생태계 현장을 뚝심 있게 파고드는 확장 코스입니다.',
      steps: [recentDept, '산업부', '경제부']
    };
    pathC = {
      type: 'C',
      title: '뉴미디어 탐사 스토리텔러 코스',
      routeName: `${recentDept} → 디지털뉴스부 → 기획취재부`,
      description: '생생한 현장 취재를 영상, 팟캐스트, 롱폼 인터랙티브 웹 콘텐츠로 제작하여 독자 참여를 이끄는 차세대 경로입니다.',
      steps: [recentDept, '디지털뉴스부', '기획취재부']
    };
  }

  return {
    totalMonths,
    totalYearsText,
    reporterType,
    detailedSpecialty,
    description,
    topFields: sortedSubFields.slice(0, 3),
    skillTree,
    careerPaths: [pathA, pathB, pathC]
  };
}
