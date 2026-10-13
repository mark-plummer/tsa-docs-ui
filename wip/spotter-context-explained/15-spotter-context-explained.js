;(function () {
  // ---- router ---------------------------------------------------------------------------------
  const INTENTS = [
    { t: '…talk, format or refuse differently, for everyone', kind: 'in', where: 'Spotter instructions', why: 'Behavior is applied on every answer and must not depend on the question matching. Only instructions give that guarantee.', ex: '"Begin every response with a one-line takeaway. Decline compensation questions and redirect to HR."', not: 'A data definition. It would apply to every model in the Org.', path: 'Spotter settings > Spotter instructions. Needs Can manage Spotter.' },
    { t: '…give one team its own analyst with its own focus and models', kind: 'in', where: 'Analyst instructions', why: 'A Spotter Analyst scopes persona, focus and a small set of data models to one audience. Inside it, the Analyst instructions are the system prompt; the Org Spotter instructions do not apply.', ex: '"You are the EMEA renewals analyst. Lead with churn risk. Use the CS model first."', not: 'Metric definitions. Those belong to the model, so every Analyst that uses it inherits them.', path: 'Spotter Analysts > Instructions.' },
    { t: '…understand a word my team uses for a column', kind: 'se', where: 'Column synonym', why: 'A synonym is a name-to-column mapping used in matching. It is the cheapest fix for "Spotter picked the wrong column because I said geo".', ex: 'region: geo, territory, market', not: 'A meaning or a value format. That is AI Context.', path: 'Model page > Columns > Synonyms.' },
    { t: '…know what a column means or how its values are written', kind: 'se', where: 'AI Context', why: 'Column selection reads AI Context to tell similar columns apart and to read non-standard values. Describe identity: what it is, its unit, its grain, how values look.', ex: '"Fiscal quarter label, e.g. Q2 FY26. Fiscal year starts February." · "Short forms; MP means Metoprolol."', not: '"Prefer this column when…" That is a decision, so it belongs in memory.', path: 'Model page > Spotter optimization > AI Context. 400 characters per column.' },
    { t: '…apply a definition, default filter or exclusion', kind: 'sh', where: 'Data model memory', why: 'Memory is retrieved on the meaning of the question, can name several columns, and is applied as filters and definitions when the query is built.', ex: '"Revenue excludes Account_Type = Internal Test." · "If no time period is given, use the last 30 days."', not: 'A data model instruction also works today, but new shared logic belongs in data model memory so it is managed in one place.', path: 'Say it in a Spotter conversation on that model ("Remember this: …"), or learn it from a trusted Liveboard.' },
    { t: '…tell Spotter which of two similar columns to use for a kind of question', kind: 'sh', where: 'Data model memory, plus AI Context on each column', why: 'The choice is a decision across two columns, so it is memory and fires before selection. The AI Context on each column should describe what each one is, which is what lets the memory land.', ex: 'Memory: "Bookings questions use Close Date." AI Context: Close Date "Date the deal was signed"; Created Date "Date the record was created".', not: '"Prefer this over Created Date" written only in AI Context. It is read after the column is already a candidate.', path: 'Memory in conversation; AI Context on the Spotter optimization tab.' },
    { t: '…answer a recurring question the same specific way every time', kind: 'sh', where: 'Data model memory, learned from a Liveboard', why: 'Memory learned from a Liveboard holds the steps: filters, grouping, aggregation. On an exact question match it is applied as written; on similar questions it is used as a pattern.', ex: '"Quarterly churn view: filter close_date to the fiscal quarter, group by month, sum arr_change."', not: 'A single saved question and answer. Memory carries the steps, so it generalizes to similar questions.', path: 'Memory sources > Liveboards > Add the Liveboard that already shows the analysis, then verify the generated memory.' },
    { t: '…remember something about me', kind: 'pe', where: 'Personal memory', why: 'Profile facts always come along; preferences on a model are fetched when relevant. Nobody else sees them, and they never override data model memory.', ex: '"Remember I lead Customer Success for EMEA." · "When I say my accounts, I mean EMEA enterprise."', not: 'Anything your whole team should get. Make that data model memory.', path: 'Say it in conversation. Personal memory must be on for your Org and for you.' },
  ]
  const TAG = { in: 'instr', se: 'columns', sh: 'memory', pe: 'you' }
  const intents = document.getElementById('intents'); const dest = document.getElementById('dest')
  if (!intents || !dest) return
  INTENTS.forEach((it, i) => {
    const b = document.createElement('button'); b.className = 'intent'; b.setAttribute('role', 'tab'); b.textContent = it.t
    b.addEventListener('click', () => select(i)); intents.appendChild(b)
  })
  function select (i) {
    intents.querySelectorAll('.intent').forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i) })
    const it = INTENTS[i]
    dest.innerHTML = `
      <div class="where"><span class="tg ${it.kind}">${TAG[it.kind]}</span><h3>${it.where}</h3></div>
      <div class="row">
        <div class="k">Why here</div><div class="v">${it.why}</div>
        <div class="k">Write it like</div><div class="v ex">${it.ex}</div>
        <div class="k">Not this</div><div class="v not">${it.not}</div>
        <div class="k">Where</div><div class="v">${it.path}</div>
      </div>`
  }
  select(0)
})();

