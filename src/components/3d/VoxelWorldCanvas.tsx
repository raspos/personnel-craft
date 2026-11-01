import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterProfile, Stage, CareerRecord, WishSelection } from '../../types/game';
import { VoxelCharacter, CharacterAction } from './VoxelCharacter';
import {
  createNewsroomBuilding,
  createVoxelTree,
  createStreetLamp,
  createCareerVoxelMap,
  createBossNPC,
  createCommitteeRoom,
  createVoxelFarmField
} from './VoxelBuildings';
import { getDepartmentByName } from '../../data/departments';

interface VoxelWorldCanvasProps {
  stage: Stage;
  profile: CharacterProfile;
  careers: CareerRecord[];
  wishes: WishSelection;
  action: CharacterAction;
  farmingSprouts?: { first: number; second: number; third: number };
}

export const VoxelWorldCanvas: React.FC<VoxelWorldCanvasProps> = ({
  stage,
  profile,
  careers,
  wishes,
  action,
  farmingSprouts
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);

  const characterRef = useRef<VoxelCharacter | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldGroupRef = useRef<THREE.Group | null>(null);
  const bossAnimateListRef = useRef<((t: number) => void)[]>([]);

  // 회전 드래그 상호작용
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotationOffsetRef = useRef({ x: 0, y: 0 });

  // 1. Scene 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('WebGL is not supported or failed, falling back to 2D view', err);
      setWebGLFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120); // 딥 복셀 나이트 스카이
    scene.fog = new THREE.FogExp2(0x0b1120, 0.025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 3.5, 9);
    cameraRef.current = camera;

    // 조명 세팅 (복셀 스타일에 맞게 부드럽고 쨍한 헤미스피어 라이팅)
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    dirLight.position.set(7, 14, 9);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.5);
    fillLight.position.set(-6, 5, -5);
    scene.add(fillLight);

    // 공통 바닥 (그리드 보도블록)
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 복셀 타일 그리드
    const gridHelper = new THREE.GridHelper(26, 26, 0x475569, 0x334155);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 캐릭터 생성
    const character = new VoxelCharacter(profile.appearance, 1.0);
    character.group.position.set(0, 0, 2);
    scene.add(character.group);
    characterRef.current = character;

    // 월드 오브젝트 그룹
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    worldGroupRef.current = worldGroup;

    // 반응형 리사이즈 핸들러
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // 애니메이션 렌더 루프
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      const elapsedTime = clock.getElapsedTime() * 1000;
      if (characterRef.current) {
        characterRef.current.animate(elapsedTime);
      }

      // NPC들 애니메이션
      bossAnimateListRef.current.forEach(anim => anim(elapsedTime * 0.002));

      // 드래그 회전 완만하게 적용
      if (worldGroupRef.current && sceneRef.current) {
        scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, rotationOffsetRef.current.x, 0.1);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // 2. 외형 및 액션 업데이트
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.updateAppearance(profile.appearance);
      characterRef.current.setAction(action);
    }
  }, [profile.appearance, action]);

  // 3. Stage 변경 시 3D 환경 구축
  useEffect(() => {
    const worldGroup = worldGroupRef.current;
    const camera = cameraRef.current;
    const character = characterRef.current;
    if (!worldGroup || !camera || !character) return;

    // 기존 월드 정리
    while (worldGroup.children.length > 0) {
      worldGroup.remove(worldGroup.children[0]);
    }
    bossAnimateListRef.current = [];

    // 카메라 위치 기본 리셋
    rotationOffsetRef.current = { x: 0, y: 0 };

    if (stage === 1) {
      // 메인 화면: 신문사 본관, 간판, 나무, 가로등, 게시판
      camera.position.set(0, 3.2, 8.5);
      camera.lookAt(0, 1.8, 0);

      const newsroom = createNewsroomBuilding();
      worldGroup.add(newsroom);

      const tree1 = createVoxelTree(-4.5, -0.5, 1.1);
      const tree2 = createVoxelTree(4.8, -1.0, 0.9);
      worldGroup.add(tree1, tree2);

      const lamp1 = createStreetLamp(-2.8, 2.0);
      const lamp2 = createStreetLamp(2.8, 2.0);
      worldGroup.add(lamp1, lamp2);

      character.group.position.set(0, 0, 1.8);
      character.group.rotation.set(0, 0, 0);

    } else if (stage === 2) {
      // 커리어 지도: 사용자가 입력한 부서 블록 맵
      camera.position.set(3.5, 4.5, 7.5);
      camera.lookAt(0, 1.5, 0);

      const careerMap = createCareerVoxelMap(careers);
      careerMap.position.set(0, 0, -2);
      worldGroup.add(careerMap);

      // 캐릭터를 커리어 로드 최상단/중앙에 배치
      const latestHeight = careers.length > 0 ? (careers[careers.length - 1].periodMonths / 12) * 1.0 : 0.8;
      character.group.position.set(0, latestHeight, 0.5);
      character.group.rotation.set(0, -0.3, 0);

    } else if (stage === 3) {
      // 희망 부서 3곳의 건물과 부서장 NPC들
      camera.position.set(0, 3.6, 9.0);
      camera.lookAt(0, 1.6, 0);

      const deptList = [wishes.first.deptName, wishes.second.deptName, wishes.third.deptName];
      const xPositions = [-3.8, 0, 3.8];

      deptList.forEach((deptName, idx) => {
        const deptDef = getDepartmentByName(deptName);
        if (!deptDef) return;

        // 작은 부서 건물 블록
        const bldgGroup = new THREE.Group();
        bldgGroup.position.set(xPositions[idx], 0, -1.5);

        const bColor = new THREE.Color(deptDef.color);
        const bMat = new THREE.MeshLambertMaterial({ color: bColor });
        const bldgGeo = new THREE.BoxGeometry(2.4, 4.0, 2.0);
        const bldg = new THREE.Mesh(bldgGeo, bMat);
        bldg.position.y = 2.0;
        bldg.castShadow = true;

        // 부서 간판
        const signGeo = new THREE.BoxGeometry(2.2, 0.6, 0.2);
        const signMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 3.6, 1.05);

        bldgGroup.add(bldg, sign);
        worldGroup.add(bldgGroup);

        // 부서장 복셀 NPC
        const boss = createBossNPC(deptDef);
        boss.group.position.set(xPositions[idx], 0, 0.5);
        boss.group.scale.set(0.9, 0.9, 0.9);
        worldGroup.add(boss.group);
        bossAnimateListRef.current.push(boss.animate);
      });

      // 내 캐릭터는 정중앙 앞쪽에서 이들을 바라봄
      character.group.position.set(0, 0, 3.2);
      character.group.rotation.set(0, Math.PI, 0);

    } else if (stage === 3.5) {
      // [신규] 인사 농사 월드: 희망 부서 3곳 + 부서장 앞마당의 블록 밭과 새싹
      camera.position.set(0, 3.8, 8.8);
      camera.lookAt(0, 1.4, 0);

      const deptList = [wishes.first.deptName, wishes.second.deptName, wishes.third.deptName];
      const xPositions = [-3.8, 0, 3.8];
      const sproutList = [
        farmingSprouts?.first ?? 0,
        farmingSprouts?.second ?? 0,
        farmingSprouts?.third ?? 0
      ];

      deptList.forEach((deptName, idx) => {
        const deptDef = getDepartmentByName(deptName);
        if (!deptDef) return;

        // 작은 부서 건물
        const bldgGroup = new THREE.Group();
        bldgGroup.position.set(xPositions[idx], 0, -2.0);

        const bColor = new THREE.Color(deptDef.color);
        const bMat = new THREE.MeshLambertMaterial({ color: bColor });
        const bldgGeo = new THREE.BoxGeometry(2.4, 3.8, 1.8);
        const bldg = new THREE.Mesh(bldgGeo, bMat);
        bldg.position.y = 1.9;
        bldg.castShadow = true;

        const signGeo = new THREE.BoxGeometry(2.2, 0.5, 0.2);
        const signMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 3.4, 0.95);

        bldgGroup.add(bldg, sign);
        worldGroup.add(bldgGroup);

        // 부서장 NPC
        const boss = createBossNPC(deptDef);
        boss.group.position.set(xPositions[idx], 0, -0.6);
        boss.group.scale.set(0.85, 0.85, 0.85);
        worldGroup.add(boss.group);
        bossAnimateListRef.current.push(boss.animate);

        // 부서 앞마당 블록 밭 & 새싹 (0~3단계)
        const farm = createVoxelFarmField(sproutList[idx]);
        farm.position.set(xPositions[idx], 0, 0.8);
        worldGroup.add(farm);
      });

      // 내 캐릭터 (밭을 가꾸는 위치)
      character.group.position.set(0, 0, 2.8);
      character.group.rotation.set(0, Math.PI, 0);

    } else if (stage === 4) {
      // 인사위원회: 대형 테이블과 심사위원들
      camera.position.set(0, 4.0, 7.5);
      camera.lookAt(0, 1.5, 0);

      const committee = createCommitteeRoom();
      worldGroup.add(committee);

      // 내 캐릭터는 탁자 앞 심사받는 위치
      character.group.position.set(0, 0, 2.0);
      character.group.rotation.set(0, 0, 0);

    } else if (stage === 5) {
      // 운명의 발령: 어두운 조명과 스포트라이트 단상
      camera.position.set(0, 3.0, 7.0);
      camera.lookAt(0, 1.4, 0);

      // 발표 단상
      const podiumGeo = new THREE.BoxGeometry(2.5, 0.5, 2.5);
      const podiumMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
      const podium = new THREE.Mesh(podiumGeo, podiumMat);
      podium.position.set(0, 0.25, 0);
      podium.receiveShadow = true;
      worldGroup.add(podium);

      // 인사발령 봉투가 올려진 탁자
      const tableGeo = new THREE.BoxGeometry(1.2, 0.9, 0.8);
      const tableMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(0, 0.45, -0.6);

      const envelopeGeo = new THREE.BoxGeometry(0.5, 0.05, 0.35);
      const envMat = new THREE.MeshLambertMaterial({ color: 0xfef08a }); // 금빛 봉투
      const envelope = new THREE.Mesh(envelopeGeo, envMat);
      envelope.position.set(0, 0.93, -0.6);

      worldGroup.add(table, envelope);

      character.group.position.set(0, 0.5, 0.3);
      character.group.rotation.set(0, 0, 0);
    }
  }, [stage, careers, wishes, farmingSprouts]);

  // 마우스 드래그로 3D 시점 둘러보기 (모바일 터치 세로 스크롤 완전 허용)
  const handlePointerDown = (e: React.PointerEvent) => {
    // 터치 기기는 브라우저 네이티브 세로 스크롤이 자연스럽게 올라가도록 회전 이벤트 패스
    if (e.pointerType === 'touch') return;
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    rotationOffsetRef.current.x += deltaX * 0.006;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'pan-y' }}
      className="relative w-full h-full min-h-[240px] sm:min-h-[320px] md:min-h-[460px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl select-none"
    >
      {!webGLFailed ? (
        <canvas ref={canvasRef} style={{ touchAction: 'pan-y' }} className="w-full h-full block" />
      ) : (
        // 2D 복셀 그래픽 대체 모드 (저사양/WebGL 미지원 시)
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
          <div className="text-5xl mb-4 animate-bounce">📰</div>
          <div className="font-pixel text-xl text-blue-400 font-bold mb-2">2D 복셀 그래픽 모드 가동</div>
          <p className="text-slate-300 text-sm max-w-sm">
            기자 <strong>{profile.nickname}</strong> ({profile.hireYear}년 입사)
          </p>
          <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400">현재 액션: {action.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* 3D 뷰 힌트 & 조작 뱃지 */}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5 shadow-md pointer-events-none">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>화면 드래그로 360° 시점 회전</span>
      </div>

      {/* 무대 라벨 뱃지 */}
      <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-blue-500/40 text-xs font-pixel text-blue-300 shadow-md">
        {stage === 1 && '🏢 STAGE 1: 신문사 정문 앞'}
        {stage === 2 && '📈 STAGE 2: 커리어 블록 로드'}
        {stage === 3 && '🏛️ STAGE 3: 희망 부서 거리'}
        {stage === 3.5 && '🌕 STAGE 3.5: 추석 이후 인사 농사'}
        {stage === 4 && '⚖️ STAGE 4: 인사위원회 회의실'}
        {stage === 5 && '📜 STAGE 5: 운명의 단상'}
      </div>
    </div>
  );
};
