/**
 * SKIN AURA — Minecraft Bedrock Creator Studio
 * Engine & Web Application Core Logic
 */

// Global Application State
const state = {
  pfp: {
    skinImg: null,
    skinFileName: '',
    skinDim: '64x64',
    pose: 'standing',
    bg: 'purple',
    customBgImg: null,
    aura: 'none',
    cape: 'none',
    fx: {
      glow: true,
      outline: false,
      vignette: true,
      shadow: true
    }
  },
  pack: {
    skins: [], // Array of { id, name, img, file }
    name: 'Skin Aura Custom Pack',
    creator: 'Skin Aura Creator',
    desc: 'Custom skin pack created with Skin Aura Studio.',
    iconBase64: null
  },
  cape: {
    tool: 'pencil',
    color: '#9933ff',
    width: 10,
    height: 16,
    grid: [], // 2D array [height][width] color strings
    history: [],
    historyIdx: -1
  }
};

// ==========================================================================
// INITIALIZATION & TAB ROUTING
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initCapeGrid();
  setupEventListeners();
  renderPfp();
});

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) activeTab.classList.add('active');

  const activeNav = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Close mobile nav
  document.getElementById('nav-links').classList.remove('show');

  if (tabId === 'pfp') renderPfp();
  if (tabId === 'cape') drawCapeCanvas();
}

function setupEventListeners() {
  // Mobile Hamburger Toggle
  const hamburger = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('show'));

  // PFP Skin Drag & Drop Setup
  setupDropZone('pfp-drop-zone', 'pfp-skin-input', handlePfpSkinFile);

  // Pack Skins Drag & Drop Setup
  setupDropZone('pack-drop-zone', 'pack-skins-input', handlePackSkinsFiles);

  // Cape Canvas Interactive Painting
  const capeCanvas = document.getElementById('cape-pixel-canvas');
  let isDrawing = false;

  capeCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    paintCapePixel(e);
  });

  capeCanvas.addEventListener('mousemove', (e) => {
    if (isDrawing) paintCapePixel(e);
  });

  window.addEventListener('mouseup', () => {
    if (isDrawing) {
      isDrawing = false;
      saveCapeHistory();
    }
  });
}

// Toast Alert System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '✓'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Generic Dropzone Binder
function setupDropZone(zoneId, inputId, handlerFn) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);

  zone.addEventListener('click', (e) => {
    if (e.target !== input) input.click();
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlerFn(e.dataTransfer.files);
    }
  });

  input.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handlerFn(e.target.files);
    }
  });
}

// Validation Utility for Bedrock Skins
function validateBedrockSkinPNG(file, callback) {
  if (file.type !== 'image/png') {
    showToast('Invalid file format. Bedrock skins must be PNG files.', 'error');
    return;
  }

  const img = new Image();
  const url = URL.createObjectURL(file);

  img.onload = () => {
    URL.revokeObjectURL(url);
    const w = img.width;
    const h = img.height;

    // Bedrock standard dimensions validation: 64x64 or 128x128
    if ((w === 64 && (h === 64 || h === 32)) || (w === 128 && h === 128)) {
      callback(img, `${w}x${h}`);
    } else {
      showToast(`Invalid dimensions (${w}x${h}). Bedrock skins must be 64x64 or 128x128.`, 'error');
    }
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('Failed to parse PNG skin file.', 'error');
  };

  img.src = url;
}

// ==========================================================================
// 🧑‍🎨 BEDROCK PFP GENERATOR ENGINE
// ==========================================================================

function handlePfpSkinFile(files) {
  const file = files[0];
  validateBedrockSkinPNG(file, (img, dim) => {
    state.pfp.skinImg = img;
    state.pfp.skinFileName = file.name;
    state.pfp.skinDim = dim;

    document.getElementById('pfp-skin-filename').textContent = file.name;
    document.getElementById('pfp-skin-dim').textContent = dim;
    document.getElementById('pfp-skin-thumb').src = img.src;
    document.getElementById('pfp-skin-info').classList.remove('hidden');

    renderPfp();
    showToast('Bedrock skin loaded successfully!');
  });
}

function clearPfpSkin() {
  state.pfp.skinImg = null;
  document.getElementById('pfp-skin-info').classList.add('hidden');
  document.getElementById('pfp-skin-input').value = '';
  renderPfp();
}

function setPfpOption(category, value) {
  state.pfp[category] = value;

  // Update button active UI
  document.querySelectorAll(`.opt-btn[data-group="${category}"]`).forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === value);
  });

  renderPfp();
}

function handleCustomBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      state.pfp.customBgImg = img;
      setPfpOption('bg', 'custom');
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// Master Canvas Rendering Routine for PFP
function renderPfp() {
  const canvas = document.getElementById('pfp-canvas');
  const ctx = canvas.getContext('2d');
  const size = canvas.width; // 512x512

  ctx.clearRect(0, 0, size, size);

  // 1. Draw Background
  drawPfpBackground(ctx, size);

  // 2. Draw Cape (Behind Avatar)
  drawPfpCape(ctx, size);

  // 3. Draw Character / Skin Avatar
  drawPfpCharacter(ctx, size);

  // 4. Draw Aura Particles
  drawPfpAura(ctx, size);

  // 5. Draw Post Effects (Vignette)
  if (document.getElementById('fx-vignette').checked) {
    const vigGradient = ctx.createRadialGradient(size/2, size/2, size*0.3, size/2, size/2, size*0.7);
    vigGradient.addColorStop(0, 'rgba(0,0,0,0)');
    vigGradient.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vigGradient;
    ctx.fillRect(0, 0, size, size);
  }
}

function drawPfpBackground(ctx, size) {
  const bg = state.pfp.bg;

  if (bg === 'custom' && state.pfp.customBgImg) {
    ctx.drawImage(state.pfp.customBgImg, 0, 0, size, size);
    return;
  }

  const grad = ctx.createLinearGradient(0, 0, size, size);
  switch(bg) {
    case 'blue':
      grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#1e3a8a'); break;
    case 'galaxy':
      grad.addColorStop(0, '#090514'); grad.addColorStop(0.5, '#2e1065'); grad.addColorStop(1, '#0284c7'); break;
    case 'sunset':
      grad.addColorStop(0, '#31103f'); grad.addColorStop(0.5, '#701a75'); grad.addColorStop(1, '#f59e0b'); break;
    case 'nether':
      grad.addColorStop(0, '#180505'); grad.addColorStop(0.5, '#450a0a'); grad.addColorStop(1, '#991b1b'); break;
    case 'end':
      grad.addColorStop(0, '#050a0f'); grad.addColorStop(0.5, '#142834'); grad.addColorStop(1, '#115e59'); break;
    case 'dark':
      grad.addColorStop(0, '#050508'); grad.addColorStop(1, '#111119'); break;
    case 'purple':
    default:
      grad.addColorStop(0, '#0f0c1b'); grad.addColorStop(0.5, '#2e1065'); grad.addColorStop(1, '#581c87'); break;
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
}

function drawPfpCharacter(ctx, size) {
  const img = state.pfp.skinImg;
  const headSize = 180;
  const headX = (size - headSize) / 2;
  const headY = 120;

  // Outer Glow FX
  if (document.getElementById('fx-glow').checked) {
    ctx.save();
    ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
    ctx.shadowBlur = 30;
  }

  if (!img) {
    // Placeholder Silhouette if no skin uploaded
    ctx.fillStyle = '#1e1e2d';
    ctx.fillRect(headX, headY, headSize, headSize);
    ctx.fillRect(headX + 20, headY + headSize, headSize - 40, 160);
    ctx.fillStyle = '#3f3f5a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UPLOAD SKIN', size/2, headY + headSize/2 + 5);
    if (document.getElementById('fx-glow').checked) ctx.restore();
    return;
  }

  ctx.imageSmoothingEnabled = false; // Preserve crisp Minecraft pixels

  // Pose Stance Variations (Slight Rotation Transforms)
  ctx.save();
  const pose = state.pfp.pose;
  if (pose === 'left') { ctx.translate(size/2, headY + headSize/2); ctx.rotate(-0.08); ctx.translate(-size/2, -(headY + headSize/2)); }
  if (pose === 'right') { ctx.translate(size/2, headY + headSize/2); ctx.rotate(0.08); ctx.translate(-size/2, -(headY + headSize/2)); }
  if (pose === 'running' || pose === 'pvp') { ctx.translate(size/2, headY + headSize/2); ctx.rotate(-0.04); ctx.translate(-size/2, -(headY + headSize/2)); }

  // 1. Base Head (Front Face - UV x:8, y:8, w:8, h:8)
  ctx.drawImage(img, 8, 8, 8, 8, headX, headY, headSize, headSize);

  // 2. Head Overlay / Hat Layer (UV x:40, y:8, w:8, h:8)
  ctx.drawImage(img, 40, 8, 8, 8, headX - 4, headY - 4, headSize + 8, headSize + 8);

  // 3. Body Torso (Front - UV x:20, y:20, w:8, h:12)
  const bodyW = headSize;
  const bodyH = 180;
  const bodyX = headX;
  const bodyY = headY + headSize;
  ctx.drawImage(img, 20, 20, 8, 12, bodyX, bodyY, bodyW, bodyH);

  // Body Overlay Layer (UV x:20, y:36, w:8, h:12) if 64x64 format
  if (state.pfp.skinDim !== '64x32') {
    ctx.drawImage(img, 20, 36, 8, 12, bodyX - 2, bodyY, bodyW + 4, bodyH);
  }

  ctx.restore();
  if (document.getElementById('fx-glow').checked) ctx.restore();
}

