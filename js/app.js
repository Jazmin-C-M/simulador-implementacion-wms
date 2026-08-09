// Interfaz: conecta el modelo (model.js) y el motor (engine.js) con el HTML.
// Todo lo que aparece aqui funciona de verdad (guardar escenario, editar recursos, recalcular) --
// nada decorativo.

const PHASE_COLORS = {
  "Site Readiness": "#4f8cff",
  "Design Adaptation": "#7c5cff",
  "Functional Review": "#f2994a",
  "UAT": "#f5a623",
  "Training": "#2ecc71",
  "DIALT": "#00b8d9",
  "Go Live": "#ff5c5c",
  "Hypercare": "#9aa4b8"
};

const LS_KEY = "wms_simulador_escenarios_v1";

// Bitacora real de exploracion manual de la usuaria (Jaz), guardada aqui -- no solo en su localStorage --
// para que quede visible en la pestana "Escenarios"/"Mis Pruebas" aunque se abra en un navegador nuevo
// (ej. el profesor calificando). Son intentos genuinos, verificados: Jaz 1 no cumple (79 sem, $35,917,975),
// Jaz 2 si cumple (34 sem, $29,228,028) -- sirve para comparar contra las 6 Propuestas de la IA.
const SEED_MIS_INTENTOS = [
  {"id":1786307404717,"savedAt":"2026-08-09T20:30:04.717Z","origen":"manual","scenario":{"name":"Jaz 1","startDateISO":"2026-08-09","maxFrentes":3,"delayFactor":0,"siteOrder":["Site 01","Site 02","Site 03","Site 04","Site 05","Site 06","Site 07","Site 08","Site 09","Site 10","Site 11","Site 12","Site 13","Site 14","Site 15"],"siteMaturity":{"Site 01":"B","Site 02":"B","Site 03":"B","Site 04":"B","Site 05":"B","Site 06":"B","Site 07":"B","Site 08":"B","Site 09":"B","Site 10":"B","Site 11":"B","Site 12":"B","Site 13":"B","Site 14":"B","Site 15":"B"},"siteWifiOption":{"Site 01":"wifiPrioritized","Site 02":"wifiPrioritized","Site 03":"wifiPrioritized","Site 04":"wifiPrioritized","Site 05":"wifiPrioritized","Site 06":"wifiPrioritized","Site 07":"wifiPrioritized","Site 08":"wifiPrioritized","Site 09":"wifiPrioritized","Site 10":"wifiPrioritized","Site 11":"wifiPrioritized","Site 12":"wifiPrioritized","Site 13":"wifiPrioritized","Site 14":"wifiPrioritized","Site 15":"wifiPrioritized"},"roleHeadcountByVariantId":{"1":3,"2":1,"3":1,"4":1,"5":2,"6":1,"7":3,"8":1,"9":6,"10":2,"11":3,"12":3,"13":3,"14":3,"15":3,"16":10,"17":3,"18":3}},"resumen":{"meetsGoal":false,"totalWeeks":79,"totalCost":35917974.612805784}},
  {"id":1786308214701,"savedAt":"2026-08-09T20:43:34.702Z","origen":"manual","scenario":{"name":"Jaz 2","startDateISO":"2026-08-05","maxFrentes":15,"delayFactor":0,"siteOrder":["Site 01","Site 02","Site 03","Site 04","Site 05","Site 06","Site 07","Site 08","Site 09","Site 10","Site 11","Site 12","Site 13","Site 14","Site 15"],"siteMaturity":{"Site 01":"B","Site 02":"B","Site 03":"B","Site 04":"B","Site 05":"B","Site 06":"B","Site 07":"B","Site 08":"B","Site 09":"B","Site 10":"B","Site 11":"B","Site 12":"B","Site 13":"B","Site 14":"B","Site 15":"B"},"siteWifiOption":{"Site 01":"wifiFullOptimized","Site 02":"wifiFullOptimized","Site 03":"wifiFullOptimized","Site 04":"wifiFullOptimized","Site 05":"wifiFullOptimized","Site 06":"wifiFullOptimized","Site 07":"wifiFullOptimized","Site 08":"wifiFullOptimized","Site 09":"wifiFullOptimized","Site 10":"wifiFullOptimized","Site 11":"wifiFullOptimized","Site 12":"wifiFullOptimized","Site 13":"wifiFullOptimized","Site 14":"wifiFullOptimized","Site 15":"wifiFullOptimized"},"roleHeadcountByVariantId":{"1":5,"2":1,"3":1,"4":1,"5":8,"6":1,"7":9,"8":0,"9":1,"10":7,"11":6,"12":4,"13":4,"14":4,"15":4,"16":12,"17":5,"18":1}},"resumen":{"meetsGoal":true,"totalWeeks":34,"totalCost":29228027.51076973}}
];

const model = buildModel(RAW_DATA);
// Punto de partida: un escenario ya verificado que cumple los 8 meses (no "Actual", que no cumple).
// Esta incrustado en engine.js, no en localStorage, para que se vea aunque sea la primera vez que
// alguien abre la pagina sin nada guardado en su navegador.
let scenario = recommendedScenario(model, {});
let sim = null;
let costs = null;

