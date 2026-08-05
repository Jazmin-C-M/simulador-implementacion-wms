// Motor de simulacion: dado un escenario (headcount por rol, orden de sitios, frentes en paralelo,
// madurez por sitio, opcion de wifi por sitio), calcula el cronograma semana a semana y el costo.
//
// Supuestos de modelado (documentados tambien en docs/entendimiento-datos.md):
// 1. Un "frente" = un sitio ocupado de principio (Site Readiness) a fin (Hypercare). El numero maximo
//    de frentes limita cuantos sitios estan EN PROGRESO al mismo tiempo.
// 2. El orden de sitios es una cola estricta: un sitio no arranca su primera fase hasta que le toca su
//    turno Y hay capacidad de recursos disponible. Si el que sigue en la cola no puede arrancar, ese
//    frente se queda vacio esa semana (no se salta al siguiente de la cola) -- asi el orden es una
//    restriccion real, no solo una sugerencia.
// 3. Al arrancar una fase se reserva su consumo de capacidad para TODA su duracion de una vez
//    (si no hay capacidad para la fase completa, no arranca esa semana).
// 4. La capacidad de un rol se trata como una bolsa continua (se puede repartir en fracciones,
//    ej. 0.5 + 0.5 = 1 persona). El atributo "Puede Multitarea" se muestra como informacion pero
//    NO se usa para restringir el calculo -- no hay una regla confirmada de como afecta a la
//    aritmetica de capacidad, y no se quiso inventar una.
// 5. Cluster 4 usa la misma tabla de Phase-Resource Allocation que Cluster 1/2/3 (idénticos entre si
//    en el archivo); Cluster 4 no traia su propia fila. Ver model.js / cluster4Assumed.
// 6. Costo de recursos: roles "Fixed" se cobran el mes completo × duracion total del programa
//    (se asume que estan contratados todo el programa). Roles "Flexible" solo se cobran las semanas
//    en que ese rol (agrupado por nombre) tuvo consumo real > 0.
// 7. Costos de implementacion (dispositivos, montacargas, señalizacion, etiquetas, impresoras,
//    etiquetado manual, wifi) son un costo unico por sitio (capex), no dependen del cronograma.
//    La opcion de WiFi (full/optimizado/priorizado) es una palanca por sitio.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function addCalendarMonths(date, months) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultScenario(model, { name = "Nuevo escenario", startDateISO } = {}) {
  const roleHeadcountByVariantId = {};
  model.roleVariants.forEach(r => { roleHeadcountByVariantId[r.id] = r.actual; });

  const siteMaturity = {};
  const siteWifiOption = {};
  model.sites.forEach(s => {
    siteMaturity[s.siteId] = "A";
    siteWifiOption[s.siteId] = "wifiFullOptimized";
  });

  return {
    name,
    startDateISO: startDateISO || isoDate(new Date()),
    maxFrentes: 3,
    siteOrder: model.sites.map(s => s.siteId),
    siteMaturity,
    siteWifiOption,
    roleHeadcountByVariantId
  };
}

function loadPresetScenario(model, preset, startDateISO) {
  // preset: "actual" | "escenario1"
  const s = defaultScenario(model, { name: preset === "actual" ? "Actual (del archivo)" : "Escenario 1 (del archivo)", startDateISO });
  model.roleVariants.forEach(r => {
    s.roleHeadcountByVariantId[r.id] = preset === "actual" ? r.actual : r.escenario1;
  });
  return s;
}

function totalHeadcountByRoleName(model, scenario) {
  const totals = {};
  model.roleVariants.forEach(r => {
    totals[r.role] = (totals[r.role] || 0) + (scenario.roleHeadcountByVariantId[r.id] || 0);
  });
  return totals;
}

