const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');

let formats = [];

function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  const videoId = getYoutubeId(url);

  if (!videoId) {
    statusDiv.textContent = '❌ Invalid YouTube URL.';
    return;
  }

  statusDiv.textContent = '🔍 Fetching formats...';
  formatSelect.style.display = 'none';
  downloadBtn.style.display = 'none';
  formatSelect.innerHTML = '';

  try {
    const res = await fetch(`https://yt.trom.tf/api/info?url=https://www.youtube.com/watch?v=${videoId}`);
    const data = await res.json();

    if (!data || !data.formats) {
      statusDiv.textContent = '⚠️ No formats found.';
      return;
    }

    formats = data.formats.filter(f => f.url && f.qualityLabel);

    if (formats.length === 0) {
      statusDiv.textContent = '❌ No downloadable formats found.';
      return;
    }

    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${f.qualityLabel} (${f.container}, ${f.contentLength ? (f.contentLength / 1024 / 1024).toFixed(1) + ' MB' : 'unknown'})`;
      formatSelect.appendChild(opt);
    });

    formatSelect.style.display = 'block';
    downloadBtn.style.display = 'block';
    statusDiv.textContent = '✅ Choose a format to download.';
  } catch (err) {
    console.error(err);
    statusDiv.textContent = '❌ Failed to fetch formats.';
  }
});

downloadBtn.addEventListener('click', () => {
  const selectedIndex = formatSelect.value;
  const chosen = formats[selectedIndex];

  if (!chosen || !chosen.url) {
    statusDiv.textContent = '⚠️ Invalid format selected.';
    return;
  }

  const a = document.createElement('a');
  a.href = chosen.url;
  a.download = `${chosen.qualityLabel || 'video'}.mp4`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  statusDiv.textContent = '📥 Download started.';
});
