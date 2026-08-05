// Prepara el RAW_DATA (tal cual viene del Excel) en estructuras listas para simular.
// No modifica los valores de origen; aqui solo se agrupan/derivan.

const PHASE_ORDER = [
  "Site Readiness", "Design Adaptation", "Functional Review", "UAT",
  "Training", "DIALT", "Go Live", "Hypercare"
];

const WEEKS_PER_MONTH = 4.345; // promedio calendario (52 semanas / 12 meses)

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
