# 3D Assets & Models Directory

To ensure 100% reliability, instant load times, and a beautiful consistent low-poly art style, the character (explorer) and mountain landscape assets are built **procedurally in code** using custom Three.js mesh geometry and materials (see [Character.jsx](file:///f:/portfolio/src/components/Character.jsx) and [Environment.jsx](file:///f:/portfolio/src/components/Environment.jsx)).

If you want to swap these with custom GLB/FBX files in the future:
1. Place `traveller.glb` and `mountain.glb` in this directory.
2. Import them in React Three Fiber using `@react-three/drei`'s `useGLTF` hook:
   ```javascript
   import { useGLTF } from '@react-three/drei';
   const { scene } = useGLTF('/src/models/traveller.glb');
   ```
3. Place `<primitive object={scene} />` inside your component's group.
