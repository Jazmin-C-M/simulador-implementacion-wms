// Prepara el RAW_DATA (tal cual viene del Excel) en estructuras listas para simular.
// No modifica los valores de origen; aqui solo se agrupan/derivan.

const PHASE_ORDER = [
  "Site Readiness", "Design Adaptation", "Functional Review", "UAT",
  "Training", "DIALT", "Go Live", "Hypercare"
];

const WEEKS_PER_MONTH = 4.345; // promedio calendario (52 semanas / 12 meses)

// Los valores de "Financials" venian originalmente en USD (asi se llama la pestana en el Excel);
// los de "Resource Master" ya vienen en MXN (columna "Average Monthly Cost (MXN)"), sin conversion.
// Aclaracion del profesor en clase (2026-08-10): usar tipo de cambio 18 MXN por USD para convertir
// Financials a pesos -- reemplaza la instruccion anterior de "tratar todo como pesos sin convertir".
const FX_USD_TO_MXN = 18;

function buildModel(raw) {
  const sites = raw.sites.map(s => ({ ...s }));

  const financialsBySite = {};
  raw.financials.forEach(f => { financialsBySite[f.siteId] = f; });

  // --- Recursos: agrupar por nombre de rol (para disponibilidad de capacidad),
  // manteniendo cada variante (Interno/Externo) por separado para costo y headcount editable.
  const roleVariants = raw.roles.map(r => ({ ...r }));
  const roleGroups = {}; // nombre de rol -> [variantes]
  roleVariants.forEach(r => {
    if (!roleGroups[r.role]) roleGroups[r.role] = [];
    roleGroups[r.role].push(r);
  });

  // --- Fases: cluster+madurez -> [ {phase, sequence, durationWeeks} ]
  const phasesByClusterMaturity = {};
  raw.phases.forEach(p => {
    const key = `${p.cluster}|${p.deploymentMaturity}`;
    if (!phasesByClusterMaturity[key]) phasesByClusterMaturity[key] = [];
    phasesByClusterMaturity[key].push({ phase: p.phase, sequence: p.sequence, durationWeeks: p.durationWeeks });
  });
  Object.values(phasesByClusterMaturity).forEach(arr => arr.sort((a, b) => a.sequence - b.sequence));

  // --- Asignacion de recursos por fase: cluster -> fase -> [{role, capacityConsumption}]
  // Cluster 4 no viene en el archivo -> se asume igual a Cluster 1 (idéntico a 2 y 3). Queda marcado.
  const allocationByCluster = {};
  raw.allocation.forEach(a => {
    if (!allocationByCluster[a.cluster]) allocationByCluster[a.cluster] = {};
    if (!allocationByCluster[a.cluster][a.phase]) allocationByCluster[a.cluster][a.phase] = [];
    allocationByCluster[a.cluster][a.phase].push({ role: a.role, capacityConsumption: a.capacityConsumption });
  });
  let cluster4Assumed = false;
  if (!allocationByCluster[4]) {
    cluster4Assumed = true;
    allocationByCluster[4] = JSON.parse(JSON.stringify(allocationByCluster[1]));
  }

  return {
    sites,
    financialsBySite,
    roleVariants,
    roleGroups,
    phasesByClusterMaturity,
    allocationByCluster,
    cluster4Assumed
  };
}

// Consumo total requerido de un rol en una fase de un cluster (suma filas repetidas = mas gente a la vez)
function getPhaseRoleDemand(model, cluster, phaseName) {
  const rows = (model.allocationByCluster[cluster] || {})[phaseName] || [];
  const demand = {};
  rows.forEach(row => {
    demand[row.role] = (demand[row.role] || 0) + row.capacityConsumption;
  });
  return demand; // { roleName: capacidadTotalRequerida }
}

function getPhaseDuration(model, cluster, maturity, phaseName) {
  const key = `${cluster}|${maturity}`;
  const list = model.phasesByClusterMaturity[key] || [];
  const found = list.find(p => p.phase === phaseName);
  return found ? found.durationWeeks : 0;
}

// Palanca de contingencia por atraso (no viene del archivo -- es una decision de planeacion:
// "a veces pasan retrasos", asi que se puede inflar la duracion de cada fase un % como colchon
// de riesgo). El % se reparte PROPORCIONALMENTE entre las 8 fases de cada cluster+madurez (metodo
// de residuo mayor, para que la suma total quede exacta) en vez de redondear cada fase por separado
// hacia arriba -- eso distorsionaria mucho las fases de 1 semana (una fase de 1 semana con 5% de
// retraso pasaria a 2 semanas, un 100% de aumento, si se redondeara fase por fase).
function buildDelayedModel(baseModel, delayFactor) {
  if (!delayFactor) return baseModel;
  const newPhasesByClusterMaturity = {};
  Object.keys(baseModel.phasesByClusterMaturity).forEach(key => {
    const list = baseModel.phasesByClusterMaturity[key];
    const total = list.reduce((sum, p) => sum + p.durationWeeks, 0);
    const newTotal = Math.ceil(total * (1 + delayFactor));
    const extra = newTotal - total;
    const raw = list.map(p => (total > 0 ? (p.durationWeeks / total) * extra : 0));
    const floorExtra = raw.map(Math.floor);
    let remaining = extra - floorExtra.reduce((a, b) => a + b, 0);
    const order = raw.map((r, i) => ({ i, frac: r - floorExtra[i] })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < order.length && remaining > 0; k++, remaining--) floorExtra[order[k].i] += 1;
    newPhasesByClusterMaturity[key] = list.map((p, i) => ({ ...p, durationWeeks: p.durationWeeks + floorExtra[i] }));
  });
  return Object.assign({}, baseModel, { phasesByClusterMaturity: newPhasesByClusterMaturity });
}
