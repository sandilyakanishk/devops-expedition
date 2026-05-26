import fs from 'fs';
import path from 'path';

const file = path.join('f:', 'portfolio', 'public', 'quaternius_cc0-boat-724.glb');
const buffer = fs.readFileSync(file);

const magic = buffer.toString('utf8', 0, 4);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

console.log(`GLB Magic: ${magic}`);
console.log(`GLB Version: ${version}`);
console.log(`GLB Length: ${length}`);

const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.toString('utf8', 16, 20);

const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

console.log('\n--- Meshes ---');
if (gltf.meshes) {
  gltf.meshes.forEach((mesh, index) => {
    console.log(`Mesh [${index}]: ${mesh.name}`);
    if (mesh.primitives) {
      mesh.primitives.forEach((prim, pIndex) => {
        console.log(`  Primitive [${pIndex}]: attributes=${Object.keys(prim.attributes).join(', ')} material=${prim.material}`);
      });
    }
  });
}

console.log('\n--- Materials ---');
if (gltf.materials) {
  gltf.materials.forEach((mat, index) => {
    console.log(`Material [${index}]: name="${mat.name}"`);
  });
}

console.log('\n--- Nodes ---');
if (gltf.nodes) {
  gltf.nodes.forEach((node, index) => {
    console.log(`Node [${index}]: name="${node.name}" mesh=${node.mesh} rotation=${node.rotation} translation=${node.translation} scale=${node.scale} children=${node.children}`);
  });
}
