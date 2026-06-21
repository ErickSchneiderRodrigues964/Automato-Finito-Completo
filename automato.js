let af = null;
let nos = [];
let arrastando = null, offX = 0, offY = 0;

// ─── Gerar AF de Pilha ───────────────────────────────────

function gerarAF() {
  const estados  = document.getElementById('estados').value.split(',').map(s => s.trim()).filter(Boolean);
  const inicial  = document.getElementById('inicial').value.trim();
  const finais   = document.getElementById('finais').value.split(',').map(s => s.trim()).filter(Boolean);
  const zInicial = document.getElementById('pilha-inicial').value.trim() || 'Z';
  const linhas   = document.getElementById('transicoes').value.trim().split('\n');

  const trans = {};
  for (const linha of linhas) {
    const partes = linha.split(',').map(s => s.trim());
    if (partes.length < 5) continue;
    
    // Formato PDA: de, simLido, topoPilha, para, empilhar
    const [de, sim, topo, para, empilha] = partes;
    if (!trans[de]) trans[de] = [];
    trans[de].push({ sim, topo, para, empilha });
  }

  if (!estados.length || !inicial) {
    alert('Preencha ao menos os estados e o estado inicial.');
    return;
  }

  af = { estados, inicial, finais, zInicial, trans };

  document.getElementById('secao-af').hidden    = false;
  document.getElementById('secao-teste').hidden = false;

  posicionarNos();
  desenhar();
}

// ─── Canvas e Desenho ────────────────────────────────────

const R = 32; 

