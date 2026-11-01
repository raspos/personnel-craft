import { CareerRecord, CareerAnalysisResult, CareerPathRecommendation, CareerSynergy } from '../types/game';
import { getDepartmentByName } from '../data/departments';

interface ReporterProfileTemplate {
  reporterType: string;
  reporterTypeEn: string;
  detailedSpecialty: string;
  detailedSpecialtyEn: string;
  description: string;
  descriptionEn: string;
}

// 세부 취재 분야 영문 매핑
export const SUBFIELD_TRANSLATIONS: Record<string, string> = {
  '국회·원내': 'National Assembly',
  '정당·선거': 'Elections & Parties',
  '대통령실': 'Presidential Office',
  '정치제도': 'Political System',
  '여론조사·민심': 'Polling & Public Opinion',
  '경찰·사건사고': 'Police & Accidents',
  '검찰·법원': 'Courts & Prosecutors',
  '시민사회·노동': 'Civil Society & Labor',
  '재난·안전': 'Disaster & Public Safety',
  '교육·인권': 'Education & Human Rights',
  '세종정책': 'Sejong Policy',
  '한국은행·금리': 'Bank of Korea & Rates',
  '금융·은행': 'Finance & Banking',
  '거시경제정책': 'Macroeconomic Policy',
  '재정·세제': 'Fiscal & Tax Policy',
  '부동산·가계부채': 'Real Estate & Household Debt',
  '경제통계·데이터': 'Economic Statistics',
  '반도체·AI': 'Semiconductors & AI',
  '자동차·모빌리티': 'Automotive & Mobility',
  '에너지·원전': 'Energy & Nuclear',
  '통상·배터리': 'Trade & Batteries',
  '대기업·지배구조': 'Chaebol & Governance',
  '중소벤처기업': 'SMEs & Ventures',
  '플랫폼·빅테크': 'Big Tech & Platforms',
  '게임·콘텐츠': 'Gaming & Digital Content',
  '통신·네트워크': 'Telecom & Networks',
  '보안·소프트웨어': 'Cybersecurity & Software',
  '스타트업': 'Startups',
  '코스피·시황': 'KOSPI & Market Trading',
  '코스닥·벤처투자': 'KOSDAQ & VC',
  '자산운용·펀드': 'Asset Management & Funds',
  '채권·외환': 'Bonds & Forex',
  '기업공개(IPO)': 'IPOs',
  '심층탐사·고발': 'Deep Investigation',
  '데이터저널리즘': 'Data Journalism',
  '권력감시': 'Power Watchdog',
  '구조적 불평등': 'Structural Inequality',
  '기후위기·환경': 'Climate & Environment',
  '외교부·조약': 'Foreign Ministry & Treaties',
  '국방부·군사': 'Defense & Military',
  '통일부·남북관계': 'Inter-Korean Relations',
  '동북아안보': 'Northeast Asian Security',
  '방위산업': 'Defense Industry',
  '미국·북미': 'US & North America',
  '중국·중화권': 'China & Greater China',
  '유럽·EU': 'Europe & EU',
  '글로벌 분쟁': 'Global Conflicts',
  '국제기구': 'International Organizations',
  '보건복지·연금': 'Welfare & Pensions',
  '고용노동·노사': 'Labor & Employment',
  '환경·생태': 'Ecology & Environment',
  '여성가족·인구': 'Demographics & Family',
  '저출산고령화': 'Aging & Fertility Crisis',
  '프로야구(KBO)': 'Pro Baseball (KBO)',
  '해외축구·K리그': 'Soccer & K-League',
  '올림픽·국제대회': 'Olympics & Global Sports',
  '골프·레저': 'Golf & Leisure',
  'e스포츠': 'Esports',
  '영화·방송·OTT': 'Film, TV & OTT',
  'K-POP·가요': 'K-Pop & Music',
  '출판·문학': 'Publishing & Literature',
  '미술·전시': 'Art & Exhibitions',
  '학술·역사': 'Academia & History',
  '1면·종합면 편집': 'Front Page & Main Editing',
  '정치면 편집': 'Politics Editing',
  '경제면 편집': 'Economy Editing',
  '제목·레이아웃': 'Headlines & Layout',
  '교열·윤문': 'Proofreading & Copyediting',
  '지방자치·의회': 'Local Governments & Councils',
  '지역경제·개발': 'Regional Economy',
  '지역사회·축제': 'Local Communities',
  '수도권·광역행정': 'Metropolitan Administration',
  '아파트분양·청약': 'Apartment Sales & Pre-sale',
  '재건축·재개발': 'Redevelopment',
  '상업용부동산': 'Commercial Real Estate',
  '국토부정책': 'Land & Transport Policy',
  '임대차시장': 'Rental Market',
  '속보·포털대응': 'Breaking News & Portals',
  '인터랙티브 기획': 'Interactive Stories',
  '소셜미디어·숏폼': 'Social Media & Short-form',
  '뉴스레터·오디오': 'Newsletters & Audio',
  '현장취재 사진': 'Field Photography',
  '정치·의전 사진': 'Political Photojournalism',
  '드론·항공 촬영': 'Drone & Aerials',
  '영상기획·유튜브': 'Video & YouTube',
  '사설 기획': 'Editorial Writing',
  '외부 칼럼 관리': 'External Columns',
  '기명 칼럼': 'Byline Columns',
  '독자마당': 'Letters & Readers Forum'
};

const getDeptNameLocal = (dept: string, isEn: boolean): string => {
  if (!isEn) return dept;
  const def = getDepartmentByName(dept);
  return def ? def.nameEn : dept;
};

