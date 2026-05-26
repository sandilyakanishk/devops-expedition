import fs from 'fs';
import path from 'path';

function inspectModel(filename) {
  const file = path.join('f:', 'portfolio', 'public', filename);
  const buffer = fs.readFileSync(file);
  const chunkLength = buffer.readUInt32LE(12);
  const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n================= ${filename} =================`);
  
  if (gltf.meshes) {
    gltf.meshes.forEach((mesh) => {
      console.log(`Mesh: ${mesh.name}`);
      mesh.primitives.forEach((prim, idx) => {
        const posAccessorIdx = prim.attributes.POSITION;
        if (posAccessorIdx !== undefined && gltf.accessors) {
          const accessor = gltf.accessors[posAccessorIdx];
          console.log(`  Primitive [${idx}]: POSITION min=${JSON.stringify(accessor.min)} max=${JSON.stringify(accessor.max)} material=${prim.material}`);
        }
      });
    });
  }

  if (gltf.materials) {
    gltf.materials.forEach((mat, index) => {
      console.log(`Material [${index}]: name="${mat.name}"`);
    });
  }

  if (gltf.nodes) {
    gltf.nodes.forEach((node, idx) => {
      if (node.mesh !== undefined || node.children) {
        console.log(`Node [${idx}]: name="${node.name}" mesh=${node.mesh} scale=${JSON.stringify(node.scale)} translation=${JSON.stringify(node.translation)}`);
      }
    });
  }
}

inspectModel('quaternius_cc0-mossy-rock-1303.glb');
inspectModel('quaternius_cc0-mossy-rock-1308.glb');