// Origen del escenario actual: "ia" (una de las 6 propuestas encontradas por busqueda automatizada),
// "archivo" (Actual/Escenario1, tal cual vienen en el Excel), o "manual" (el usuario toco algo a mano).
// Se usa para la bitacora de "Mis Pruebas" -- comparar lo que el usuario logra ajustando el mismo
// contra lo que encontro la IA, sin inventar un historial que no paso.
let origenActual = "ia";
function marcarComoManual() { origenActual = "manual"; }

function recalc() {
  const effectiveModel = buildDelayedModel(model, scenario.delayFactor || 0);
  sim = simulate(effectiveModel, scenario);
  costs = computeCosts(effectiveModel, scenario, sim);
  renderAll();
}

function fmtMoney(n) {
  return "$" + Math.round(n).toLocaleString("es-MX");
}
function fmtWeeks(w) {
  return (Math.round(w * 10) / 10) + " sem";
}
function fmtDate(d) {
  return d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

// ---------------- Tabs ----------------
document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  document.querySelectorAll("nav.tabs button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
});

// ---------------- Controles generales ----------------
document.getElementById("scenarioName").addEventListener("input", e => { scenario.name = e.target.value; });
document.getElementById("startDate").addEventListener("change", e => { scenario.startDateISO = e.target.value; marcarComoManual(); recalc(); });
document.getElementById("maxFrentes").addEventListener("change", e => {
  scenario.maxFrentes = Math.max(1, parseInt(e.target.value) || 1);
  marcarComoManual();
  recalc();
});
document.getElementById("delayFactor").addEventListener("input", e => {
  scenario.delayFactor = Math.max(0, parseFloat(e.target.value) || 0) / 100;
  marcarComoManual();
  recalc();
});
document.getElementById("btnLoadActual").addEventListener("click", () => {
  scenario = loadPresetScenario(model, "actual", scenario.startDateISO);
  origenActual = "archivo";
  syncControlsFromScenario();
  renderTablaSitios();
  renderTablaRecursos();
  recalc();
});
document.getElementById("btnLoadEscenario1").addEventListener("click", () => {
  scenario = loadPresetScenario(model, "escenario1", scenario.startDateISO);
  origenActual = "archivo";
  syncControlsFromScenario();
  renderTablaSitios();
  renderTablaRecursos();
  recalc();
});
document.getElementById("btnLoadPropuesta").addEventListener("click", () => {
  const value = document.getElementById("propuestaSelector").value;
  if (value.startsWith("propuesta-")) {
    const key = parseInt(value.replace("propuesta-", ""));
    scenario = loadPropuesta(model, key, scenario.startDateISO);
    origenActual = "ia";
    syncControlsFromScenario();
    renderTablaSitios();
    renderTablaRecursos();
    recalc();
  } else if (value.startsWith("guardado-")) {
    const id = parseInt(value.replace("guardado-", ""));
    const item = getSavedScenarios().find(i => i.id === id);
    if (item) cargarEscenarioGuardado(item);
  }
});

function renderPropuestaSelectorGuardados() {
  const optgroup = document.getElementById("optgroupGuardados");
  const selector = document.getElementById("propuestaSelector");
  const valorPrevio = selector.value;
  const list = getSavedScenarios();
  optgroup.innerHTML = list.length
    ? list.map(item => `<option value="guardado-${item.id}">${item.scenario.name} (${ORIGEN_LABELS[item.origen] || "?"}, ${fmtMoney(item.resumen.totalCost)})</option>`).join("")
    : `<option value="" disabled>Aún no has guardado ningún escenario</option>`;
  // conservar la seleccion si sigue existiendo, si no, regresar a la propuesta recomendada
  if (Array.from(selector.options).some(o => o.value === valorPrevio)) {
    selector.value = valorPrevio;
  }
}

function syncControlsFromScenario() {
  document.getElementById("scenarioName").value = scenario.name;
  document.getElementById("startDate").value = scenario.startDateISO;
  document.getElementById("maxFrentes").value = scenario.maxFrentes;
  document.getElementById("delayFactor").value = Math.round((scenario.delayFactor || 0) * 1000) / 10;
}

// ---------------- Render: badges de estado ----------------
function renderStatusBadges() {
  const el = document.getElementById("statusBadges");
  const goalBadge = sim.meetsGoal
    ? `<div class="badge good">✅ Cumple 8 meses<span class="sub">${fmtDate(sim.endDate)}</span></div>`
    : `<div class="badge bad">❌ No cumple 8 meses<span class="sub">${sim.timedOut ? "no termina en el horizonte simulado" : fmtDate(sim.endDate)}</span></div>`;
  const delayBadge = scenario.delayFactor > 0
    ? `<div class="badge">⚠️ +${Math.round(scenario.delayFactor * 100)}% retraso incluido</div>` : "";
  el.innerHTML = `
    ${goalBadge}
    <div class="badge">${fmtWeeks(sim.totalWeeks)} · ${(Math.round(sim.programMonths * 10) / 10)} meses</div>
    <div class="badge">${fmtMoney(costs.totalCost)} MXN</div>
    ${delayBadge}
  `;
}