function drawPfpCape(ctx, size) {
  const capeOpt = state.pfp.cape;
  if (capeOpt === 'none') return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const capeW = 200;
  const capeH = 280;
  const capeX = (size - capeW) / 2;
  const capeY = 200;

  if (capeOpt === 'designed') {
    // Render Cape directly from Cape Designer Grid Canvas
    const tempCapeCanvas = renderCapeToCanvas();
    ctx.drawImage(tempCapeCanvas, capeX, capeY, capeW, capeH);
  } else {
    // Preset Capes Fallback
    ctx.fillStyle = capeOpt.includes('fire') ? '#991b1b' : capeOpt.includes('galaxy') ? '#312e81' : '#854d0e';
    ctx.fillRect(capeX, capeY, capeW, capeH);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(capeX + capeW*0.3, capeY + capeH*0.2, capeW*0.4, capeH*0.4);
  }

  ctx.restore();
}

function drawPfpAura(ctx, size) {
  const aura = state.pfp.aura;
  if (aura === 'none') return;

  ctx.save();
  const centerX = size / 2;
  const centerY = size / 2;

  let color1 = '#8b5cf6', color2 = '#ec4899';
  if (aura === 'fire') { color1 = '#f97316'; color2 = '#ef4444'; }
  if (aura === 'lightning') { color1 = '#38bdf8'; color2 = '#facc15'; }
  if (aura === 'ice') { color1 = '#a5f3fc'; color2 = '#0284c7'; }
  if (aura === 'shadow') { color1 = '#374151'; color2 = '#111827'; }
  if (aura === 'galaxy') { color1 = '#c084fc'; color2 = '#38bdf8'; }
  if (aura === 'toxic') { color1 = '#4ade80'; color2 = '#15803d'; }
  if (aura === 'sakura') { color1 = '#f472b6'; color2 = '#fbcfe8'; }

  // Draw procedural particle stars/sparks around character
  for (let i = 0; i < 35; i++) {
    const angle = (i / 35) * Math.PI * 2;
    const dist = 120 + Math.sin(i * 3) * 60;
    const px = centerX + Math.cos(angle) * dist;
    const py = centerY + Math.sin(angle) * dist;
    const radius = 3 + (i % 4) * 2;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? color1 : color2;
    ctx.shadowColor = color1;
    ctx.shadowBlur = 10;
    ctx.fill();
  }

  ctx.restore();
}

function downloadPFP() {
  const canvas = document.getElementById('pfp-canvas');
  const link = document.createElement('a');
  link.download = `SkinAura-PFP-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Downloaded HD Profile Picture!');
}

// ==========================================================================
// 📦 BEDROCK SKIN PACK GENERATOR ENGINE
// ==========================================================================

function handlePackSkinsFiles(files) {
  Array.from(files).forEach(file => {
    validateBedrockSkinPNG(file, (img, dim) => {
      const skinObj = {
        id: 'skin_' + Math.random().toString(36).substr(2, 9),
        name: file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, " "),
        img: img,
        dim: dim,
        file: file
      };

      state.pack.skins.push(skinObj);
      renderPackSkinsList();
      showToast(`Added ${file.name} to skin pack.`);
    });
  });
}

function renderPackSkinsList() {
  const list = document.getElementById('pack-skins-list');
  document.getElementById('pack-skin-count').textContent = state.pack.skins.length;

  if (state.pack.skins.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span>📁</span>
        <p>No skins added yet. Upload your first PNG skin above!</p>
      </div>`;
    return;
  }

  list.innerHTML = '';
  state.pack.skins.forEach((skin, idx) => {
    const card = document.createElement('div');
    card.className = 'skin-card';

    // Face Preview Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(skin.img, 8, 8, 8, 8, 0, 0, 32, 32); // Front Face
    ctx.drawImage(skin.img, 40, 8, 8, 8, 0, 0, 32, 32); // Hat Overlay

    card.appendChild(canvas);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input';
    input.value = skin.name;
    input.onchange = (e) => { state.pack.skins[idx].name = e.target.value; };
    card.appendChild(input);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-icon btn-danger';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => removeSkinFromPack(idx);
    card.appendChild(removeBtn);

    list.appendChild(card);
  });
}

