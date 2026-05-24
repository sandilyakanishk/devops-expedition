const urls = [
  'https://github.com/sandilyakanishk/portfolio-3Dtrek',
  'https://github.com/sandilyakanishk/portfolio-3dtrek',
  'https://github.com/sandilyakanishk/devops-expedition'
];

for (const url of urls) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${url} -> Status: ${res.status}`);
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
  }
}