// ---------------- Render: KPIs plan general ----------------
function renderKPIs() {
  const el = document.getElementById("kpiRow");
  const finishedCount = sim.siteSchedules.length;
  const endClass = sim.meetsGoal ? "good" : "bad";
  const finishedClass = finishedCount === model.sites.length ? "good" : "bad";
  el.innerHTML = `
    <div class="kpi"><div class="value">${fmtDate(sim.startDate)}</div><div class="label">Inicio del programa</div></div>
    <div class="kpi ${endClass}"><div class="value">${fmtDate(sim.endDate)}</div><div class="label">Fin del programa</div></div>
    <div class="kpi"><div class="value">${fmtDate(sim.goalDate)}</div><div class="label">Meta (inicio + 8 meses)</div></div>
    <div class="kpi ${finishedClass}"><div class="value">${finishedCount} / ${model.sites.length}</div><div class="label">Sitios terminados</div></div>
    <div class="kpi"><div class="value">${scenario.maxFrentes}</div><div class="label">Frentes en paralelo</div></div>
  `;
}

function renderDiagnostico() {
  const el = document.getElementById("diagnostico");
  let html = "";

  if (sim.stuckFronts.length > 0) {
    const items = sim.stuckFronts.map(f => {
      if (f.structuralBlockers.length > 0) {
        const detail = f.structuralBlockers.map(b => `<b>${b.role}</b> (necesita ${b.need}, hay ${b.capacity})`).join(", ");
        return `<li><b>${f.siteId}</b>: nunca puede entrar a <b>${f.stuckEnteringPhase}</b> con este escenario — falta capacidad de ${detail}. Sube el headcount de ese rol en "Uso de Recursos" para desatorarlo.</li>`;
      }
      return `<li><b>${f.siteId}</b>: detenido intentando entrar a <b>${f.stuckEnteringPhase}</b> — hay capacidad suficiente en total, pero está ocupada por otros sitios en paralelo en este momento.</li>`;
    }).join("");
    html += `<div class="assumption" style="border-color:var(--bad);color:var(--bad);">
      <b>⚠️ ${sim.stuckFronts.length} sitio(s) detenido(s) sin terminar</b>
      <ul style="margin:6px 0 0 18px;color:var(--text);">${items}</ul>
    </div>`;
  }
  if (sim.neverStarted.length > 0) {
    html += `<p class="hint">${sim.neverStarted.length} sitio(s) todavía ni siquiera arrancan (esperando en la cola porque no hay un frente libre o el que sigue está detenido): ${sim.neverStarted.join(", ")}.</p>`;
  }
  if (sim.timedOut) {
    html += `<p class="footnote">La simulación llegó a su horizonte máximo (400 semanas ≈ 7.7 años) sin que todos los sitios terminaran.</p>`;
  }
  el.innerHTML = html;
}

function renderPhaseLegend() {
  document.getElementById("phaseLegend").innerHTML = PHASE_ORDER.map(p =>
    `<span><i style="background:${PHASE_COLORS[p]}"></i>${p}</span>`
  ).join("");
}

// ---------------- Render: Gantt general ----------------
function renderGanttGeneral() {
  const el = document.getElementById("ganttGeneral");
  const totalWeeks = Math.max(sim.totalWeeks, 1);
  let html = "";
  model.sites.forEach(site => {
    const schedule = sim.siteSchedules.find(f => f.siteId === site.siteId);
    html += `<div class="gantt-row"><div class="gantt-label">${site.siteId} <span class="tag ${site.country === "Mexico" ? "mx" : "co"}">${site.country === "Mexico" ? "MX" : "CO"}</span></div><div class="gantt-track">`;
    if (schedule) {
      schedule.phases.forEach(ph => {
        const left = (ph.startWeek / totalWeeks) * 100;
        const width = Math.max(((ph.endWeek - ph.startWeek) / totalWeeks) * 100, 0.3);
        html += `<div class="gantt-bar" style="left:${left}%;width:${width}%;background:${PHASE_COLORS[ph.phase]}" title="${ph.phase}: semana ${ph.startWeek}–${ph.endWeek}"></div>`;
      });
    } else {
      const stuck = sim.stuckFronts.find(f => f.siteId === site.siteId);
      const label = stuck
        ? `detenido entrando a ${stuck.stuckEnteringPhase}${stuck.structuralBlockers.length ? " (falta " + stuck.structuralBlockers.map(b => b.role).join(", ") + ")" : ""}`
        : "en espera en la cola";
      html += `<div style="padding:4px 8px;color:var(--text-dim);font-size:0.75rem;">${label}</div>`;
    }
    html += `</div></div>`;
  });
  // escala de semanas
  const marks = 8;
  let scale = "";
  for (let i = 0; i <= marks; i++) {
    const w = Math.round((totalWeeks / marks) * i);
    scale += `<div style="flex:1;">${w}sem</div>`;
  }
  html += `<div class="gantt-scale">${scale}</div>`;
  el.innerHTML = html;
}

