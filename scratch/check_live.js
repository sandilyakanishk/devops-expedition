import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
];

let selectedPath = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    selectedPath = p;
    break;
  }
}

if (!selectedPath) {
  console.error("Could not find Google Chrome installed in standard paths.");
  process.exit(1);
}

const logFile = path.join(process.cwd(), 'scratch', 'chrome_live_raw.log');
const stream = fs.createWriteStream(logFile);

console.log(`Using Chrome at: ${selectedPath}`);
console.log(`Writing raw logs to: ${logFile}`);

const chromeProcess = spawn(selectedPath, [
  '--headless=new',
  '--disable-gpu',
  '--enable-logging=stderr',
  '--v=1',
  'https://sandilyakanishk.github.io/portfolio-3Dtrek/'
]);

chromeProcess.stderr.pipe(stream);
chromeProcess.stdout.pipe(stream);

setTimeout(() => {
  console.log("Terminating Chrome...");
  chromeProcess.kill();
  stream.end();
  
  // Read and print JS logs specifically
  const logContent = fs.readFileSync(logFile, 'utf8');
  console.log("\n--- PARSED LIVE JS LOGS ---");
  const lines = logContent.split('\n');
  let jsLogsFound = false;
  for (const line of lines) {
    if (line.includes('console') || line.includes('CONSOLE') || line.includes('Error') || line.includes('Uncaught') || line.includes('JS') || line.includes('exception') || line.includes('failed') || line.includes('404')) {
      console.log(line.trim());
      jsLogsFound = true;
    }
  }
  if (!jsLogsFound) {
    console.log("No logs containing key words found.");
  }
  
  process.exit(0);
}, 8000);
