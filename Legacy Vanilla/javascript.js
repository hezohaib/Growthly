
        "use strict";
        // ---------- data (seeded so results are reproducible) ----------
        function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
        const rand = mulberry32(42), DAYS = 180, END = new Date(2026, 9, 31);
        const series = Array.from({ length: DAYS }, (_, i) => {
            const date = new Date(END); date.setDate(date.getDate() - (DAYS - 1 - i));
            const growth = 1 + i / DAYS * .6, weekend = [0, 6].includes(date.getDay()) ? .7 : 1;
            return {
                date,
                revenue: Math.round(3000 * growth * weekend * (.9 + rand() * .2)),
                signups: Math.round(14 * growth * weekend * (.7 + rand() * .6)),
                active: Math.round(1800 * growth * (.97 + rand() * .06)),
                churned: Math.round(2 + rand() * 4)
            };
        });
        const PLAN_PRICE = { Starter: 29, Pro: 99, Business: 299 };
        const names = "Northwind,Acme Labs,Bluefin,Cedar & Co,Dune Studio,Evergreen,Foxglove,Granite,Harbor,Ionic,Juniper,Kestrel,Lumen,Meridian,Nimbus,Orchard,Pinecone,Quarry,Riverside,Sable,Tidewater,Umbra,Vantage,Willow,Yarrow,Zephyr,Atlas,Beacon,Cobalt,Delta".split(",");
        const customers = names.map((name, i) => {
            const plan = ["Starter", "Pro", "Business"][Math.floor(rand() * 3)], seats = 1 + Math.floor(rand() * (plan === "Starter" ? 3 : plan === "Pro" ? 10 : 30));
            const joined = new Date(END); joined.setDate(joined.getDate() - Math.floor(rand() * 400));
            return { name, plan, seats, mrr: PLAN_PRICE[plan] + (plan === "Starter" ? 0 : seats * 5), status: rand() < .15 ? "Churned" : "Active", joined };
        });

        // ---------- state ----------
        const state = { range: 30, metric: "revenue", query: "", sort: { key: "mrr", dir: "desc" }, page: 1, pageSize: 8 };

        // ---------- helpers ----------
        const $ = s => document.querySelector(s);
        const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
        const num = new Intl.NumberFormat("en-US");
        const short = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
        const sum = (a, k) => a.reduce((t, r) => t + r[k], 0);
        const pct = (c, p) => p ? ((c - p) / p) * 100 : 0;
        const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

        // ---------- selectors (derived data, never stored) ----------
        function periods() { const n = state.range; return { cur: series.slice(DAYS - n), prev: series.slice(DAYS - 2 * n, DAYS - n) } }
        function kpiData() {
            const { cur, prev } = periods();
            const churnRate = p => sum(p, "churned") / (sum(p, "active") / p.length) * 100;
            return [
                { label: "Revenue", value: usd.format(sum(cur, "revenue")), delta: pct(sum(cur, "revenue"), sum(prev, "revenue")) },
                { label: "New signups", value: num.format(sum(cur, "signups")), delta: pct(sum(cur, "signups"), sum(prev, "signups")) },
                { label: "Active users", value: num.format(cur.at(-1).active), delta: pct(cur.at(-1).active, prev.at(-1).active) },
                { label: "Churn rate", value: churnRate(cur).toFixed(2) + "%", delta: pct(churnRate(cur), churnRate(prev)), lowerIsBetter: true }
            ];
        }
        function visibleCustomers() {
            const q = state.query.trim().toLowerCase(), { key, dir } = state.sort;
            const rows = customers.filter(c => c.name.toLowerCase().includes(q));
            rows.sort((a, b) => { const x = a[key], y = b[key]; const r = x instanceof Date ? x - y : typeof x === "number" ? x - y : String(x).localeCompare(y); return dir === "asc" ? r : -r });
            return rows;
        }

        // ---------- renderers ----------
        function renderKpis() {
            $("#kpis").innerHTML = kpiData().map(k => {
                const good = k.lowerIsBetter ? k.delta <= 0 : k.delta >= 0, sign = k.delta >= 0 ? "+" : "";
                return `<div class="panel kpi"><div class="l">${k.label}</div><div class="v">${k.value}</div>
    <div class="d ${good ? "good" : "bad"}">${sign}${k.delta.toFixed(1)}% <span style="color:var(--muted)">vs previous ${state.range} days</span></div></div>`
            }).join("");
            const { cur } = periods();
            $("#period").textContent = `${short.format(cur[0].date)} to ${short.format(cur.at(-1).date)}, 2026`;
        }

        function niceMax(m) { const step = Math.pow(10, Math.floor(Math.log10(m))) / 2; return Math.ceil(m / step) * step }

        function renderChart() {
            const data = periods().cur, key = state.metric, vals = data.map(d => d[key]);
            const W = 640, H = 240, p = { l: 48, r: 12, t: 12, b: 26 }, max = niceMax(Math.max(...vals)), n = vals.length;
            const x = i => p.l + i / (n - 1) * (W - p.l - p.r), y = v => p.t + (1 - v / max) * (H - p.t - p.b);
            const fmt = key === "revenue" ? v => usd.format(v) : v => num.format(v);
            const line = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
            const grid = [0, 1, 2, 3, 4].map(t => { const v = max / 4 * t; return `<line x1="${p.l}" x2="${W - p.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${p.l - 8}" y="${y(v) + 4}" text-anchor="end">${key === "revenue" ? "$" + Math.round(v / 1000 * 10) / 10 + "k" : Math.round(v)}</text>` }).join("");
            const ticks = [0, .33, .66, 1].map(f => { const i = Math.round(f * (n - 1)); return `<text x="${x(i)}" y="${H - 6}" text-anchor="${f === 0 ? "start" : f === 1 ? "end" : "middle"}">${short.format(data[i].date)}</text>` }).join("");
            $("#chart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${key} over the last ${n} days">
    ${grid}${ticks}
    <path d="${line}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="var(--accent)" opacity=".08"/>
    <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    <line id="vl" y1="${p.t}" y2="${H - p.b}" stroke="var(--muted)" stroke-dasharray="3 3" style="display:none"/>
    <circle id="dot" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" style="display:none"/>
    <rect id="hit" x="${p.l}" y="${p.t}" width="${W - p.l - p.r}" height="${H - p.t - p.b}" fill="transparent"/></svg>
    <div class="tip" id="tip"></div>`;
            const svg = $("#chart svg"), tip = $("#tip"), vl = $("#vl"), dot = $("#dot");
            const hide = () => { tip.style.display = vl.style.display = dot.style.display = "none" };
            $("#hit").addEventListener("pointermove", e => {
                const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
                const i = Math.max(0, Math.min(n - 1, Math.round((px - p.l) / (W - p.l - p.r) * (n - 1))));
                vl.setAttribute("x1", x(i)); vl.setAttribute("x2", x(i)); dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(vals[i]));
                vl.style.display = dot.style.display = "";
                tip.textContent = `${short.format(data[i].date)}: ${fmt(vals[i])}`;
                tip.style.display = "block"; tip.style.left = (x(i) / W * 100) + "%";
            });
            $("#hit").addEventListener("pointerleave", hide);
        }

        function renderPlans() {
            const active = customers.filter(c => c.status === "Active"), total = sum(active, "mrr");
            $("#plans").innerHTML = Object.keys(PLAN_PRICE).map(plan => {
                const rows = active.filter(c => c.plan === plan), v = sum(rows, "mrr"), share = v / total * 100;
                return `<div class="plan"><div class="row"><span>${plan} <span style="color:var(--muted)">(${rows.length} accounts)</span></span><strong>${usd.format(v)}</strong></div>
    <div class="track"><div class="fill" style="width:${share.toFixed(1)}%"></div></div></div>`
            }).join("")
                + `<p class="sub">Active accounts only. Total ${usd.format(total)} per month.</p>`;
        }

        const COLS = [{ key: "name", label: "Customer" }, { key: "plan", label: "Plan" }, { key: "seats", label: "Seats", n: 1 }, { key: "mrr", label: "Monthly revenue", n: 1 }, { key: "joined", label: "Joined" }, { key: "status", label: "Status" }];
        function renderHead() {
            $("#thead").innerHTML = COLS.map(c => {
                const on = state.sort.key === c.key, aria = on ? (state.sort.dir === "asc" ? "ascending" : "descending") : "none";
                return `<th class="${c.n ? "n" : ""}" aria-sort="${aria}"><button data-sort="${c.key}">${c.label}</button></th>`
            }).join("");
        }
        function renderTable() {
            const rows = visibleCustomers(), pages = Math.max(1, Math.ceil(rows.length / state.pageSize));
            state.page = Math.min(state.page, pages);
            const start = (state.page - 1) * state.pageSize, view = rows.slice(start, start + state.pageSize);
            $("#tbody").innerHTML = view.length ? view.map(c => `<tr><td>${esc(c.name)}</td><td>${c.plan}</td><td class="n">${c.seats}</td><td class="n">${usd.format(c.mrr)}</td>
    <td>${short.format(c.joined)}, ${c.joined.getFullYear()}</td><td><span class="pill ${c.status === "Churned" ? "churned" : ""}">${c.status}</span></td></tr>`).join("")
                : `<tr><td colspan="6" class="empty">No customers match “${esc(state.query)}”. Try a shorter name.</td></tr>`;
            $("#pager").innerHTML = `<span>${rows.length ? `${start + 1} to ${start + view.length} of ${rows.length}` : "0 results"}</span>
    <span><button class="btn" data-page="${state.page - 1}" ${state.page <= 1 ? "disabled" : ""}>Previous</button>
    <button class="btn" data-page="${state.page + 1}" ${state.page >= pages ? "disabled" : ""}>Next</button></span>`;
        }
        function renderControls() {
            document.querySelectorAll("[data-range]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.range === state.range));
            document.querySelectorAll("[data-metric]").forEach(b => b.setAttribute("aria-pressed", b.dataset.metric === state.metric));
        }
        function render() { renderControls(); renderKpis(); renderChart(); renderPlans(); renderHead(); renderTable() }

        // ---------- events (one delegated listener) ----------
        document.addEventListener("click", e => {
            const t = e.target.closest("[data-range],[data-metric],[data-sort],[data-page]");
            if (!t || t.disabled) return;
            if (t.dataset.range) { state.range = +t.dataset.range; render() }
            else if (t.dataset.metric) { state.metric = t.dataset.metric; renderControls(); renderChart() }
            else if (t.dataset.sort) {
                const k = t.dataset.sort;
                state.sort = state.sort.key === k ? { key: k, dir: state.sort.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" };
                state.page = 1; renderHead(); renderTable();
                document.querySelector(`[data-sort="${k}"]`).focus();
            }
            else if (t.dataset.page) { state.page = +t.dataset.page; renderTable() }
        });
        let timer;
        $("#q").addEventListener("input", e => { clearTimeout(timer); timer = setTimeout(() => { state.query = e.target.value; state.page = 1; renderTable() }, 150) });
        $("#theme").addEventListener("click", () => {
            const root = document.documentElement, dark = getComputedStyle(root).colorScheme === "dark";
            root.dataset.theme = dark ? "light" : "dark";
        });
        render();