// ---------------- Render: Plan por sitio ----------------
function renderSiteSelector() {
  const sel = document.getElementById("siteSelector");
  if (sel.options.length === 0) {
    model.sites.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.siteId;
      opt.textContent = `${s.siteId} (${s.country === "Mexico" ? "México" : "Colombia"}, Clúster ${s.cluster})`;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", renderSiteDetail);
  }
}

function renderSiteDetail() {
  const siteId = document.getElementById("siteSelector").value || model.sites[0].siteId;
  const site = model.sites.find(s => s.siteId === siteId);
  const schedule = sim.siteSchedules.find(f => f.siteId === siteId);
  const maturity = scenario.siteMaturity[siteId] || "A";
  const fin = model.financialsBySite[siteId];
  const assumedNote = site.cluster === 4
    ? `<p class="assumption">Este sitio es Clúster 4: la tabla de Phase-Resource Allocation no traía datos para ese clúster en el archivo original — se está usando la misma tabla que Clúster 1/2/3 (supuesto, ver pestaña "Entendimiento del Excel").</p>` : "";
  const maturityNote = (site.cluster === 3 || site.cluster === 4)
    ? `<p class="hint">En este clúster, la madurez A o B da exactamente la misma duración — no cambia el resultado.</p>` : "";

  let queueNote = "";
  if (schedule && schedule.startWeek > 0) {
    const posicion = scenario.siteOrder.indexOf(siteId) + 1;
    queueNote = `<div class="assumption" style="border-color:var(--accent);color:var(--text);">
      ⏳ Este sitio no empezó hasta la <b>semana ${schedule.startWeek}</b> — no fue un problema de sus propias fases (arrancan sin huecos, ve la tabla abajo), fue <b>espera en la fila</b>: es el sitio #${posicion} en tu orden de entrada, y con <b>${scenario.maxFrentes} frente(s) en paralelo</b> solo esa cantidad de sitios trabaja a la vez de los 15. Sube "Frentes en paralelo" en Plan General (y el headcount necesario para sostenerlos) para que arranque antes, o cámbialo de posición en la fila en "Uso de Recursos".
    </div>`;
  }

  let phasesHtml = "";
  if (schedule) {
    const totalW = Math.max(schedule.endWeek, 1);
    let previousEndWeek = schedule.phases.length ? schedule.phases[0].startWeek : 0;
    schedule.phases.forEach(ph => {
      const gap = ph.startWeek - previousEndWeek;
      if (gap > 0) {
        const demandNext = getPhaseRoleDemand(model, site.cluster, ph.phase);
        const blockers = Object.entries(demandNext)
          .map(([role, need]) => {
            const used = (sim.weeklyRoleLoad[previousEndWeek] || {})[role] || 0;
            const cap = sim.capacityByRole[role] || 0;
            return { role, need, used, cap, falta: used + need - cap };
          })
          .filter(b => b.falta > 1e-9)
          .sort((a, b) => b.falta - a.falta);
        const blockersStr = blockers.length
          ? blockers.map(b => `<b>${b.role}</b> (necesitabas ${Math.round((b.used + b.need) * 100) / 100}, tenías ${b.cap})`).join(", ")
          : "otro sitio tenía prioridad y liberó la capacidad después";
        phasesHtml += `<tr>
          <td colspan="4">
            <div class="assumption" style="margin:4px 0;">
              ⏸️ Esperó <b>${gap} semana${gap > 1 ? "s" : ""}</b> (semana ${previousEndWeek}–${ph.startWeek}) antes de poder entrar a <b>${ph.phase}</b> — no había capacidad suficiente de: ${blockersStr}.
              ${blockers.length ? `Sube el headcount de <b>${blockers[0].role}</b> en "Uso de Recursos" para intentar acortar esta espera.` : ""}
            </div>
          </td>
        </tr>`;
      }
      const startDate = addDays(sim.startDate, ph.startWeek * 7);
      const endDate = addDays(sim.startDate, ph.endWeek * 7);
      const demand = getPhaseRoleDemand(model, site.cluster, ph.phase);
      const demandStr = Object.entries(demand).map(([r, v]) => `${r} (${v})`).join(", ") || "—";
      phasesHtml += `<tr>
        <td><span style="color:${PHASE_COLORS[ph.phase]}">●</span> ${ph.phase}</td>
        <td>${ph.startWeek}–${ph.endWeek} (${ph.endWeek - ph.startWeek} sem)</td>
        <td>${fmtDate(startDate)} → ${fmtDate(endDate)}</td>
        <td style="font-size:0.78rem;color:var(--text-dim);">${demandStr}</td>
      </tr>`;
      previousEndWeek = ph.endWeek;
    });
  } else {
    phasesHtml = `<tr><td colspan="4">Este sitio no terminó dentro del horizonte simulado con el escenario actual.</td></tr>`;
  }

  document.getElementById("siteDetail").innerHTML = `
    <div class="kpi-row">
      <div class="kpi"><div class="value">${site.country === "Mexico" ? "México" : "Colombia"}</div><div class="label">País</div></div>
      <div class="kpi"><div class="value">${site.cluster}</div><div class="label">Clúster</div></div>
      <div class="kpi"><div class="value">${maturity}</div><div class="label">Madurez (ajustable en "Uso de Recursos")</div></div>
      <div class="kpi"><div class="value">${schedule ? fmtWeeks(schedule.endWeek - schedule.startWeek) : "—"}</div><div class="label">Duración total del sitio</div></div>
      <div class="kpi"><div class="value">${fmtMoney(fin ? fin.benefitsPerMonth : 0)}</div><div class="label">Beneficio mensual una vez vivo</div></div>
    </div>
    ${assumedNote}${maturityNote}${queueNote}
    <div class="table-scroll">
      <table>
        <thead><tr><th>Fase</th><th>Semanas del programa</th><th>Fechas</th><th>Roles que consume</th></tr></thead>
        <tbody>${phasesHtml}</tbody>
      </table>
    </div>
  `;
}