// 현업 언론사 현실 고증 기자 유형 카탈로그 (한/영 완벽 대응)
const REPORTER_PROFILE_CATALOG: Record<string, ReporterProfileTemplate> = {
  // 1. 단일/주력 전문 유형
  '사건캡 출신 야전사령관': {
    reporterType: '사건캡 출신 야전사령관',
    reporterTypeEn: 'Field General & Former Crime Beat Cap',
    detailedSpecialty: '경찰서 라인부터 다져진 동물적 취재 감각과 데스크 지휘력',
    detailedSpecialtyEn: 'Instinctive breaking news sense and desk command honed from police precincts',
    description: '수습 시절 팩스방과 당직실을 거쳐 시경캡까지 역임한 야전 지휘관입니다. 사건 냄새를 맡으면 물불 안 가리고 후배들을 진두지휘하며, 취재원의 굳게 닫힌 입도 소주 한잔과 끈질긴 설득으로 열어젖히는 편집국의 든든한 돌격대장입니다.',
    descriptionEn: 'A battle-hardened commander who rose from the probationary night desk to City Desk Cap. Leading reporters fearlessly upon smelling breaking news, this leader opens tight-lipped sources over drinks and relentless persuasion.'
  },
  '열혈 사건팀 막내·현장 기동형': {
    reporterType: '열혈 사건팀 막내·현장 기동형',
    reporterTypeEn: 'Tenacious Crime Desk Rookie & Rapid Responder',
    detailedSpecialty: '경찰서 당직실과 사건 사고 현장을 누비는 발빠른 기동력',
    detailedSpecialtyEn: 'Fast-moving field mobility roaming police precincts and emergency scenes',
    description: '수습 팩스방을 거쳐 일선 경찰서 라인을 종횡무진 누비는 기동취재반의 주역입니다. 사건 냄새를 맡으면 가장 먼저 현장에 도착해 목격자를 찾고 취재원의 굳게 닫힌 문을 끈질기게 두드리는 편집국의 활력소입니다.',
    descriptionEn: 'The engine of the rapid-response team, cutting teeth across metropolitan police stations. The first to reach crime scenes, tracking down witnesses and knocking persistently on closed doors.'
  },
  '서초동 법조 라인 단독 제조기': {
    reporterType: '서초동 법조 라인 단독 제조기',
    reporterTypeEn: 'Supreme Court & Prosecutors Beat Scoop Machine',
    detailedSpecialty: '영장실질심사와 공소장 행간을 털어내는 법조통',
    detailedSpecialtyEn: 'Legal insider deciphering indictments and warrant hearings',
    description: '서울중앙지검과 대법원 기자실을 주 무대로 활약하는 엘리트 법조 기자입니다. 판·검사, 대형 로펌 변호사들과의 깊은 네트워크를 바탕으로 복잡한 법리 싸움 이면에 숨은 권력의 암투와 비리를 칼같이 단독 보도해 냅니다.',
    descriptionEn: 'An elite legal reporter based in the Central District Prosecutors Office and Supreme Court press rooms. Drawing on deep networks of judges, prosecutors, and top attorneys to break exclusives exposing high-stakes political and financial scandals.'
  },
  '의사당 베테랑 정치통': {
    reporterType: '의사당 베테랑 정치통',
    reporterTypeEn: 'National Assembly Political Veteran',
    detailedSpecialty: '의원회관과 정당 당사를 누비며 정국 판세를 꿰뚫는 정치 베테랑',
    detailedSpecialtyEn: 'Seasoned insider reading political tides across party headquarters and parliament halls',
    description: '국회 본청과 여야 당사를 내 집처럼 드나들며 여의도 정가의 내밀한 기류와 막전막후를 실시간으로 낚아챕니다. 당 지도부부터 보좌진 네트워크까지 꽉 쥐고 있어 총선 공천이나 계파 갈등의 판세를 입체적으로 읽어냅니다.',
    descriptionEn: 'Treating the Capitol and party headquarters like a second home, picking up backroom whispers and power shifts in real time. Connected from party leadership down to aides, analyzing electoral nominations and factional rivalries with sharp clarity.'
  },
  '관가 저승사자·세종시 정책통': {
    reporterType: '관가 저승사자·세종시 정책통',
    reporterTypeEn: 'Cabinet Watchdog & Sejong Policy Specialist',
    detailedSpecialty: '정부세종청사 보도자료의 허점을 까발리는 숫자 저격수',
    detailedSpecialtyEn: 'Fiscal sniper exposing flaws behind ministerial press releases in Sejong',
    description: '기획재정부, 산업부, 복지부 등 관가 관료들이 가장 껄끄러워하는 분석가입니다. 복잡한 통계 수치와 정책 용어 뒤에 숨겨진 세수 펑크나 예산 낭비를 귀신같이 찾아내 1면 톱기사로 꽂아 넣는 냉철한 정책 감시자입니다.',
    descriptionEn: 'The most feared analyst among bureaucrats in Finance, Industry, and Welfare ministries. A cold-eyed fiscal watchdog uncovering tax shortfalls and wasted budgets buried behind complex government statistics.'
  },
  '통화정책 & 거시경제 분석통': {
    reporterType: '통화정책 & 거시경제 분석통',
    reporterTypeEn: 'Monetary Policy & Macroeconomy Analyst',
    detailedSpecialty: '한국은행 기준금리와 외환시장·거시금융의 맥을 짚는 금융통',
    detailedSpecialtyEn: 'Central bank & FX insider parsing interest rates and global macroeconomic risks',
    description: '한국은행 본관과 금융당국을 출입하며 금리 결정과 환율 변동, 글로벌 금융 리스크의 인과관계를 날카롭게 분석합니다. 난해한 통화정책과 거시 지표를 명쾌하게 풀어내는 금융 저널리즘의 엘리트입니다.',
    descriptionEn: 'Covering the Bank of Korea and financial regulators to dissect rate decisions, currency swings, and systemic risks. An elite financial journalist demystifying dense monetary policy for the public.'
  },
  '재계 밸류체인을 꿰뚫는 산업 전략가': {
    reporterType: '재계 밸류체인을 꿰뚫는 산업 전략가',
    reporterTypeEn: 'Chaebol & Global Supply Chain Strategist',
    detailedSpecialty: '글로벌 공급망과 기업 지배구조를 해부하는 산업 전문기자',
    detailedSpecialtyEn: 'Dissecting corporate governance, semiconductors, and global supply chains',
    description: '주요 그룹의 사업 구조 개편과 재무제표, 글로벌 공급망을 훤히 꿰뚫고 있습니다. 기업 총수와 임원진의 결단부터 생산 공장의 제조 현장까지 넘나들며 반도체·배터리 등 국가 핵심 먹거리의 현주소를 입체적으로 전합니다.',
    descriptionEn: 'Thoroughly versed in business restructurings, financial balance sheets, and global supply lines. Moving seamlessly from boardroom intrigues to manufacturing factory floors to report on strategic national industries.'
  },
  '여의도 자본시장 파수꾼 (개미들의 구원투수)': {
    reporterType: '여의도 자본시장 파수꾼 (개미들의 구원투수)',
    reporterTypeEn: 'Capital Markets Guardian & Retail Investor Advocate',
    detailedSpecialty: '공시 해독과 작전 세력 사냥, 장마감 시황 머신',
    detailedSpecialtyEn: 'Deciphering regulatory filings, hunting market manipulators, and real-time market briefings',
    description: '증권선물거래소와 여의도 증권가를 누비며 수상한 전환사채(CB) 발행, 사모펀드의 무자본 M&A 등 자본시장의 불공정 거래를 추적합니다. 복잡한 공시를 개미 투자자의 눈높이로 풀어내는 시장 파수꾼입니다.',
    descriptionEn: 'Prowling the stock exchange and Yeouido securities houses to expose suspicious convertible bonds, leveraged buyout schemes, and unfair market trades. A retail investor ally translating opaque filings into clear warnings.'
  },
  '상복 터진 탐사보도 헌터': {
    reporterType: '상복 터진 탐사보도 헌터',
    reporterTypeEn: 'Award-Winning Investigative Hunter',
    detailedSpecialty: '취재수첩 10권과 엑셀 데이터로 이달의 기자상을 싹쓸이하는 장인',
    detailedSpecialtyEn: 'Master reporter sweeping Journalist of the Month awards with records requests and deep data',
    description: '단발성 속보에 연연하지 않고 수개월간 정보공개 청구와 심층 취재를 통해 사회의 구조적 모순을 고발합니다. 한번 물면 놓지 않는 집념으로 법 개정과 사회적 파장을 이끌어내며 회사에 트로피를 안겨주는 탐사 에이스입니다.',
    descriptionEn: 'Ignoring fleeting clickbait to spend months filing FOIA requests and digging deep into structural contradictions. A tenacious sleuth whose relentless exposés force legal reforms and bring home journalism trophies.'
  },
  '판교 테크 덕후·스타트업 사냥꾼': {
    reporterType: '판교 테크 덕후·스타트업 사냥꾼',
    reporterTypeEn: 'Silicon Valley & Pangyo Tech Geek / Startup Scout',
    detailedSpecialty: 'AI 혁명과 플랫폼 빅테크의 알고리즘을 털어내는 테크너드',
    detailedSpecialtyEn: 'Tech nerd tracking AI revolution, cloud giants, and unicorn algorithms',
    description: '테헤란로와 판교 테크노밸리의 밤을 함께 지새우는 혁신통입니다. 생성형 AI, 클라우드, 유니콘 스타트업의 지각 변동을 가장 발 빠르게 포착하여 난해한 기술 혁신을 독자들에게 친절하게 전달합니다.',
    descriptionEn: 'An innovation specialist burning the midnight oil across tech corridors. Swiftly capturing sea changes across generative AI, cloud platforms, and venture startups, presenting complex tech trends with engaging clarity.'
  },
  '더그아웃의 하이에나·스포츠 현장 승부사': {
    reporterType: '더그아웃의 하이에나·스포츠 현장 승부사',
    reporterTypeEn: 'Dugout Insider & High-Stakes Sports Reporter',
    detailedSpecialty: '경기장 락커룸과 스토브리그 이적설을 쥐락펴락하는 현장 마당발',
    detailedSpecialtyEn: 'Well-connected field insider commanding locker rooms and stove-league transfer scoops',
    description: '프로야구·축구 경기장과 선수단 훈련장을 지키며 경기 결과 뒤에 숨은 선수와 감독의 인간 드라마를 포착합니다. 스토브리그 FA 계약과 사령탑 경질 등 굵직한 단독 특종을 터뜨리는 그라운드의 승부사입니다.',
    descriptionEn: 'Stationed at stadium dugouts and training grounds, capturing the human drama behind match scores. A veteran scoop hound breaking exclusive free-agency signings and managerial shake-ups.'
  },
  '시사회 단골·대중문화 비평가': {
    reporterType: '시사회 단골·대중문화 비평가',
    reporterTypeEn: 'Red Carpet Regular & Pop Culture Critic',
    detailedSpecialty: 'K-콘텐츠 생태계와 시대적 감수성을 꿰뚫는 트렌드세터',
    detailedSpecialtyEn: 'Trendsetter discerning the K-content ecosystem and cultural zeitgeist',
    description: '칸 영화제부터 아이돌 쇼케이스, OTT 시리즈 신작까지 문화 콘텐츠의 전선을 누빕니다. 대중의 취향을 정확히 짚어내는 감각적인 문장력과 문화 비평을 결합하여 시대의 유행을 독자들에게 명쾌하게 해설합니다.',
    descriptionEn: 'Roaming the cultural frontlines from international film festivals to K-pop showcases and streaming premieres. Combining perceptive cultural critiques with stylish prose to capture the public taste.'
  },
  '포털 랭킹 1위의 제왕·트래픽 폭격기': {
    reporterType: '포털 랭킹 1위의 제왕·트래픽 폭격기',
    reporterTypeEn: 'Traffic Kingpin & Front-Page Headline Alchemist',
    detailedSpecialty: '실검과 포털 메인을 장악하는 헤드라인 연금술사',
    detailedSpecialtyEn: 'Headline wizard dominating search trends and portal main pages',
    description: '어떤 이슈든 독자의 시선을 단숨에 사로잡는 마법 같은 제목과 속보 호흡으로 디지털 트래픽을 폭발시킵니다. SNS와 커뮤니티의 민심을 1초 만에 캐치하여 미디어의 도달 범위를 극대화하는 온라인 뉴스룸의 핵심 동력입니다.',
    descriptionEn: 'Igniting digital traffic with hypnotic headlines and swift-breaking news instincts. Capturing social media sentiment in an instant to maximize media reach as an indispensable online newsroom engine.'
  },
  '외교관보다 바쁜 국제부 번역·분석 머신': {
    reporterType: '외교관보다 바쁜 국제부 번역·분석 머신',
    reporterTypeEn: 'Global Affairs Analyst & Real-Time Wire Machine',
    detailedSpecialty: '미 대선과 글로벌 지정학 리스크를 실시간 타전하는 엘리트',
    detailedSpecialtyEn: 'Elite analyst monitoring superpower rivalry, elections, and geopolitical risks around the clock',
    description: 'CNN, 블룸버그, 로이터의 긴급 타전을 24시간 모니터링하며 한반도 정세와 미·중 패권 전쟁의 여파를 정밀 분석합니다. 영어 원문 자료를 총알처럼 독해하며 해외 특파원 부임을 호시탐탐 노리는 글로벌 역량자입니다.',
    descriptionEn: 'Monitoring CNN, Bloomberg, and Reuters wires 24/7, analyzing global repercussions on the Korean peninsula. Swiftly translating and dissecting foreign intelligence while eyeing the next foreign correspondent posting.'
  },
  '지역 민심 꿰뚫는 로컬 맹주 전국부': {
    reporterType: '지역 민심 꿰뚫는 로컬 맹주 전국부',
    reporterTypeEn: 'Grassroots Regional Bureau Sovereign',
    detailedSpecialty: '지방 시·도청 토착 권력과 지역 현안의 숨은 내막을 아는 터줏대감',
    detailedSpecialtyEn: 'Local authority insider uncovering regional power structures and community concerns',
    description: '서울 중심의 뉴스 프레임을 깨고 전국 각지의 생생한 현장 목소리를 전달합니다. 지역 단체장과 토착 유지들의 은밀한 결탁부터 지방 소멸의 아픈 현실까지 발로 뛰어 기록하는 풀뿌리 저널리즘의 버팀목입니다.',
    descriptionEn: 'Breaking past Seoul-centric news frameworks to deliver vivid grassroots voices. Reporting on the ground from collusions among provincial officials to the stark realities of regional depopulation.'
  },
  '편집국 마당발 올라운더 (멀티플레이어)': {
    reporterType: '편집국 마당발 올라운더 (멀티플레이어)',
    reporterTypeEn: 'Newsroom All-Rounder & Ultimate Survivor',
    detailedSpecialty: '어느 부서에 던져놓아도 첫날부터 1인분 이상 해내는 만능 생존왕',
    detailedSpecialtyEn: 'Versatile operator pulling more than their weight from day one on any desk',
    description: '사회부 현장 취재부터 산업부 기업 기사, 정치부 백브리핑까지 안 해본 출입처가 없는 베테랑입니다. 급작스러운 공석이나 대형 이슈가 터졌을 때 편집국장이 가장 먼저 찾는 구원투수이자 적응력의 끝판왕입니다.',
    descriptionEn: 'A seasoned veteran who has covered everything from crime beats and corporate earnings to political scrums. The go-to troubleshooter the Editor-in-Chief calls upon during sudden vacancies or major breaking news crises.'
  },
  '새 영역 개척하는 호기심 천국형': {
    reporterType: '새 영역 개척하는 호기심 천국형',
    reporterTypeEn: 'Curious Pioneer & Cross-Domain Explorer',
    detailedSpecialty: '출입처 경계를 허물며 새로운 융합 기획을 파고드는 탐험가',
    detailedSpecialtyEn: 'Adventurous reporter blurring beat boundaries to forge hybrid investigative features',
    description: '기존 출입처의 관행에 얽매이지 않고 인접 분야와의 시너지를 창출하는 다재다능한 기자입니다. 사회부 시각으로 경제를 보고, IT 감각으로 문화를 취재하며 차별화된 하이브리드 기사를 생산해 냅니다.',
    descriptionEn: 'Unfettered by beat traditions, finding powerful synergies across adjacent fields. Viewing economics through a social lens and reporting culture with tech savviness to produce differentiated hybrid journalism.'
  },

  // 2. 부서 간 연계 시너지 특화 유형
  '금융범죄·기업비리 추적 스페셜리스트': {
    reporterType: '금융범죄·기업비리 추적 스페셜리스트',
    reporterTypeEn: 'Financial Crime & Corporate Corruption Sleuth',
    detailedSpecialty: '서초동 검찰 라인과 자본시장 자금 흐름을 동시에 꿰뚫는 특수통',
    detailedSpecialtyEn: 'Special prosecutor beat instincts combined with capital market forensic accounting',
    description: '사회부 법조 출입으로 다진 수사 기밀 취재력과 증권·경제부의 재무제표 공시 분석력을 결합했습니다. 대형 경제 비리 게이트와 주가조작 세력의 꼬리를 가장 집요하게 물어뜯는 편집국의 강력한 사냥꾼입니다.',
    descriptionEn: 'Melding investigative prosecution reporting with financial balance sheet forensics. A formidable predator tracking corporate embezzlement schemes and stock price manipulation rings.'
  },
  '반도체부터 AI까지, 테크 패권 전략가': {
    reporterType: '반도체부터 AI까지, 테크 패권 전략가',
    reporterTypeEn: 'Semiconductor to AI Tech Hegemony Strategist',
    detailedSpecialty: '하드웨어 제조 공급망과 빅테크 플랫폼 소프트웨어를 아우르는 산업 분석가',
    detailedSpecialtyEn: 'Industrial analyst spanning hardware manufacturing and big-tech software ecosystems',
    description: '산업부 대기업(반도체·모빌리티) 취재와 IT산업부(AI·플랫폼·스타트업) 취재를 연계하여, 글로벌 기술 패권 경쟁의 전선과 국내 산업 생태계의 대전환을 입체적으로 해부하는 에이스입니다.',
    descriptionEn: 'Linking chaebol manufacturing coverage with big tech AI startups to dissect global tech dominance and the restructuring of the national industrial ecosystem.'
  },
  '글로벌 통상전쟁 & 공급망 분석가': {
    reporterType: '글로벌 통상전쟁 & 공급망 분석가',
    reporterTypeEn: 'Global Trade War & Supply Chain Analyst',
    detailedSpecialty: '미·중 지정학 패권 갈등과 국내 수출 기업의 나비효과를 읽는 전략가',
    detailedSpecialtyEn: 'Strategic analyst mapping US-China geopolitical friction to domestic exporters',
    description: '국제부의 외신 모니터링 감각과 산업·경제부의 실물 현장 취재를 융합했습니다. 워싱턴과 베이징의 통상 규제가 국내 반도체, 배터리 공장에 미치는 파급력을 날카롭게 짚어냅니다.',
    descriptionEn: 'Fusing global foreign wire analysis with domestic industrial field reporting to pinpoint how Washington and Beijing trade restrictions ripple across domestic semiconductor and battery facilities.'
  },
  '국가 재정·연금 개혁의 메스, 거시정책 설계자': {
    reporterType: '국가 재정·연금 개혁의 메스, 거시정책 설계자',
    reporterTypeEn: 'Fiscal & Pension Reform Policy Architect',
    detailedSpecialty: '기재부의 국가 재정 곳간과 복지·노동 현장의 고통을 잇는 정책통',
    detailedSpecialtyEn: 'Policy specialist bridging government treasury coffers with grassroots welfare realities',
    description: '경제부(세종 관가)의 예산·세제 분석력과 사회정책부(노동·연금·복지)의 현장 감각을 결합했습니다. 선심성 포퓰리즘 정책의 허점을 숫자로 까발리고 지속 가능한 대안을 제시하는 정통 정책 기자입니다.',
    descriptionEn: 'Combining budget and tax analysis from Sejong with on-the-ground labor and pension coverage. Exposing populist flaws with hard numbers and proposing sustainable policy alternatives.'
  },
  '한 우물만 판 외길 외골수 장인': {
    reporterType: '한 우물만 판 외길 외골수 장인',
    reporterTypeEn: 'Single-Beat Purist & Irreplaceable Authority',
    detailedSpecialty: '출입처의 살아있는 족보이자 대체 불가능한 1타 전문기자',
    detailedSpecialtyEn: 'Living encyclopedia and premier authority on their designated beat',
    description: '순환 보직의 유혹을 뿌리치고 한 분야에서 10년 가까이 명맥을 지켜왔습니다. 해당 분야의 20년 역사와 주요 취재원의 계보를 훤히 꿰뚫고 있어, 타사 기자들이 기사를 쓰기 전에 먼저 자문을 구하는 장인입니다.',
    descriptionEn: 'Rejecting rotating desk assignments to guard a single beat for over a decade. Possessing deep institutional memory and source genealogies, serving as the trusted advisor other reporters consult first.'
  }
};

