const output = document.getElementById("output");
const cmd = document.getElementById("cmd");
const terminal = document.querySelector(".terminal");
let currentRisk = "safe";

function clearOutput() {
  output.innerHTML = "";
}

function typeText(text, speed = 20) {
  let i = 0;

  const line = document.createElement("div");

  if (currentRisk === "warning") {
    line.classList.add("bold-warning");
  } else if (currentRisk === "danger") {
    line.classList.add("bold-danger");
  }

  output.appendChild(line);

  function tick() {
    if (i < text.length) {
      line.innerHTML += text[i++];
      setTimeout(tick, speed);
    }
  }

  tick();
}

function createBar(value, max = 100, size = 20) {
  const percent = Math.round((value / max) * 100);
  const filled = Math.round((percent / 100) * size);
  const empty = size - filled;

  const bar =
    "█".repeat(filled) +
    "░".repeat(empty);

  return `${bar} ${percent.toFixed(2)}%`;
}

function updateInputColor() {
  const inputLine = document.querySelector(".input-line");

  if (!inputLine) return;

  inputLine.classList.remove("safe", "warning", "danger");

  const state =
    currentRisk === "warning" ? "warning" :
    currentRisk === "danger" ? "danger" :
    "safe";

  inputLine.classList.add(state);
}

function setRiskTheme(level) {
  terminal.classList.remove("warning", "danger");

  currentRisk = "safe";

  if (level === "suspeita") {
    terminal.classList.add("warning");
    currentRisk = "warning";
  }

  if (level === "phishing") {
    terminal.classList.add("danger");
    currentRisk = "danger";
  }

  updateInputColor(); 
}

async function analyzeURL(url) {
  const res = await fetch("http://localhost:8000/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  return await res.json();
}

// regra simples e compatível com teu ML
function isURL(text) {
  return text.includes(".");
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function print(text, type = "normal") {
  const line = document.createElement("div");

  line.innerHTML = text;

  if (type === "safe") {
    line.classList.add("bold-safe");
  } else if (type === "warning") {
    line.classList.add("bold-warning");
  } else if (type === "danger") {
    line.classList.add("bold-danger");
  }

  line.style.marginBottom = "6px";

  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function spacer(lines = 1) {
  for (let i = 0; i < lines; i++) {
    print("");
  }
}


async function animateBar(label, value, type = "safe") {
  const steps = 20;
  const target = parseFloat(value);

  for (let i = 0; i <= steps; i++) {
    const current = (target / steps) * i;
    const bar = createBar(current);

    print(`${label}: ${bar}`, type);

    await delay(40);
    output.removeChild(output.lastChild);
  }

  print(`${label}: ${createBar(target)}`, type);
}
async function renderResult(data) {
  terminal.classList.remove("warning", "danger");
  clearOutput();

  const prediction = (data.prediction || "").toLowerCase();

  const isPhishing = prediction.includes("phishing");
  const isSuspicious = prediction.includes("suspeita");

  const riskType =
    isPhishing ? "danger" :
    isSuspicious ? "warning" :
    "safe";

  setRiskTheme(
    isPhishing ? "phishing" :
    isSuspicious ? "suspeita" :
    "baixo"
  );

  // 1. TARGET
  await typeText(`[TARGET LOCKED] ${data.url || "unknown"}`);
  await delay(2500);
  spacer(1)

  await typeText("INITIALIZING SCAN...");
  await delay(1200);
  await typeText("[ANALYZING TARGET...]");
  await delay(1200);

  spacer(1)
  // 2. PROBABILITIES (ANTES do prediction)
  await animateBar(
    "LEGITIMATE PROB",
    data.legitimate_probability,
    riskType
  );

  await animateBar(
    "PHISHING PROB",
    data.phishing_probability,
    riskType
  );

  await delay(300);
  spacer(1)

  // 3. RESULTADO
  print(`PREDICTION: ${data.prediction}`, riskType);
  await delay(1000);
  print(`RISK LEVEL: ${data.risk_level}`, riskType);
  await delay(1000);

  spacer(2)
  // 4. ALERTA FINAL
  const finalMessages = isPhishing || isSuspicious
    ? [
        "⚠ THREAT DETECTED: PHISHING NODE",
        "INITIATING COUNTER-TRACE...",
        "TARGET FLAGGED AS MALICIOUS"
      ]
    : [
        "SAFE NODE CONFIRMED",
        "NO THREATS DETECTED"
      ];

  for (let msg of finalMessages) {
    await typeText(msg);
    await delay(250);
  }
}

cmd.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const value = cmd.value.trim();

    print("> " + value);

    if (isURL(value)) {
      try {
        const result = await analyzeURL(value);
        renderResult(result);
      } catch (err) {
        print("ERROR: API UNREACHABLE");
      }
    } else {
      print("unknown command");
    }

    cmd.value = "";
  }
});

// boot sequence
print("SYSTEM READY...");
print("AWAITING TARGET INPUT...");

const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = "01";
const fontSize = 14;

const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ff9f";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }

    drops[i]++;
  }
}

setInterval(drawMatrix, 33);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});