function posicionarNos() {
  const canvas = document.getElementById('canvas');
  const W = canvas.width, H = canvas.height;
  const n = af.estados.length;

  nos = af.estados.map((id, i) => {
    const angulo = (2 * Math.PI * i / n) - Math.PI / 2;
    const raio   = Math.min(W, H) * 0.35;
    return {
      id,
      x: W / 2 + raio * Math.cos(angulo),
      y: H / 2 + raio * Math.sin(angulo),
      ativo: false
    };
  });

  if (n <= 5) {
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

  // Agrupar transições entre os mesmos nós para evitar sobreposição de linhas
  const arestas = {};
  for (const [de, lista] of Object.entries(af.trans)) {
    for (const t of lista) {
      const key = de + "->" + t.para;
      if (!arestas[key]) arestas[key] = { de, para: t.para, labels: [] };
      arestas[key].labels.push(`${t.sim}, ${t.topo}/${t.empilha}`);
    }
  }

  for (const edge of Object.values(arestas)) {
    desenharAresta(ctx, edge.de, edge.para, edge.labels.join(' | '));
  }

  for (const n of nos) {
    desenharNo(ctx, n);
  }
}

function desenharNo(ctx, n) {
  const { x, y, id, ativo } = n;
  const isFinal   = af.finais.includes(id);
  const isInicial = id === af.inicial;

  if (isFinal) {
    ctx.beginPath();
    ctx.arc(x, y, R + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#66bb6a';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(x, y, R, 0, 2 * Math.PI);
  ctx.fillStyle   = ativo ? '#e8eaf6' : '#fff';
  ctx.strokeStyle = ativo ? '#3f51b5' : (isFinal ? '#66bb6a' : '#aaa');
  ctx.lineWidth   = ativo ? 2.5 : 1.8;
  ctx.fill();
  ctx.stroke();

  if (isInicial) {
    ctx.beginPath();
    ctx.moveTo(x - R - 28, y);
    ctx.lineTo(x - R - 2,  y);
    ctx.strokeStyle = '#999';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    seta(ctx, x - R - 2, y, 0, '#999');
  }

  ctx.fillStyle    = ativo ? '#3f51b5' : '#222';
  ctx.font         = '14px Arial';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, x, y);
}

function desenharAresta(ctx, deId, paraId, rotulo) {
  const de   = no(deId);
  const para = no(paraId);
  if (!de || !para) return;

  const ativa = de.ativo && para.ativo;
  const cor   = ativa ? '#3f51b5' : '#bbb';

  ctx.strokeStyle = cor;
  ctx.fillStyle   = cor;
  ctx.lineWidth   = ativa ? 2 : 1.3;

  if (deId === paraId) {
    ctx.beginPath();
    ctx.arc(de.x, de.y - R - 20, 20, 0, 2 * Math.PI);
    ctx.stroke();
    seta(ctx, de.x, de.y - R - 2, -Math.PI / 2, cor);
    ctx.fillStyle = '#555';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(rotulo, de.x, de.y - R - 48);
    return;
  }

  const dx = para.x - de.x, dy = para.y - de.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / d, ny = dx / d;

  let curva = 0;
  // Verifica se existe aresta de volta
  if (af.trans[paraId] && af.trans[paraId].some(t => t.para === deId)) {
      curva = 35;
  }

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

  const lx = curva ? cpx + nx * 14 : (sx + ex) / 2 + nx * 12;
  const ly = curva ? cpy + ny * 14 : (sy + ey) / 2 + ny * 12;
  ctx.fillStyle = '#444';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(rotulo, lx, ly);
}

function seta(ctx, x, y, angulo, cor) {
  const t = 10;
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

// Interatividade Canvas
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


// ─── Testar Palavra e Pilha (Simulação DFS) ──────────────

function simularPDA(estadoAtual, palavraRestante, pilhaAtual, caminho, depth = 0) {
  // Impede loops infinitos em transições epsilon mal formuladas
  if (depth > 500) return null;

  // Aceitação por estado final ao terminar de ler a palavra
  if (palavraRestante.length === 0 && af.finais.includes(estadoAtual)) {
    return caminho; 
  }

  const transicoes = af.trans[estadoAtual] || [];

  for (let t of transicoes) {
    let { sim, topo, para, empilha } = t;
    let consomeLetra = (sim !== '&' && sim !== 'ε');

    // Validação 1: O símbolo lido bate?
    if (consomeLetra && palavraRestante[0] !== sim) continue;
    
    // Validação 2: A pilha tá vazia quando não devia?
    if (pilhaAtual.length === 0 && topo !== '&' && topo !== 'ε') continue;
    
    // Validação 3: O topo da pilha bate?
    let topoPilha = pilhaAtual[pilhaAtual.length - 1];
    if (topo !== '&' && topo !== 'ε' && topoPilha !== topo) continue;

    // Prepara próximo passo
    let novaPilha = [...pilhaAtual];
    
    // Desempilha
    if (topo !== '&' && topo !== 'ε') {
      novaPilha.pop();
    }

    // Empilha (insere de trás pra frente para que o primeiro caractere fique no topo)
    if (empilha !== '&' && empilha !== 'ε') {
      for (let i = empilha.length - 1; i >= 0; i--) {
        novaPilha.push(empilha[i]);
      }
    }

    let novaPalavra = consomeLetra ? palavraRestante.slice(1) : palavraRestante;
    
    let novoCaminho = [...caminho, { 
      estado: para, 
      simLido: consomeLetra ? sim : 'ε', 
      pilha: [...novaPilha] 
    }];

    // Chamada recursiva
    let resultado = simularPDA(para, novaPalavra, novaPilha, novoCaminho, depth + 1);
    
    if (resultado) return resultado; // Caminho de aceitação encontrado!
  }

  return null; // Nenhum caminho válido nesta ramificação
}

function atualizarPilhaVisual(pilhaArray) {
  const divPilha = document.getElementById('pilha-visual');
  divPilha.innerHTML = '';
  
  if (pilhaArray.length === 0) {
    divPilha.innerHTML = '<div class="pilha-item vazio">Vazia</div>';
    return;
  }

  // Renderiza do topo para a base
  for (let i = pilhaArray.length - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'pilha-item' + (i === 0 ? ' fundo' : '');
    el.textContent = pilhaArray[i];
    divPilha.appendChild(el);
  }
}

async function testar() {
  if (!af) return;

  const palavra = document.getElementById('palavra').value;
  const pilhaInicial = [af.zInicial];
  
  // Caminho inicial
  let inicio = [{ estado: af.inicial, simLido: '', pilha: [...pilhaInicial] }];
  
  // Roda o simulador para encontrar um caminho de sucesso
  let caminhoAceito = simularPDA(af.inicial, palavra, pilhaInicial, inicio);
  const aceita = caminhoAceito !== null;

  // Atualizar mensagens UI
  const div = document.getElementById('resultado');
  div.className   = aceita ? 'aceita' : 'rejeita';
  div.textContent = aceita
    ? `✔  "${palavra || 'ε'}" foi ACEITA!`
    : `✘  "${palavra || 'ε'}" foi REJEITADA.`;

  const trace = document.getElementById('trace');
  trace.innerHTML = '';

  // Animação e rastro de execução
  const caminhoAnimar = aceita ? caminhoAceito : inicio; // Se rejeitar, mostra só o inicial

  for (let i = 0; i < caminhoAnimar.length; i++) {
    const passo = caminhoAnimar[i];

    if (i > 0) {
      const seta = document.createElement('span');
      seta.className = 'seta';
      seta.textContent = `─${passo.simLido}→`;
      trace.appendChild(seta);
    }
    const el = document.createElement('span');
    el.className = 'passo' + (i === caminhoAnimar.length - 1 && aceita ? ' aceito' : ' atual');
    el.textContent = passo.estado;
    trace.appendChild(el);

    // Animar Canvas
    for (const n of nos) n.ativo = false;
    const noAtual = no(passo.estado);
    if (noAtual) noAtual.ativo = true;
    desenhar();

    // Animar Pilha
    atualizarPilhaVisual(passo.pilha);

    // Delay para vizualização
    await new Promise(r => setTimeout(r, 600));
  }
}

document.getElementById('palavra')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') testar();
});
