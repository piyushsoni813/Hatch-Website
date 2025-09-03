document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href'))
      .scrollIntoView({ behavior: 'smooth' });
  });
});

const navbar = document.getElementById("mainNavbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      navbar.classList.remove("bg-black");
      navbar.classList.add("bg-glass", "backdrop-blur-lg", "border-b", "border-white/10");
    } else {
      navbar.classList.add("bg-black");
      navbar.classList.remove("bg-black/50", "backdrop-blur-lg", "border-b", "border-white/10");
    }
  });

const canvas = document.getElementById("paper");
const ctx = canvas.getContext("2d");
const orbitImages = Array.from(document.querySelectorAll(".orbit-img"));

/* Layout knobs */
const CONFIG = {
  railCount: 8,           // number of arcs/rails
  railGap: 64,            // px gap between rails
  railThickness: 2,       // base line width
  glow: 0.9,              // 0..1 glow intensity
  hue: 265,               // base purple hue
  sweepStart: 0,          // arc start angle (radians)
  sweepEnd: Math.PI * 2   // 270° quarter circle
};

/* Polyrhythm tempo ratios for each rail (speeds loop cleanly) */
const RATIOS = [
  [1,1],  // 1:1
  [3,2],  // 3:2
  [4,3],  // 4:3
  [5,4],  // 5:4
  [4,5],  // 4:5
  [7,7],  // 9:7
  [4,6],  // 4:6
  [6,8]  // 10:9
];

let W = 0, H = 0, DPR = 1;
let center = { x: 0, y: 0 };
let baseRadius = 0;

/* One phase per rail (0..1), advanced by its polyrhythm ratio */
const phases = new Float32Array(CONFIG.railCount).fill(0);

/* Resize and position the system to the right, mid‑height */
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.width = Math.floor(window.innerWidth * DPR);
  H = canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  // Place arcs on the right side like the screenshot
  center.x = W * 0.98;
  center.y = H * -0.1;

  // Scale base radius with viewport, keep generous negative space
  baseRadius = Math.min(W, H) * 0.22;

  // Sync image container to canvas stacking
  const orbitRoot = document.getElementById("orbit-container");
  orbitRoot.style.width = `${window.innerWidth}px`;
  orbitRoot.style.height = `${window.innerHeight}px`;
}
resize();
window.addEventListener("resize", resize);

/* Utility: draw a single glowing arc */
function drawRail(radius, alpha) {
  const { sweepStart, sweepEnd, railThickness, hue } = CONFIG;

  // Outer soft glow
  const glowW = railThickness * 12;
  const grad = ctx.createRadialGradient(center.x, center.y, radius - glowW, center.x, center.y, radius + glowW);
  grad.addColorStop(0, `hsla(${hue},85%,65%,${0.00 * alpha})`);
  grad.addColorStop(0.45, `hsla(${hue},85%,65%,${0.08 * alpha})`);
  grad.addColorStop(0.55, `hsla(${hue},85%,65%,${0.30 * alpha})`);
  grad.addColorStop(0.65, `hsla(${hue},85%,65%,${0.08 * alpha})`);
  grad.addColorStop(1, `hsla(${hue},85%,65%,0)`);

  ctx.lineWidth = glowW;
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, CONFIG.sweepStart, CONFIG.sweepEnd);
  ctx.stroke();

  // Core line
  ctx.lineWidth = railThickness;
  ctx.strokeStyle = `hsla(${hue},85%,72%,${0.9 * alpha})`;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, CONFIG.sweepStart, CONFIG.sweepEnd);
  ctx.stroke();

  // Inner accent
  ctx.lineWidth = railThickness;
  ctx.strokeStyle = `hsla(${hue+10},95%,85%,${0.6 * alpha})`;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius - railThickness*1.2, CONFIG.sweepStart, CONFIG.sweepEnd);
  ctx.stroke();
}

/* Map phase (0..1) to angle along the quarter arc */
function phaseToAngle(p) {
  return CONFIG.sweepStart + p * (CONFIG.sweepEnd - CONFIG.sweepStart);
}

/* Place each avatar on its rail using its current phase */
function placeAvatars() {
  orbitImages.forEach((node, i) => {
    const radius = baseRadius + i * CONFIG.railGap * DPR;
    const angle = phaseToAngle(phases[i]);
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);

    const px = x / DPR;
    const py = y / DPR;

    const w = node.offsetWidth || 64;
    const h = node.offsetHeight || 64;

    node.style.left = `${px - w/2}px`;
    node.style.top  = `${py - h/2}px`;
  });
}

/* Advance phases using true polyrhythm ratios */
const BASE_BPM = 10;               // slow, elegant sweep
const TWO_PI = Math.PI * 2;
let prev = performance.now();

function tick(now) {
  const dt = (now - prev) / 1000;
  prev = now;

  // Clear
  ctx.clearRect(0, 0, W, H);

  // Draw rails back-to-front with fade
  for (let i = CONFIG.railCount - 1; i >= 0; i--) {
    const r = baseRadius + i * CONFIG.railGap * DPR;
    const fade = 1 - i / (CONFIG.railCount + 2);       // slight falloff
    drawRail(r, fade * (0.6 + CONFIG.glow*0.4));
  }

  // Update polyrhythmic phases and place images
  for (let i = 0; i < CONFIG.railCount; i++) {
    const [num, den] = RATIOS[i % RATIOS.length];
    const cyclesPerSec = (BASE_BPM/60) * (num/den);    // tempo scaled by ratio
    phases[i] = (phases[i] + cyclesPerSec * dt) % 1;   // wrap 0..1
  }

  placeAvatars();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);




// Get DOM elements
const upcomingBtn = document.getElementById("upcomingBtn");
const pastBtn = document.getElementById("pastBtn");
const upcomingEvents = document.getElementById("upcomingEvents");
const pastEvents = document.getElementById("pastEvents");

// Reset both buttons
function resetTabs() {
  upcomingBtn.classList.remove("active-tab");
  pastBtn.classList.remove("active-tab");
  upcomingBtn.classList.add("text-gray-400");
  pastBtn.classList.add("text-gray-400");
}

// Show Upcoming
upcomingBtn.addEventListener("click", () => {
  resetTabs();
  upcomingBtn.classList.add("active-tab");
  upcomingBtn.classList.remove("text-gray-400");

  upcomingEvents.classList.remove("hidden");
  pastEvents.classList.add("hidden");
});

// Show Past
pastBtn.addEventListener("click", () => {
  resetTabs();
  pastBtn.classList.add("active-tab");
  pastBtn.classList.remove("text-gray-400");

  pastEvents.classList.remove("hidden");
  upcomingEvents.classList.add("hidden");
});

// Default state = Upcoming visible
document.addEventListener("DOMContentLoaded", () => {
  resetTabs();
  upcomingBtn.classList.add("active-tab");
  upcomingBtn.classList.remove("text-gray-400");

  upcomingEvents.classList.remove("hidden");
  pastEvents.classList.add("hidden");
});