// ---------------- Render: tabla de recursos (editable) ----------------
function renderTablaRecursos() {
  const rows = model.roleVariants.map(r => {
    const val = scenario.roleHeadcountByVariantId[r.id];
    return `<tr>
      <td>${r.role}</td>
      <td>${r.internalOrExternal}</td>
      <td>${r.workMode}</td>
      <td>${r.canMultitask}</td>
      <td>${r.fixedOrFlexibleCost}</td>
      <td>${fmtMoney(r.avgMonthlyCostMxn)}</td>
      <td style="color:var(--text-dim)">${r.actual}</td>
      <td style="color:var(--text-dim)">${r.escenario1}</td>
      <td><input type="number" min="0" step="1" value="${val}" data-role-id="${r.id}" class="input-headcount"></td>
    </tr>`;
  }).join("");

  document.getElementById("tablaRecursos").innerHTML = `
    <thead><tr>
      <th>Rol</th><th>Interno/Externo</th><th>Modalidad</th><th>Multitarea</th><th>Costo</th>
      <th>$/mes (MXN)</th><th>Actual</th><th>Escenario 1</th><th>Tu escenario</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  `;

  document.querySelectorAll(".input-headcount").forEach(input => {
    input.addEventListener("input", e => {
      const id = parseInt(e.target.dataset.roleId);
      scenario.roleHeadcountByVariantId[id] = Math.max(0, parseInt(e.target.value) || 0);
      marcarComoManual();
      recalc();
    });
  });
}

// ---------------- Render: tabla de sitios (orden, madurez, wifi) ----------------
function renderTablaSitios() {
  const orderIndex = {};
  scenario.siteOrder.forEach((id, i) => { orderIndex[id] = i + 1; });

  const rows = model.sites.map(s => {
    const fin = model.financialsBySite[s.siteId];
    return `<tr data-site-id="${s.siteId}">
      <td>${s.siteId} <span class="tag ${s.country === "Mexico" ? "mx" : "co"}">${s.country === "Mexico" ? "MX" : "CO"}</span></td>
      <td>${s.cluster}</td>
      <td><input type="number" min="1" max="${model.sites.length}" value="${orderIndex[s.siteId]}" class="input-orden" data-site="${s.siteId}"></td>
      <td>
        <select class="input-madurez" data-site="${s.siteId}">
          <option value="A" ${scenario.siteMaturity[s.siteId] === "A" ? "selected" : ""}>A</option>
          <option value="B" ${scenario.siteMaturity[s.siteId] === "B" ? "selected" : ""}>B</option>
        </select>
      </td>
      <td>
        <select class="input-wifi" data-site="${s.siteId}">
          <option value="wifiFull" ${scenario.siteWifiOption[s.siteId] === "wifiFull" ? "selected" : ""}>Full (${fmtMoney(fin.wifiFull)})</option>
          <option value="wifiFullOptimized" ${scenario.siteWifiOption[s.siteId] === "wifiFullOptimized" ? "selected" : ""}>Optimizado (${fmtMoney(fin.wifiFullOptimized)})</option>
          <option value="wifiPrioritized" ${scenario.siteWifiOption[s.siteId] === "wifiPrioritized" ? "selected" : ""}>Priorizado (${fmtMoney(fin.wifiPrioritized)})</option>
        </select>
      </td>
    </tr>`;
  }).join("");

  document.getElementById("tablaSitios").innerHTML = `
    <thead><tr><th>Sitio</th><th>Clúster</th><th>Orden de entrada</th><th>Madurez</th><th>Opción de WiFi</th></tr></thead>
    <tbody>${rows}</tbody>
  `;

  document.querySelectorAll(".input-orden").forEach(input => {
    input.addEventListener("change", e => {
      marcarComoManual();
      const siteId = e.target.dataset.site;
      const newPos = Math.max(1, Math.min(model.sites.length, parseInt(e.target.value) || 1));
      scenario.siteOrder = scenario.siteOrder.filter(id => id !== siteId);
      scenario.siteOrder.splice(newPos - 1, 0, siteId);
      renderTablaSitios();
      recalc();
    });
  });
  document.querySelectorAll(".input-madurez").forEach(sel => {
    sel.addEventListener("change", e => { scenario.siteMaturity[e.target.dataset.site] = e.target.value; marcarComoManual(); recalc(); });
  });
  document.querySelectorAll(".input-wifi").forEach(sel => {
    sel.addEventListener("change", e => { scenario.siteWifiOption[e.target.dataset.site] = e.target.value; marcarComoManual(); recalc(); });
  });
}

