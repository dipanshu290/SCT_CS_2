let originalImageData;
let currentImageData;
let theme = "dark";

// Load image onto both canvases
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas1 = document.getElementById("canvasOriginal");
      const canvas2 = document.getElementById("canvasEncrypted");

      canvas1.width = img.width;
      canvas1.height = img.height;
      canvas2.width = img.width;
      canvas2.height = img.height;

      const ctx1 = canvas1.getContext("2d");
      ctx1.drawImage(img, 0, 0);
      originalImageData = ctx1.getImageData(0, 0, img.width, img.height);
      currentImageData = originalImageData;

      const ctx2 = canvas2.getContext("2d");
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

      logEvent("🖼️ Image loaded");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Drag-and-drop support
document.body.addEventListener("dragover", (e) => e.preventDefault());
document.body.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) {
    loadImage(e.dataTransfer.files[0]);
  }
});

document.getElementById("imageInput").addEventListener("change", (e) => {
  loadImage(e.target.files[0]);
});

function xorAndFlip(imageData, key) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = (y * width + x) * 4;
      const flipIndex = (y * width + (width - x - 1)) * 4;

      newData[flipIndex] = data[srcIndex] ^ key;
      newData[flipIndex + 1] = data[srcIndex + 1] ^ key;
      newData[flipIndex + 2] = data[srcIndex + 2] ^ key;
      newData[flipIndex + 3] = data[srcIndex + 3];
    }
  }

  return new ImageData(newData, width, height);
}

function encryptImage() {
  const key = parseInt(document.getElementById("keyInput").value);
  if (!key || isNaN(key)) {
    alert("🔐 Please enter a valid numeric key.");
    return;
  }

  const canvas = document.getElementById("canvasEncrypted");
  const ctx = canvas.getContext("2d");
  const encrypted = xorAndFlip(originalImageData, key);
  ctx.putImageData(encrypted, 0, 0);
  currentImageData = encrypted;

  logEvent(`🔒 Encrypted with key ${key}`);
}

function decryptImage() {
  const key = parseInt(document.getElementById("keyInput").value);
  if (!key || isNaN(key)) {
    alert("🔐 Please enter a valid numeric key.");
    return;
  }

  const canvas = document.getElementById("canvasEncrypted");
  const ctx = canvas.getContext("2d");
  const decrypted = xorAndFlip(currentImageData, key);
  ctx.putImageData(decrypted, 0, 0);
  currentImageData = decrypted;

  logEvent(`🔓 Decrypted with key ${key}`);
}

function downloadEncrypted() {
  const canvas = document.getElementById("canvasEncrypted");
  const link = document.createElement("a");
  link.download = "encrypted-image.png";
  link.href = canvas.toDataURL();
  link.click();
  logEvent("📥 Downloaded encrypted image");
}

function logEvent(message) {
  const log = document.getElementById("log");
  const time = new Date().toLocaleTimeString();
  log.textContent += `[${time}] ${message}\n`;
  log.scrollTop = log.scrollHeight;
}

// Theme switcher
function switchTheme(selected) {
  theme = selected;
  const root = document.documentElement;

  if (theme === "dark") {
    root.style.setProperty("--bg-dark", "#0f1117");
    root.style.setProperty("--accent-cyber", "#3ea8ff");
    root.style.setProperty("--text-light", "#cde4ff");
  } else if (theme === "cyber") {
    root.style.setProperty("--bg-dark", "#001d2e");
    root.style.setProperty("--accent-cyber", "#00ffe9");
    root.style.setProperty("--text-light", "#ddf");
  } else if (theme === "nebula") {
    root.style.setProperty("--bg-dark", "#1e002f");
    root.style.setProperty("--accent-cyber", "#ff47cd");
    root.style.setProperty("--text-light", "#f0d8ff");
  }

  logEvent(`🎨 Theme switched to ${theme}`);
}

// Threat analyzer (animated simulation)
function threatScan() {
  logEvent("🧪 Scanning for pixel anomalies...");
  let dots = 0;
  const interval = setInterval(() => {
    logEvent("⚠️ Threat check " + ".".repeat(++dots));
    if (dots === 3) {
      clearInterval(interval);
      encryptImage();
      logEvent("✅ Threat scan complete");
    }
  }, 500);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(() => {
    console.log("🧠 Service Worker registered");
  });
}
