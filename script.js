const out = document.getElementById('out');
document.getElementById('btn').addEventListener('click', async () => {
  out.textContent = 'Pozivam /.netlify/functions/hello …';
  try {
    const res = await fetch('/.netlify/functions/hello', { method: 'GET' });
    const text = await res.text();
    out.textContent = `Status: ${res.status}\n\n${text}`;
  } catch (e) {
    out.textContent = 'Greška: ' + e.message;
  }
});