// ---------------- Render: costos ----------------
function renderCostos() {
  document.getElementById("kpiCostos").innerHTML = `
    <div class="kpi"><div class="value">${fmtMoney(costs.totalCost)}</div><div class="label">Costo total del escenario (MXN)</div></div>
    <div class="kpi"><div class="value">${fmtMoney(costs.totalCapex)}</div><div class="label">Implementación (capex, una vez por sitio)</div></div>
    <div class="kpi"><div class="value">${fmtMoney(costs.totalResourceCost)}</div><div class="label">Recursos (equipo, según duración)</div></div>
  `;

  const rows = model.sites.map(s => {
    const c = costs.bySite[s.siteId];
    return `<tr><td>${s.siteId}</td><td>${s.country === "Mexico" ? "México" : "Colombia"}</td><td>${fmtMoney(c.capex)}</td><td>${fmtMoney(c.resourceCost)}</td><td><b>${fmtMoney(c.capex + c.resourceCost)}</b></td></tr>`;
  }).join("");
  document.getElementById("tablaCostoSitio").innerHTML = `
    <thead><tr><th>Sitio</th><th>País</th><th>Capex</th><th>Recursos (prorrateado)</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  `;

  const byRoleName = {};
  Object.values(costs.byRoleVariant).forEach(({ variant, cost }) => {
    byRoleName[variant.role] = (byRoleName[variant.role] || 0) + cost;
  });
  const maxCost = Math.max(...Object.values(byRoleName), 1);
  const barsHtml = Object.entries(byRoleName).sort((a, b) => b[1] - a[1]).map(([role, cost]) => `
    <div class="bar-chart-row">
      <div>${role}</div>
      <div class="bar-chart-track"><div class="bar-chart-fill" style="width:${(cost / maxCost) * 100}%"></div></div>
      <div>${fmtMoney(cost)}</div>
    </div>
  `).join("");
  document.getElementById("barCostoRecurso").innerHTML = barsHtml;
}

// ---------------- Render: escenarios guardados ----------------
function getSavedScenarios() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; }
}
function setSavedScenarios(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

const ORIGEN_LABELS = { ia: "🤖 IA", archivo: "📄 Archivo", manual: "✋ Manual" };

function guardarEscenarioActual(origenForzado) {
  const list = getSavedScenarios();
  list.push({
    id: Date.now(),
    savedAt: new Date().toISOString(),
    origen: origenForzado || origenActual,
    scenario: JSON.parse(JSON.stringify(scenario)),
    resumen: {
      meetsGoal: sim.meetsGoal,
      totalWeeks: sim.totalWeeks,
      totalCost: costs.totalCost
    }
  });
  setSavedScenarios(list);
  renderEscenariosGuardados();
  renderMisPruebas();
}

document.getElementById("btnGuardarEscenario").addEventListener("click", () => guardarEscenarioActual());
document.getElementById("btnGuardarIntentoManual").addEventListener("click", () => {
  if (origenActual !== "manual") {
    const sigue = confirm(
      "Lo que tienes cargado ahora mismo no tiene ningún cambio tuyo detectado — es una Propuesta de la IA " +
      "(o Actual/Escenario 1) tal cual, sin editar. Si acabas de refrescar la página, tus cambios anteriores " +
      "no se guardaron (se pierden al recargar hasta que le das \"Guardar\").\n\n" +
      "¿Seguro que quieres guardar esto como tu intento manual de todos modos?"
    );
    if (!sigue) return;
  }
  guardarEscenarioActual("manual");
});

// ---------------- Exportar / importar escenarios guardados (localStorage no viaja entre direcciones) ----------------
const elOrigenUrl = document.getElementById("origenActualUrl");
if (elOrigenUrl) elOrigenUrl.textContent = window.location.origin + window.location.pathname;

document.getElementById("btnExportarEscenarios").addEventListener("click", () => {
  const list = getSavedScenarios();
  if (list.length === 0) { alert("Todavía no tienes ningún escenario guardado aquí para exportar."); return; }
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mis-escenarios-wms.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById("btnImportarEscenarios").addEventListener("click", () => {
  document.getElementById("inputImportarEscenarios").click();
});
document.getElementById("inputImportarEscenarios").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importados = JSON.parse(reader.result);
      if (!Array.isArray(importados)) throw new Error("El archivo no tiene el formato esperado.");
      const listaActual = getSavedScenarios();
      // se les da un id nuevo a los importados para que nunca choquen con los que ya hay aqui
      const conNuevoId = importados.map((item, i) => ({ ...item, id: Date.now() + i }));
      setSavedScenarios(listaActual.concat(conNuevoId));
      renderEscenariosGuardados();
      renderMisPruebas();
      alert(`Se importaron ${conNuevoId.length} escenario(s) correctamente.`);
    } catch (err) {
      alert("No se pudo leer el archivo — asegúrate de que sea un archivo exportado desde este mismo simulador.");
    }
    document.getElementById("inputImportarEscenarios").value = "";
  };
  reader.readAsText(file);
});

