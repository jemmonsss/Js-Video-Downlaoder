const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');

let formats = [];
const proxy = 'https://cors.sh/?url=';
const apis = [
  url => proxy + `https://yt-dlp-api.up.railway.app/info?url=${encodeURIComponent(url)}`,
  url => proxy + `https://youtube-dl-api.matheus.workers.dev/?url=${encodeURIComponent(url)}`,
  url => {
    const m = url.match(/(?:v=|youtu\.be\/)([^&]+)/);
    return m ? proxy + `https://pipedapi.kavin.rocks/streams/${m[1]}` : null;
  }
];

async function tryAPIs(videoUrl) {
  const results = await Promise.all(apis.map(fn => {
    const endpoint = fn(videoUrl);
    return endpoint ? fetch(endpoint).then(r => r.ok ? r.json() : null).catch(() => null) : null;
  }));
  return results.find(r => r && (r.formats || r.url || r.videoStreams)) || null;
}

fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return (statusDiv.textContent = 'Enter a valid video URL.');

  statusDiv.textContent = 'Fetching from multiple sources…';
  formatSelect.style.display = 'none';
  downloadBtn.style.display = 'none';
  formatSelect.innerHTML = '';
  formats = [];

  const data = await tryAPIs(url);
  if (!data) return (statusDiv.textContent = 'All APIs failed.');

  if (data.formats) {
    formats = data.formats.filter(f => f.ext === 'mp4' && f.url && f.vcodec !== 'none' && f.acodec !== 'none');
    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      const quality = f.format_note || (f.height ? f.height + 'p' : 'unknown');
      const size = f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'unknown';
      opt.value = i;
      opt.textContent = `${quality} – ${size}`;
      formatSelect.appendChild(opt);
    });
  } else if (data.url) {
    formats = [{url: data.url, ext: 'mp4'}];
    const opt = document.createElement('option');
    opt.value = 0;
    opt.textContent = 'Default MP4';
    formatSelect.appendChild(opt);
  } else if (data.videoStreams) {
    formats = data.videoStreams.map(v => ({url: v.url, ext: 'mp4', format_note: v.quality}));
    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${f.format_note} – MP4`;
      formatSelect.appendChild(opt);
    });
  }

  if (formats.length === 0) return (statusDiv.textContent = 'No usable formats.');
  formatSelect.style.display = 'block';
  downloadBtn.style.display = 'block';
  statusDiv.textContent = 'Choose format and click download.';
});

downloadBtn.addEventListener('click', () => {
  const chosen = formats[formatSelect.value];
  if (!chosen?.url) return (statusDiv.textContent = 'Invalid selection.');
  const a = document.createElement('a');
  a.href = chosen.url;
  a.download = 'video.mp4';
  document.body.appendChild(a);
  a.click();
  a.remove();
  statusDiv.textContent = 'Download started.';
});
