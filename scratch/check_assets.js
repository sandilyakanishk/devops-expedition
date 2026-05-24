const assets = [
  'https://sandilyakanishk.github.io/devops-expedition/assets/index-CHctFJPt.js',
  'https://sandilyakanishk.github.io/devops-expedition/assets/index-CG0_bKVR.css'
];

for (const url of assets) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${url} -> Status: ${res.status}`);
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
  }
}
