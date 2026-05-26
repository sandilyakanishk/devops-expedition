import fs from 'fs';
import path from 'path';

const filePath = path.join('f:', 'portfolio', 'scratch', 'prev_env.jsx');
const content = fs.readFileSync(filePath, 'utf16le');

// Let's find "ForestDecorations" in the content
const lines = content.split('\n');
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function ForestDecorations')) {
    start = i;
    break;
  }
}

if (start !== -1) {
  console.log(`Found ForestDecorations at line ${start + 1}`);
  for (let i = start; i < start + 150 && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log('ForestDecorations not found.');
}