// 부서 간 연계 시너지 분석 함수 (한/영 완벽 대응)
function analyzeSynergy(
  careers: CareerRecord[],
  uniqueDepts: string[],
  deptMonths: Record<string, number>,
  totalMonths: number,
  isLawFocus: boolean,
  isSejongFocus: boolean,
  isEn: boolean = false
): CareerSynergy | undefined {
  if (careers.length < 2) {
    if (careers.length === 1 && careers[0].periodMonths >= 48) {
      const dept = careers[0].deptName;
      const deptDisplay = getDeptNameLocal(dept, isEn);
      return {
        title: isEn ? 'Single-Desk Dedicated Specialist' : '단일 부서 집중 장인형',
        combination: isEn ? `${deptDisplay} Single Long-Term Beat` : `${dept} 단독 장기 근속`,
        description: isEn
          ? `Focused deeply on [${deptDisplay}] without wandering, achieving peak domain expertise.`
          : `다른 부서로 한눈팔지 않고 [${dept}]에 깊게 천착하여 출입처 최고의 전문성을 확보했습니다.`
      };
    }
    return undefined;
  }

  const hasEconomy = (deptMonths['경제부'] || 0) > 0;
  const hasIndustry = (deptMonths['산업부'] || 0) > 0;
  const hasStock = (deptMonths['증권부'] || 0) > 0;
  const hasIT = (deptMonths['IT산업부'] || 0) > 0;
  const hasPolitics = (deptMonths['정치부'] || 0) > 0;
  const hasSociety = (deptMonths['사회부'] || 0) > 0;
  const hasGlobal = (deptMonths['국제부'] || 0) > 0;
  const hasInvest = (deptMonths['기획취재부'] || 0) > 0;
  const hasPolicy = (deptMonths['사회정책부'] || 0) > 0;
  const hasSports = (deptMonths['스포츠부'] || 0) > 0;
  const hasCulture = (deptMonths['문화부'] || 0) > 0;

  // 1. 법조(사회부) + 경제/증권
  if (hasSociety && isLawFocus && (hasEconomy || hasStock)) {
    return {
      title: isEn ? 'Legal Investigation × Capital Market Forensics Synergy' : '법조 수사 × 자본시장 추적 시너지',
      combination: isEn ? 'Metro (Courts & Prosecutors) + Economy & Securities' : '사회부(검찰·법원) + 경제·증권부',
      description: isEn
        ? 'Combines confidential investigative sources with balance sheet analysis to pinpoint corporate corruption.'
        : '검찰 특수부 수사 기밀 취재력에 기업 재무제표와 공시 해독력을 결합하여, 대형 경제 비리 게이트를 정조준하는 강력한 융합 역량을 발휘합니다.'
    };
  }

  // 2. 산업부 + IT산업부
  if (hasIndustry && hasIT) {
    return {
      title: isEn ? 'Manufacturing Supply Chain × Big Tech AI Synergy' : '제조업 공급망 × 빅테크 AI 생태계 시너지',
      combination: isEn ? 'Industry + IT Industry' : '산업부 + IT산업부',
      description: isEn
        ? 'Vertically integrated tech analysis from legacy manufacturing to startup AI platforms.'
        : '반도체·모빌리티 등 국가 기간 제조업부터 판교 스타트업과 생성형 AI 플랫폼까지 수직 계열화된 테크 패권 분석력을 보유하고 있습니다.'
    };
  }

  // 3. 사회부 + 정치부
  if (hasSociety && hasPolitics) {
    return {
      title: isEn ? 'Crime Beat Grit × National Assembly Political Insight Synergy' : '사건 현장 야전 근성 × 여의도 정국 판세 시너지',
      combination: isEn ? 'Metro + Politics' : '사회부 + 정치부',
      description: isEn
        ? 'Harnesses raw precinct persistence to uncover backroom parliamentary deals and assess political rumors.'
        : '경찰서 마와리 시절 체득한 집요한 돌파력으로 여의도 의원회관의 은밀한 밀실 야합과 지라시의 진위를 날카롭게 가려냅니다.'
    };
  }

  // 4. 국제부 + 산업/경제부
  if (hasGlobal && (hasIndustry || hasEconomy)) {
    return {
      title: isEn ? 'Global Foreign Desk Insight × Domestic Industry Synergy' : '글로벌 외신 인사이트 × 국내 산업 현장 시너지',
      combination: isEn ? 'International + Industry & Economy' : '국제부 + 산업·경제부',
      description: isEn
        ? 'Synthesizes foreign policy and exchange movements to illuminate real impacts on domestic export industries.'
        : '미·중 패권 갈등과 글로벌 관세, 환율 변동이 국내 주력 수출 기업들의 공급망에 미치는 실질적 파급력을 입체 조망합니다.'
    };
  }

  // 5. 기획취재부 + 사회/경제부
  if (hasInvest && (hasSociety || hasEconomy)) {
    return {
      title: isEn ? 'Deep Data FOIA Investigation × Raw Field Reporting Synergy' : '심층 데이터 탐사 × 날것의 현장 취재력 시너지',
      combination: isEn ? 'Special Investigations + Metro & Economy' : '기획취재부 + 사회·경제부',
      description: isEn
        ? 'Pairs massive FOIA data mining with face-to-face interviews to produce policy-shifting investigative exclusives.'
        : '방대한 정보공개 청구 데이터 분석과 현장 취재원의 입을 여는 대면 취재력을 결합해 제도를 바꾸는 특종을 생산합니다.'
    };
  }

  // 6. 경제부(세종) + 사회정책부
  if (hasEconomy && isSejongFocus && hasPolicy) {
    return {
      title: isEn ? 'Fiscal Macro Analysis × Welfare & Labor Beat Synergy' : '국가 재정 거시 분석 × 복지·노동 현장 시너지',
      combination: isEn ? 'Economy (Sejong Policy) + Social Policy' : '경제부(세종정책) + 사회정책부',
      description: isEn
        ? 'Evaluates state budget realities alongside urgent labor and welfare demands to filter out fiscal populism.'
        : '정부 곳간(예산·세제)의 현실과 복지·연금 현장의 절박함을 동시에 검증하여 포퓰리즘을 걸러내는 정통 정책 분석 역량을 갖추었습니다.'
    };
  }

  // 7. 스포츠부 + 문화부
  if (hasSports && hasCulture) {
    return {
      title: isEn ? 'Public Sensibility × Athletic Competition Synergy' : '대중 감수성 × 그라운드 승부사 엔터 시너지',
      combination: isEn ? 'Sports + Culture & Entertainment' : '스포츠부 + 문화부',
      description: isEn
        ? 'Captures the pulse of athletic showdowns and pop culture trends in accessible, engaging writing.'
        : '경기장의 박진감 넘치는 호흡과 K-컬처 엔터테인먼트의 트렌드를 감각적인 필력으로 녹여내는 대중 친화적 콘텐츠 전문가입니다.'
    };
  }

  // 단일 부서 비중 75% 이상
  const maxDeptRatio = Math.max(...Object.values(deptMonths)) / Math.max(1, totalMonths);
  if (maxDeptRatio >= 0.75) {
    const mainDept = Object.entries(deptMonths).sort((a, b) => b[1] - a[1])[0][0];
    const mainDeptDisplay = getDeptNameLocal(mainDept, isEn);
    return {
      title: isEn ? 'Single-Beat Mastery Focus' : '출입처 외길 집중형',
      combination: isEn ? `${mainDeptDisplay} Concentrated Focus` : `${mainDept} 집중 특화`,
      description: isEn
        ? `Invested over 75% of total tenure in [${mainDeptDisplay}], becoming an irreplaceable institutional fixture.`
        : `전체 경력의 75% 이상을 [${mainDept}]에 쏟아부어 해당 분야의 대체 불가능한 족보이자 전문기자로 자리잡았습니다.`
    };
  }

  return {
    title: isEn ? 'Diversified Multi-Beat Synergy' : '다변화 순환 시너지',
    combination: isEn
      ? uniqueDepts.slice(0, 3).map(d => getDeptNameLocal(d, isEn)).join(' → ')
      : uniqueDepts.slice(0, 3).join(' → '),
    description: isEn
      ? 'Bridged beat boundaries across diverse news desks, offering multifaceted perspectives on current affairs.'
      : '여러 부서를 두루 거치며 취재 영역의 경계를 허물고, 복합적인 관점으로 뉴스의 이면을 입체적으로 조명합니다.'
  };
}

