const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');

let formats = [];
const apis = [
  url => `https://cors.sh/?url=${encodeURIComponent(`https://yt-dlp-api.up.railway.app/info?url=${url}`)}`,
  url => `https://cors.sh/?url=${encodeURIComponent(`https://youtube-dl-api.matheus.workers.dev/?url=${url}`)}`
];

async function tryAPIs(videoUrl) {
  const results = await Promise.all(apis.map(api => 
    fetch(api(videoUrl)).then(r => r.ok ? r.json() : null).catch(() => null)
  ));
  return results.find(r => r && (r.formats || r.url)) || null;
}

fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return (statusDiv.textContent = 'Enter a valid video URL.');

  statusDiv.textContent = 'Trying multiple APIs…';
  formatSelect.style.display = 'none';
  downloadBtn.style.display = 'none';
  formatSelect.innerHTML = '';
  formats = [];

  const data = await tryAPIs(url);
  if (!data) return (statusDiv.textContent = 'All APIs failed or returned nothing.');

  if (data.formats) {
    formats = data.formats.filter(f => f.ext==='mp4' && f.url && f.vcodec!=='none' && f.acodec!=='none');
    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${f.format_note||f.height+'p'} (${f.filesize ? (f.filesize/1024/1024).toFixed(1)+' MB' : 'size unknown'})`;
      formatSelect.appendChild(opt);
    });
  } else if (data.url) {
    formats = [{url: data.url, ext: 'mp4'}];
    const opt = document.createElement('option');
    opt.value = 0;
    opt.textContent = 'Default format (MP4)';
    formatSelect.appendChild(opt);
  }

  if (formats.length === 0) return (statusDiv.textContent = 'No formats available.');

  formatSelect.style.display = 'block';
  downloadBtn.style.display = 'block';
  statusDiv.textContent = 'Select a format and download.';
});

downloadBtn.addEventListener('click', () => {
  const chosen = formats[formatSelect.value];
  if (!chosen?.url) return (statusDiv.textContent = 'Invalid format selected.');
  const a = document.createElement('a');
  a.href = chosen.url;
  a.download = 'video.mp4';
  document.body.appendChild(a);
  a.click();
  a.remove();
  statusDiv.textContent = 'Download started.';
});
