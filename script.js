const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');

let formats = [];

// CORS-centric proxies
const proxyUrls = [
  'https://corsproxy.io/?',
  'https://cors.sh/?url=',
  'https://api.cors.lol/?url='
];

// Backend endpoints configuration
const apis = [
  u => `https://yt-dlp-api.up.railway.app/info?url=${encodeURIComponent(u)}`,
  u => `https://youtube-dl-api.matheus.workers.dev/?url=${encodeURIComponent(u)}`,
  u => {
    const m = u.match(/(?:v=|youtu\.be\/)([^&]+)/);
    return m ? `https://pipedapi.kavin.rocks/streams/${m[1]}` : null;
  }
];

// Build combined endpoints
function buildEndpoints(u) {
  return apis.flatMap(fn =>
    proxyUrls.map(proxy => {
      const apiUrl = fn(u);
      return apiUrl ? proxy + apiUrl : null;
    })
  ).filter(Boolean);
}

// Try all endpoint combinations
async function tryAll(url) {
  const endpoints = buildEndpoints(url);
  const results = await Promise.all(endpoints.map(ep =>
    fetch(ep).then(r => (r.ok ? r.json() : null)).catch(() => null)
  ));
  return results.find(r => r && (r.formats || r.url || r.videoStreams)) || null;
}

fetchBtn.addEventListener('click', async () => {
  const u = urlInput.value.trim();
  if (!u) return statusDiv.textContent = 'Enter a valid video URL.';

  statusDiv.textContent = 'Trying many APIs…';
  formatSelect.style.display = 'none';
  downloadBtn.style.display = 'none';
  formatSelect.innerHTML = '';
  formats = [];

  const data = await tryAll(u);
  if (!data) return statusDiv.textContent = 'All APIs failed 🙁';

  if (data.formats) {
    formats = data.formats.filter(f =>
      f.ext === 'mp4' && f.url && f.vcodec !== 'none' && f.acodec !== 'none'
    );
    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      const q = f.format_note || (f.height ? f.height + 'p' : 'MP4');
      const s = f.filesize ? `${(f.filesize/1024/1024).toFixed(1)} MB` : 'size unknown';
      opt.value = i;
      opt.textContent = `${q} – ${s}`;
      formatSelect.appendChild(opt);
    });
  } else if (data.url) {
    formats = [{url: data.url, format_note: 'MP4'}];
    const opt = document.createElement('option');
    opt.value = 0;
    opt.textContent = 'Default MP4';
    formatSelect.appendChild(opt);
  } else if (data.videoStreams) {
    formats = data.videoStreams.map(v => ({
      url: v.url,
      format_note: v.quality,
      ext: 'mp4'
    }));
    formats.forEach((f,i)=>{
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${f.format_note} – MP4`;
      formatSelect.appendChild(opt);
    });
  }

  if (!formats.length) return statusDiv.textContent = 'No usable formats.';
  formatSelect.style.display = 'block';
  downloadBtn.style.display = 'block';
  statusDiv.textContent = 'Choose format and click download!';
});

downloadBtn.addEventListener('click', () => {
  const chosen = formats[formatSelect.value];
  if (!chosen?.url) return statusDiv.textContent = 'Invalid format.';
  const a = document.createElement('a');
  a.href = chosen.url;
  a.download = `${chosen.format_note.replace(/\s+/g,'_')}.mp4`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  statusDiv.textContent = 'Download started!';
});
