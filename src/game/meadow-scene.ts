import * as THREE from "three";
import { certificates, type CertificateId } from "../data/portfolio";

export type TimeOfDay = "day" | "evening";
export interface GalleryHandle {
  setPaused(value: boolean): void;
  setReducedMotion(value: boolean): void;
  setTimeOfDay(value: TimeOfDay): void;
  focusFrame(id: CertificateId | null): void;
  resetView(): void;
  destroy(): void;
}
interface GalleryOptions {
  basePath: string;
  reducedMotion: boolean;
  onReady(): void;
  onSelect(id: CertificateId): void;
  onError(message: string): void;
  onHotspots(spots: Array<{ id: CertificateId; x: number; y: number; visible: boolean }>): void;
}
type Point = readonly [number, number, number];

export function mountGalleryRoom(root: HTMLElement, options: GalleryOptions): GalleryHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe0d0ae);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.08, 60);
  const home = new THREE.Vector3(0.85, 2.7, 6.8);
  const homeTarget = new THREE.Vector3(-0.05, 2.15, -4.8);
  const target = homeTarget.clone();
  camera.position.copy(home);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const instanced = new Set<THREE.InstancedMesh>();
  const events = new AbortController();
  const frames: Array<{ id: CertificateId; group: THREE.Group; width: number; height: number; edge: THREE.MeshLambertMaterial }> = [];
  let observer: ResizeObserver | undefined;
  let raf: number | undefined;
  let destroyed = false;
  let failed = false;
  let paused = false;
  let reduced = options.reducedMotion;
  let elapsed = 0;
  let previous = 0;
  let width = 1;
  let height = 1;
  let spotsDirty = true;
  let selected: CertificateId | null = null;
  let savedView: { position: THREE.Vector3; target: THREE.Vector3 } | undefined;
  let transition: { from: THREE.Vector3; look: THREE.Vector3; to: THREE.Vector3; at: THREE.Vector3; start: number } | undefined;
  let drag: { id: number; x: number; y: number; lastX: number; lastY: number; distance: number; multiple: boolean } | undefined;
  let hovered: CertificateId | undefined;
  let seed = 177;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const geometry = <T extends THREE.BufferGeometry>(g: T): T => { geometries.add(g); return g; };
  const material = <T extends THREE.Material>(m: T): T => { materials.add(m); return m; };
  const cube = geometry(new THREE.BoxGeometry(1, 1, 1));
  const sphere = geometry(new THREE.SphereGeometry(1, 16, 12));
  const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 16));
  const plane = geometry(new THREE.PlaneGeometry(1, 1));
  const mesh = (parent: THREE.Object3D, shape: THREE.BufferGeometry, surface: THREE.Material, p: Point, size: Point, cast = false) => {
    const object = new THREE.Mesh(shape, surface);
    object.position.set(...p);
    object.scale.set(...size);
    object.castShadow = cast;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (parent: THREE.Object3D, surface: THREE.Material, p: Point, size: Point, cast = false) => mesh(parent, cube, surface, p, size, cast);
  const matte = (color: THREE.ColorRepresentation, map?: THREE.Texture) => material(new THREE.MeshLambertMaterial({ color, map }));
  const paint = (size: number, draw: (context: CanvasRenderingContext2D) => void) => {
    const image = document.createElement("canvas");
    image.width = image.height = size;
    const context = image.getContext("2d");
    if (!context) throw new Error("Canvas textures are unavailable.");
    draw(context);
    const texture = new THREE.CanvasTexture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    return texture;
  };
  const beam = (parent: THREE.Object3D, surface: THREE.Material, a: Point, b: Point, thickness: number) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const direction = to.clone().sub(from);
    const object = box(parent, surface, from.add(to).multiplyScalar(0.5).toArray() as [number, number, number], [thickness, direction.length(), thickness], true);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return object;
  };
  const stop = () => { if (raf !== undefined) cancelAnimationFrame(raf); raf = undefined; previous = 0; };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stop();
    observer?.disconnect();
    events.abort();
    for (const object of instanced) object.dispose();
    for (const item of geometries) item.dispose();
    for (const item of materials) item.dispose();
    for (const item of textures) item.dispose();
    scene.traverse(object => { if (object instanceof THREE.DirectionalLight) object.shadow.dispose(); });
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  const fail = () => {
    if (destroyed || failed) return;
    failed = true;
    stop();
    canvas.style.cursor = "default";
    options.onError("The 3D room is unavailable. Your certificates are still here in the illustrated room and collection.");
  };
  canvas.addEventListener("webglcontextlost", event => { event.preventDefault(); fail(); }, { signal: events.signal });

  try {
    root.append(canvas);
    const plasterMap = paint(256, context => {
      context.fillStyle = "#fffdf4";
      context.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) {
        context.fillStyle = i % 2 ? "rgba(123,107,71,.045)" : "rgba(198,176,128,.06)";
        context.fillRect(random() * 256, random() * 256, 1 + random() * 9, 1 + random() * 3);
      }
    });
    const woodMap = paint(256, context => {
      context.fillStyle = "#f1dfb7";
      context.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i++) {
        const y = random() * 256;
        context.strokeStyle = `rgba(100,63,30,${0.025 + random() * 0.07})`;
        context.lineWidth = 0.3 + random();
        context.beginPath(); context.moveTo(0, y);
        context.bezierCurveTo(65, y + random() * 12, 185, y - random() * 12, 256, y);
        context.stroke();
      }
    });
    const plaster = matte(0xe7d9b8, plasterMap);
    const leftWall = matte(0xded1af, plasterMap);
    const sage = matte(0x788473, plasterMap);
    const wood = matte(0x876444, woodMap);
    const darkWood = matte(0x54402d, woodMap);
    const honey = matte(0xb48a56, woodMap);
    const paper = matte(0xf6efdd);
    const brass = matte(0xb5914f);
    const terracotta = matte(0xac7154);
    const ink = matte(0x3d4e42);
    const bookColors = [matte(0x667965), matte(0xb07957), matte(0x6b8385), matte(0xbbac78)];
    const hemisphere = new THREE.HemisphereLight(0xfff4da, 0x74644b, 2.0);
    const sun = new THREE.DirectionalLight(0xffe3ac, 2.35);
    sun.position.set(-4.8, 4.7, 2.7);
    sun.target.position.set(0.5, 1.2, -4.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 7, bottom: -7, near: 0.5, far: 28 });
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.0002;
    sun.shadow.radius = 3;
    scene.add(hemisphere, sun, sun.target);
    const lampLight = new THREE.PointLight(0xffc16c, 0.6, 7, 2);
    lampLight.position.set(2.45, 1.94, -3.6);
    scene.add(lampLight);

    box(scene, plaster, [0, 2.75, -5], [12, 5.5, 0.18]);
    box(scene, leftWall, [-6, 2.75, 1], [0.18, 5.5, 12]);
    box(scene, plaster, [6, 2.75, 1], [0.18, 5.5, 12]);
    box(scene, matte(0xbda77f, plasterMap), [0, 5.52, 1], [12, 0.14, 12]);
    box(scene, darkWood, [0, -0.12, 1], [12, 0.2, 12]);
    const boards = new THREE.InstancedMesh(cube, wood, 120);
    boards.receiveShadow = true;
    instanced.add(boards);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    for (let row = 0; row < 20; row++) for (let col = 0; col < 6; col++) {
      dummy.position.set(-5 + col * 2, -0.014, -4.7 + row * 0.6);
      dummy.scale.set(1.986, 0.04, 0.584);
      dummy.updateMatrix();
      boards.setMatrixAt(row * 6 + col, dummy.matrix);
      boards.setColorAt(row * 6 + col, tint.setHSL(0.105, 0.14 + random() * 0.08, 0.68 + random() * 0.18));
    }
    scene.add(boards);
    box(scene, sage, [0, 0.72, -4.86], [12, 1.44, 0.12]);
    for (const x of [-5.86, 5.86]) box(scene, sage, [x, 0.72, 1], [0.12, 1.44, 12]);
    for (const y of [0.12, 1.45, 5.25]) {
      box(scene, wood, [0, y, -4.72], [12, y === 5.25 ? 0.21 : 0.095, 0.13]);
      for (const x of [-5.73, 5.73]) box(scene, wood, [x, y, 1], [0.13, y === 5.25 ? 0.21 : 0.095, 12]);
    }
    for (let i = 0; i < 17; i++) box(scene, matte(0x687661), [-5.6 + i * 0.7, 0.76, -4.765], [0.028, 1.2, 0.035]);
    for (const x of [-5.76, 5.76]) box(scene, wood, [x, 3.33, -4.76], [0.16, 3.72, 0.16]);
    for (const z of [-4.8, -0.2, 4.7]) box(scene, wood, [0, 5.22, z], [11.8, 0.3, 0.24], true);
    box(scene, brass, [0, 4.77, -4.77], [10.6, 0.035, 0.045]);

    const viewMap = paint(512, context => {
      const sky = context.createLinearGradient(0, 0, 0, 512);
      sky.addColorStop(0, "#b9d4c7"); sky.addColorStop(0.68, "#e7e9bc"); sky.addColorStop(1, "#96ae76");
      context.fillStyle = sky; context.fillRect(0, 0, 512, 512);
      context.fillStyle = "#fff9dd";
      for (const [x, y, r] of [[100, 105, 44], [135, 87, 49], [181, 111, 38], [344, 154, 37], [380, 144, 46]]) {
        context.beginPath(); context.ellipse(x, y, r, r * 0.43, 0, 0, Math.PI * 2); context.fill();
      }
      for (let layer = 0; layer < 3; layer++) {
        context.fillStyle = ["#a8bd91", "#8ba777", "#628b64"][layer]!;
        context.beginPath(); context.moveTo(0, 512);
        for (let x = 0; x <= 512; x += 4) context.lineTo(x, 290 + layer * 52 + Math.sin(x * 0.014 + layer * 1.8) * 36);
        context.lineTo(512, 512); context.fill();
      }
      for (let i = 0; i < 160; i++) {
        context.fillStyle = ["#779c68", "#9ab27c", "#527d58"][i % 3]!;
        context.beginPath(); context.ellipse(random() * 512, 410 + random() * 110, 8 + random() * 22, 12 + random() * 19, -0.5, 0, Math.PI * 2); context.fill();
      }
    });
    const windowView = material(new THREE.MeshBasicMaterial({ map: viewMap, toneMapped: false }));
    const windowGroup = new THREE.Group();
    windowGroup.position.set(-5.78, 3.05, -0.55);
    windowGroup.rotation.y = Math.PI / 2;
    scene.add(windowGroup);
    box(windowGroup, darkWood, [0, 0, -0.06], [3.24, 3.18, 0.14]);
    mesh(windowGroup, plane, windowView, [0, 0, 0.02], [2.96, 2.85, 1]);
    for (const x of [-1.55, 0, 1.55]) box(windowGroup, honey, [x, 0, 0.12], [0.12, 3.12, 0.15], true);
    for (const y of [-1.51, 0, 1.51]) box(windowGroup, honey, [0, y, 0.12], [3.22, 0.11, 0.15], true);
    box(windowGroup, honey, [0, -1.64, 0.2], [3.56, 0.16, 0.6], true);
    beam(windowGroup, darkWood, [-1.91, 1.81, 0.33], [1.91, 1.81, 0.33], 0.04);
    const fabric = material(new THREE.MeshLambertMaterial({ color: 0xebe1c4, map: plasterMap, side: THREE.DoubleSide }));
    const curtainGeometry = geometry(new THREE.PlaneGeometry(0.78, 3.13, 20, 15));
    const curtainVertices = curtainGeometry.getAttribute("position");
    for (let i = 0; i < curtainVertices.count; i++) {
      const x = curtainVertices.getX(i), y = curtainVertices.getY(i);
      curtainVertices.setZ(i, Math.cos(x * 28) * 0.06 + Math.sin(y * 2) * 0.04);
      curtainVertices.setY(i, y + Math.cos(x * 28) * 0.025);
    }
    curtainGeometry.computeVertexNormals();
    const curtains = [-1, 1].map(side => mesh(windowGroup, curtainGeometry, fabric, [side * 1.53, 0.1, 0.33], [1, 1, 1]));

    const rug = box(scene, matte(0xaca47d, plasterMap), [0.3, 0.018, 1.3], [4.5, 0.035, 3.15]);
    box(scene, matte(0x8d8f70, plasterMap), [0.3, 0.04, 1.3], [4.26, 0.015, 2.91]);
    box(scene, matte(0xc0b28c, plasterMap), [0.3, 0.05, 1.3], [4.04, 0.012, 2.7]);
    rug.receiveShadow = true;
    const sunlight = material(new THREE.MeshBasicMaterial({ color: 0xffe8a6, transparent: true, opacity: 0.14, depthWrite: false, toneMapped: false }));
    for (let i = 0; i < 4; i++) {
      const patch = mesh(scene, plane, sunlight, [-2.4 + (i % 2) * 1.28, 0.075, -0.4 + Math.floor(i / 2) * 1.78], [1.15, 1.61, 1]);
      patch.rotation.set(-Math.PI / 2, 0, -0.37);
    }

    const cabinet = new THREE.Group();
    cabinet.position.set(0.15, 0, -4.14);
    scene.add(cabinet);
    box(cabinet, wood, [0, 0.7, 0], [6.45, 1.22, 0.81], true);
    box(cabinet, honey, [0, 1.33, 0], [6.65, 0.15, 1.02], true);
    for (const x of [-2.13, 0, 2.13]) {
      box(cabinet, darkWood, [x, 0.72, 0.421], [2.02, 1.04, 0.035]);
      box(cabinet, wood, [x, 0.72, 0.449], [1.88, 0.9, 0.04]);
      box(cabinet, honey, [x, 0.73, 0.477], [1.64, 0.66, 0.018]);
      box(cabinet, brass, [x + 0.57, 0.83, 0.504], [0.035, 0.19, 0.025]);
    }
    for (const x of [-2.8, 2.8]) for (const z of [-0.27, 0.27]) box(cabinet, darkWood, [x, 0.075, z], [0.11, 0.15, 0.11]);
    for (let i = 0; i < 5; i++) {
      const book = new THREE.Group();
      book.position.set(-2.31 + i * 0.16, 1.4, -0.01);
      book.rotation.z = i === 4 ? -0.13 : 0;
      cabinet.add(book);
      box(book, bookColors[i % bookColors.length]!, [0, 0.25 + i % 2 * 0.05, 0], [0.135, 0.5 + i % 2 * 0.1, 0.33]);
      box(book, paper, [0.008, 0.25 + i % 2 * 0.05, 0.175], [0.102, 0.45 + i % 2 * 0.1, 0.012]);
      box(book, brass, [0, 0.2, 0.187], [0.074, 0.012, 0.012]);
    }
    mesh(cabinet, cylinder, terracotta, [-0.91, 1.54, 0.02], [0.15, 0.28, 0.15], true);
    mesh(cabinet, sphere, paper, [0.83, 1.58, 0.04], [0.19, 0.21, 0.19], true);
    mesh(cabinet, cylinder, paper, [0.83, 1.78, 0.04], [0.09, 0.14, 0.09]);
    beam(cabinet, ink, [0.83, 1.85, 0.04], [0.98, 2.26, 0.08], 0.014);
    beam(cabinet, ink, [0.84, 1.86, 0.04], [0.65, 2.15, 0.13], 0.012);
    mesh(cabinet, cylinder, brass, [2.31, 1.44, 0.09], [0.23, 0.06, 0.23]);
    mesh(cabinet, cylinder, brass, [2.31, 1.74, 0.09], [0.036, 0.58, 0.036]);
    const shadeMaterial = matte(0xe1c78c);
    const shade = geometry(new THREE.CylinderGeometry(0.19, 0.4, 0.45, 24, 1, true));
    shadeMaterial.side = THREE.DoubleSide;
    mesh(cabinet, shade, shadeMaterial, [2.31, 2.05, 0.09], [1, 1, 1], true);

    const chair = new THREE.Group();
    chair.position.set(-4.04, 0, -1.03);
    chair.rotation.y = 0.48;
    scene.add(chair);
    for (const x of [-0.43, 0.43]) for (const z of [-0.39, 0.39]) beam(chair, wood, [x * 1.12, 0.03, z * 1.2], [x, 0.66, z], 0.075);
    box(chair, wood, [0, 0.62, 0], [1.06, 0.12, 1.02], true);
    mesh(chair, sphere, matte(0x989d70, plasterMap), [0, 0.74, 0.03], [0.52, 0.13, 0.47], true);
    for (const x of [-0.48, 0.48]) beam(chair, wood, [x, 0.59, -0.43], [x, 1.53, -0.57], 0.075);
    for (let i = 0; i < 3; i++) box(chair, honey, [0, 1.1 + i * 0.18, -0.5 - i * 0.025], [0.99, 0.11, 0.06], true);
    const table = new THREE.Group();
    table.position.set(-4.38, 0, 0.56);
    scene.add(table);
    mesh(table, cylinder, darkWood, [0, 0.53, 0], [0.055, 1.03, 0.055], true);
    mesh(table, cylinder, honey, [0, 1.06, 0], [0.49, 0.075, 0.49], true);
    for (let i = 0; i < 3; i++) beam(table, wood, [0, 0.48, 0], [Math.cos(i * 2.094) * 0.34, 0.03, Math.sin(i * 2.094) * 0.34], 0.06);
    mesh(table, cylinder, paper, [0.16, 1.2, 0.01], [0.09, 0.19, 0.09]);
    const handle = geometry(new THREE.TorusGeometry(0.065, 0.018, 6, 14));
    mesh(table, handle, paper, [0.27, 1.22, 0.01], [1, 1, 1]);
    box(table, bookColors[1]!, [-0.18, 1.13, 0.02], [0.3, 0.055, 0.42]);

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0); leafShape.bezierCurveTo(-0.36, 0.2, -0.32, 0.69, 0, 1);
    leafShape.bezierCurveTo(0.32, 0.69, 0.36, 0.2, 0, 0);
    const leafGeometry = geometry(new THREE.ShapeGeometry(leafShape, 10));
    const leafMaterials = [0x586f4b, 0x75895a, 0x91a66e].map(color => material(new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })));
    const plant = new THREE.Group();
    plant.position.set(4.55, 0, -3.48);
    scene.add(plant);
    const pot = geometry(new THREE.CylinderGeometry(0.42, 0.29, 0.71, 24));
    mesh(plant, pot, terracotta, [0, 0.36, 0], [1, 1, 1], true);
    mesh(plant, cylinder, darkWood, [0, 0.717, 0], [0.36, 0.02, 0.36]);
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, y = 1.15 + i % 4 * 0.35, x = Math.cos(a) * 0.34, z = Math.sin(a) * 0.25;
      beam(plant, ink, [0, 0.69, 0], [x, y, z], 0.018);
      const leaf = mesh(plant, leafGeometry, leafMaterials[i % 3]!, [x, y - 0.1, z], [0.65, 0.71, 1], true);
      leaf.rotation.set(-0.25 + Math.cos(a) * 0.36, a, -Math.sin(a) * 0.72);
    }
    for (let i = 0; i < 3; i++) {
      const leaf = mesh(cabinet, leafGeometry, leafMaterials[i]!, [0.66 + i * 0.11, 2.03 + i * 0.02, 0.1], [0.16, 0.25, 1]);
      leaf.rotation.z = (i - 1) * 0.8;
    }

    const placements: Array<{ p: Point; width: number; angle: number }> = [
      { p: [-2.99, 3.38, -4.7], width: 2.59, angle: 0.008 },
      { p: [-0.02, 2.98, -4.7], width: 2.85, angle: -0.006 },
      { p: [2.93, 3.53, -4.7], width: 2.51, angle: 0.006 },
    ];
    let remaining = certificates.length;
    const loader = new THREE.TextureLoader();
    certificates.forEach((certificate, index) => {
      const placement = placements[index]!;
      const w = placement.width, h = (w - 0.34) * 928 / 1200 + 0.34;
      const group = new THREE.Group();
      group.position.set(...placement.p);
      group.rotation.z = placement.angle;
      group.userData.certificateId = certificate.id;
      scene.add(group);
      const edge = matte(index === 1 ? 0x6a4d30 : 0x795532, woodMap);
      box(group, darkWood, [0, 0, 0], [w + 0.1, h + 0.1, 0.1], true);
      box(group, edge, [0, 0, 0.065], [w, h, 0.13], true);
      box(group, brass, [0, 0, 0.137], [w - 0.135, h - 0.135, 0.018]);
      box(group, paper, [0, 0, 0.154], [w - 0.175, h - 0.175, 0.018]);
      const texture = loader.load(`${options.basePath}${certificate.image}`, () => {
        if (destroyed || failed) return;
        render();
        if (--remaining === 0) options.onReady();
      }, undefined, fail);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      textures.add(texture);
      const imageMaterial = material(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
      mesh(group, plane, imageMaterial, [0, 0, 0.175], [w - 0.34, h - 0.34, 1]);
      const top = placement.p[1] + h / 2 + 0.045;
      for (const dx of [-w * 0.32, w * 0.32]) {
        beam(scene, brass, [placement.p[0] + dx, top, -4.765], [placement.p[0] + dx, 4.76, -4.765], 0.009);
        mesh(scene, sphere, brass, [placement.p[0] + dx, 4.77, -4.735], [0.026, 0.026, 0.02]);
      }
      const label = paint(256, context => {
        context.fillStyle = "#d8c398"; context.fillRect(0, 0, 256, 256);
        context.fillStyle = "#493c2a"; context.textAlign = "center";
        context.font = "22px Georgia";
        context.fillText(index === 2 ? "BSI" : certificate.issuer, 128, 126);
        context.font = "12px sans-serif"; context.fillText("SEPTEMBER 2026", 128, 149);
      });
      label.repeat.set(1, 0.3);
      label.offset.set(0, 0.35);
      const labelMaterial = material(new THREE.MeshBasicMaterial({ map: label, toneMapped: false }));
      mesh(group, plane, labelMaterial, [0, -h / 2 - 0.22, -0.025], [0.75, 0.23, 1]);
      frames.push({ id: certificate.id, group, width: w, height: h, edge });
    });

    const dustGeometry = geometry(new THREE.BufferGeometry());
    const dust = new Float32Array(28 * 3);
    for (let i = 0; i < 28; i++) { dust[i * 3] = -5 + random() * 4; dust[i * 3 + 1] = 0.7 + random() * 3.7; dust[i * 3 + 2] = -2 + random() * 4; }
    const dustOrigin = dust.slice();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
    const dustMaterial = material(new THREE.PointsMaterial({ color: 0xffeed0, size: 0.014, transparent: true, opacity: 0.38, depthWrite: false }));
    scene.add(new THREE.Points(dustGeometry, dustMaterial));
    const projected = new THREE.Vector3();
    const updateSpots = () => {
      options.onHotspots(frames.map(frame => {
        projected.set(0, -frame.height / 2 - 0.22, 0.2);
        frame.group.localToWorld(projected).project(camera);
        return { id: frame.id, x: (projected.x + 1) * 50, y: (1 - projected.y) * 50, visible: projected.z >= -1 && projected.z <= 1 && Math.abs(projected.x) < 0.95 && Math.abs(projected.y) < 0.94 };
      }));
      spotsDirty = false;
    };
    function render() {
      if (destroyed || failed) return;
      camera.lookAt(target);
      try {
        renderer.render(scene, camera);
        if (spotsDirty) updateSpots();
      } catch { fail(); }
    }
    const finishTransition = () => {
      if (!transition) return;
      camera.position.copy(transition.to); target.copy(transition.at);
      transition = undefined; spotsDirty = true;
    };
    const tick = (now: number) => {
      raf = undefined;
      if (destroyed || failed || paused) return;
      elapsed += previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      if (transition) {
        const t = THREE.MathUtils.clamp((now - transition.start) / 650, 0, 1);
        const eased = t * t * (3 - 2 * t);
        camera.position.lerpVectors(transition.from, transition.to, eased);
        target.lerpVectors(transition.look, transition.at, eased);
        spotsDirty = true;
        if (t === 1) transition = undefined;
      }
      if (!reduced) {
        curtains.forEach((curtain, index) => { curtain.rotation.y = Math.sin(elapsed * 0.6 + index) * 0.016; });
        for (let i = 0; i < 28; i++) {
          dust[i * 3] = dustOrigin[i * 3]! + Math.sin(elapsed * 0.16 + i) * 0.08;
          dust[i * 3 + 1] = dustOrigin[i * 3 + 1]! + Math.sin(elapsed * 0.11 + i * 2) * 0.11;
        }
        dustGeometry.getAttribute("position").needsUpdate = true;
      }
      render();
      if (!reduced || transition) schedule();
    };
    function schedule() {
      if (!destroyed && !failed && !paused && (!reduced || transition) && raf === undefined) raf = requestAnimationFrame(tick);
    }
    const moveView = (position: THREE.Vector3, at: THREE.Vector3) => {
      transition = { from: camera.position.clone(), look: target.clone(), to: position.clone(), at: at.clone(), start: performance.now() };
      if (reduced || paused) finishTransition();
      spotsDirty = true; render(); schedule();
    };
    const focusFrame = (id: CertificateId | null) => {
      if (destroyed || failed) return;
      if (id === null) {
        if (savedView) moveView(savedView.position, savedView.target);
        savedView = undefined; selected = null;
        return;
      }
      const frame = frames.find(frame => frame.id === id);
      if (!frame) return;
      if (!selected) savedView = { position: camera.position.clone(), target: target.clone() };
      selected = id;
      const distance = Math.max(frame.height * 0.72, frame.width * 0.68 / camera.aspect) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const at = frame.group.position.clone();
      moveView(at.clone().add(new THREE.Vector3(0, 0, distance)), at);
    };
    const resize = () => {
      if (destroyed || failed) return;
      const bounds = root.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      camera.aspect = width / height;
      camera.fov = width < 600 ? 54 : 48;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      if (selected) { focusFrame(selected); finishTransition(); }
      spotsDirty = true; render();
    };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pick = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / width * 2 - 1, -(event.clientY - bounds.top) / height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      let object: THREE.Object3D | null = raycaster.intersectObjects(frames.map(frame => frame.group), true)[0]?.object ?? null;
      while (object) {
        const id = object.userData.certificateId as CertificateId | undefined;
        if (id) return id;
        object = object.parent;
      }
      return undefined;
    };
    const hover = (id: CertificateId | undefined) => {
      if (hovered === id) return;
      hovered = id;
      for (const frame of frames) frame.edge.emissive.set(frame.id === id ? 0x2a1c08 : 0x000000);
      canvas.style.cursor = id ? "pointer" : "grab";
      render();
    };
    const look = (dx: number, dy: number) => {
      if (selected || failed) return;
      transition = undefined;
      target.x = THREE.MathUtils.clamp(target.x + dx, -3.8, 3.8);
      target.y = THREE.MathUtils.clamp(target.y + dy, 1.9, 3.9);
      spotsDirty = true; render();
    };
    canvas.addEventListener("pointerdown", event => {
      if (failed || event.button !== 0) return;
      if (drag) { drag.multiple = true; return; }
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, distance: 0, multiple: !event.isPrimary };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    }, { signal: events.signal });
    canvas.addEventListener("pointermove", event => {
      if (failed) return;
      if (drag && drag.id === event.pointerId) {
        drag.distance = Math.max(drag.distance, Math.hypot(event.clientX - drag.x, event.clientY - drag.y));
        if (drag.distance >= 6) look(-(event.clientX - drag.lastX) / width * 8, (event.clientY - drag.lastY) / height * 4);
        drag.lastX = event.clientX; drag.lastY = event.clientY;
      } else if (!drag && event.pointerType !== "touch") hover(pick(event));
    }, { signal: events.signal });
    canvas.addEventListener("pointerup", event => {
      if (!drag || drag.id !== event.pointerId) return;
      const clicked = !drag.multiple && Math.max(drag.distance, Math.hypot(event.clientX - drag.x, event.clientY - drag.y)) < 6;
      drag = undefined;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      const id = pick(event);
      canvas.style.cursor = id ? "pointer" : "grab";
      if (clicked && id) options.onSelect(id);
    }, { signal: events.signal });
    const cancelDrag = () => { drag = undefined; canvas.style.cursor = failed ? "default" : "grab"; };
    canvas.addEventListener("pointercancel", cancelDrag, { signal: events.signal });
    canvas.addEventListener("lostpointercapture", cancelDrag, { signal: events.signal });
    canvas.addEventListener("pointerleave", () => { if (!drag) hover(undefined); }, { signal: events.signal });
    root.addEventListener("keydown", event => {
      const direction = ({ ArrowLeft: [-0.35, 0], ArrowRight: [0.35, 0], ArrowUp: [0, 0.2], ArrowDown: [0, -0.2] } as Record<string, [number, number]>)[event.key];
      if (direction) { event.preventDefault(); look(direction[0]!, direction[1]!); }
    }, { signal: events.signal });
    const setTimeOfDay = (time: TimeOfDay) => {
      if (destroyed || failed) return;
      const evening = time === "evening";
      hemisphere.color.set(evening ? 0xa8b6d1 : 0xfff4da);
      hemisphere.groundColor.set(evening ? 0x57505c : 0x74644b);
      hemisphere.intensity = evening ? 1.16 : 2;
      sun.color.set(evening ? 0xc7c4df : 0xffe3ac);
      sun.intensity = evening ? 0.6 : 2.35;
      lampLight.intensity = evening ? 5.8 : 0.6;
      shadeMaterial.emissive.set(evening ? 0x8c571a : 0x000000);
      windowView.color.set(evening ? 0x61789f : 0xffffff);
      sunlight.opacity = evening ? 0.035 : 0.14;
      dustMaterial.opacity = evening ? 0.13 : 0.38;
      renderer.toneMappingExposure = evening ? 0.91 : 1.04;
      renderer.shadowMap.needsUpdate = true;
      render();
    };
    renderer.shadowMap.needsUpdate = true;
    resize();
    observer = new ResizeObserver(resize);
    observer.observe(root);
    window.addEventListener("resize", resize, { passive: true, signal: events.signal });
    schedule();
    return {
      setPaused(value) {
        if (destroyed || paused === value) return;
        paused = value;
        if (value) { finishTransition(); stop(); cancelDrag(); render(); } else schedule();
      },
      setReducedMotion(value) {
        if (destroyed || reduced === value) return;
        reduced = value;
        if (value) { finishTransition(); stop(); render(); } else schedule();
      },
      setTimeOfDay,
      focusFrame,
      resetView() { selected = null; savedView = undefined; cancelDrag(); moveView(home, homeTarget); },
      destroy,
    };
  } catch (error) { destroy(); throw error; }
}