export function analyzeCareer(careers: CareerRecord[], isEn: boolean = false): CareerAnalysisResult {
  const totalMonths = careers.reduce((sum, c) => sum + c.periodMonths, 0);
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  const totalYearsText = isEn
    ? (remainingMonths === 0
        ? `${years} ${years === 1 ? 'yr' : 'yrs'}`
        : `${years} ${years === 1 ? 'yr' : 'yrs'} ${remainingMonths} ${remainingMonths === 1 ? 'mo' : 'mos'}`)
    : (remainingMonths === 0 
        ? `${years}년` 
        : `${years}년 ${remainingMonths}개월`);

  // 기본 빈 경력 처리 (수습 기자)
  if (careers.length === 0 || totalMonths === 0) {
    return {
      totalMonths: 0,
      totalYearsText: isEn ? '0 yrs' : '0년',
      reporterType: isEn ? 'Rookie Cub Reporter on Day 1 Beat Patrol' : '세상 물정 모르는 풋내기 수습 (마와리 1일차)',
      detailedSpecialty: isEn ? 'Unpolished diamond sleeping on precinct sofas, unfazed by desk reprimands' : '경찰서 당직실에서 쪽잠 자며 선배에게 털려도 눈빛만은 살아있는 원석',
      description: isEn
        ? 'Gripping notebook and pen, learning reporting fundamentals across police precincts and district offices. A 100% pure ball of passion racing under deadline pressure with dreams of breaking scoops.'
        : '취재 수첩과 펜을 꼭 쥐고 경찰서 형사계와 지구대를 돌며 기자의 기본기를 배우는 중입니다. 선배의 불호령과 마감 압박 속에서도 특종 기자의 꿈을 품고 달리는 순도 100%의 열정 덩어리입니다.',
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
          title: isEn ? 'Classic Metro Field Beat Route' : '정통 사회부 야전 코스',
          routeName: isEn ? 'Metro → National → Politics' : '사회부 → 전국부 → 정치부',
          description: isEn
            ? 'Hone core reporting grit on crime beats before advancing into national parliamentary politics.'
            : '사건사고 현장에서 뼈를 깎는 취재 기본기를 다진 뒤 여의도 정치권으로 진출하는 정통 기자 코스입니다.',
          steps: isEn ? ['Metro', 'National', 'Politics'] : ['사회부', '전국부', '정치부']
        },
        {
          type: 'B',
          title: isEn ? 'Elite Economy & Industry Route' : '엘리트 경제·산업 코스',
          routeName: isEn ? 'Industry → Economy → Securities' : '산업부 → 경제부 → 증권부',
          description: isEn
            ? 'Gain mastery of corporate field operations and macro policy to monitor Korean capitalism.'
            : '기업 현장과 거시 정책을 두루 섭렵하며 한국 자본주의의 핵심부를 감시하는 금융·산업 전문가 경로입니다.',
          steps: isEn ? ['Industry & Tech', 'Economy', 'Securities'] : ['산업부', '경제부', '증권부']
        },
        {
          type: 'C',
          title: isEn ? 'Trend & Digital Editorial Route' : '트렌드 & 디지털 기획 코스',
          routeName: isEn ? 'Digital News → IT Industry → Special Investigations' : '디지털뉴스부 → IT산업부 → 기획취재부',
          description: isEn
            ? 'Master portal traffic dynamics and tech ecosystems before pivoting to large-scale data journalism.'
            : '포털 트래픽 감각과 테크 생태계를 체득한 뒤 대형 데이터 탐사보도로 전환하는 현대적 성공 방정식입니다.',
          steps: isEn ? ['Digital News', 'IT Industry', 'Special Investigations'] : ['디지털뉴스부', 'IT산업부', '기획취재부']
        }
      ]
    };
  }

  // 1. 최근 경력에 가중치(Recency Weight) 부여
  const deptRawMonths: Record<string, number> = {};
  const deptWeightedMonths: Record<string, number> = {};
  const subFieldCounts: Record<string, number> = {};
  const uniqueDepts: string[] = [];

  careers.forEach((c, idx) => {
    if (!uniqueDepts.includes(c.deptName)) {
      uniqueDepts.push(c.deptName);
    }
    deptRawMonths[c.deptName] = (deptRawMonths[c.deptName] || 0) + c.periodMonths;

    // 최신성 가중치: 과거 블록은 0.75, 가장 최근 블록은 1.55배로 가중
    const recencyFactor = careers.length <= 1
      ? 1.0
      : 0.75 + (idx / (careers.length - 1)) * 0.80; // 0.75 ~ 1.55

    const weightedPeriod = c.periodMonths * recencyFactor;
    deptWeightedMonths[c.deptName] = (deptWeightedMonths[c.deptName] || 0) + weightedPeriod;

    if (c.subFields && c.subFields.length > 0) {
      c.subFields.forEach(sf => {
        const actualMonths = typeof sf.months === 'number' && sf.months > 0 
          ? sf.months 
          : Math.round(c.periodMonths / c.subFields.length);
        // 세부 분야에도 최신성 가중치 반영
        subFieldCounts[sf.name] = (subFieldCounts[sf.name] || 0) + (actualMonths * recencyFactor);
      });
    }
  });

  const totalWeighted = Object.values(deptWeightedMonths).reduce((sum, v) => sum + v, 0);

  const sortedSubFields = Object.entries(subFieldCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([field, months]) => ({
      field: isEn ? (SUBFIELD_TRANSLATIONS[field] || field) : field,
      months: Math.round(months),
      ratio: Math.round((months / totalWeighted) * 1000) / 10
    }));

  // 가중치가 적용된 주요 도메인별 영향력 계산
  const ecoIndustryW = (deptWeightedMonths['경제부'] || 0) + (deptWeightedMonths['산업부'] || 0) + (deptWeightedMonths['증권부'] || 0) + (deptWeightedMonths['부동산부'] || 0) + (deptWeightedMonths['IT산업부'] || 0);
  const politicsPolicyW = (deptWeightedMonths['정치부'] || 0) + (deptWeightedMonths['외교안보부'] || 0) + (deptWeightedMonths['사회정책부'] || 0);
  const societyW = (deptWeightedMonths['사회부'] || 0) + (deptWeightedMonths['전국부'] || 0);
  const investDataW = (deptWeightedMonths['기획취재부'] || 0);
  const globalW = (deptWeightedMonths['국제부'] || 0) + (deptWeightedMonths['외교안보부'] || 0);
  const cultureW = (deptWeightedMonths['문화부'] || 0);
  const sportsW = (deptWeightedMonths['스포츠부'] || 0);
  const techDigitalW = (deptWeightedMonths['IT산업부'] || 0) + (deptWeightedMonths['디지털뉴스부'] || 0);

  // 특화 키워드 체크 (한글 원본 키워드로 감지)
  const rawSubFieldNames = Object.keys(subFieldCounts);
  const isLawFocus = rawSubFieldNames.some(s => s.includes('검찰') || s.includes('법원') || s.includes('사법'));
  const isSejongFocus = rawSubFieldNames.some(s => s.includes('세종') || s.includes('기재부') || s.includes('세종정책') || s.includes('예산'));
  const isBokMacroFocus = rawSubFieldNames.some(s => s.includes('한국은행') || s.includes('금리') || s.includes('금융') || s.includes('통화') || s.includes('거시'));

  // 2. 부서 간 연계 시너지 분석 도출
  const careerSynergy = analyzeSynergy(careers, uniqueDepts, deptRawMonths, totalMonths, isLawFocus, isSejongFocus, isEn);

  // 3. 유형 매칭 로직 (최신성 가중치 기반 + 부서 간 연계 반영)
  let catalogKey = '편집국 마당발 올라운더 (멀티플레이어)';

  // 부서 간 연계 특화가 뚜렷한 경우 최우선 매칭
  if (careerSynergy && (careerSynergy.title.includes('금융범죄') || careerSynergy.title.includes('Financial Crime'))) {
    catalogKey = '금융범죄·기업비리 추적 스페셜리스트';
  } else if (careerSynergy && (careerSynergy.title.includes('제조업 공급망') || careerSynergy.title.includes('Manufacturing Supply Chain'))) {
    catalogKey = '반도체부터 AI까지, 테크 패권 전략가';
  } else if (careerSynergy && (careerSynergy.title.includes('글로벌 외신') || careerSynergy.title.includes('Global Foreign Desk'))) {
    catalogKey = '글로벌 통상전쟁 & 공급망 분석가';
  } else if (careerSynergy && (careerSynergy.title.includes('국가 재정 거시') || careerSynergy.title.includes('Fiscal Macro Analysis'))) {
    catalogKey = '국가 재정·연금 개혁의 메스, 거시정책 설계자';
  } else if (careerSynergy && (careerSynergy.title.includes('외길 집중형') || careerSynergy.title.includes('Single-Beat Mastery'))) {
    catalogKey = '한 우물만 판 외길 외골수 장인';
  } else if (sportsW / totalWeighted >= 0.35) {
    catalogKey = '더그아웃의 하이에나·스포츠 현장 승부사';
  } else if (cultureW / totalWeighted >= 0.35) {
    catalogKey = '시사회 단골·대중문화 비평가';
  } else if (isSejongFocus && (deptWeightedMonths['경제부'] || 0) >= 12) {
    catalogKey = '관가 저승사자·세종시 정책통';
  } else if (isBokMacroFocus && (deptWeightedMonths['경제부'] || 0) >= 12) {
    catalogKey = '통화정책 & 거시경제 분석통';
  } else if ((deptWeightedMonths['증권부'] || 0) / totalWeighted >= 0.35) {
    catalogKey = '여의도 자본시장 파수꾼 (개미들의 구원투수)';
  } else if (investDataW / totalWeighted >= 0.25) {
    catalogKey = '상복 터진 탐사보도 헌터';
  } else if (politicsPolicyW / totalWeighted >= 0.40) {
    if ((deptWeightedMonths['외교안보부'] || 0) >= (deptWeightedMonths['정치부'] || 0)) {
      catalogKey = '외교관보다 바쁜 국제부 번역·분석 머신';
    } else {
      catalogKey = '의사당 베테랑 정치통';
    }
  } else if (globalW / totalWeighted >= 0.40) {
    catalogKey = '외교관보다 바쁜 국제부 번역·분석 머신';
  } else if (societyW / totalWeighted >= 0.40) {
    if (isLawFocus) {
      catalogKey = '서초동 법조 라인 단독 제조기';
    } else if ((deptWeightedMonths['전국부'] || 0) > (deptWeightedMonths['사회부'] || 0)) {
      catalogKey = '지역 민심 꿰뚫는 로컬 맹주 전국부';
    } else {
      // 5년(60개월) 이상이면 사건캡/시경캡, 그 미만이면 현장 기동형
      catalogKey = totalMonths >= 60 ? '사건캡 출신 야전사령관' : '열혈 사건팀 막내·현장 기동형';
    }
  } else if (techDigitalW / totalWeighted >= 0.38) {
    if ((deptWeightedMonths['디지털뉴스부'] || 0) > (deptWeightedMonths['IT산업부'] || 0)) {
      catalogKey = '포털 랭킹 1위의 제왕·트래픽 폭격기';
    } else {
      catalogKey = '판교 테크 덕후·스타트업 사냥꾼';
    }
  } else if (ecoIndustryW / totalWeighted >= 0.40) {
    if ((deptWeightedMonths['산업부'] || 0) >= (deptWeightedMonths['경제부'] || 0)) {
      catalogKey = '재계 밸류체인을 꿰뚫는 산업 전략가';
    } else if (isBokMacroFocus) {
      catalogKey = '통화정책 & 거시경제 분석통';
    } else {
      catalogKey = '관가 저승사자·세종시 정책통';
    }
  } else if (careers.length >= 3) {
    catalogKey = '편집국 마당발 올라운더 (멀티플레이어)';
  } else {
    catalogKey = '새 영역 개척하는 호기심 천국형';
  }

  // 카탈로그에서 매칭 문구 가져오기
  const matchedTemplate = REPORTER_PROFILE_CATALOG[catalogKey] || REPORTER_PROFILE_CATALOG['편집국 마당발 올라운더 (멀티플레이어)'];
  const reporterType = isEn ? matchedTemplate.reporterTypeEn : matchedTemplate.reporterType;
  const detailedSpecialty = isEn ? matchedTemplate.detailedSpecialtyEn : matchedTemplate.detailedSpecialty;
  const description = isEn ? matchedTemplate.descriptionEn : matchedTemplate.description;

  // 4. 스킬트리 계산 (최신성 가중치 적용 & 완만한 로그 성장 곡선)
  const calcScore = (weightedMonths: number, baseWeight: number = 1.0) => {
    if (weightedMonths <= 0) return 15;
    const effective = weightedMonths * baseWeight;
    const curve = Math.round(15 + 23 * Math.log(1 + effective / 6));
    return Math.max(15, Math.min(98, curve));
  };

  const skillTree: Record<string, number> = {
    '정치·정책': calcScore((deptWeightedMonths['정치부'] || 0) * 1.0 + (deptWeightedMonths['사회정책부'] || 0) * 0.6),
    '경제·금융': calcScore((deptWeightedMonths['경제부'] || 0) * 1.0 + (deptWeightedMonths['증권부'] || 0) * 0.9),
    '기업·산업': calcScore((deptWeightedMonths['산업부'] || 0) * 1.0 + (deptWeightedMonths['IT산업부'] || 0) * 0.8),
    '외교·국제': calcScore((deptWeightedMonths['국제부'] || 0) * 1.0 + (deptWeightedMonths['외교안보부'] || 0) * 1.0),
    '현장취재': calcScore((deptWeightedMonths['사회부'] || 0) * 1.1 + (deptWeightedMonths['전국부'] || 0) * 0.8),
    '탐사·기획': calcScore((deptWeightedMonths['기획취재부'] || 0) * 1.2 + (deptWeightedMonths['오피니언부'] || 0) * 0.5),
    '데이터 분석': calcScore((deptWeightedMonths['기획취재부'] || 0) * 0.8 + (deptWeightedMonths['디지털뉴스부'] || 0) * 0.6),
    '기술·디지털': calcScore((deptWeightedMonths['IT산업부'] || 0) * 1.0 + (deptWeightedMonths['디지털뉴스부'] || 0) * 1.0),
    '콘텐츠·편집': calcScore((deptWeightedMonths['편집부'] || 0) * 1.2 + (deptWeightedMonths['사진영상부'] || 0) * 0.8),
  };

  // 5. 커리어패스 3가지 추천 생성
  const recentDept = careers[careers.length - 1].deptName;
  const recentDeptDisplay = getDeptNameLocal(recentDept, isEn);

  let pathA: CareerPathRecommendation;
  let pathB: CareerPathRecommendation;
  let pathC: CareerPathRecommendation;

  if (ecoIndustryW > politicsPolicyW && ecoIndustryW > societyW) {
    pathA = {
      type: 'A',
      title: isEn ? 'Macroeconomy & Capital Markets Expert Route' : '거시경제 & 여의도 자본시장 전문가 코스',
      routeName: isEn
        ? `${recentDeptDisplay} → Securities → Special Investigations`
        : `${recentDept} → 증권부 → 기획취재부`,
      description: isEn
        ? 'Add securities filing analysis and deep accounting audits to industrial field experience to monitor market power brokers.'
        : '산업 현장 취재 경험에 자본시장 공시 해독과 심층 회계 분석을 더해 시장의 큰손들을 감시하는 전문가 경로입니다.',
      steps: isEn ? [recentDeptDisplay, 'Securities', 'Special Investigations'] : [recentDept, '증권부', '기획취재부']
    };
    pathB = {
      type: 'B',
      title: isEn ? 'Global Trade & Chaebol Hegemony Route' : '글로벌 통상 & 대기업 패권 추적 코스',
      routeName: isEn
        ? `${recentDeptDisplay} → International → Industry & Tech`
        : `${recentDept} → 국제부 → 산업부`,
      description: isEn
        ? 'Expand corporate coverage into the global supply chain battlefield and international trade arenas.'
        : '국내 대기업 취재를 미국·중국 글로벌 공급망 전쟁과 국제 통상 무대로 확장하는 대형 기획 코스입니다.',
      steps: isEn ? [recentDeptDisplay, 'International', 'Industry & Tech'] : [recentDept, '국제부', '산업부']
    };
    pathC = {
      type: 'C',
      title: isEn ? 'Economic Investigative Journalist Transition' : '경제 탐사 저널리스트 파격 전환',
      routeName: isEn
        ? `${recentDeptDisplay} → Special Investigations → Social Policy`
        : `${recentDept} → 기획취재부 → 사회정책부`,
      description: isEn
        ? 'Wield balance sheets and public data to expose income disparity, pension reform, and labor rights.'
        : '기업 재무제표와 공공 데이터를 무기로 빈부격차, 연금 개혁, 노동 현안을 깊숙이 파헤치는 탐사보도 경로입니다.',
      steps: isEn ? [recentDeptDisplay, 'Special Investigations', 'Social Policy'] : [recentDept, '기획취재부', '사회정책부']
    };
  } else if (politicsPolicyW >= societyW) {
    pathA = {
      type: 'A',
      title: isEn ? 'Parliamentary Veteran & Editorial Columnist Route' : '정치부 터줏대감 & 논설위원 코스',
      routeName: isEn
        ? `${recentDeptDisplay} → Politics → Opinion & Editorial`
        : `${recentDept} → 정치부 → 오피니언부`,
      description: isEn
        ? 'Leverage deep political analysis built in parliament and presidential office to shape public opinion through editorials.'
        : '국회와 대통령실을 누비며 쌓은 정국 분석력을 바탕으로 사설과 칼럼을 통해 여론을 주도하는 정통 코스입니다.',
      steps: isEn ? [recentDeptDisplay, 'Politics', 'Opinion & Editorial'] : [recentDept, '정치부', '오피니언부']
    };
    pathB = {
      type: 'B',
      title: isEn ? 'Integrated Politics & Fiscal Policy Specialist Route' : '정치·경제 융합 정책통 코스',
      routeName: isEn
        ? `${recentDeptDisplay} → Economy → Social Policy`
        : `${recentDept} → 경제부 → 사회정책부`,
      description: isEn
        ? 'Combine political mechanics with budgetary analysis to rigorously test the fiscal viability of policies.'
        : '여의도 정치 공학에 세제·예산 분석력을 결합하여 정책의 현실성을 입체적으로 검증하는 하이브리드 경로입니다.',
      steps: isEn ? [recentDeptDisplay, 'Economy', 'Social Policy'] : [recentDept, '경제부', '사회정책부']
    };
    pathC = {
      type: 'C',
      title: isEn ? 'Digital Elections & Data Journalist Route' : '디지털 선거 & 데이터 저널리스트',
      routeName: isEn
        ? `${recentDeptDisplay} → Digital News → Special Investigations`
        : `${recentDept} → 디지털뉴스부 → 기획취재부`,
      description: isEn
        ? 'Visualize polling data, legislative bills, and electoral trends to engage audiences in real time.'
        : '여론조사와 선거구 데이터, 국회 법안 발의 데이터를 시각화하여 대중과 실시간 소통하는 디지털 혁신 경로입니다.',
      steps: isEn ? [recentDeptDisplay, 'Digital News', 'Special Investigations'] : [recentDept, '디지털뉴스부', '기획취재부']
    };
  } else {
    pathA = {
      type: 'A',
      title: isEn ? 'Investigative Reporting & Power Watchdog Route' : '탐사보도 & 권력 감시 특종 코스',
      routeName: isEn
        ? `${recentDeptDisplay} → Special Investigations → Metro`
        : `${recentDept} → 기획취재부 → 사회부`,
      description: isEn
        ? 'Channel crime beat persistence and source discovery into massive in-depth exposés of institutional misconduct.'
        : '사건기자 시절 다져진 취재 근성과 취재원 발굴 능력을 대형 심층 기획과 권력 비리 고발로 집대성하는 에이스 경로입니다.',
      steps: isEn ? [recentDeptDisplay, 'Special Investigations', 'Metro'] : [recentDept, '기획취재부', '사회부']
    };
    pathB = {
      type: 'B',
      title: isEn ? 'Field Reporting to Industrial Ecosystem Expansion' : '사회 현장 → 산업 현장 영토 확장',
      routeName: isEn
        ? `${recentDeptDisplay} → Industry & Tech → Economy`
        : `${recentDept} → 산업부 → 경제부`,
      description: isEn
        ? 'Apply raw field journalism to tackle corporate labor relations and industrial ecosystem dynamics.'
        : '거친 야전 취재력을 바탕으로 대기업 노사 갈등과 산업 생태계 현장을 뚝심 있게 파고드는 확장 코스입니다.',
      steps: isEn ? [recentDeptDisplay, 'Industry & Tech', 'Economy'] : [recentDept, '산업부', '경제부']
    };
    pathC = {
      type: 'C',
      title: isEn ? 'New Media Investigative Storyteller Route' : '뉴미디어 탐사 스토리텔러 코스',
      routeName: isEn
        ? `${recentDeptDisplay} → Digital News → Special Investigations`
        : `${recentDept} → 디지털뉴스부 → 기획취재부`,
      description: isEn
        ? 'Transform vivid on-the-ground reporting into podcasts, video documentaries, and long-form interactive digital stories.'
        : '생생한 현장 취재를 영상, 팟캐스트, 롱폼 인터랙티브 웹 콘텐츠로 제작하여 독자 참여를 이끄는 차세대 경로입니다.',
      steps: isEn ? [recentDeptDisplay, 'Digital News', 'Special Investigations'] : [recentDept, '디지털뉴스부', '기획취재부']
    };
  }

  return {
    totalMonths,
    totalYearsText,
    reporterType,
    detailedSpecialty,
    description,
    careerSynergy,
    topFields: sortedSubFields.slice(0, 3),
    skillTree,
    careerPaths: [pathA, pathB, pathC]
  };
}
