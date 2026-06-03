// Dados do autômato atual
let af = null;

// Nós para o canvas (posição de cada estado)
let nos = [];
let arrastando = null, offX = 0, offY = 0;

// ─── Gerar AF ────────────────────────────────────────────

function gerarAF() {
  const estados  = document.getElementById('estados').value.split(',').map(s => s.trim()).filter(Boolean);
  const inicial  = document.getElementById('inicial').value.trim();
  const finais   = document.getElementById('finais').value.split(',').map(s => s.trim()).filter(Boolean);
  const linhas   = document.getElementById('transicoes').value.trim().split('\n');

  // Montar tabela de transições
  const trans = {};
  for (const linha of linhas) {
    const partes = linha.split(',').map(s => s.trim());
    if (partes.length < 3) continue;
    const [de, sim, para] = partes;
    if (!trans[de]) trans[de] = {};
    trans[de][sim] = para;
  }

  if (!estados.length || !inicial) {
    alert('Preencha ao menos os estados e o estado inicial.');
    return;
  }

  af = { estados, inicial, finais, trans };

  document.getElementById('secao-af').hidden    = false;
  document.getElementById('secao-teste').hidden = false;

  posicionarNos();
  desenhar();
}

// ─── Canvas ──────────────────────────────────────────────

const R = 28; // raio dos círculos

function posicionarNos() {
  const canvas = document.getElementById('canvas');
  const W = canvas.width, H = canvas.height;
  const n = af.estados.length;

  nos = af.estados.map((id, i) => {
    // Layout em círculo
    const angulo = (2 * Math.PI * i / n) - Math.PI / 2;
    const raio   = Math.min(W, H) * 0.35;
    return {
      id,
      x: W / 2 + raio * Math.cos(angulo),
      y: H / 2 + raio * Math.sin(angulo),
      ativo: false
    };
  });

  // Para poucos estados, layout em linha
  if (n <= 4) {
    nos.forEach((no, i) => {
      no.x = (W / (n + 1)) * (i + 1);
      no.y = H / 2;
    });
  }
}

function no(id) {
  return nos.find(n => n.id === id);
}

function desenhar() {
  const canvas = document.getElementById('canvas');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenha transições
  for (const [de, mapa] of Object.entries(af.trans)) {
    for (const [sim, para] of Object.entries(mapa)) {
      desenharAresta(ctx, de, para, sim);
    }
  }

  // Desenha estados
  for (const n of nos) {
    desenharNo(ctx, n);
  }
}

