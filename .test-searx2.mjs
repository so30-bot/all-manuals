// Test more SearXNG instances with JSON
const instances = [
  'https://paulgo.io',
  'https://search.ononoki.org',
  'https://searxng.ch',
  'https://search.hbubli.cc',
  'https://search.inetol.net',
  'https://searx.nixnet.services',
  'https://opnxng.com',
  'https://search.rhscz.eu',
];

for (const base of instances) {
  try {
    const url = `${base}/search?q=${encodeURIComponent('washing machine not draining LG error')}&format=json&lang=en&categories=general`;
    const resp = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0', 'accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    const text = await resp.text();
    if (text.startsWith('{')) {
      const data = JSON.parse(text);
      console.log(`${base}: OK ${data.results?.length || 0} results`);
      if (data.results?.length) {
        data.results.slice(0, 2).forEach((r, i) => console.log(`  ${i}: ${r.title?.slice(0, 50)} | ${r.url?.slice(0, 60)}`));
      }
    } else {
      console.log(`${base}: not JSON (${resp.status})`);
    }
  } catch (e) {
    console.log(`${base}: ${e.message?.slice(0, 50)}`);
  }
}
