const apiBase = 'https://yt-dlp-web.vercel.app/api/download?url=';

const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');

let formats = [];

fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return statusDiv.textContent = 'Enter a valid video URL.';

  statusDiv.textContent = 'Fetching formats...';
  formatSelect.style.display = 'none';
  downloadBtn.style.display = 'none';
  formatSelect.innerHTML = '';

  try {
    const res = await fetch(apiBase + encodeURIComponent(url));
    const data = await res.json();

    if (!data.formats || data.formats.length === 0) {
      statusDiv.textContent = 'No formats found.';
      return;
    }

    formats = data.formats.filter(f => f.ext === 'mp4' && f.vcodec !== 'none');

    if (formats.length === 0) {
      statusDiv.textContent = 'No video formats available.';
      return;
    }

    formats.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${f.format_note || f.height + 'p'} (${f.ext}, ${f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'unknown'})`;
      formatSelect.appendChild(opt);
    });

    formatSelect.style.display = 'block';
    downloadBtn.style.display = 'block';
    statusDiv.textContent = `Choose a format to download.`;
  } catch (err) {
    console.error(err);
    statusDiv.textContent = 'Failed to fetch formats.';
  }
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
  a.download = (chosen.format_note || 'video') + '.mp4';
  document.body.appendChild(a);
  a.click();
  a.remove();

  statusDiv.textContent = 'Download started.';
});
