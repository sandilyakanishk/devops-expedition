try {
  const res = await fetch('https://sandilyakanishk.github.io/devops-expedition/', {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  });
  const html = await res.text();
  console.log("=== LIVE INDEX.HTML CONTENT ===");
  console.log(html);
} catch (err) {
  console.error("Fetch failed:", err);
}