function desenharNo(ctx, n) {
  const { x, y, id, ativo } = n;
  const isFinal   = af.finais.includes(id);
  const isInicial = id === af.inicial;

  // Anel duplo para estados finais
  if (isFinal) {
    ctx.beginPath();
    ctx.arc(x, y, R + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#66bb6a';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  // Círculo principal
  ctx.beginPath();
  ctx.arc(x, y, R, 0, 2 * Math.PI);
  ctx.fillStyle   = ativo ? '#e8eaf6' : '#fff';
  ctx.strokeStyle = ativo ? '#3f51b5' : (isFinal ? '#66bb6a' : '#aaa');
  ctx.lineWidth   = ativo ? 2.5 : 1.8;
  ctx.fill();
  ctx.stroke();

  // Seta de entrada no estado inicial
  if (isInicial) {
    ctx.beginPath();
    ctx.moveTo(x - R - 28, y);
    ctx.lineTo(x - R - 2,  y);
    ctx.strokeStyle = '#999';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    seta(ctx, x - R - 2, y, 0, '#999');
  }

  // Nome do estado
  ctx.fillStyle    = ativo ? '#3f51b5' : '#222';
  ctx.font         = '13px Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, x, y);
}

function desenharAresta(ctx, deId, paraId, simbolo) {
  const de   = no(deId);
  const para = no(paraId);
  if (!de || !para) return;

  // Verifica se a aresta está ativa na simulação
  const ativa = de.ativo && para.ativo;
  const cor   = ativa ? '#3f51b5' : '#bbb';

  ctx.strokeStyle = cor;
  ctx.fillStyle   = cor;
  ctx.lineWidth   = ativa ? 2 : 1.3;

  // Self-loop
  if (deId === paraId) {
    ctx.beginPath();
    ctx.arc(de.x, de.y - R - 18, 18, 0, 2 * Math.PI);
    ctx.stroke();
    seta(ctx, de.x, de.y - R - 2, -Math.PI / 2, cor);
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(simbolo, de.x, de.y - R - 42);
    return;
  }

  // Curva se houver aresta nos dois sentidos
  const temInverso = af.trans[paraId]?.[simbolo] === deId;
  const curva = temInverso ? 30 : 0;

  const dx = para.x - de.x, dy = para.y - de.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / d, ny = dx / d;

  const cpx = (de.x + para.x) / 2 + nx * curva;
  const cpy = (de.y + para.y) / 2 + ny * curva;

  const a1 = Math.atan2(cpy - de.y,   cpx - de.x);
  const a2 = Math.atan2(cpy - para.y, cpx - para.x);

  const sx = de.x   + Math.cos(a1) * R;
  const sy = de.y   + Math.sin(a1) * R;
  const ex = para.x + Math.cos(a2) * R;
  const ey = para.y + Math.sin(a2) * R;

  ctx.beginPath();
  if (curva) {
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
  } else {
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
  }
  ctx.stroke();

  seta(ctx, ex, ey, Math.atan2(ey - cpy, ex - cpx), cor);

  // Label no meio
  const lx = curva ? cpx + nx * 14 : (sx + ex) / 2 + nx * 12;
  const ly = curva ? cpy + ny * 14 : (sy + ey) / 2 + ny * 12;
  ctx.fillStyle = '#444';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(simbolo, lx, ly);
}

function seta(ctx, x, y, angulo, cor) {
  const t = 9;
  ctx.save();
  ctx.fillStyle = cor;
  ctx.translate(x, y);
  ctx.rotate(angulo);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-t, -t / 2.5);
  ctx.lineTo(-t,  t / 2.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── Arrastar estados ────────────────────────────────────

const canvas = document.getElementById('canvas');

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  for (const n of nos) {
    if ((mx - n.x) ** 2 + (my - n.y) ** 2 <= R * R) {
      arrastando = n;
      offX = mx - n.x;
      offY = my - n.y;
      break;
    }
  }
});

canvas.addEventListener('mousemove', e => {
  if (!arrastando) return;
  const rect = canvas.getBoundingClientRect();
  arrastando.x = e.clientX - rect.left - offX;
  arrastando.y = e.clientY - rect.top  - offY;
  desenhar();
});

canvas.addEventListener('mouseup',    () => arrastando = null);
canvas.addEventListener('mouseleave', () => arrastando = null);

// ─── Testar palavra ──────────────────────────────────────

async function testar() {
  if (!af) return;

  const palavra = document.getElementById('palavra').value;
  let estado    = af.inicial;
  const passos  = [estado];

  for (const simbolo of palavra) {
    const proximo = af.trans[estado]?.[simbolo];
    if (!proximo) { passos.push(null); break; }
    estado = proximo;
    passos.push(estado);
  }

  const aceita = estado !== null && af.finais.includes(estado);

  // Mostrar resultado
  const div = document.getElementById('resultado');
  div.className   = aceita ? 'aceita' : 'rejeita';
  div.textContent = aceita
    ? `✔  "${palavra || 'ε'}" foi ACEITA`
    : `✘  "${palavra || 'ε'}" foi REJEITADA`;

  // Mostrar trace
  const trace = document.getElementById('trace');
  trace.innerHTML = '';
  const chars = [''].concat([...palavra], [null]);
  for (let i = 0; i < passos.length; i++) {
    if (i > 0) {
      const seta = document.createElement('span');
      seta.className = 'seta';
      seta.textContent = `─${[...palavra][i - 1]}→`;
      trace.appendChild(seta);
    }
    const el = document.createElement('span');
    el.className = 'passo' +
      (passos[i] === null                          ? ' erro'   :
       i === passos.length - 1 && aceita           ? ' aceito' :
       i === passos.length - 1                     ? ' atual'  : '');
    el.textContent = passos[i] ?? '✘';
    trace.appendChild(el);
  }

  // Animar no canvas
  for (const n of nos) n.ativo = false;
  desenhar();

  for (let i = 0; i < passos.length; i++) {
    for (const n of nos) n.ativo = false;
    const n = no(passos[i]);
    if (n) n.ativo = true;
    desenhar();
    await new Promise(r => setTimeout(r, 400));
  }
}

// Enter para testar
document.getElementById('palavra')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') testar();
});
