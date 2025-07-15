const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');

let formats = [];

// Try multiple APIs
const apis = [
  url => `https://yt-dlp-api.up.railway.app/info?url=${encodeURIComponent(url)}`,
  url => `https://youtube-dl-api.matheus.workers.dev/?url=${encodeURIComponent(url)}`,
  url => {
    const id = extractYouTubeId(url);
    return id ? `https://pipedapi.kavin.rocks/streams/${id}` : null;
  }
];

function extractYouTubeId(url) {
  try {
    const match = url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

async function tryAPIs(videoUrl) {
  const promises = apis.map(api => {
    const endpoint = api(videoUrl);
    if (!endpoint) return null;
    return fetch(endpoint).then(r => r.ok ? r.json() : null).catch(() => null);
  });

  const results = await Promise.all(promises);
  for (const result of results) {
    if (!result) continue;
    if (result.formats || result.url || result.videoStreams) return result;
  }
  return null;
}

fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return (statusDiv.textContent = 'Enter a valid video URL.');

  statusDiv.textContent = 'Trying multiple APIs...';
  formatSelect.style.display = 'none';
  downloadBtn.style.display = 'none';
  formatSelect.innerHTML = '';
  formats = [];

  const data = await tryAPIs(url);

  if (!data) {
    statusDiv.textContent = 'All APIs failed or returned no usable formats.';
    return;
  }

  if (data.formats) {
    formats = data.formats.filter(f =>
      f.ext === 'mp4' && f.url && f.vcodec !== 'none' && f.acodec !== 'none'
    );
    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      const quality = f.format_note || (f.height ? f.height + 'p' : 'unknown');
      const size = f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'unknown';
      opt.value = i;
      opt.textContent = `${quality} - ${f.ext} (${size})`;
      formatSelect.appendChild(opt);
    });
  } else if (data.url) {
    formats = [{ url: data.url, format_note: 'default', ext: 'mp4' }];
    const opt = document.createElement('option');
    opt.value = 0;
    opt.textContent = 'Default format (MP4)';
    formatSelect.appendChild(opt);
  } else if (data.videoStreams) {
    formats = data.videoStreams.map(f => ({
      url: f.url,
      format_note: f.quality,
      ext: 'mp4'
    }));
    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${f.format_note} - ${f.ext}`;
      formatSelect.appendChild(opt);
    });
  }

  if (formats.length === 0) {
    statusDiv.textContent = 'No formats available.';
    return;
  }

  formatSelect.style.display = 'block';
  downloadBtn.style.display = 'block';
  statusDiv.textContent = 'Formats loaded.';
});

downloadBtn.addEventListener('click', () => {
  const selectedIndex = formatSelect.value;
  const chosen = formats[selectedIndex];

  if (!chosen || !chosen.url) {
    statusDiv.textContent = 'Invalid format selected.';
    return;
  }

  const a = document.createElement('a');
  a.href = chosen.url;
  a.download = 'video.mp4';
  document.body.appendChild(a);
  a.click();
  a.remove();

  statusDiv.textContent = 'Download started.';
});
