import { CareerRecord, CareerAnalysisResult, CareerPathRecommendation } from '../types/game';

interface ReporterProfileTemplate {
  reporterType: string;
  detailedSpecialty: string;
  description: string;
}

// 유형별 품격 있는 완성형 저널리즘 해설 카탈로그
const REPORTER_PROFILE_CATALOG: Record<string, ReporterProfileTemplate> = {
  '거시경제·금융 전문형': {
    reporterType: '거시경제·금융 전문형',
    detailedSpecialty: '금리와 거시경제 정책의 맥을 짚는 금융통',
    description: '한국은행과 금융당국 취재를 거치며 글로벌 통화정책과 가계부채, 자본시장의 복잡한 톱니바퀴를 읽어내는 통찰을 축적했습니다. 수치 이면에 숨은 시장의 심리를 꿰뚫어 보는 거시경제 전문기자입니다.'
  },
  '기업·산업 분석형': {
    reporterType: '기업·산업 분석형',
    detailedSpecialty: '제조 현장과 공급망 패권을 꿰뚫는 산업 구조 분석가',
    description: '반도체, 배터리, 자동차 등 국가 기간산업 현장을 발로 뛰며 대기업 지배구조와 글로벌 무역 전쟁의 전선을 취재했습니다. 공장의 기름 냄새부터 IR 자료의 재무제표까지 입체적으로 해부하는 에이스입니다.'
  },
  '거시경제·정책 분석형': {
    reporterType: '거시경제·정책 분석형',
    detailedSpecialty: '국가 재정과 실물경제의 함수를 푸는 정책 분석가',
    description: '기획재정부와 거시경제 부처를 밀착 취재하며 세제 개편, 국가 예산, 복지 재정의 파급효과를 심도 있게 다뤄왔습니다. 정책의 정치적 수사를 걷어내고 실물경제에 미치는 영향을 냉철하게 짚어냅니다.'
  },
  '자본시장 전문형': {
    reporterType: '자본시장 전문형',
    detailedSpecialty: '여의도 증권가와 기업가치 평가의 숨은 키를 쥔 시장 감시자',
    description: '증시 시황, 사모펀드, IPO 시장을 밀착 취재하며 자본의 흐름과 기업 공시의 이면을 추적했습니다. 투자자의 시각과 저널리즘의 공공성을 결합하여 시장의 불공정을 짚어내는 자본시장 파수꾼입니다.'
  },
  '정치·정책 전문형': {
    reporterType: '정치·정책 전문형',
    detailedSpecialty: '여의도 입법 권력과 정국 흐름을 꿰뚫는 정치통',
    description: '국회와 여야 정당, 대통령실을 두루 거치며 거친 정쟁 속에서도 입법 메커니즘과 권력의 동학을 날카롭게 포착해 왔습니다. 복잡한 정치 공학 속에서 정책의 본질을 짚어내는 정통 정치기자입니다.'
  },
  '외교·안보 전문형': {
    reporterType: '외교·안보 전문형',
    detailedSpecialty: '한반도 정세와 지정학적 리스크를 읽는 국제안보 전략가',
    description: '외교부와 국방부, 미·중 패권 갈등의 최전선을 조망하며 동북아 안보와 글로벌 통상 질서의 함수를 풀어왔습니다. 국익의 관점에서 냉철하게 국제 뉴스를 입체 분석하는 전문 인력입니다.'
  },
  '사회현장 전문형': {
    reporterType: '사회현장 전문형',
    detailedSpecialty: '사건 사고의 최전선에서 진실을 캐내는 현장 야전사령관',
    description: '사건 캡과 라인을 지키며 경찰서, 법원, 재난 현장의 날것 그대로의 목소리를 기록했습니다. 취재원의 입을 여는 탁월한 친화력과 거친 현장에서도 특종의 냄새를 맡는 기자 정신이 살아있습니다.'
  },
  '탐사·데이터저널리즘형': {
    reporterType: '탐사·데이터저널리즘형',
    detailedSpecialty: '빅데이터와 심층 추적으로 구조적 모순을 파헤치는 탐사 저널리스트',
    description: '방대한 공공 데이터와 정보공개 청구, 집요한 장기 추적 취재를 통해 사회의 가려진 부조리를 고발해 왔습니다. 단발성 속보를 넘어 사회 제도를 바꾸는 대형 어젠다 세팅에 강점을 보입니다.'
  },
  '기술·혁신 전문형': {
    reporterType: '기술·혁신 전문형',
    detailedSpecialty: 'AI 혁명과 플랫폼 생태계를 선도적으로 해설하는 테크 저널리스트',
    description: '빅테크 플랫폼, 생성형 AI, 스타트업 생태계의 패러다임 변화를 발 빠르게 추적했습니다. 난해한 기술 용어를 독자의 눈높이로 풀어내고 기술이 바꿀 사회적 파급력을 통찰합니다.'
  },
  '스포츠 전문·현장 분석형': {
    reporterType: '스포츠 전문·현장 분석형',
    detailedSpecialty: '그라운드의 승부와 스포츠 산업의 생리를 꿰뚫는 현장 승부사',
    description: '프로야구·축구 등 프로 리그와 국가대표 경기, 선수단과 프런트를 밀착 취재하며 승부의 박진감과 스포츠 비즈니스의 이면을 날카롭게 포착했습니다. 경기장의 뜨거운 호흡을 박진감 넘치는 필력으로 전하는 정통 스포츠 저널리스트입니다.'
  },
  '문화·대중예술 전문형': {
    reporterType: '문화·대중예술 전문형',
    detailedSpecialty: 'K-콘텐츠와 문화예술 생태계의 흐름을 읽는 문화 저널리스트',
    description: '영화, 미술, 공연, 출판, 방송·OTT 등 문화예술 생태계와 K-컬처 산업을 깊이 있게 조망하며 시대적 감수성과 문화 담론을 독자들에게 전해 왔습니다. 깊이 있는 비평과 감각적인 문장력을 갖추고 있습니다.'
  },
  '문화·트렌드 분석형': {
    reporterType: '문화·트렌드 분석형',
    detailedSpecialty: '대중문화 산업과 시대적 라이프스타일을 포착하는 트렌드 저널리스트',
    description: '콘텐츠, 라이프스타일, 여가 트렌드를 두루 취재하며 대중의 소비 트렌드와 시대정신을 감각적으로 담아냈습니다. 독자의 시선을 사로잡는 대중적 기획력이 돋보입니다.'
  },
  '디지털·인터랙티브형': {
    reporterType: '디지털·인터랙티브형',
    detailedSpecialty: '뉴미디어 문법과 독자 참여를 이끄는 디지털 스토리텔러',
    description: '지면의 한계를 넘어 인터랙티브 기획, 뉴스레터, 소셜미디어 포맷으로 독자와 직접 호흡해 왔습니다. 급변하는 미디어 환경에서 뉴스의 도달 방식을 혁신하는 인재입니다.'
  },
  '현장·정책 융합형': {
    reporterType: '현장·정책 융합형',
    detailedSpecialty: '현장의 목소리와 정책의 대안을 잇는 제도 개선 전문가',
    description: '사회부 현장에서 목격한 시민들의 삶을 정책 부서(사회정책·노동·복지)의 구체적인 법안과 예산 문제로 연결 지어 보도했습니다. 현실과 제도의 간극을 메우는 균형 잡힌 시각을 보유하고 있습니다.'
  },
  '종합 순환형': {
    reporterType: '종합 순환형',
    detailedSpecialty: '편집국 전 라운드를 경험한 멀티플레이어 올라운더',
    description: '사회부 현장의 뚝심, 산업·경제의 숫자 감각, 정책 부서의 거시적 안목을 고루 갖추었습니다. 어떤 부서에 배치되어도 즉시 주력으로 활약할 수 있는 높은 적응력과 유연성을 자랑합니다.'
  },
  '취재영역 확장형': {
    reporterType: '취재영역 확장형',
    detailedSpecialty: '새로운 도메인을 거침없이 흡수하는 성장 잠재력의 저널리스트',
    description: '기존 출입처에서 탄탄히 다진 취재 기본기를 바탕으로 인접 분야로 지평을 넓혀가고 있습니다. 취재원에 대한 두려움 없는 돌파력과 새로운 영역을 스펀지처럼 흡수하는 유연함이 돋보입니다.'
  }
};