function simulate(model, scenario) {
  const capacityByRole = totalHeadcountByRoleName(model, scenario);
  const weeklyRoleLoad = {}; // week -> { roleName: consumo }
  const EPS = 1e-9;

  function canReserve(startWeek, duration, demand) {
    for (let w = startWeek; w < startWeek + duration; w++) {
      const load = weeklyRoleLoad[w] || {};
      for (const role in demand) {
        const used = load[role] || 0;
        const cap = capacityByRole[role] || 0;
        if (used + demand[role] > cap + EPS) return false;
      }
    }
    return true;
  }

  function reserve(startWeek, duration, demand) {
    for (let w = startWeek; w < startWeek + duration; w++) {
      if (!weeklyRoleLoad[w]) weeklyRoleLoad[w] = {};
      for (const role in demand) {
        weeklyRoleLoad[w][role] = (weeklyRoleLoad[w][role] || 0) + demand[role];
      }
    }
  }

  const siteById = {};
  model.sites.forEach(s => { siteById[s.siteId] = s; });

  const effectiveCluster = c => c; // cluster 4 ya se resuelve dentro de model.allocationByCluster

  const queue = scenario.siteOrder.slice();
  const fronts = []; // { siteId, phaseIndex, phaseEndWeek, phases: [{phase,startWeek,endWeek}], blocked }
  const finished = [];
  const MAX_WEEKS = 400;
  let week = 0;

  function tryStartPhase(front, phaseIndex, atWeek) {
    const site = siteById[front.siteId];
    const maturity = scenario.siteMaturity[front.siteId] || "A";
    const phaseName = PHASE_ORDER[phaseIndex];
    const duration = getPhaseDuration(model, site.cluster, maturity, phaseName);
    const demand = getPhaseRoleDemand(model, effectiveCluster(site.cluster), phaseName);
    if (duration <= 0) {
      // fase sin duracion (ej. Design Adaptation = 0 semanas en cluster 4): se marca completa al instante
      front.phases.push({ phase: phaseName, startWeek: atWeek, endWeek: atWeek });
      front.phaseIndex = phaseIndex;
      front.phaseEndWeek = atWeek;
      return true;
    }
    if (!canReserve(atWeek, duration, demand)) return false;
    reserve(atWeek, duration, demand);
    front.phases.push({ phase: phaseName, startWeek: atWeek, endWeek: atWeek + duration });
    front.phaseIndex = phaseIndex;
    front.phaseEndWeek = atWeek + duration;
    return true;
  }

  while ((queue.length > 0 || fronts.length > 0) && week < MAX_WEEKS) {
    // 1. intentar llenar frentes libres, respetando el orden estricto de la cola
    while (fronts.length < scenario.maxFrentes && queue.length > 0) {
      const nextSiteId = queue[0];
      const front = { siteId: nextSiteId, phaseIndex: -1, phaseEndWeek: week, phases: [] };
      if (tryStartPhase(front, 0, week)) {
        queue.shift();
        fronts.push(front);
      } else {
        break; // el siguiente en la cola no puede arrancar todavia -- no nos saltamos el orden
      }
    }

    // 2. avanzar fases que ya llegaron a su fin en esta semana
    for (let i = fronts.length - 1; i >= 0; i--) {
      const front = fronts[i];
      if (front.phaseEndWeek > week) continue; // sigue en progreso
      const nextPhaseIndex = front.phaseIndex + 1;
      if (nextPhaseIndex >= PHASE_ORDER.length) {
        finished.push({ siteId: front.siteId, phases: front.phases, startWeek: front.phases[0].startWeek, endWeek: front.phaseEndWeek });
        fronts.splice(i, 1);
      } else {
        tryStartPhase(front, nextPhaseIndex, week); // si no puede, se reintenta la siguiente semana (queda "detenido" ocupando el frente)
      }
    }

    week += 1;
  }

  // --- Diagnostico: por que se quedaron detenidos los sitios que no terminaron ---
  const stuckFronts = fronts.map(front => {
    const site = siteById[front.siteId];
    const nextPhaseIndex = front.phaseIndex + 1;
    const phaseName = PHASE_ORDER[nextPhaseIndex];
    const demand = getPhaseRoleDemand(model, effectiveCluster(site.cluster), phaseName);
    const structuralBlockers = Object.entries(demand)
      .filter(([role, need]) => need > (capacityByRole[role] || 0) + EPS)
      .map(([role, need]) => ({ role, need, capacity: capacityByRole[role] || 0 }));
    return {
      siteId: front.siteId,
      completedPhase: PHASE_ORDER[front.phaseIndex] || null,
      stuckEnteringPhase: phaseName,
      structuralBlockers // si tiene elementos, NUNCA va a poder arrancar con este headcount, sin importar cuantas semanas pasen
    };
  });
  const neverStarted = queue.slice();

  const timedOut = week >= MAX_WEEKS && (queue.length > 0 || fronts.length > 0);
  const totalWeeks = finished.length > 0 ? Math.max(...finished.map(f => f.endWeek)) : 0;

  const start = new Date(scenario.startDateISO + "T00:00:00");
  const endDate = addDays(start, Math.round(totalWeeks * 7));
  const goalDate = addCalendarMonths(start, 8);
  const meetsGoal = !timedOut && finished.length === model.sites.length && endDate <= goalDate;

  return {
    startDate: start,
    endDate,
    goalDate,
    totalWeeks,
    programMonths: totalWeeks / WEEKS_PER_MONTH,
    meetsGoal,
    timedOut,
    siteSchedules: finished.sort((a, b) => a.startWeek - b.startWeek),
    weeklyRoleLoad,
    capacityByRole,
    stuckFronts,
    neverStarted
  };
}

