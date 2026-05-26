import fs from 'fs';
import path from 'path';

const file = path.join('f:', 'portfolio', 'public', 'quaternius_cc0-bat-669.glb');
const buffer = fs.readFileSync(file);
const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

console.log('\n--- Animations ---');
if (gltf.animations) {
  gltf.animations.forEach((anim, index) => {
    console.log(`Animation [${index}]: name="${anim.name}" duration=${anim.channels ? anim.channels.length : 0} channels`);
  });
} else {
  console.log('No animations found in GLB.');
}
