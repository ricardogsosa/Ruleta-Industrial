// ===============================
// VARIABLES PRINCIPALES
// ===============================
let temasOriginal = {}; // Se cargará desde preguntas.json (categorías y preguntas)
let temas = {};         // Copia modificable de temasOriginal
let totalPreguntas = 0; // Cantidad total de preguntas
let usedQuestions = []; // Lista de preguntas ya usadas
let spinning = false;   // Controla si la ruleta está girando

// ===============================
// CONFIGURACIÓN DEL CANVAS
// ===============================
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const w = canvas.width, h = canvas.height;
const c = w / 2;  // centro de la ruleta
const r = c - 10; // radio de la ruleta

// Colores de cada sector (puedes cambiar o agregar más)
const colors = [
  "#ff4d6d","#ffd166","#06d6a0","#118ab2",
  "#8338ec","#3a86ff","#ff006e","#ffbe0b",
  "#fb5607","#06d6a0"
];

let classes = []; // Categorías (Historia, Ciencia, etc.)
let num = 0;      // Número de sectores
let angle = 0;    // Ángulo de cada sector

// ===============================
// CARGAR PREGUNTAS DESDE JSON
// ===============================
async function cargarPreguntas() {
  try {
    const res = await fetch("Ruleta_F.json");  // Carga el archivo externo
    temasOriginal = await res.json();           // Lo convierte a objeto JS
    temas = JSON.parse(JSON.stringify(temasOriginal)); // Copia para modificar

    classes = Object.keys(temas);               // Extrae los nombres de categorías
    num = classes.length;
    angle = 2 * Math.PI / num;                  // Calcula el ángulo de cada sector
    totalPreguntas = Object.values(temas).reduce((a, b) => a + b.length, 0);

    drawWheel();   // Dibuja la ruleta
    updateSummary(); // Actualiza el panel de resumen
  } catch (err) {
    console.error("Error al cargar preguntas:", err);
    alert("No se pudo cargar el archivo preguntas.json");
  }
}

// ===============================
// DIBUJAR LA RULETA
// ===============================
function drawWheel() {
  ctx.clearRect(0, 0, w, h);
  if (!classes.length) return; // Si no hay categorías, no dibuja nada

  for (let i = 0; i < num; i++) {
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, r, i * angle, (i + 1) * angle);
    ctx.closePath();

    ctx.fillStyle = colors[i % colors.length]; // Asigna color
    ctx.globalAlpha = 0.8;
    ctx.fill();

    // Escribe el texto (nombre de la categoría)
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(i * angle + angle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.fillText(classes[i], r - 20, 5);
    ctx.restore();
  }
}

// ===============================
// ANIMACIÓN DE GIRO
// ===============================
function spinWheel() {
  if (spinning || !classes.length) return; // Evita giros dobles
  spinning = true;

  // Cálculo aleatorio del giro
  const spins = Math.random() * 6 + 8; // Número de vueltas
  const extra = Math.random() * angle;  // Ángulo adicional
  const finalAngle = spins * 2 * Math.PI + extra;
  const dur = 4000; // Duración en milisegundos (4 segundos)
  const start = performance.now();

  function anim(t) {
    let e = t - start;
    if (e > dur) e = dur;

    // Easing (animación suave)
    const p = e / dur;
    const es = 1 - Math.pow(1 - p, 3);
    const ang = finalAngle * es;

    // Dibuja el giro
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(ang);
    ctx.translate(-c, -c);
    drawWheel();
    ctx.restore();

    // Continúa o finaliza animación
    if (e < dur) {
      requestAnimationFrame(anim);
    } else {
      spinning = false;
 const actualAngle = finalAngle % (2 * Math.PI);

// 🔹 La flecha está ARRIBA (12 en punto), pero actualmente toma el de ABAJO.
// Por eso giramos la referencia 180° (Math.PI)
const pointerAngle = -Math.PI / 2; // posición arriba

// 🔹 Calculamos qué sector quedó bajo la flecha
const adjusted = (pointerAngle - actualAngle + 2 * Math.PI) % (2 * Math.PI);

// 🔹 Determinamos el índice correcto del sector ganador
const idx = Math.floor(adjusted / angle) % num;

// 🔹 Mostramos la pregunta de esa categoría
showQ(idx);
// Muestra pregunta de la categoría ganadora
    }
  }
  requestAnimationFrame(anim);
}

// ===============================
// MOSTRAR PREGUNTA
// ===============================
function showQ(i) {
  const cls = classes[i];
  if (!temas[cls].length) {
    updatePanel(cls, "Sin preguntas restantes.");
    return;
  }

  // Escoge pregunta al azar
  const qIndex = Math.floor(Math.random() * temas[cls].length);
  const q = temas[cls].splice(qIndex, 1)[0]; // La elimina del array
  usedQuestions.push({ cls, q });

  updatePanel(cls, q);
  updateSummary();
  showBig(cls, q);
}

// ===============================
// ACTUALIZAR PANELES
// ===============================
function updatePanel(cls, q) {
  resultTitle.textContent = cls;
  resultContent.textContent = q;
  counterText.textContent = `Pregunta ${usedQuestions.length}/${totalPreguntas}`;
}

function updateSummary() {
  if (!classes.length) return;
  let totalRestante = totalPreguntas - usedQuestions.length;
  let html = "";
  for (const c in temas) {
    html += `${c}: ${temas[c].length} restantes<br>`;
  }
  html += `<br>Total restante: ${totalRestante}/${totalPreguntas}`;
  summaryList.innerHTML = html;
}

// ===============================
// VENTANA EMERGENTE (MODAL)
// ===============================
const big = document.getElementById("bigResult");
bigAccept.onclick = () => big.classList.remove("show"); // Cierra el modal

function showBig(cls, q) {
  bigResultTitle.textContent = cls;
  bigResultQuestion.textContent = q;
  big.classList.add("show"); // Lo muestra en pantalla
}

// ===============================
// BOTONES
// ===============================
spinBtn.onclick = spinWheel;

resetBtn.onclick = () => {
  // Reinicia las preguntas
  temas = JSON.parse(JSON.stringify(temasOriginal));
  usedQuestions = [];
  updatePanel("Pulsa girar", "Aquí aparecerá la categoría y la pregunta.");
  updateSummary();
};

nextBtn.onclick = () => {
  // Muestra otra pregunta al azar sin girar la ruleta
  const disp = classes.filter(c => temas[c].length > 0);
  if (!disp.length) return alert("No quedan preguntas.");
  const cls = disp[Math.floor(Math.random() * disp.length)];
  const qIndex = Math.floor(Math.random() * temas[cls].length);
  const q = temas[cls].splice(qIndex, 1)[0];
  usedQuestions.push({ cls, q });
  updatePanel(cls, q);
  updateSummary();
  showBig(cls, q);
};

// ===============================
// INICIO
// ===============================
cargarPreguntas(); // Carga el JSON automáticamente al iniciar