export function analyzeCareer(careers: CareerRecord[]): CareerAnalysisResult {
  const totalMonths = careers.reduce((sum, c) => sum + c.periodMonths, 0);
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  const totalYearsText = remainingMonths === 0 
    ? `${years}년` 
    : `${years}년 ${remainingMonths}개월`;

  // 기본 빈 경력 처리
  if (careers.length === 0 || totalMonths === 0) {
    return {
      totalMonths: 0,
      totalYearsText: '0년',
      reporterType: '풋풋한 수습·새내기 기자',
      detailedSpecialty: '편집국의 미래를 짊어질 열정의 원석',
      description: '취재 수첩과 펜을 들고 선배들의 뒤를 쫓으며 기자의 기본기를 다지고 있습니다. 날것 그대로의 열정과 출입처를 향한 호기심으로 가득 찬 상태입니다.',
      topFields: [],
      skillTree: {
        '정치·정책': 10,
        '경제·금융': 10,
        '기업·산업': 10,
        '외교·국제': 10,
        '현장취재': 20,
        '탐사·기획': 10,
        '데이터 분석': 10,
        '기술·디지털': 10,
        '콘텐츠·편집': 10,
      },
      careerPaths: [
        {
          type: 'A',
          title: '사회부 현장 트레이닝 코스',
          routeName: '사회부 → 산업부 → 경제부',
          description: '기자의 기본기인 사건사고 현장 취재를 거쳐 산업 및 거시경제로 확장하는 정통 엘리트 코스입니다.',
          steps: ['사회부', '산업부', '경제부']
        },
        {
          type: 'B',
          title: '디지털 & 정책 탐사 코스',
          routeName: '디지털뉴스부 → 사회정책부 → 기획취재부',
          description: '디지털 문법과 정책 이슈를 융합하여 기획 탐사 저널리스트로 성장하는 현대적 경로입니다.',
          steps: ['디지털뉴스부', '사회정책부', '기획취재부']
        },
        {
          type: 'C',
          title: '글로벌 & 외교안보 특화 코스',
          routeName: '국제부 → 외교안보부 → 정치부',
          description: '국제 정세와 안보 이슈를 두루 섭렵하며 국가 정책의 큰 그림을 읽는 저널리스트 경로입니다.',
          steps: ['국제부', '외교안보부', '정치부']
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
  const cultureSportMonths = (deptMonths['스포츠부'] || 0) + (deptMonths['문화부'] || 0);
  const techDigitalMonths = (deptMonths['IT산업부'] || 0) + (deptMonths['디지털뉴스부'] || 0);

  // 1. 유형 매칭 로직 (카탈로그 키 결정)
  let catalogKey = '종합 순환형';

  if ((deptMonths['증권부'] || 0) >= 24) {
    catalogKey = '자본시장 전문형';
  } else if (ecoIndustryMonths / totalMonths >= 0.5) {
    if ((deptMonths['증권부'] || 0) >= 12 || sortedSubFields.some(s => s.field.includes('금리') || s.field.includes('금융'))) {
      catalogKey = '거시경제·금융 전문형';
    } else if ((deptMonths['산업부'] || 0) >= (deptMonths['경제부'] || 0)) {
      catalogKey = '기업·산업 분석형';
    } else {
      catalogKey = '거시경제·정책 분석형';
    }
  } else if (politicsPolicyMonths / totalMonths >= 0.45) {
    catalogKey = '정치·정책 전문형';
  } else if (globalMonths / totalMonths >= 0.4) {
    catalogKey = '외교·안보 전문형';
  } else if (investDataMonths / totalMonths >= 0.25) {
    catalogKey = '탐사·데이터저널리즘형';
  } else if (societyMonths / totalMonths >= 0.45) {
    if ((deptMonths['사회정책부'] || 0) >= 12) {
      catalogKey = '현장·정책 융합형';
    } else {
      catalogKey = '사회현장 전문형';
    }
  } else if (techDigitalMonths / totalMonths >= 0.4) {
    if ((deptMonths['IT산업부'] || 0) >= (deptMonths['디지털뉴스부'] || 0)) {
      catalogKey = '기술·혁신 전문형';
    } else {
      catalogKey = '디지털·인터랙티브형';
    }
  } else if ((deptMonths['스포츠부'] || 0) / totalMonths >= 0.35) {
    catalogKey = '스포츠 전문·현장 분석형';
  } else if ((deptMonths['문화부'] || 0) / totalMonths >= 0.35) {
    catalogKey = '문화·대중예술 전문형';
  } else if (cultureSportMonths / totalMonths >= 0.4) {
    catalogKey = '문화·트렌드 분석형';
  } else if (careers.length >= 3) {
    catalogKey = '종합 순환형';
  } else {
    catalogKey = '취재영역 확장형';
  }

  // 카탈로그에서 완성형 문구 불러오기
  const matchedTemplate = REPORTER_PROFILE_CATALOG[catalogKey] || REPORTER_PROFILE_CATALOG['종합 순환형'];
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
      title: '거시경제·자본시장 전문가 경로',
      routeName: `${recentDept} → 증권부 → 기획취재부`,
      description: '산업 현장과 실물경제 취재 경험을 자본시장과 기업가치 심층 분석으로 한 단계 도약시키는 전문화 경로입니다.',
      steps: [recentDept, '증권부', '기획취재부']
    };
    pathB = {
      type: 'B',
      title: '글로벌 통상 & 산업 네트워크 확장',
      routeName: `${recentDept} → 국제부 → 산업부`,
      description: '국내 대기업 및 제조 취재 경험을 글로벌 공급망, 미중 패권 갈등 등 국제 경제 분야로 확장하는 경로입니다.',
      steps: [recentDept, '국제부', '산업부']
    };
    pathC = {
      type: 'C',
      title: '경제 탐사 저널리스트로의 전환',
      routeName: `${recentDept} → 기획취재부 → 사회정책부`,
      description: '경제·기업 데이터 분석 역량을 바탕으로 불평등, 노동, 연금 등 구조적 사회문제를 심층 고발하는 파격적 도전 경로입니다.',
      steps: [recentDept, '기획취재부', '사회정책부']
    };
  } else if (politicsPolicyMonths >= societyMonths) {
    pathA = {
      type: 'A',
      title: '국가 정책 & 입법 저널리즘 전문가',
      routeName: `${recentDept} → 정치부 → 오피니언부`,
      description: '국회와 행정부 취재를 통해 구축한 정책 감시 역량을 심층 해설과 논설로 고도화하는 경로입니다.',
      steps: [recentDept, '정치부', '오피니언부']
    };
    pathB = {
      type: 'B',
      title: '정치·경제 융합 정책통 경로',
      routeName: `${recentDept} → 경제부 → 사회정책부`,
      description: '정치 권력 취재에 예산과 재정, 거시경제 분석력을 결합하여 정책의 현실성을 입체적으로 검증하는 확장 경로입니다.',
      steps: [recentDept, '경제부', '사회정책부']
    };
    pathC = {
      type: 'C',
      title: '디지털 인터랙티브 정치 데이터 저널리스트',
      routeName: `${recentDept} → 디지털뉴스부 → 기획취재부`,
      description: '선거 및 의정활동 데이터를 시각화하고 대중과 소통하는 현대적 데이터 스토리텔링에 도전하는 경로입니다.',
      steps: [recentDept, '디지털뉴스부', '기획취재부']
    };
  } else {
    pathA = {
      type: 'A',
      title: '탐사보도 & 권력감시 에이스 경로',
      routeName: `${recentDept} → 기획취재부 → 사회부`,
      description: '사건기자 시절 다져진 취재 근성과 취재원 발굴 능력을 대형 심층 기획과 고발 보도로 집대성하는 정통 엘리트 경로입니다.',
      steps: [recentDept, '기획취재부', '사회부']
    };
    pathB = {
      type: 'B',
      title: '기업 & 노동 현장 전문기자 경로',
      routeName: `${recentDept} → 산업부 → 사회정책부`,
      description: '사회부에서의 시민사회 및 노동 취재 경험을 기업 경영 및 산업 정책과 맞물려 균형 잡힌 시각으로 확장하는 경로입니다.',
      steps: [recentDept, '산업부', '사회정책부']
    };
    pathC = {
      type: 'C',
      title: '테크 & 미래산업 저널리스트로의 변신',
      routeName: `${recentDept} → IT산업부 → 증권부`,
      description: '거친 사건 현장에서 벗어나 인공지능, 스타트업, 벤처캐피털 등 혁신 생태계를 취재하는 신선한 변신 경로입니다.',
      steps: [recentDept, 'IT산업부', '증권부']
    };
  }

  return {
    totalMonths,
    totalYearsText,
    reporterType,
    detailedSpecialty,
    description,
    topFields: sortedSubFields.slice(0, 4),
    skillTree,
    careerPaths: [pathA, pathB, pathC]
  };
}