function removeSkinFromPack(idx) {
  state.pack.skins.splice(idx, 1);
  renderPackSkinsList();
}

function handlePackIconUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    state.pack.iconBase64 = evt.target.result;
    document.getElementById('pack-icon-preview').src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// Generate Compliant Minecraft Bedrock .mcpack Zip File
async function generateAndExportPack() {
  if (state.pack.skins.length === 0) {
    showToast('Please add at least one Bedrock PNG skin before building.', 'error');
    return;
  }

  if (typeof JSZip === 'undefined') {
    showToast('JSZip engine library not loaded. Check connection.', 'error');
    return;
  }

  const zip = new JSZip();
  const packName = document.getElementById('pack-name').value || 'Skin Aura Pack';
  const packCreator = document.getElementById('pack-creator').value || 'Skin Aura';
  const packDesc = document.getElementById('pack-desc').value || 'Bedrock Skin Pack';

  // UUID v4 Generator
  const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  const headerUUID = generateUUID();
  const moduleUUID = generateUUID();

  // 1. Bedrock manifest.json Structure
  const manifestJson = {
    "format_version": 2,
    "header": {
      "name": packName,
      "description": packDesc,
      "uuid": headerUUID,
      "version": [1, 0, 0],
      "min_engine_version": [1, 16, 0]
    },
    "modules": [
      {
        "type": "skins",
        "uuid": moduleUUID,
        "version": [1, 0, 0]
      }
    ]
  };

  zip.file('manifest.json', JSON.stringify(manifestJson, null, 2));

  // 2. Bedrock skins.json Structure
  const skinsArray = state.pack.skins.map((s, i) => {
    const fileKey = `skin_${i + 1}.png`;
    
    // Add file to ZIP
    zip.file(fileKey, s.file);

    return {
      "localization_name": s.name,
      "geometry": s.dim === '128x128' ? "geometry.humanoid.customSlim" : "geometry.humanoid.custom",
      "texture": fileKey,
      "type": "free"
    };
  });

  const skinsJson = {
    "serialize_name": packName.replace(/[^a-zA-Z0-9]/g, ""),
    "localization_name": packName,
    "skins": skinsArray
  };

  zip.file('skins.json', JSON.stringify(skinsJson, null, 2));

  // 3. languages / en_US.lang for in-game naming
  const langContent = state.pack.skins.map((s, i) => `skin.${packName.replace(/[^a-zA-Z0-9]/g, "")}.${s.name}=${s.name}`).join('\n');
  zip.folder('texts').file('en_US.lang', langContent);

  // 4. pack_icon.png
  if (state.pack.iconBase64) {
    const iconData = state.pack.iconBase64.split(',')[1];
    zip.file('pack_icon.png', iconData, { base64: true });
  } else {
    // Standard Fallback transparent 64x64 PNG
    const fallbackBase64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAPUlEQVR42u3BAQEAAACCIP+vbthANQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8GygAB3L26qgAAAABJRU5ErkJggg==";
    zip.file('pack_icon.png', fallbackBase64, { base64: true });
  }

  // Build & Trigger Download
  showToast('Generating .mcpack file...', 'info');
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${packName.replace(/[^a-zA-Z0-9_-]/g, "_")}.mcpack`;
  link.click();

  showToast('✓ .MCPACK generated and downloaded successfully!', 'success');
}

// ==========================================================================
// 🦸 BEDROCK CAPE DESIGNER ENGINE
// ==========================================================================

function initCapeGrid() {
  state.cape.grid = Array(state.cape.height).fill(null).map(() => Array(state.cape.width).fill('#ffffff'));
  saveCapeHistory();
  drawCapeCanvas();
}

function setCapeTool(tool) {
  state.cape.tool = tool;
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tool-${tool}`).classList.add('active');
}

function updateCapeColor(val) {
  state.cape.color = val;
  document.getElementById('color-preview-bar').style.backgroundColor = val;
}

