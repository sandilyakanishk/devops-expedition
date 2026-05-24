import * as THREE from 'three';

let cachedClayTexture = null;

export function getClayTexture() {
  if (cachedClayTexture) return cachedClayTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 1. Fill base mid-grey (neutral height)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // 2. Draw soft hand-molded lumps (low frequency height variations)
  // We can draw a few soft, large, semi-transparent white/black circles with radial gradients
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const radius = 50 + Math.random() * 90;
    const isHill = Math.random() > 0.5;
    
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, isHill ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Draw fingerprint swirls (curves representing fingerprint impressions)
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 6; i++) {
    // Generate a swirl center
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    
    // Draw concentric arc segments (fingerprint ridges)
    ctx.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    for (let r = 10; r < 90; r += 10) {
      ctx.beginPath();
      // Draw a partial arc
      const startAngle = Math.random() * Math.PI * 2;
      const endAngle = startAngle + Math.PI + Math.random() * Math.PI;
      ctx.arc(sx, sy, r, startAngle, endAngle);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;

  // 4. Draw high-frequency grain noise (representing fine clay particles)
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 6; // small noise
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 5. Create Three.js Texture
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2.5); // tile it so it is fine-grained
  
  cachedClayTexture = tex;
  return tex;
}