function cargarEscenarioGuardado(item) {
  scenario = item.scenario;
  origenActual = item.origen || "manual";
  syncControlsFromScenario();
  renderTablaSitios();
  renderTablaRecursos();
  recalc();
}

function renderEscenariosGuardados() {
  const list = getSavedScenarios();
  const rows = list.map(item => `
    <tr>
      <td>${item.scenario.name}</td>
      <td>${ORIGEN_LABELS[item.origen] || "—"}</td>
      <td>${new Date(item.savedAt).toLocaleString("es-MX")}</td>
      <td>${item.resumen.meetsGoal ? "✅" : "❌"}</td>
      <td>${fmtWeeks(item.resumen.totalWeeks)}</td>
      <td>${fmtMoney(item.resumen.totalCost)}</td>
      <td>${item.scenario.delayFactor ? "+" + Math.round(item.scenario.delayFactor * 100) + "%" : "—"}</td>
      <td>
        <button class="btn small secondary" data-load="${item.id}">Cargar</button>
        <button class="btn small danger" data-del="${item.id}">Eliminar</button>
      </td>
    </tr>`).join("");
  document.getElementById("tablaComparacion").innerHTML = `
    <thead><tr><th>Nombre</th><th>Origen</th><th>Guardado</th><th>¿8 meses?</th><th>Duración</th><th>Costo</th><th>Retraso</th><th>Acciones</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="8" style="color:var(--text-dim)">Aún no hay escenarios guardados.</td></tr>`}</tbody>
  `;

  document.querySelectorAll("[data-load]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = list.find(i => i.id === parseInt(btn.dataset.load));
      if (item) cargarEscenarioGuardado(item);
    });
  });
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      setSavedScenarios(getSavedScenarios().filter(i => i.id !== parseInt(btn.dataset.del)));
      renderEscenariosGuardados();
      renderMisPruebas();
    });
  });
}

// ---------------- Render: entendimiento del Excel ----------------
function renderEntendimiento() {
  document.getElementById("entendimientoContent").innerHTML = `
    <h2>Entendimiento del archivo de origen</h2>
    <p class="hint">Resumen operativo de las 6 pestañas de <code>WMS Scenarios - Anonymized.xlsx</code>. El detalle completo, con cada hallazgo y decisión tomada durante la revisión, está en <code>docs/entendimiento-datos.md</code> del repositorio.</p>

    <h3>1. ENTREGABLES</h3>
    <p>Ficha del ejercicio: objetivo, los 5 entregables y la rúbrica de calificación. No alimenta ningún cálculo, es texto de instrucciones.</p>

    <h3>2. Sites Master (15 sitios)</h3>
    <p>Cada sitio con su Clúster (1–4, llave hacia Implementation Phases y Phase-Resource Allocation) y su condición de arranque (identificación de pasillos/cajas, torre de control, montacargas, wifi, tablets, equipos de conteo). <b>Hallazgo:</b> Site 02 y Site 03 (México) son un duplicado intencional (confirmado con el usuario, un sitio faltante que el profesor rellenó copiando otro) — se tratan como sitios reales, no se corrigen.</p>

    <h3>3. Financials (USD → tratado como MXN)</h3>
    <p>Beneficio mensual y costo de implementación por sitio (dispositivos, montacargas, señalización, etiquetas, 3 opciones de WiFi). La columna "Costs without Labelers & WiFi" se verificó: es la suma exacta de los 5 costos anteriores. Todos los valores del archivo se tratan como pesos mexicanos, no dólares (aclaración del profesor en clase).</p>

    <h3>4. Resource Master (18 roles)</h3>
    <p>Costo mensual, modalidad, si es interno/externo, si el costo es fijo/flexible, y headcount "Actual" vs "Escenario 1". 3 roles tienen variante Interna y Externa (Change Management Lead, Infrastructure Lead, Functional Lead) — se tratan como bolsas de recursos separadas para costo, pero se suman para ver disponibilidad total del rol.</p>

    <h3>5. Implementation Phases</h3>
    <p>8 fases en orden fijo, duración en semanas según Clúster y Madurez (A/B). <b>Decisión de modelado:</b> ninguna pestaña indica qué madurez corresponde a cada sitio — se maneja como palanca ajustable por sitio (ver pestaña "Uso de Recursos"), con "A" por defecto. En Clúster 3 y 4 da igual A o B.</p>

    <h3>6. Phase-Resource Allocation</h3>
    <p>Qué rol consume cada fase y cuánta capacidad (0.5 = medio tiempo, 1 = tiempo completo; filas repetidas del mismo rol en la misma fase se suman, no son duplicados). <b>Hallazgo:</b> Clúster 4 no tenía fila propia en el archivo — Clúster 1/2/3 son idénticos entre sí, así que el simulador asume que Clúster 4 usa la misma tabla (supuesto confirmado con el usuario, afecta solo a Site 12).</p>

    <h3>Supuestos del motor de cálculo (no vienen del archivo, son de diseño)</h3>
    <ul>
      <li>Un "frente" ocupa un sitio completo, de Site Readiness a Hypercare.</li>
      <li>El orden de sitios es una cola estricta — un sitio no se salta a otro.</li>
      <li>La capacidad de un rol se reparte en fracciones continuas (no se usa "Puede Multitarea" en la aritmética — no hay una regla confirmada de cómo debería afectar).</li>
      <li>Costo de roles "Fixed": se cobra todo el programa. Costo de roles "Flexible": solo las semanas en que ese rol tuvo consumo real.</li>
      <li>El costo de recursos se reparte a cada sitio en proporción a su consumo real esa semana frente al consumo total de ese rol esa semana.</li>
    </ul>
  `;
}

function addDays(date, days) { return new Date(date.getTime() + days * 24 * 60 * 60 * 1000); }

// ---------------- Render: Mis Pruebas (bitacora manual vs. IA) ----------------
function renderMisPruebas() {
  renderPropuestaSelectorGuardados();
  const list = getSavedScenarios();
  const intentosManuales = list.filter(i => i.origen === "manual");

  const mejorIA = Object.entries(PROPUESTAS)
    .map(([key, p]) => ({ key, cost: p.costoVerificado }))
    .sort((a, b) => a.cost - b.cost)[0];

  const manualesQueCumplen = intentosManuales.filter(i => i.resumen.meetsGoal);
  const mejorManual = manualesQueCumplen.length
    ? manualesQueCumplen.reduce((best, i) => i.resumen.totalCost < best.resumen.totalCost ? i : best)
    : null;

  let kpiHtml = `
    <div class="kpi"><div class="value">${fmtMoney(mejorIA.cost)}</div><div class="label">Mejor de la IA (Propuesta ${mejorIA.key}, 6 probadas)</div></div>
    <div class="kpi ${mejorManual ? "good" : ""}"><div class="value">${mejorManual ? fmtMoney(mejorManual.resumen.totalCost) : "—"}</div><div class="label">Tu mejor intento manual que cumple</div></div>
    <div class="kpi"><div class="value">${intentosManuales.length}</div><div class="label">Intentos manuales guardados</div></div>
  `;
  if (mejorManual) {
    const diff = mejorManual.resumen.totalCost - mejorIA.cost;
    const pct = Math.round((diff / mejorIA.cost) * 1000) / 10;
    kpiHtml += `<div class="kpi ${diff > 0 ? "bad" : "good"}"><div class="value">${diff > 0 ? "+" : ""}${fmtMoney(diff)}</div><div class="label">Diferencia vs. la IA (${diff > 0 ? "+" : ""}${pct}%)</div></div>`;
  }
  document.getElementById("kpiComparacionManualVsIA").innerHTML = kpiHtml;

  const rows = intentosManuales.slice().reverse().map(item => `
    <tr>
      <td>${new Date(item.savedAt).toLocaleString("es-MX")}</td>
      <td>${item.scenario.name}</td>
      <td>${item.resumen.meetsGoal ? "✅" : "❌"}</td>
      <td>${fmtWeeks(item.resumen.totalWeeks)}</td>
      <td>${fmtMoney(item.resumen.totalCost)}</td>
      <td><button class="btn small secondary" data-load-manual="${item.id}">Cargar</button></td>
    </tr>`).join("");
  document.getElementById("tablaIntentosManuales").innerHTML = `
    <thead><tr><th>Guardado</th><th>Nombre</th><th>¿8 meses?</th><th>Duración</th><th>Costo</th><th>Acciones</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="6" style="color:var(--text-dim)">Aún no has guardado ningún intento manual. Ajusta algo en "Uso de Recursos" y guárdalo aquí.</td></tr>`}</tbody>
  `;
  document.querySelectorAll("[data-load-manual]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = list.find(i => i.id === parseInt(btn.dataset.loadManual));
      if (item) cargarEscenarioGuardado(item);
    });
  });
}

// ---------------- Render orquestador ----------------
function renderAll() {
  renderStatusBadges();
  renderKPIs();
  renderDiagnostico();
  renderPhaseLegend();
  renderGanttGeneral();
  renderSiteSelector();
  renderSiteDetail();
  renderCostos();
  renderEscenariosGuardados();
  renderMisPruebas();
}

// ---------------- Init ----------------
// Si es la primera vez que se abre el simulador en este navegador (nada guardado todavia), se precarga
// la bitacora real de exploracion manual -- asi queda visible sin depender de que cada quien la guarde.
if (getSavedScenarios().length === 0) {
  setSavedScenarios(SEED_MIS_INTENTOS);
}
syncControlsFromScenario();
renderTablaRecursos();
renderTablaSitios();
renderEntendimiento();
recalc();