function paintCapePixel(e) {
  const canvas = document.getElementById('cape-pixel-canvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  const cellW = canvas.width / state.cape.width;
  const cellH = canvas.height / state.cape.height;

  const gridX = Math.floor(clickX / cellW);
  const gridY = Math.floor(clickY / cellH);

  if (gridX >= 0 && gridX < state.cape.width && gridY >= 0 && gridY < state.cape.height) {
    if (state.cape.tool === 'pencil') {
      state.cape.grid[gridY][gridX] = state.cape.color;
    } else if (state.cape.tool === 'eraser') {
      state.cape.grid[gridY][gridX] = 'transparent';
    } else if (state.cape.tool === 'fill') {
      floodFillCape(gridX, gridY, state.cape.grid[gridY][gridX], state.cape.color);
    }
    drawCapeCanvas();
  }
}

function floodFillCape(x, y, targetColor, replacementColor) {
  if (targetColor === replacementColor) return;
  if (x < 0 || x >= state.cape.width || y < 0 || y >= state.cape.height) return;
  if (state.cape.grid[y][x] !== targetColor) return;

  state.cape.grid[y][x] = replacementColor;

  floodFillCape(x + 1, y, targetColor, replacementColor);
  floodFillCape(x - 1, y, targetColor, replacementColor);
  floodFillCape(x, y + 1, targetColor, replacementColor);
  floodFillCape(x, y - 1, targetColor, replacementColor);
}

function drawCapeCanvas() {
  const canvas = document.getElementById('cape-pixel-canvas');
  const ctx = canvas.getContext('2d');
  const cellW = canvas.width / state.cape.width;
  const cellH = canvas.height / state.cape.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < state.cape.height; r++) {
    for (let c = 0; c < state.cape.width; c++) {
      const color = state.cape.grid[r][c];
      if (color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
  }
}

function saveCapeHistory() {
  // Truncate future history if undoing
  if (state.cape.historyIdx < state.cape.history.length - 1) {
    state.cape.history = state.cape.history.slice(0, state.cape.historyIdx + 1);
  }
  const snap = JSON.stringify(state.cape.grid);
  state.cape.history.push(snap);
  state.cape.historyIdx = state.cape.history.length - 1;
}

function undoCape() {
  if (state.cape.historyIdx > 0) {
    state.cape.historyIdx--;
    state.cape.grid = JSON.parse(state.cape.history[state.cape.historyIdx]);
    drawCapeCanvas();
  }
}

function redoCape() {
  if (state.cape.historyIdx < state.cape.history.length - 1) {
    state.cape.historyIdx++;
    state.cape.grid = JSON.parse(state.cape.history[state.cape.historyIdx]);
    drawCapeCanvas();
  }
}

function clearCapeCanvas() {
  initCapeGrid();
  showToast('Cape canvas cleared.');
}

function loadCapePreset(type) {
  const g = state.cape.grid;
  const w = state.cape.width;
  const h = state.cape.height;

  // Fill Background
  for(let r=0; r<h; r++) for(let c=0; c<w; c++) g[r][c] = '#1e1b4b';

  if (type === 'fire') {
    for(let r=0; r<h; r++) for(let c=0; c<w; c++) g[r][c] = r > 10 ? '#ef4444' : r > 5 ? '#f97316' : '#facc15';
  } else if (type === 'lightning') {
    for(let r=0; r<h; r++) for(let c=0; c<w; c++) g[r][c] = '#0284c7';
    g[3][5] = g[4][5] = g[5][4] = g[6][4] = g[7][3] = g[8][4] = g[9][4] = g[10][5] = '#facc15';
  } else if (type === 'crystal') {
    for(let r=0; r<h; r++) for(let c=0; c<w; c++) g[r][c] = '#06b6d4';
    g[6][4] = g[6][5] = g[7][3] = g[7][6] = g[8][4] = g[8][5] = '#ccfbf1';
  }

  saveCapeHistory();
  drawCapeCanvas();
  showToast(`Loaded ${type} cape preset!`);
}

function renderCapeToCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = state.cape.width;
  canvas.height = state.cape.height;
  const ctx = canvas.getContext('2d');

  for (let r = 0; r < state.cape.height; r++) {
    for (let c = 0; c < state.cape.width; c++) {
      ctx.fillStyle = state.cape.grid[r][c];
      ctx.fillRect(c, r, 1, 1);
    }
  }
  return canvas;
}

function downloadCapePNG() {
  // Renders a full 64x32 Bedrock Cape Texture Specification Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const capeFront = renderCapeToCanvas();
  // Draw Front Cape face onto correct Bedrock texture UV coordinate (x:1, y:1, w:10, h:16)
  ctx.drawImage(capeFront, 1, 1, 10, 16);

  const link = document.createElement('a');
  link.download = `SkinAura-Bedrock-Cape-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Exported standard 64x32 Bedrock Cape Texture!');
}

function applyCapeToPfp() {
  setPfpOption('cape', 'designed');
  switchTab('pfp');
  showToast('Applied custom cape to PFP Generator!');
}
