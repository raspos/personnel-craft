export interface DepartmentDef {
  id: string;
  name: string;
  category: '보도' | '경제' | '기획' | '문화스포츠' | '제작디지털';
  color: string; // 3D 블록 색상
  subFields: string[];
  bossTitle: string;
  bossCostume: {
    accessory: 'briefcase' | 'laptop' | 'helmet' | 'passport' | 'mic' | 'pen' | 'camera' | 'glasses';
    shirtColor: string;
    hairColor: string;
  };
}

export const DEFAULT_DEPARTMENTS: DepartmentDef[] = [
  {
    id: 'politics',
    name: '정치부',
    category: '보도',
    color: '#3b82f6', // 파랑
    subFields: ['국회·원내', '정당·선거', '대통령실', '정치제도', '여론조사·민심'],
    bossTitle: '정치부장',
    bossCostume: { accessory: 'briefcase', shirtColor: '#1e3a8a', hairColor: '#1e293b' }
  },
  {
    id: 'society',
    name: '사회부',
    category: '보도',
    color: '#ef4444', // 빨강
    subFields: ['경찰·사건사고', '검찰·법원', '시민사회·노동', '재난·안전', '교육·인권'],
    bossTitle: '사회부장',
    bossCostume: { accessory: 'mic', shirtColor: '#991b1b', hairColor: '#334155' }
  },
  {
    id: 'economy',
    name: '경제부',
    category: '경제',
    color: '#10b981', // 에메랄드
    subFields: ['한국은행·금리', '금융·은행', '거시경제정책', '재정·세제', '부동산·가계부채', '경제통계·데이터'],
    bossTitle: '경제부장',
    bossCostume: { accessory: 'laptop', shirtColor: '#065f46', hairColor: '#475569' }
  },
  {
    id: 'industry',
    name: '산업부',
    category: '경제',
    color: '#f59e0b', // 호박색
    subFields: ['반도체·AI', '자동차·모빌리티', '에너지·원전', '통상·배터리', '대기업·지배구조', '중소벤처기업'],
    bossTitle: '산업부장',
    bossCostume: { accessory: 'helmet', shirtColor: '#b45309', hairColor: '#0f172a' }
  },
  {
    id: 'it_industry',
    name: 'IT산업부',
    category: '경제',
    color: '#06b6d4', // 청록
    subFields: ['플랫폼·빅테크', '게임·콘텐츠', '통신·네트워크', '보안·소프트웨어', '스타트업'],
    bossTitle: 'IT산업부장',
    bossCostume: { accessory: 'laptop', shirtColor: '#0e7490', hairColor: '#1e1b4b' }
  },
  {
    id: 'stock',
    name: '증권부',
    category: '경제',
    color: '#8b5cf6', // 보라
    subFields: ['코스피·시황', '코스닥·벤처투자', '자산운용·펀드', '채권·외환', '기업공개(IPO)'],
    bossTitle: '증권부장',
    bossCostume: { accessory: 'laptop', shirtColor: '#5b21b6', hairColor: '#3b0764' }
  },
  {
    id: 'investigative',
    name: '기획취재부',
    category: '기획',
    color: '#ec4899', // 핑크
    subFields: ['심층탐사·고발', '데이터저널리즘', '권력감시', '구조적 불평등', '기후위기·환경'],
    bossTitle: '기획취재부장',
    bossCostume: { accessory: 'pen', shirtColor: '#9d174d', hairColor: '#172554' }
  },
  {
    id: 'foreign_security',
    name: '외교안보부',
    category: '보도',
    color: '#6366f1', // 인디고
    subFields: ['외교부·조약', '국방부·군사', '통일부·남북관계', '동북아안보', '방위산업'],
    bossTitle: '외교안보부장',
    bossCostume: { accessory: 'briefcase', shirtColor: '#3730a3', hairColor: '#09090b' }
  },
  {
    id: 'international',
    name: '국제부',
    category: '보도',
    color: '#14b8a6', // 틸
    subFields: ['미국·북미', '중국·중화권', '유럽·EU', '글로벌 분쟁', '국제기구'],
    bossTitle: '국제부장',
    bossCostume: { accessory: 'passport', shirtColor: '#115e59', hairColor: '#292524' }
  },
  {
    id: 'social_policy',
    name: '사회정책부',
    category: '보도',
    color: '#84cc16', // 라임
    subFields: ['보건복지·연금', '고용노동·노사', '환경·생태', '여성가족·인구', '저출산고령화'],
    bossTitle: '사회정책부장',
    bossCostume: { accessory: 'pen', shirtColor: '#3f6212', hairColor: '#334155' }
  },
  {
    id: 'sports',
    name: '스포츠부',
    category: '문화스포츠',
    color: '#e11d48', // 로즈
    subFields: ['프로야구(KBO)', '해외축구·K리그', '올림픽·국제대회', '골프·레저', 'e스포츠'],
    bossTitle: '스포츠부장',
    bossCostume: { accessory: 'mic', shirtColor: '#9f1239', hairColor: '#1c1917' }
  },
  {
    id: 'culture',
    name: '문화부',
    category: '문화스포츠',
    color: '#f97316', // 오렌지
    subFields: ['영화·방송·OTT', 'K-POP·가요', '출판·문학', '미술·전시', '학술·역사'],
    bossTitle: '문화부장',
    bossCostume: { accessory: 'glasses', shirtColor: '#c2410c', hairColor: '#262626' }
  },
  {
    id: 'editorial',
    name: '편집부',
    category: '제작디지털',
    color: '#64748b', // 슬레이트
    subFields: ['1면·종합면 편집', '정치면 편집', '경제면 편집', '제목·레이아웃', '교열·윤문'],
    bossTitle: '편집부장',
    bossCostume: { accessory: 'pen', shirtColor: '#334155', hairColor: '#18181b' }
  },
  {
    id: 'regional',
    name: '전국부',
    category: '보도',
    color: '#a855f7',
    subFields: ['지방자치·의회', '지역경제·개발', '지역사회·축제', '수도권·광역행정'],
    bossTitle: '전국부장',
    bossCostume: { accessory: 'briefcase', shirtColor: '#6b21a8', hairColor: '#27272a' }
  },
  {
    id: 'real_estate',
    name: '부동산부',
    category: '경제',
    color: '#eab308',
    subFields: ['아파트분양·청약', '재건축·재개발', '상업용부동산', '국토부정책', '임대차시장'],
    bossTitle: '부동산부장',
    bossCostume: { accessory: 'laptop', shirtColor: '#854d0e', hairColor: '#1e293b' }
  },
  {
    id: 'digital_news',
    name: '디지털뉴스부',
    category: '제작디지털',
    color: '#0284c7',
    subFields: ['속보·포털대응', '인터랙티브 기획', '소셜미디어·숏폼', '뉴스레터·오디오'],
    bossTitle: '디지털뉴스부장',
    bossCostume: { accessory: 'laptop', shirtColor: '#075985', hairColor: '#18181b' }
  },
  {
    id: 'photo_video',
    name: '사진영상부',
    category: '제작디지털',
    color: '#475569',
    subFields: ['현장취재 사진', '정치·의전 사진', '드론·항공 촬영', '영상기획·유튜브'],
    bossTitle: '사진영상부장',
    bossCostume: { accessory: 'camera', shirtColor: '#1e293b', hairColor: '#0a0a0a' }
  },
  {
    id: 'opinion',
    name: '오피니언부',
    category: '기획',
    color: '#78716c',
    subFields: ['사설 기획', '외부 칼럼 관리', '기명 칼럼', '독자마당'],
    bossTitle: '오피니언부장',
    bossCostume: { accessory: 'glasses', shirtColor: '#44403c', hairColor: '#1c1917' }
  }
];

export function getDepartmentByName(name: string): DepartmentDef | undefined {
  return DEFAULT_DEPARTMENTS.find(d => d.name === name);
}

export function getDepartmentColor(name: string): string {
  const dept = getDepartmentByName(name);
  return dept ? dept.color : '#94a3b8';
}
