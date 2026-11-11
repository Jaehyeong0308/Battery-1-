import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// --- 절차적 텍스처 생성기 (외부 리소스 0개 / 100% 자체 생성) ---
function createNoiseTexture(width = 256, height = 256, baseColor = '#323b47', accentColor = '#242b35'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);
  ctx.strokeRect(0, 0, width / 2, height / 2);
  ctx.strokeRect(width / 2, height / 2, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 훨씬 밝고 선명한 연구소 금속 벽면
  ctx.fillStyle = '#3a4452';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#485566';
  ctx.fillRect(16, 16, 480, 230);
  ctx.fillRect(16, 262, 480, 234);

  // 리벳 볼트
  ctx.fillStyle = '#7a8ba0';
  const rivetPoints = [
    [24, 24], [256, 24], [488, 24],
    [24, 238], [256, 238], [488, 238],
    [24, 270], [256, 270], [488, 270],
    [24, 488], [256, 488], [488, 488],
  ];
  rivetPoints.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(20, 25, 32, 0.25)';
  for (let i = 0; i < 10; i++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 180;
    const sh = 60 + Math.random() * 160;
    ctx.fillRect(sx, sy, 3 + Math.random() * 5, sh);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createClueTexture(digit: string, clueIndex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  ctx.fillStyle = 'rgba(160, 20, 20, 0.6)';
  for (let i = 0; i < 35; i++) {
    const x = 256 + (Math.random() - 0.5) * 320;
    const y = 256 + (Math.random() - 0.5) * 320;
    const r = 5 + Math.random() * 24;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = 'bold 36px "Pretendard", "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#ff4444';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 16;
  ctx.fillText(`비밀 암호 #${clueIndex}`, 256, 160);

  ctx.font = 'bold 165px monospace';
  ctx.fillStyle = '#ff2222';
  ctx.shadowBlur = 28;
  ctx.fillText(digit, 256, 320);

  ctx.font = 'bold 24px "Pretendard", "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#cc2222';
  ctx.shadowBlur = 6;
  ctx.fillText('절대 잊지 말 것', 256, 385);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createDoorTexture(isLocked: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#343e4a';
  ctx.fillRect(0, 0, 512, 512);

  ctx.lineWidth = 16;
  ctx.strokeStyle = '#5c6b7e';
  ctx.strokeRect(8, 8, 496, 496);

  // 사선 스트라이프 패턴
  const drawHazard = (y: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(16, y, 480, 50);
    ctx.clip();
    for (let x = -50; x < 600; x += 40) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 25, y);
      ctx.lineTo(x - 15, y + 50);
      ctx.lineTo(x - 40, y + 50);
      ctx.fill();
    }
    ctx.restore();
  };
  drawHazard(20);
  drawHazard(442);

  ctx.fillStyle = '#111822';
  ctx.fillRect(136, 115, 240, 110);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.strokeRect(136, 115, 240, 110);

  ctx.font = 'bold 26px "Pretendard", "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = isLocked ? '#ef4444' : '#22c55e';
  ctx.shadowColor = isLocked ? '#ff0000' : '#00ff44';
  ctx.shadowBlur = 10;
  ctx.fillText(isLocked ? '잠김 [3자리 암호]' : '승인됨 - 개방', 256, 162);

  ctx.font = 'bold 16px "Pretendard", "Noto Sans KR", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('시설 비상 탈출구 (에어락)', 256, 198);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// --- Web Audio API 프로시저 사운드 엔진 ---
class SoundManager {
  private ctx: AudioContext | null = null;
  private isAudioStarted = false;

  public initAudio() {
    if (this.isAudioStarted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.startAmbient();
      this.isAudioStarted = true;
    } catch {
      // Audio permission
    }
  }

  private startAmbient() {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const ambientGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(48, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(130, this.ctx.currentTime);
    ambientGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
  }

  public playFootstep() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(60 + Math.random() * 20, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  public playBatteryPickup() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playClueFound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [330, 392, 493.88].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  public playGhostScream() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 1.2);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.35);
  }

  public playJumpscare() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.8);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.1);
  }

  public playKeypadBeep(success = true) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = success ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(success ? 1046.5 : 180, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (success ? 0.25 : 0.4));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playFlickerBuzz() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playDoorOpen() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(45, now + 1.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
  }
}

// 맵 구조
const MAP_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 5, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 5, 1, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 3, 0, 0, 0, 0, 0, 1, 5, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 4, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 9, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const CELL_SIZE = 4;
const WALL_HEIGHT = 3.6;
const SECRET_CODE = ['4', '7', '2'];

