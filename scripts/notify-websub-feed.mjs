const site = (process.env.PUBLIC_SITE_URL || 'https://all-manuals.ru').replace(/\/$/, '');
const hubUrl = process.env.WEBSUB_HUB_URL || 'https://pubsubhubbub.appspot.com/';
const feedUrl = `${site}/feed.xml`;

const body = new URLSearchParams({
  'hub.mode': 'publish',
  'hub.url': feedUrl,
});

const response = await fetch(hubUrl, {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
  },
  body,
});

if (!response.ok) {
  const text = await response.text().catch(() => '');
  throw new Error(`WebSub notify failed: ${response.status} ${response.statusText} ${text}`.trim());
}

console.log(`WebSub notified: ${feedUrl}`);
