// Test SearXNG public instances
const instances = [
  'https://search.sapti.me',
  'https://searx.tiekoetter.com',
  'https://searx.work',
  'https://search.bus-hit.me',
];

for (const base of instances) {
  try {
    const url = `${base}/search?q=${encodeURIComponent('стиральная машина не сливает воду LG')}&format=json&lang=ru&categories=general`;
    const resp = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!resp.ok) { console.log(`${base}: ${resp.status}`); continue; }
    const data = await resp.json();
    console.log(`${base}: ${data.results?.length || 0} results`);
    if (data.results?.length) {
      data.results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i}: ${r.title?.slice(0, 60)} | ${r.url?.slice(0, 80)}`);
      });
    }
  } catch (e) {
    console.log(`${base}: ERROR - ${e.message?.slice(0, 60)}`);
  }
}