// --- 귀신 3D 모델 절차적 생성 함수 ---
function createGhostMesh(): THREE.Group {
  const ghost = new THREE.Group();

  // 1. 유령 몸체 (흘러내리는 반투명 천 자락)
  const bodyGeo = new THREE.ConeGeometry(0.55, 1.9, 16, 4, true);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xddf2fd,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.82,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 0.95;
  ghost.add(bodyMesh);

  // 2. 창백하고 기괴한 머리
  const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    emissive: 0xef4444,
    emissiveIntensity: 0.25,
    roughness: 0.4,
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.y = 1.95;
  ghost.add(headMesh);

  // 3. 붉게 타오르는 안구 (2개)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.1, 1.98, -0.26);
  ghost.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.1, 1.98, -0.26);
  ghost.add(rightEye);

  // 4. 귀신 붉은 안광 포인트 라이트
  const eyeLight = new THREE.PointLight(0xff0000, 2.5, 7.0);
  eyeLight.position.set(0, 1.95, -0.3);
  ghost.add(eyeLight);

  // 5. 뻗어 나오는 창백한 팔 (좌/우)
  const armMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0xef4444,
    emissiveIntensity: 0.2,
    roughness: 0.5,
  });
  const armGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.8, 8);

  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.45, 1.45, -0.3);
  leftArm.rotation.x = -Math.PI / 3;
  leftArm.rotation.z = Math.PI / 8;
  ghost.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.45, 1.45, -0.3);
  rightArm.rotation.x = -Math.PI / 3;
  rightArm.rotation.z = -Math.PI / 8;
  ghost.add(rightArm);

  return ghost;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const soundManagerRef = useRef<SoundManager>(new SoundManager());

  // 상태 관리
  const [isLocked, setIsLocked] = useState(false);
  const [battery, setBattery] = useState(100);
  const [cluesFound, setCluesFound] = useState<boolean[]>([false, false, false]);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [doorStatusMessage, setDoorStatusMessage] = useState<string | null>(null);
  const [ghostAlert, setGhostAlert] = useState(false);

  const stateRef = useRef({
    battery: 100,
    cluesFound: [false, false, false],
    isGameWon: false,
    isGameOver: false,
    controlsLocked: false,
  });

  useEffect(() => {
    stateRef.current.battery = battery;
  }, [battery]);

  useEffect(() => {
    stateRef.current.cluesFound = cluesFound;
  }, [cluesFound]);

  useEffect(() => {
    stateRef.current.isGameWon = isGameWon;
  }, [isGameWon]);

  useEffect(() => {
    stateRef.current.isGameOver = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    stateRef.current.controlsLocked = isLocked;
  }, [isLocked]);

  useEffect(() => {
    if (!containerRef.current) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. 씬 & 카메라 (시야를 훨씬 더 밝게 설정)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a212d);
    // 안개 밀도를 0.008로 대폭 완화하여 아주 먼 거리까지 시야가 확 트임
    scene.fog = new THREE.FogExp2(0x1a212d, 0.008);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(1 * CELL_SIZE + 2, 1.6, 1 * CELL_SIZE + 2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 노출을 1.55로 대폭 올려 시야 전반을 훨씬 더 밝게 조성
    renderer.toneMappingExposure = 1.55;

    containerRef.current.appendChild(renderer.domElement);

    // 2. 조명 시스템 (요청: 시야 훨씬 더 밝게)
    // 앰비언트 라이트 강도 2.2
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 2.2);
    scene.add(ambientLight);

    // 헤미스피어 라이트 1.4 (상/하 반사광 완벽 충족)
    const hemiLight = new THREE.HemisphereLight(0xcfd8dc, 0x475569, 1.4);
    scene.add(hemiLight);

    // 손전등 스포트라이트: 강도 7.0, 범위 55m, 넓은 각도
    const flashlight = new THREE.SpotLight(0xfffaed, 7.0, 55, Math.PI / 3.5, 0.45, 1.0);
    flashlight.position.set(0.18, -0.15, 0);
    camera.add(flashlight);

    const flashlightTarget = new THREE.Object3D();
    flashlightTarget.position.set(0, 0, -10);
    camera.add(flashlightTarget);
    flashlight.target = flashlightTarget;

    scene.add(camera);

    // 복도 곳곳의 비상 조명 (대폭 밝고 선명한 형광/경고등)
    const emergencyLightPositions = [
      [2 * CELL_SIZE + 2, 3.2, 1 * CELL_SIZE + 2, 0x60a5fa],
      [6 * CELL_SIZE + 2, 3.2, 3 * CELL_SIZE + 2, 0xf87171],
      [4 * CELL_SIZE + 2, 3.2, 7 * CELL_SIZE + 2, 0x34d399],
      [8 * CELL_SIZE + 2, 3.2, 9 * CELL_SIZE + 2, 0xfbbf24],
      [10 * CELL_SIZE + 2, 3.2, 5 * CELL_SIZE + 2, 0x818cf8],
      [2 * CELL_SIZE + 2, 3.2, 9 * CELL_SIZE + 2, 0x38bdf8],
      [5 * CELL_SIZE + 2, 3.2, 5 * CELL_SIZE + 2, 0xec4899],
    ];
    emergencyLightPositions.forEach(([x, y, z, col]) => {
      const pLight = new THREE.PointLight(col, 2.0, 16);
      pLight.position.set(x, y, z);
      scene.add(pLight);

      const fixtureGeo = new THREE.BoxGeometry(0.9, 0.1, 0.25);
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        emissive: col,
        emissiveIntensity: 0.9,
      });
      const fixtureMesh = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixtureMesh.position.set(x, y + 0.1, z);
      scene.add(fixtureMesh);
    });

    // 3. 포인터 락 컨트롤
    const controls = new PointerLockControls(camera, renderer.domElement);

    controls.addEventListener('lock', () => {
      setIsLocked(true);
      soundManagerRef.current.initAudio();
    });

    controls.addEventListener('unlock', () => {
      setIsLocked(false);
    });

    const keys: Record<string, boolean> = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      ArrowUp: false,
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (keys[e.code] !== undefined) keys[e.code] = true;
      if (e.code === 'KeyE') {
        attemptInteraction();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (keys[e.code] !== undefined) keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 4. 머티리얼 & 텍스처
    const floorTexture = createNoiseTexture(512, 512, '#384352', '#29323d');
    floorTexture.repeat.set(CELL_SIZE * MAP_GRID[0].length * 0.25, CELL_SIZE * MAP_GRID.length * 0.25);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.65,
      metalness: 0.2,
    });

    const ceilingTexture = createNoiseTexture(512, 512, '#2b3440', '#1c232c');
    ceilingTexture.repeat.set(CELL_SIZE * MAP_GRID[0].length * 0.25, CELL_SIZE * MAP_GRID.length * 0.25);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      roughness: 0.8,
      metalness: 0.1,
    });

    const wallTexture = createWallTexture();
    wallTexture.repeat.set(1, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.5,
      metalness: 0.35,
    });

    const totalW = MAP_GRID[0].length * CELL_SIZE;
    const totalD = MAP_GRID.length * CELL_SIZE;

    const floorGeo = new THREE.PlaneGeometry(totalW, totalD);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(totalW / 2, 0, totalD / 2);
    scene.add(floorMesh);

    const ceilingGeo = new THREE.PlaneGeometry(totalW, totalD);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(totalW / 2, WALL_HEIGHT, totalD / 2);
    scene.add(ceilingMesh);

    // 5. 맵 오브젝트, 충돌체, 단서, 배터리, 탈출구
    interface WallBoundingBox {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
    }
    const wallColliders: WallBoundingBox[] = [];

    interface CollectibleBattery {
      id: string;
      group: THREE.Group;
      pointLight: THREE.PointLight;
      position: THREE.Vector3;
      collected: boolean;
    }
    const batteries: CollectibleBattery[] = [];

    interface WallClueItem {
      clueIndex: number;
      mesh: THREE.Mesh;
      position: THREE.Vector3;
      digit: string;
    }
    const clues: WallClueItem[] = [];

    let doorMesh: THREE.Mesh | null = null;
    let doorLight: THREE.PointLight | null = null;
    const doorPosition = new THREE.Vector3();

    const boxGeo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);

    for (let r = 0; r < MAP_GRID.length; r++) {
      for (let c = 0; c < MAP_GRID[r].length; c++) {
        const cell = MAP_GRID[r][c];
        const worldX = c * CELL_SIZE + CELL_SIZE / 2;
        const worldZ = r * CELL_SIZE + CELL_SIZE / 2;

        if (cell === 1) {
          const wall = new THREE.Mesh(boxGeo, wallMaterial);
          wall.position.set(worldX, WALL_HEIGHT / 2, worldZ);
          scene.add(wall);

          wallColliders.push({
            minX: worldX - CELL_SIZE / 2,
            maxX: worldX + CELL_SIZE / 2,
            minZ: worldZ - CELL_SIZE / 2,
            maxZ: worldZ + CELL_SIZE / 2,
          });
        } else if (cell === 5) {
          // 노란색 배터리
          const batGroup = new THREE.Group();

          const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.55, 16);
          const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0xeab308,
            emissiveIntensity: 0.55,
          });
          const body = new THREE.Mesh(bodyGeo, bodyMat);
          batGroup.add(body);

          const tipGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12);
          const tipMat = new THREE.MeshStandardMaterial({
            color: 0xf1f5f9,
            roughness: 0.2,
            metalness: 0.9,
          });
          const tip = new THREE.Mesh(tipGeo, tipMat);
          tip.position.y = 0.3;
          batGroup.add(tip);

          const ringGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.12, 16);
          const ringMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.y = -0.22;
          batGroup.add(ring);

          const pLight = new THREE.PointLight(0xfde047, 2.0, 7.0);
          pLight.position.set(0, 0.35, 0);
          batGroup.add(pLight);

          batGroup.position.set(worldX, 0.45, worldZ);
          scene.add(batGroup);

          batteries.push({
            id: `bat_${r}_${c}`,
            group: batGroup,
            pointLight: pLight,
            position: new THREE.Vector3(worldX, 0.45, worldZ),
            collected: false,
          });
        } else if (cell === 2 || cell === 3 || cell === 4) {
          const clueIdx = cell === 2 ? 0 : cell === 3 ? 1 : 2;
          const digit = SECRET_CODE[clueIdx];

          const clueTex = createClueTexture(digit, clueIdx + 1);
          const clueMat = new THREE.MeshStandardMaterial({
            map: clueTex,
            transparent: true,
            roughness: 0.3,
            emissive: 0xef4444,
            emissiveIntensity: 0.95,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          const cluePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), clueMat);

          if (r > 0 && MAP_GRID[r - 1][c] === 1) {
            cluePlane.position.set(worldX, 1.7, (r - 0.5) * CELL_SIZE + 0.04);
            cluePlane.rotation.y = 0;
          } else if (r < MAP_GRID.length - 1 && MAP_GRID[r + 1][c] === 1) {
            cluePlane.position.set(worldX, 1.7, (r + 0.5) * CELL_SIZE - 0.04);
            cluePlane.rotation.y = Math.PI;
          } else if (c > 0 && MAP_GRID[r][c - 1] === 1) {
            cluePlane.position.set((c - 0.5) * CELL_SIZE + 0.04, 1.7, worldZ);
            cluePlane.rotation.y = Math.PI / 2;
          } else {
            cluePlane.position.set((c + 0.5) * CELL_SIZE - 0.04, 1.7, worldZ);
            cluePlane.rotation.y = -Math.PI / 2;
          }

          scene.add(cluePlane);

          const redGlow = new THREE.PointLight(0xff2222, 2.0, 6.0);
          redGlow.position.copy(cluePlane.position);
          scene.add(redGlow);

          clues.push({
            clueIndex: clueIdx,
            mesh: cluePlane,
            position: cluePlane.position.clone(),
            digit,
          });
        } else if (cell === 9) {
          doorPosition.set(worldX, 1.6, worldZ);

          const doorTex = createDoorTexture(true);
          const doorMat = new THREE.MeshStandardMaterial({
            map: doorTex,
            roughness: 0.4,
            metalness: 0.6,
          });
          doorMesh = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE * 0.9, WALL_HEIGHT * 0.95, 0.4), doorMat);
          doorMesh.position.set(worldX, WALL_HEIGHT / 2, worldZ);
          scene.add(doorMesh);

          doorLight = new THREE.PointLight(0xef4444, 2.8, 10.0);
          doorLight.position.set(worldX, WALL_HEIGHT * 0.85, worldZ - 0.3);
          scene.add(doorLight);

          wallColliders.push({
            minX: worldX - CELL_SIZE / 2,
            maxX: worldX + CELL_SIZE / 2,
            minZ: worldZ - 0.3,
            maxZ: worldZ + 0.3,
          });
        }
      }
    }

    // 6. 귀신(괴물) 메쉬 생성 및 초기 비활성화
    const ghostGroup = createGhostMesh();
    ghostGroup.visible = false;
    scene.add(ghostGroup);

    let ghostActive = false;
    let ghostSpawned = false;

    // 상호작용
    function attemptInteraction() {
      if (stateRef.current.isGameOver || stateRef.current.isGameWon) return;
      const pPos = camera.position;

      // 배터리 수집
      for (const bat of batteries) {
        if (!bat.collected) {
          const dist = pPos.distanceTo(bat.position);
          if (dist < 2.5) {
            bat.collected = true;
            scene.remove(bat.group);
            soundManagerRef.current.playBatteryPickup();
            setBattery((prev) => Math.min(100, Math.round(prev + 25)));
            setInteractionPrompt('⚡ 예비 배터리 획득! (+25% 충전)');
            setTimeout(() => setInteractionPrompt(null), 2500);

            // 배터리를 획득하면 손전등이 다시 켜지고 귀신이 퇴치/숨어듦!
            if (ghostActive) {
              ghostActive = false;
              ghostGroup.visible = false;
              setGhostAlert(false);
            }
            return;
          }
        }
      }

      // 단서 조사
      for (const clue of clues) {
        const dist = pPos.distanceTo(clue.position);
        if (dist < 2.8) {
          soundManagerRef.current.playClueFound();
          setCluesFound((prev) => {
            const next = [...prev];
            next[clue.clueIndex] = true;
            return next;
          });
          setInteractionPrompt(`🔍 암호 단서 #${clue.clueIndex + 1} 발견: [ ${clue.digit} ]`);
          setTimeout(() => setInteractionPrompt(null), 3000);
          return;
        }
      }

      // 탈출구 도어 작동
      if (doorMesh) {
        const dist = pPos.distanceTo(doorPosition);
        if (dist < 3.2) {
          const allFound = stateRef.current.cluesFound.every(Boolean);
          if (allFound) {
            soundManagerRef.current.playKeypadBeep(true);
            soundManagerRef.current.playDoorOpen();
            if (doorLight) doorLight.color.setHex(0x22c55e);

            let slideProgress = 0;
            const slideInterval = setInterval(() => {
              slideProgress += 0.05;
              if (doorMesh) doorMesh.position.y += 0.15;
              if (slideProgress >= 1) clearInterval(slideInterval);
            }, 30);

            setIsGameWon(true);
            controls.unlock();
          } else {
            soundManagerRef.current.playKeypadBeep(false);
            const foundCount = stateRef.current.cluesFound.filter(Boolean).length;
            setDoorStatusMessage(`키패드 잠김: 3개의 암호 숫자를 모두 찾아야 합니다! (${foundCount}/3 발견)`);
            setTimeout(() => setDoorStatusMessage(null), 4000);
          }
        }
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && controls.isLocked) {
        attemptInteraction();
      }
    };
    window.addEventListener('mousedown', onMouseDown);

    // 충돌 판정
    const PLAYER_RADIUS = 0.45;
    function resolveWallCollisions(currentPos: THREE.Vector3, targetPos: THREE.Vector3) {
      let newX = targetPos.x;
      for (const box of wallColliders) {
        if (
          newX + PLAYER_RADIUS > box.minX &&
          newX - PLAYER_RADIUS < box.maxX &&
          currentPos.z + PLAYER_RADIUS > box.minZ &&
          currentPos.z - PLAYER_RADIUS < box.maxZ
        ) {
          newX = currentPos.x;
          break;
        }
      }

      let newZ = targetPos.z;
      for (const box of wallColliders) {
        if (
          newX + PLAYER_RADIUS > box.minX &&
          newX - PLAYER_RADIUS < box.maxX &&
          newZ + PLAYER_RADIUS > box.minZ &&
          newZ - PLAYER_RADIUS < box.maxZ
        ) {
          newZ = currentPos.z;
          break;
        }
      }

      return new THREE.Vector3(newX, targetPos.y, newZ);
    }

    // 7. 메인 애니메이션 & 물리 & 귀신 AI 루프
    let lastTime = performance.now();
    let footstepTimer = 0;
    let flickerTimer = 0;
    let ghostSpawnDelay = 0;
    let animationFrameId: number;

    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      const time = performance.now();
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // 배터리 회전
      batteries.forEach((bat, idx) => {
        if (!bat.collected) {
          bat.group.rotation.y += delta * 1.8;
          bat.group.position.y = 0.45 + Math.sin(time * 0.003 + idx) * 0.08;
        }
      });

      // 배터리 소모
      if (controls.isLocked && !stateRef.current.isGameWon && !stateRef.current.isGameOver) {
        setBattery((prev) => {
          const next = Math.max(0, prev - 1.5 * delta);
          return next;
        });
      }

      const currentBat = stateRef.current.battery;

      // 손전등 밝기 제어
      if (currentBat <= 0) {
        flashlight.intensity = 0;
      } else if (currentBat < 20) {
        flickerTimer += delta;
        if (flickerTimer > 0.08 + Math.random() * 0.2) {
          flickerTimer = 0;
          if (Math.random() < 0.45) {
            flashlight.intensity = 0.4 + Math.random() * 1.2;
            if (Math.random() < 0.2) soundManagerRef.current.playFlickerBuzz();
          } else {
            flashlight.intensity = 4.5 + Math.random() * 2.5;
          }
        }
      } else {
        flashlight.intensity = 7.0;
      }

      // --- 귀신 추적 및 게임오버 로직 ---
      // 손전등 배터리가 0%가 되면 귀신이 스폰되어 플레이어를 쫓아옴
      if (currentBat <= 0 && !stateRef.current.isGameWon && !stateRef.current.isGameOver) {
        if (!ghostActive) {
          ghostActive = true;
          setGhostAlert(true);
          soundManagerRef.current.playGhostScream();

          // 플레이어로부터 적당한 거리(약 12m) 뒤/옆에서 스폰
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnDist = 12.0;
          ghostGroup.position.set(
            camera.position.x + Math.cos(spawnAngle) * spawnDist,
            0.1,
            camera.position.z + Math.sin(spawnAngle) * spawnDist
          );
          ghostGroup.visible = true;
        }

        // 귀신이 플레이어 방향으로 추격 (속도 ~3.3m/s)
        const ghostPos = ghostGroup.position;
        const playerPos = camera.position;

        const toPlayer = new THREE.Vector3().subVectors(playerPos, ghostPos);
        toPlayer.y = 0;
        const distanceToPlayer = toPlayer.length();

        // 귀신 시선 및 회전
        ghostGroup.lookAt(playerPos.x, ghostGroup.position.y, playerPos.z);

        // 부유 효과 (위아래로 일렁임)
        ghostGroup.position.y = 0.2 + Math.sin(time * 0.005) * 0.15;

        // 추격 이동
        if (distanceToPlayer > 0.1) {
          toPlayer.normalize();
          const ghostSpeed = 3.3; // 플레이어가 질주하면 배터리를 찾아 도망칠 수 있는 속도
          ghostGroup.position.x += toPlayer.x * ghostSpeed * delta;
          ghostGroup.position.z += toPlayer.z * ghostSpeed * delta;
        }

        // 플레이어에게 도달 (거리 1.3m 미만) -> 점프스케어 및 게임 오버!
        if (distanceToPlayer < 1.3) {
          soundManagerRef.current.playJumpscare();
          setIsGameOver(true);
          controls.unlock();
        }
      }

      // 플레이어 이동 처리
      if (controls.isLocked && !stateRef.current.isGameWon && !stateRef.current.isGameOver) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(keys.KeyW || keys.ArrowUp) - Number(keys.KeyS || keys.ArrowDown);
        direction.x = Number(keys.KeyD || keys.ArrowRight) - Number(keys.KeyA || keys.ArrowLeft);
        direction.normalize();

        const moveSpeed = 48.0;
        if (keys.KeyW || keys.ArrowUp || keys.KeyS || keys.ArrowDown) {
          velocity.z -= direction.z * moveSpeed * delta;
        }
        if (keys.KeyA || keys.ArrowLeft || keys.KeyD || keys.ArrowRight) {
          velocity.x -= direction.x * moveSpeed * delta;
        }

        const camEuler = new THREE.Euler(0, 0, 0, 'YXZ');
        camEuler.setFromQuaternion(camera.quaternion);
        camEuler.x = 0;
        camEuler.z = 0;

        const forward = new THREE.Vector3(0, 0, -1).applyEuler(camEuler);
        const right = new THREE.Vector3(1, 0, 0).applyEuler(camEuler);

        const deltaPos = new THREE.Vector3()
          .addScaledVector(forward, -velocity.z * delta)
          .addScaledVector(right, -velocity.x * delta);

        const currentPos = camera.position.clone();
        const proposedPos = currentPos.clone().add(deltaPos);
        const resolvedPos = resolveWallCollisions(currentPos, proposedPos);
        camera.position.x = resolvedPos.x;
        camera.position.z = resolvedPos.z;

        const isMoving = Math.abs(velocity.x) > 0.3 || Math.abs(velocity.z) > 0.3;
        if (isMoving) {
          footstepTimer += delta;
          if (footstepTimer > 0.45) {
            footstepTimer = 0;
            soundManagerRef.current.playFootstep();
          }
          camera.position.y = 1.6 + Math.sin(time * 0.01) * 0.04;
        } else {
          camera.position.y = 1.6;
        }

        // 상호작용 프롬프트
        let promptText: string | null = null;
        for (const bat of batteries) {
          if (!bat.collected && camera.position.distanceTo(bat.position) < 2.5) {
            promptText = '⚡ [E] 키 또는 클릭: 배터리 획득 (+25% 충전)';
            break;
          }
        }
        if (!promptText) {
          for (const clue of clues) {
            if (camera.position.distanceTo(clue.position) < 2.8) {
              promptText = `🔍 [E] 키 또는 클릭: 벽면 단서 #${clue.clueIndex + 1} 조사`;
              break;
            }
          }
        }
        if (!promptText && doorMesh && camera.position.distanceTo(doorPosition) < 3.2) {
          const allFound = stateRef.current.cluesFound.every(Boolean);
          promptText = allFound
            ? '🚪 [E] 키 또는 클릭: 비상 탈출구 에어락 문 열기'
            : '🔒 [E] 키 또는 클릭: 키패드 조사 (잠김 - 단서 3개 필요)';
        }
        setInteractionPrompt(promptText);
      }

      renderer.render(scene, camera);
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleStartGame = () => {
    soundManagerRef.current.initAudio();
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.requestPointerLock?.();
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const isLowBattery = battery < 20;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-black text-white font-sans">
      {/* 3D WebGL 캔버스 뷰포트 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* 중앙 조준점 (+) */}
      {isLocked && !isGameWon && !isGameOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-40">
          <div className="relative flex items-center justify-center">
            <div className="w-3.5 h-0.5 bg-white/85 shadow-xs" />
            <div className="absolute h-3.5 w-0.5 bg-white/85 shadow-xs" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-red-500" />
          </div>
        </div>
      )}

      {/* 귀신 추격 긴급 알림 배너 */}
      {ghostAlert && !isGameOver && !isGameWon && (
        <div className="pointer-events-none absolute top-16 inset-x-0 flex justify-center z-50 animate-bounce">
          <div className="bg-red-950/95 border-2 border-red-500 px-7 py-3 rounded-xl text-red-200 text-sm font-black shadow-2xl tracking-wider flex items-center gap-2">
            <span className="text-xl">👻</span>
            <span>경고: 손전등 소진! 정체불명의 귀신이 당신을 쫓아옵니다! 배터리를 찾거나 도망치세요!</span>
          </div>
        </div>
      )}

      {/* 동적 상호작용 안내 프롬프트 */}
      {isLocked && interactionPrompt && !isGameWon && !isGameOver && (
        <div className="pointer-events-none absolute bottom-24 inset-x-0 flex justify-center z-50">
          <div className="bg-black/85 border border-amber-400/80 px-6 py-2.5 rounded-md text-amber-200 text-sm font-semibold tracking-wide backdrop-blur-xs shadow-xl animate-pulse">
            {interactionPrompt}
          </div>
        </div>
      )}

      {/* 상태 경고 알림 배너 */}
      {doorStatusMessage && (
        <div className="pointer-events-none absolute top-20 inset-x-0 flex justify-center z-50">
          <div className="bg-red-950/95 border border-red-500 px-6 py-3 rounded-md text-red-200 text-sm font-semibold shadow-2xl tracking-wide">
            ⚠ {doorStatusMessage}
          </div>
        </div>
      )}

      {/* 좌측 상단: 손전등 배터리 UI */}
      <div className="pointer-events-none absolute top-5 left-5 z-[999] flex flex-col gap-1.5 bg-zinc-950/85 border border-zinc-700/80 p-3.5 rounded-lg backdrop-blur-xs min-w-[220px] shadow-2xl">
        <div className="flex items-center justify-between text-xs tracking-wider font-semibold">
          <span className="flex items-center gap-1.5">
            <svg
              className={`w-4 h-4 ${isLowBattery ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16 4h-2V2h-4v2H8C6.9 4 6 4.9 6 6v14c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H8V6h8v14z" />
            </svg>
            <span className={isLowBattery ? 'text-red-400 font-bold' : 'text-zinc-200'}>손전등 배터리</span>
          </span>
          <span className={`font-bold font-mono text-sm ${isLowBattery ? 'text-red-500' : 'text-zinc-100'}`}>
            {Math.round(battery)}%
          </span>
        </div>

        {/* 배터리 잔량 게이지 바 */}
        <div className="w-full bg-zinc-900 border border-zinc-700 h-2.5 rounded-xs overflow-hidden">
          <div
            className={`h-full transition-all duration-150 ${
              isLowBattery
                ? 'bg-red-600 shadow-[0_0_8px_#ff0000]'
                : battery < 50
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(0, battery)}%` }}
          />
        </div>

        {isLowBattery && (
          <div className="text-[11px] text-red-400 font-bold tracking-wider text-center animate-pulse">
            {battery <= 0 ? '☠ 배터리 소진: 귀신 출현!!' : '⚠ 배터리 부족: 조명 깜빡임 주의'}
          </div>
        )}
      </div>

      {/* 우측 상단: 벽면 암호 단서 현황 HUD */}
      <div className="pointer-events-none absolute top-5 right-5 z-[999] flex flex-col items-end gap-1.5 bg-zinc-950/85 border border-zinc-700/80 p-3.5 rounded-lg backdrop-blur-xs shadow-2xl">
        <div className="text-xs tracking-wider font-semibold text-zinc-300">
          벽면 암호 단서: <span className="text-red-400 font-bold">{cluesFound.filter(Boolean).length} / 3</span>
        </div>
        <div className="flex gap-2 mt-1">
          {SECRET_CODE.map((digit, idx) => (
            <div
              key={idx}
              className={`w-9 h-11 border flex items-center justify-center font-mono text-lg font-bold rounded-xs transition-all ${
                cluesFound[idx]
                  ? 'border-red-500 bg-red-950/70 text-red-400 shadow-[0_0_12px_rgba(255,50,50,0.6)]'
                  : 'border-zinc-800 bg-zinc-900/80 text-zinc-600'
              }`}
            >
              {cluesFound[idx] ? digit : '?'}
            </div>
          ))}
        </div>
        <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
          {cluesFound.every(Boolean) ? '✔ 모든 암호 발견 (탈출 가능)' : '복도 벽면의 붉은 숫자를 찾으세요'}
        </div>
      </div>

      {/* 조작 설명 및 시작 오버레이 창 */}
      {!isLocked && !isGameWon && !isGameOver && (
        <div
          onClick={handleStartGame}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center cursor-pointer p-6"
        >
          <div className="max-w-lg w-full bg-zinc-950/95 border border-zinc-800 p-8 rounded-xl shadow-2xl text-center space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-red-500 font-bold">
                지하 연구시설 격리구역
              </span>
              <h1 className="text-3xl font-black tracking-tight text-zinc-100">
                어둠 속의 메아리
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed">
                폐쇄된 지하 시설에 갇혔습니다. 손전등 배터리가 0%가 되면 **귀신이 출현하여 당신을 쫓아옵니다!**
                복도를 수색하여 3개의 붉은 암호 숫자를 확인하고, 노란색 예비 배터리를 모아 비상 탈출구를 열고 탈출하세요!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left bg-zinc-900/90 p-4 rounded-lg border border-zinc-800 text-xs text-zinc-200">
              <div>
                <span className="text-amber-400 font-bold block mb-1.5 text-sm">조작 방법:</span>
                <p>• [W, A, S, D] 이동</p>
                <p>• [마우스] 시점 둘러보기</p>
                <p>• [E] 또는 [클릭] 획득 / 조사</p>
                <p>• [ESC] 일시정지 메뉴</p>
              </div>
              <div>
                <span className="text-amber-400 font-bold block mb-1.5 text-sm">미션 목표:</span>
                <p>• 🔋 노란색 배터리 수집 (+25%)</p>
                <p>• 👻 배터리 0% 시 귀신 추격 주의</p>
                <p>• 🩸 벽면 붉은 암호 3개 발견</p>
                <p>• 🚪 비상 키패드 문 열고 탈출</p>
              </div>
            </div>

            <button className="w-full py-4 bg-red-700 hover:bg-red-600 transition-colors text-white font-bold tracking-widest uppercase rounded-lg text-sm shadow-lg shadow-red-900/40">
              화면을 클릭하여 시작 (마우스 조작 고정)
            </button>
            <p className="text-[11px] text-zinc-400">
              ※ 클릭하면 마우스 커서가 3D 1인칭 조작 모드로 자동 잠금됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 게임 오버 (Game Over) 화면 */}
      {isGameOver && (
        <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md z-[1002] flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full bg-black/95 border-2 border-red-600 p-8 rounded-2xl shadow-[0_0_50px_rgba(255,0,0,0.6)] text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center mx-auto text-4xl shadow-[0_0_20px_#ef4444]">
              ☠
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-red-500 font-bold">
                생체 신호 정지 (SIGNAL LOST)
              </span>
              <h2 className="text-4xl font-black text-red-500 uppercase tracking-wider">
                게임 오버
              </h2>
              <p className="text-sm text-zinc-300 pt-1 leading-relaxed">
                손전등 배터리가 방전되어 나타난 <strong className="text-red-400 font-bold">귀신에게 붙잡혔습니다.</strong>
                어둠 속에서 빠져나오지 못했습니다...
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-lg flex justify-around text-sm">
              <div>
                <span className="text-xs text-zinc-400 block mb-1">발견한 단서</span>
                <span className="text-red-400 font-bold text-xl">{cluesFound.filter(Boolean).length} / 3</span>
              </div>
              <div className="border-r border-zinc-800" />
              <div>
                <span className="text-xs text-zinc-400 block mb-1">사망 원인</span>
                <span className="text-red-400 font-bold text-base">귀신 습격</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-4 bg-red-700 hover:bg-red-600 transition-colors text-white font-bold tracking-widest uppercase rounded-lg text-sm shadow-xl shadow-red-900/50"
            >
              다시 도전하기
            </button>
          </div>
        </div>
      )}

      {/* 탈출 성공 (Clear!) 화면 */}
      {isGameWon && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[1001] flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-950 border border-emerald-500/60 p-8 rounded-xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                비상 에어락 감압 완료
              </span>
              <h2 className="text-3xl font-black text-white">
                탈출 성공!
              </h2>
              <p className="text-sm text-zinc-300 pt-1">
                3개의 암호 숫자 [{SECRET_CODE.join(' - ')}]를 모두 풀고 귀신과 어둠 속에서 무사히 탈출했습니다!
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-lg flex justify-around text-sm">
              <div>
                <span className="text-xs text-zinc-400 block mb-1">남은 배터리</span>
                <span className="text-amber-400 font-bold text-xl">{Math.round(battery)}%</span>
              </div>
              <div className="border-r border-zinc-800" />
              <div>
                <span className="text-xs text-zinc-400 block mb-1">해독된 암호</span>
                <span className="text-emerald-400 font-bold text-xl">{SECRET_CODE.join('')}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-bold tracking-wider uppercase rounded-lg text-sm shadow-lg shadow-emerald-900/30"
            >
              다시 플레이하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
