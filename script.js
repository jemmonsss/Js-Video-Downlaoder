const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');

let formats = [];

fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return statusDiv.textContent = 'Enter a valid video URL.';

  statusDiv.textContent = 'Fetching video info...';
  formatSelect.style.display = 'none';
  downloadBtn.style.display = 'none';
  formatSelect.innerHTML = '';

  try {
    const res = await fetch(`https://youtube-dl-api.matheus.workers.dev/?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!data.url) {
      statusDiv.textContent = 'No downloadable video found.';
      return;
    }

    // Build one default option since API doesn't provide format list
    const opt = document.createElement('option');
    opt.value = data.url;
    opt.textContent = 'Default Format (MP4, auto quality)';
    formatSelect.appendChild(opt);

    formatSelect.style.display = 'block';
    downloadBtn.style.display = 'block';
    statusDiv.textContent = 'Video found. Ready to download.';
  } catch (err) {
    console.error(err);
    statusDiv.textContent = 'Failed to fetch video info.';
  }
});

downloadBtn.addEventListener('click', () => {
  const chosenUrl = formatSelect.value;

  const a = document.createElement('a');
  a.href = chosenUrl;
  a.download = 'video.mp4';
  document.body.appendChild(a);
  a.click();
  a.remove();

  statusDiv.textContent = 'Download started.';
});