// ---- the animation: one question, end to end --------------------------------------------------
(function () {
  const anim = document.getElementById('anim')
  if (!anim) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const SEM_AS_TABLE = true
  const $ = (s) => anim.querySelector(s)
  const stage = $('#stage'); const doc = $('#doc'); const links = $('#links'); const circle = $('#circle')
  let speed = 0.6; let cur = 0; let playing = false; let token = 0

  const items = [...anim.querySelectorAll('.item')]
  const byId = Object.fromEntries(items.map((el) => [el.dataset.id, el]))
  const rel = (kind) => items.filter((el) => el.dataset.kind === kind && el.dataset.rel !== '0')
  const profileIds = ['m1', 'm2']; const relevantIds = ['m3', 'm4', 'm6', 'm7', 'm9']
  const memSlots = () => doc.querySelector('.psec.me .slots') || addSection('me', 'Spotter memory')
  const kindOf = (el) => el.dataset.kind === 'lg' ? 'sh' : el.dataset.kind
  const tagLabel = { in: 'instr', se: 'col', pe: 'you', sh: 'shared', lg: 'legacy', ex: 'external' }

  const R = (el) => { const r = el.getBoundingClientRect(); const s = stage.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height, cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2 } }
  const vis = (el) => el && !el.classList.contains('hid')
  const C = () => { const c = R(circle); return { x: c.cx, y: c.cy, r: c.w / 2 } }
  const onCircle = (deg) => { const c = C(); const a = deg * Math.PI / 180; return [c.x + c.r * Math.cos(a), c.y + c.r * Math.sin(a)] }
  const gapX = (leftEl, rightEl) => R(rightEl).x - 14
  const col1 = () => $('#p-in').parentElement; const col2 = () => doc.parentElement
  const analyzeRailX = () => stage.getBoundingClientRect().width - 20
  const deliverRailX = () => stage.getBoundingClientRect().width - 75
  const rowGapY = () => { const p = R($('.col.prompt')); const e = R($('.col.exec')); return Math.max(p.y + p.h, e.y + e.h) + 16 }

  function busLeft (el) {
    const a = R(el); const gx = gapX(col1(), col2()); const [ex, ey] = onCircle(180)
    if (Math.abs(a.cy - ey) < 10) return `M${a.x + a.w} ${ey} H${ex - 2}`
    return `M${a.x + a.w} ${a.cy} H${gx - 8} Q${gx} ${a.cy} ${gx} ${a.cy - 8} V${ey + 8} Q${gx} ${ey} ${gx + 8} ${ey} H${ex - 2}`
  }
  const busLabel = (el) => { const a = R(el); const gx = gapX(col1(), col2()); return [(a.x + a.w + gx - 8) / 2, a.cy - 7, 'middle'] }
  const LINKS = [
    { id: 'q', label: 'ask', d: () => busLeft($('#qbubble')), when: () => vis($('#qbubble')), lp: () => busLabel($('#qbubble')) },
    { id: 'in', label: 'fetch', d: () => busLeft($('#p-in')), when: () => vis($('#p-in')), lp: () => busLabel($('#p-in')) },
    { id: 'se', label: 'fetch', d: () => busLeft($('#p-se')), when: () => vis($('#p-se')), lp: () => busLabel($('#p-se')) },
    { id: 'me', label: 'fetch', d: () => busLeft($('#p-me')), when: () => vis($('#p-me')), lp: () => busLabel($('#p-me')) },
    { id: 'ex', label: 'fetch', d: () => busLeft($('#p-ex')), when: () => vis($('#p-ex')), lp: () => busLabel($('#p-ex')) },
    { id: 'doc', label: 'assemble', when: () => vis(doc), d () { const d = R(doc); const [sx, sy] = onCircle(150); const tx = d.x + d.w * 0.28; const ty = d.y; const my = (sy + ty) / 2; return `M${sx} ${sy} C${sx} ${my}, ${tx} ${my}, ${tx} ${ty - 2}` }, lp () { const d = R(doc); const [, sy] = onCircle(150); return [d.x + d.w * 0.28 - 6, sy + (d.y - sy) * 0.8, 'end'] } },
    { id: 'proc', label: 'process', when: () => vis(doc), d () { const d = R(doc); const [ex, ey] = onCircle(108); const sx = d.x + d.w * 0.68; const sy = d.y; const my = (sy + ey) / 2; return `M${sx} ${sy} C${sx} ${my}, ${ex} ${my}, ${ex} ${ey + 2}` }, lp () { const d = R(doc); const [, ey] = onCircle(108); return [d.x + d.w * 0.68 + 6, ey + (d.y - ey) * 0.8, 'start'] } },
    { id: 'plan', label: 'plan', when: () => vis($('#chk')), d () { const q = R($('#chk')); const [sx, sy] = onCircle(55); const tx = q.cx; const ty = q.y; const my = (sy + ty) / 2; return `M${sx} ${sy} C${sx} ${my}, ${tx} ${my}, ${tx} ${ty - 2}` }, lp () { const q = R($('#chk')); const [sx, sy] = onCircle(55); return [(sx + q.cx) / 2 + 10, (sy + q.y) / 2 - 4, 'start'] } },
    { id: 'sql', label: 'generate', when: () => vis($('#sql')), d () { const a = R($('#chk')); const b = R($('#sql')); return `M${a.cx} ${a.y + a.h} V${b.y - 2}` }, lp () { const a = R($('#chk')); const b = R($('#sql')); return [a.cx + 7, (a.y + a.h + b.y) / 2 + 3, 'start'] } },
    { id: 'wh', label: 'run', when: () => vis($('#wh')), d () { const a = R($('#sql')); const b = R($('#wh')); return `M${a.cx} ${a.y + a.h} V${b.y - 2}` }, lp () { const a = R($('#sql')); const b = R($('#wh')); return [a.cx + 7, (a.y + a.h + b.y) / 2 + 3, 'start'] } },
    { id: 'data', label: 'rows', when: () => vis($('#data')), d () { const a = R($('#wh')); const b = R($('#data')); return `M${a.cx} ${a.y + a.h} V${b.y - 2}` }, lp () { const a = R($('#wh')); const b = R($('#data')); return [a.cx + 7, (a.y + a.h + b.y) / 2 + 3, 'start'] } },
    {
      id: 'back',
      label: 'analyze',
      when: () => vis($('#data')),
      d () {
        const a = R($('#data')); const gx = analyzeRailX(); const [ex, ey] = onCircle(28)
        return `M${a.x + a.w} ${a.cy} H${gx - 8} Q${gx} ${a.cy} ${gx} ${a.cy - 8} V${ey + 8} Q${gx} ${ey} ${gx - 8} ${ey} H${ex + 2}`
      },
      lp () { const gx = analyzeRailX(); const [ex, ey] = onCircle(28); return [(gx + ex) / 2, ey + 13, 'middle'] },
    },
    {
      id: 'ans',
      label: 'deliver',
      when: () => vis($('#resp-head')),
      d () {
        const h = R($('#resp-head')); const gx = deliverRailX(); const [sx, sy] = onCircle(75)
        const tx = h.x + h.w * 0.3; const ty = h.y; const by = rowGapY()
        return `M${sx} ${sy} H${gx - 8} Q${gx} ${sy} ${gx} ${sy + 8} V${by - 8} Q${gx} ${by} ${gx - 8} ${by} H${tx + 8} Q${tx} ${by} ${tx} ${by + 8} V${ty - 2}`
      },
      lp () { const h = R($('#resp-head')); const gx = deliverRailX(); const by = rowGapY(); return [(gx + h.x + h.w * 0.3) / 2, by + 14, 'middle'] },
    },
  ]
  function fitStage () { stage.classList.toggle('doc-wide', vis(doc) && !doc.classList.contains('collapsed')) }

  const shownLinks = new Set(); let pulseLink = null
  function drawLinks () {
    fitStage()
    links.innerHTML = '<defs><marker id="lh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker><marker id="lhp" class="pulse" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>'
    for (const L of LINKS) {
      if (!L.when()) continue
      const on = shownLinks.has(L.id); const isPulse = pulseLink === L.id; const mk = isPulse ? 'url(#lhp)' : 'url(#lh)'
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      p.setAttribute('d', L.d()); p.setAttribute('class', (on ? 'shown' : '') + (isPulse ? ' pulse' : ''))
      p.setAttribute('marker-end', mk)
      links.appendChild(p)
      const [lx, ly, la] = L.lp()
      const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      tx.setAttribute('x', lx); tx.setAttribute('y', ly); tx.setAttribute('text-anchor', la); tx.setAttribute('class', (on ? 'shown' : '') + (isPulse ? ' pulse' : '')); tx.textContent = L.label
      links.appendChild(tx)
    }
  }
  const ro = new window.ResizeObserver(drawLinks); ro.observe(stage)
  anim.querySelectorAll('.stage .col').forEach((c) => ro.observe(c))

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms / speed))
  const CANCEL = Symbol('cancel')
  async function w (t, ms) { await wait(ms); if (t !== token) throw CANCEL }
  function show (el, a) { el.classList.remove('hid', 'ghosted'); if (a && !reduced) { el.classList.remove('rise', 'pop'); el.getBoundingClientRect(); el.classList.add(a) } drawLinks() }
  // Existing things appear first, then the connector draws and pulses toward them.
  async function reach (t, el, id, a = 'rise', ms = 520) { show(el, a); await w(t, 380); link(id); setPulse(id); await w(t, ms); setPulse(null) }
  // Produced things arrive with the flow: the block takes its place invisibly, the connector pulses, the content flies in, then the block appears.
  async function produce (t, el, id, src, text, kind = 'mono', a = 'rise', ms = 600) { el.classList.remove('hid'); el.classList.add('ghosted'); drawLinks(); link(id); setPulse(id); await w(t, 250); await fly(src, el, kind, ms, text); if (t !== token) throw CANCEL; setPulse(null); show(el, a) }
  function status (t) { $('#status').textContent = t }
  function docState (t) { $('#doc-state').textContent = t || '' }
  function addSection (key, title) {
    const s = document.createElement('div'); s.className = 'psec ' + key
    s.innerHTML = `<div class="sk">${title}</div><div class="sbody"><div><div class="slots"></div></div></div>`
    doc.appendChild(s); return s.querySelector('.slots')
  }
  function addSlot (slots, el) {
    const d = document.createElement('div'); d.className = 'slot'
    const tag = el.dataset.kind === 'in' ? '' : `<span class="tg ${el.dataset.kind}">${tagLabel[el.dataset.kind]}</span>`
    d.innerHTML = `<span>${tag}${el.dataset.text}</span>`
    slots.appendChild(d); return d
  }
  function addSemTable () {
    const s = document.createElement('div'); s.className = 'psec se'
    s.innerHTML = '<div class="sk">Data model semantics</div><div class="sbody"><div><div class="semwrap"><table class="semtab"><thead><tr class="hd"><th>Column</th><th>Synonym</th><th>AI Context</th></tr></thead><tbody></tbody></table></div></div></div>'
    doc.appendChild(s); return s.querySelector('tbody')
  }
  function addSemRow (tbody, el) {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${el.querySelector('b')?.textContent || el.dataset.text}</td><td>${el.querySelector('.syn')?.textContent || ''}</td><td>${el.querySelector('.ai')?.textContent || ''}</td>`
    tbody.appendChild(tr); return tr
  }
  const semTarget = SEM_AS_TABLE ? { open: addSemTable, add: addSemRow } : { open: () => addSection('se', 'Data model semantics'), add: addSlot }

  async function fly (src, dst, kind, ms, text) {
    if (reduced) return
    const s = src.getBoundingClientRect(); const d = dst.getBoundingClientRect(); const st = stage.getBoundingClientRect()
    const g = document.createElement('div'); g.className = 'ghost ' + kind
    g.textContent = text || src.dataset.text || src.textContent.trim()
    const wd = Math.min(s.width, 300)
    g.style.left = (s.left - st.left) + 'px'; g.style.top = (s.top - st.top) + 'px'; g.style.width = wd + 'px'
    stage.appendChild(g)
    const dx = d.left - s.left; const dy = d.top - s.top; const sx = Math.max(0.3, Math.min(1.2, d.width / wd))
    await g.animate(
      [{ transform: 'translate(0,0) scale(1,1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(${sx},1)`, opacity: 0.85 }],
      { duration: ms / speed, easing: 'cubic-bezier(.25,.75,.2,1)', fill: 'forwards' }
    ).finished
    g.remove()
  }
  async function moveGroup (els, slots, ms, t, adder = addSlot) {
    if (t !== token) throw CANCEL
    const pairs = els.map((el) => { const k = kindOf(el); el.classList.add('pick', k + '-pick'); return { el, k, dst: adder(slots, el) } })
    await Promise.all(pairs.map((p, i) => wait(i * 60).then(() => fly(p.el, p.dst, p.k, ms))))
    if (t !== token) throw CANCEL
    pairs.forEach((p) => p.dst.classList.add('filled')); drawLinks()
  }
  function fillInstant (el, slots, adder = addSlot) { el.classList.add('pick', kindOf(el) + '-pick'); adder(slots, el).classList.add('filled') }
  function collapse (el) { el.classList.add('collapsed'); el.classList.remove('active'); drawLinks() }
  function dimUnused (kind) { items.filter((el) => el.dataset.kind === kind && el.dataset.rel === '0').forEach((el) => el.classList.add('dim')) }
  function clearPanels () { anim.querySelectorAll('.panel').forEach((p) => p.classList.remove('active')) }
  function link (id) { shownLinks.add(id); drawLinks() }
  function setPulse (id) { pulseLink = id; drawLinks() }
  function newQuestionSlot () {
    const slots = addSection('q-sec', 'User question')
    const d = document.createElement('div'); d.className = 'slot q'
    d.innerHTML = '<span>"What was our churn last quarter?"</span>'; slots.appendChild(d); return d
  }
  async function reachDoc (t) {
    if (!doc.classList.contains('hid')) return doc.querySelector('.slot.q')
    const d = newQuestionSlot(); show(doc, 'pop'); await w(t, 380)
    link('doc'); setPulse('doc'); await w(t, 520); setPulse(null); return d
  }
  function openDoc () {
    if (!doc.classList.contains('hid')) return doc.querySelector('.slot.q')
    show(doc, 'pop'); return newQuestionSlot()
  }

  const steps = [
    { st: 'Ready', tt: 'Press Play to watch Spotter assemble one answer', tx: 'Press Play, or step through with Next.', apply () {}, async play () {} },

    {
      st: '1 / 10',
      tt: 'Priya asks',
      tx: 'The question goes to the agent. Nothing is fetched yet.',
      apply () { show($('#qbubble')); circle.classList.add('active'); link('q'); status('question received') },
      async play (t) { show($('#qbubble'), 'rise'); await w(t, 450); link('q'); setPulse('q'); await w(t, 250); await fly($('#qbubble'), circle, 'q', 650, 'What was our churn last quarter?'); if (t !== token) throw CANCEL; setPulse(null); circle.classList.add('active'); status('question received'); await w(t, 250) },
    },

    {
      st: '2 / 10',
      tt: 'Spotter instructions',
      tx: 'The prompt opens with the question. Every Spotter instruction loads next, whatever the question: tone, a required closing line, a guardrail.',
      apply () { show($('#p-in')); link('in'); openDoc().classList.add('filled'); link('doc'); const s = addSection('in', 'Spotter instructions'); rel('in').forEach((el) => fillInstant(el, s)); collapse($('#p-in')); status('instructions loaded') },
      async play (t) {
        clearPanels(); status('fetching instructions'); await reach(t, $('#p-in'), 'in'); $('#p-in').classList.add('active'); await w(t, 300)
        const q = await reachDoc(t); await fly(circle, q, 'q', 550, 'What was our churn last quarter?'); if (t !== token) throw CANCEL; q.classList.add('filled')
        const s = addSection('in', 'Spotter instructions'); drawLinks(); await w(t, 250)
        await moveGroup(rel('in'), s, 700, t); if (t !== token) throw CANCEL
        status('instructions loaded'); await w(t, 350); collapse($('#p-in')); await w(t, 450)
      },
    },

    {
      st: '3 / 10',
      tt: 'Data model semantics',
      tx: 'Only the columns that match "churn" and "last quarter" enter the prompt, with their synonyms and AI Context.',
      apply () { clearPanels(); show($('#p-se')); link('se'); dimUnused('se'); const s = semTarget.open(); rel('se').forEach((el) => fillInstant(el, s, semTarget.add)); collapse($('#p-se')); status('columns matched') },
      async play (t) {
        clearPanels(); status('scanning columns'); await reach(t, $('#p-se'), 'se'); $('#p-se').classList.add('active'); await w(t, 550); dimUnused('se'); await w(t, 350)
        const s = semTarget.open(); drawLinks(); await w(t, 200)
        await moveGroup(rel('se'), s, 720, t, semTarget.add); if (t !== token) throw CANCEL
        status('columns matched'); await w(t, 350); collapse($('#p-se')); await w(t, 450)
      },
    },

    {
      st: '4 / 10',
      tt: 'Spotter memory',
      tx: 'Priya\'s personal profile is always sent.',
      apply () { clearPanels(); show($('#p-me')); link('me'); $('#p-me').classList.add('active'); const s = addSection('me', 'Spotter memory'); profileIds.forEach((id) => fillInstant(byId[id], s)); status('profile sent') },
      async play (t) {
        clearPanels(); status('opening memory'); await reach(t, $('#p-me'), 'me'); $('#p-me').classList.add('active'); await w(t, 400)
        const s = addSection('me', 'Spotter memory'); drawLinks(); await w(t, 200)
        await moveGroup(profileIds.map((id) => byId[id]), s, 720, t); if (t !== token) throw CANCEL
        status('profile sent'); await w(t, 450)
      },
    },

    {
      st: '5 / 10',
      tt: 'Spotter memory',
      tx: 'From her preferences on this data model and the data model\'s shared memory, only what is relevant to churn is fetched.',
      apply () { dimUnused('pe'); dimUnused('sh'); const s = memSlots(); relevantIds.forEach((id) => fillInstant(byId[id], s)); collapse($('#p-me')); status('memory fetched') },
      async play (t) {
        status('searching memory'); await w(t, 300); dimUnused('pe'); dimUnused('sh'); await w(t, 450); if (t !== token) throw CANCEL
        const s = memSlots(); drawLinks(); await w(t, 200)
        await moveGroup(relevantIds.map((id) => byId[id]), s, 720, t); if (t !== token) throw CANCEL
        status('memory fetched'); await w(t, 350); collapse($('#p-me')); await w(t, 450)
      },
    },

    {
      st: '6 / 10',
      tt: 'External context',
      tx: 'Relevant context is fetched over MCP from connected sources: a Confluence page on the Q2 renewal calendar. Slack and SharePoint have nothing relevant.',
      apply () { clearPanels(); show($('#p-ex')); link('ex'); dimUnused('ex'); const s = addSection('ex', 'External context'); rel('ex').forEach((el) => fillInstant(el, s)); collapse($('#p-ex')); status('external context fetched') },
      async play (t) {
        clearPanels(); status('checking connectors'); await reach(t, $('#p-ex'), 'ex'); $('#p-ex').classList.add('active'); await w(t, 500); dimUnused('ex'); await w(t, 400)
        const s = addSection('ex', 'External context'); drawLinks(); await w(t, 200)
        await moveGroup(rel('ex'), s, 720, t); if (t !== token) throw CANCEL
        status('external context fetched'); await w(t, 350); collapse($('#p-ex')); await w(t, 450)
      },
    },

    {
      st: '7 / 10',
      tt: 'The agent plans, the semantic layer generates the query',
      tx: 'The agent turns the prompt into a plan: churn plus downgrades, EMEA, by month. The semantic layer validates it, applies row and column security, and generates the query. The LLM never writes SQL.',
      apply () { clearPanels(); doc.classList.add('collapsed'); docState('processed'); link('proc'); show($('#chk')); link('plan'); show($('#sql')); link('sql'); collapse($('#chk')); status('query generated') },
      async play (t) {
        clearPanels(); doc.classList.add('collapsed'); drawLinks(); await w(t, 600); if (t !== token) throw CANCEL
        doc.classList.add('glow'); docState('processing'); circle.classList.add('busy'); link('proc'); setPulse('proc'); status('processing the prompt'); await w(t, 1100); if (t !== token) throw CANCEL
        setPulse(null); doc.classList.remove('glow'); docState('processed'); circle.classList.remove('busy'); status('planning the answer'); await produce(t, $('#chk'), 'plan', doc, 'plan: churn + downgrades · EMEA · by month'); status('validating the plan'); await w(t, 900); if (t !== token) throw CANCEL
        collapse($('#chk')); await w(t, 550); if (t !== token) throw CANCEL
        status('generating the query'); await produce(t, $('#sql'), 'sql', $('#chk'), 'SELECT … FROM arr_changes WHERE region = EMEA …'); status('query generated'); await w(t, 300)
      },
    },

    {
      st: '8 / 10',
      tt: 'Sent to the warehouse',
      tx: 'The warehouse runs the query. Three raw rows come back, accurate but not yet an answer.',
      apply () { collapse($('#sql')); show($('#wh')); link('wh'); show($('#data')); link('data'); status('rows returned') },
      async play (t) {
        collapse($('#sql')); await w(t, 550); if (t !== token) throw CANCEL
        await reach(t, $('#wh'), 'wh', 'pop', 420); await fly($('#sql'), $('#wh'), 'mono', 600, 'SELECT … GROUP BY 1 ORDER BY 1;'); if (t !== token) throw CANCEL; $('#wh').classList.add('busy'); status('waiting on the warehouse'); await w(t, 900); if (t !== token) throw CANCEL
        $('#wh').classList.remove('busy'); await produce(t, $('#data'), 'data', $('#wh'), '3 rows', 'mono', 'rise', 500); status('rows returned'); await w(t, 300)
      },
    },

    {
      st: '9 / 10',
      tt: 'The agent analyzes the data',
      tx: 'The agent reads the rows against the prompt: the heaviest month, logos lost, and how Priya wants it shown.',
      apply () { link('back'); collapse($('#data')); status('analyzed the rows') },
      async play (t) {
        collapse($('#data')); await w(t, 550); if (t !== token) throw CANCEL
        link('back'); setPulse('back'); await w(t, 350); await fly($('#data'), circle, 'mono', 800, '3 rows · month · churned_arr · downgrade_arr · logos_lost'); if (t !== token) throw CANCEL; setPulse(null); circle.classList.add('busy'); status('analyzing the rows'); await w(t, 900); status('writing the response'); await w(t, 600)
      },
    },

    {
      st: '10 / 10',
      tt: 'Response delivered to Priya',
      tx: 'Headline number first, the chart she prefers, two lines of insight, the required closing.',
      apply () { show($('#resp-head')); show($('#resp')); link('ans'); status('delivered') },
      async play (t) { show($('#resp-head'), 'rise'); await w(t, 380); await produce(t, $('#resp'), 'ans', circle, 'EMEA churn Q2 FY26: $412K', 'r', 'rise', 700); circle.classList.remove('busy'); status('delivered') },
    },
  ]

  function resetAll () {
    token++
    anim.querySelectorAll('.ghost').forEach((g) => g.remove())
    items.forEach((el) => el.classList.remove('pick', 'in-pick', 'se-pick', 'pe-pick', 'sh-pick', 'ex-pick', 'dim'))
    anim.querySelectorAll('.collapsed').forEach((p) => p.classList.remove('collapsed'))
    anim.querySelectorAll('.ghosted').forEach((p) => p.classList.remove('ghosted'))
    doc.querySelectorAll('.psec').forEach((s) => s.remove())
    doc.classList.remove('glow'); docState(''); $('#wh').classList.remove('busy'); clearPanels();
    ['#qbubble', '#p-in', '#p-se', '#p-me', '#p-ex', '#doc', '#chk', '#sql', '#wh', '#data', '#resp-head', '#resp'].forEach((s) => $(s).classList.add('hid'))
    circle.classList.remove('active', 'busy'); status('waiting')
    shownLinks.clear(); pulseLink = null; drawLinks()
  }
  function narrate (n) {
    const s = steps[n]; $('#n-st').textContent = s.st; $('#n-tt').textContent = s.tt; $('#n-tx').textContent = s.tx
    $('#back').disabled = n === 0; $('#next').disabled = n === steps.length - 1
  }
  async function goTo (n, animate) {
    n = Math.max(0, Math.min(steps.length - 1, n))
    resetAll(); const t = token
    for (let k = 1; k < n; k++) steps[k].apply()
    cur = n; narrate(n)
    if (n === 0) return
    if (animate && !reduced) { try { await steps[n].play(t) } catch (e) { if (e !== CANCEL) throw e } } else steps[n].apply()
    drawLinks()
  }
  function stopPlaying () { token++; playing = false; $('#play').textContent = '▶ Play' }
  async function playAll () {
    if (playing) return; playing = true; $('#play').textContent = '❚❚ Pause'
    const start = cur >= steps.length - 1 ? 0 : cur
    if (start === 0) resetAll()
    const t = token
    for (let n = start + 1; n < steps.length; n++) {
      if (t !== token) break
      cur = n; narrate(n)
      try { await steps[n].play(t) } catch (e) { if (e !== CANCEL) throw e; break }
      if (t !== token) break
      await wait(1400)
    }
    if (t === token) { playing = false; $('#play').textContent = '▶ Play' }
  }

  $('#play').addEventListener('click', () => { if (playing) { stopPlaying(); goTo(cur, false) } else playAll() })
  $('#next').addEventListener('click', () => { stopPlaying(); goTo(cur + 1, true) })
  $('#back').addEventListener('click', () => { stopPlaying(); goTo(cur - 1, false) })
  $('#reset').addEventListener('click', () => { stopPlaying(); goTo(0, false); playAll() })
  anim.querySelectorAll('.speed button').forEach((b) => b.addEventListener('click', () => { speed = parseFloat(b.dataset.sp); anim.querySelectorAll('.speed button').forEach((x) => x.classList.toggle('on', x === b)) }))
  anim.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); $('#next').click() } if (e.key === 'ArrowLeft') { e.preventDefault(); $('#back').click() } })

  // Open on the finished picture so the section reads at rest; Replay runs it from the start.
  goTo(steps.length - 1, false)
})()