function computeCosts(model, scenario, sim) {
  const byRoleVariant = {};
  const bySite = {};
  model.sites.forEach(s => { bySite[s.siteId] = { capex: 0, resourceCost: 0 }; });

  // --- Capex por sitio (dispositivos, montacargas, señalizacion, etiquetas, wifi elegido) ---
  model.sites.forEach(s => {
    const fin = model.financialsBySite[s.siteId];
    if (!fin) return;
    const wifiOption = scenario.siteWifiOption[s.siteId] || "wifiFullOptimized";
    const capex = fin.implementationCosts + fin.devices + fin.forkliftStructure + fin.warehouseSignage +
      fin.labels + fin.labelPrinters + fin.manualLabeling + (fin[wifiOption] || 0);
    bySite[s.siteId].capex = capex;
  });

  // --- Costo de recursos ---
  const programWeeks = sim.totalWeeks;
  const programMonths = programWeeks / WEEKS_PER_MONTH;

  model.roleVariants.forEach(variant => {
    const headcount = scenario.roleHeadcountByVariantId[variant.id] || 0;
    let months;
    if (variant.fixedOrFlexibleCost === "Fixed") {
      months = programMonths;
    } else {
      let weeksUsed = 0;
      for (let w = 0; w < programWeeks; w++) {
        const load = (sim.weeklyRoleLoad[w] || {})[variant.role] || 0;
        if (load > 1e-9) weeksUsed += 1;
      }
      months = weeksUsed / WEEKS_PER_MONTH;
    }
    const cost = headcount * variant.avgMonthlyCostMxn * months;
    byRoleVariant[variant.id] = { variant, cost, months };
  });

  // --- Reparto de costo de recursos a sitios (proporcional al consumo real de cada sitio cada semana) ---
  model.sites.forEach(s => {
    let siteResourceCost = 0;
    // reconstruir, para este sitio, cuanto consumio de cada rol en cada semana de su cronograma
    const schedule = sim.siteSchedules.find(f => f.siteId === s.siteId);
    if (schedule) {
      schedule.phases.forEach(ph => {
        const demand = getPhaseRoleDemand(model, s.cluster, ph.phase);
        for (let w = ph.startWeek; w < ph.endWeek; w++) {
          const totalLoadThisWeek = sim.weeklyRoleLoad[w] || {};
          for (const roleName in demand) {
            const totalDemandThisWeek = totalLoadThisWeek[roleName] || demand[roleName];
            const share = totalDemandThisWeek > 0 ? demand[roleName] / totalDemandThisWeek : 0;
            // costo mensual total de ese rol (suma de variantes) prorateado a 1 semana
            const monthlyCostAllVariants = model.roleVariants
              .filter(v => v.role === roleName)
              .reduce((sum, v) => sum + (scenario.roleHeadcountByVariantId[v.id] || 0) * v.avgMonthlyCostMxn, 0);
            const weeklyCost = monthlyCostAllVariants / WEEKS_PER_MONTH;
            siteResourceCost += weeklyCost * share;
          }
        }
      });
    }
    bySite[s.siteId].resourceCost = siteResourceCost;
  });

  const totalCapex = Object.values(bySite).reduce((sum, s) => sum + s.capex, 0);
  const totalResourceCost = Object.values(byRoleVariant).reduce((sum, r) => sum + r.cost, 0);

  return {
    totalCapex,
    totalResourceCost,
    totalCost: totalCapex + totalResourceCost,
    byRoleVariant,
    bySite
  };
}
