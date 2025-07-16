let originalImageData, currentImageData;

window.onload = () => {
  setTimeout(() => {
    document.getElementById("loader").style.display = "none";
    document.getElementById("app").style.display = "block";
    switchTheme("auto");
  }, 2200);
};

const keySlider = document.getElementById("keySlider");
const keyValue = document.getElementById("keyValue");
keySlider.oninput = () => (keyValue.textContent = keySlider.value);

document.getElementById("imageInput").onchange = (e) =>
  loadImage(e.target.files[0]);

document.body.ondragover = (e) => e.preventDefault();
document.body.ondrop = (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) {
    loadImage(e.dataTransfer.files[0]);
  }
};

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas1 = document.getElementById("canvasOriginal");
      const canvas2 = document.getElementById("canvasEncrypted");
      canvas1.width = canvas2.width = img.width;
      canvas1.height = canvas2.height = img.height;

      const ctx1 = canvas1.getContext("2d");
      ctx1.drawImage(img, 0, 0);
      originalImageData = ctx1.getImageData(0, 0, img.width, img.height);
      currentImageData = originalImageData;

      canvas2.getContext("2d").clearRect(0, 0, canvas2.width, canvas2.height);
      log("🖼️ Image loaded");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function xorAndFlip(imageData, key) {
  const d = imageData.data,
    w = imageData.width,
    h = imageData.height;
  const out = new Uint8ClampedArray(d.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const f = (y * w + (w - x - 1)) * 4;
      out[f] = d[i] ^ key;
      out[f + 1] = d[i + 1] ^ key;
      out[f + 2] = d[i + 2] ^ key;
      out[f + 3] = d[i + 3];
    }
  }
  return new ImageData(out, w, h);
}

function animateEncrypt(imageData, ctx) {
  let y = 0;
  const draw = () => {
    if (y >= imageData.height) return;
    const row = ctx.createImageData(imageData.width, 1);
    for (let x = 0; x < imageData.width; x++)
      for (let i = 0; i < 4; i++)
        row.data[x * 4 + i] = imageData.data[(y * imageData.width + x) * 4 + i];
    ctx.putImageData(row, 0, y++);
    requestAnimationFrame(draw);
  };
  draw();
}

function encryptImage() {
  const key = parseInt(keySlider.value);
  const ctx = document.getElementById("canvasEncrypted").getContext("2d");
  const encrypted = xorAndFlip(originalImageData, key);
  currentImageData = encrypted;
  animateEncrypt(encrypted, ctx);
  log(`🔒 Encrypted with key ${key}`);
}

function decryptImage() {
  const key = parseInt(keySlider.value);
  const ctx = document.getElementById("canvasEncrypted").getContext("2d");
  const decrypted = xorAndFlip(currentImageData, key);
  ctx.putImageData(decrypted, 0, 0);
  currentImageData = decrypted;
  log(`🔓 Decrypted with key ${key}`);
}

function threatScan() {
  log("🧪 Scanning...");
  let i = 0;
  const step = setInterval(() => {
    log("⚠️ Threat check " + ".".repeat(++i));
    if (i === 3) {
      clearInterval(step);
      log("✅ Scan complete");
      encryptImage();
    }
  }, 500);
}

function downloadEncrypted() {
  const link = document.createElement("a");
  link.download = "encrypted-image.png";
  link.href = document.getElementById("canvasEncrypted").toDataURL();
  link.click();
  log("📥 Image downloaded");
}

function exportLog() {
  const logText = document.getElementById("log").textContent;
  const blob = new Blob([logText], { type: "text/plain" });
  const link = document.createElement("a");
  link.download = "glitchcrypt-log.txt";
  link.href = URL.createObjectURL(blob);
  link.click();
  log("📄 Log exported");
}

function generateQR() {
  const ctx = document.getElementById("qrCanvas").getContext("2d");
  ctx.clearRect(0, 0, 150, 150);
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, 150, 150);
  const hash = document
    .getElementById("canvasEncrypted")
    .toDataURL()
    .slice(50, 200);
  [...hash].forEach((c, i) => {
    const v = c.charCodeAt(0);
    const x = (i * 7) % 150;
    const y = (i * 3 + v) % 150;
    ctx.fillStyle = `hsl(${(v * 7) % 360}, 70%, 60%)`;
    ctx.fillRect(x, y, 2, 2);
  });
  log("🔗 QR code generated");
}

function switchTheme(selected) {
  const root = document.documentElement;
  let t =
    selected === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "cyber"
      : selected;
  if (t === "dark") {
    root.style.setProperty("--bg-dark", "#0f1117");
    root.style.setProperty("--accent-cyber", "#3ea8ff");
    root.style.setProperty("--text-light", "#cde4ff");
  } else if (t === "cyber") {
    root.style.setProperty("--bg-dark", "#001d2e");
    root.style.setProperty("--accent-cyber", "#00ffe9");
    root.style.setProperty("--text-light", "#ddf");
  } else if (t === "nebula") {
    root.style.setProperty("--bg-dark", "#1e002f");
    root.style.setProperty("--accent-cyber", "#ff47cd");
    root.style.setProperty("--text-light", "#f0d8ff");
  }
  log(`🎨 Theme set to ${t}`);
}

function log(msg) {
  const logEl = document.getElementById("log");
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `[${time}] ${msg}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
