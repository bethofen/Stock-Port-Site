(() => {
  const $ = id => document.getElementById(id);
  let sessionPassword = null;
  const routeNames = {home:"ภาพรวม", stock:"รายละเอียดหุ้น", copyquant:"รายละเอียด Copy Quant", reports:"รายงานหุ้น"};
  function navigate(route, updateHash=true) {
    const home = $("dashboard-home"), view = $("detail-view"), frame = $("detail-frame");
    if (!home || !view || !frame) return;
    const safeRoute = Object.prototype.hasOwnProperty.call(routeNames, route) ? route : "home";
    if (updateHash) history.pushState(null, "", safeRoute === "home" ? location.pathname : `#${safeRoute}`);
    home.hidden = safeRoute !== "home";
    view.hidden = safeRoute === "home";
    document.querySelectorAll(".nav a[data-route]").forEach(link => {
      const active = link.dataset.route === safeRoute || (safeRoute === "reports" && link.dataset.route === "stock");
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    if (safeRoute === "home") { frame.src = "about:blank"; return; }
    const path = safeRoute === "copyquant" ? "./copytrade/?embed=1" : `./report/?embed=1${safeRoute === "reports" ? "#reports" : ""}`;
    frame.title = routeNames[safeRoute];
    frame.src = path;
  }
  function routeFromHash() {
    const route = location.hash.slice(1);
    navigate(Object.prototype.hasOwnProperty.call(routeNames, route) ? route : "home", false);
  }
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt = (value, digits=2) => value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString("th-TH", {maximumFractionDigits:digits});
  const base64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  async function decrypt(blob, password) {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({name:"PBKDF2", salt:base64(blob.salt), iterations:blob.iterations || 200000, hash:"SHA-256"}, material, {name:"AES-GCM",length:256}, false, ["decrypt"]);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:base64(blob.iv)}, key, base64(blob.ct))));
  }
  async function load(path) {
    const metaRes = await fetch(path + "meta.json", {cache:"no-store"});
    if (!metaRes.ok) throw Object.assign(new Error("ยังไม่มีข้อมูลเผยแพร่"), {kind:"missing"});
    const meta = await metaRes.json();
    const response = await fetch(path + (meta.encrypted ? "site-data.json.enc" : "site-data.json"), {cache:"no-store"});
    if (!response.ok) throw Object.assign(new Error("อ่านข้อมูลไม่สำเร็จ"), {kind:"missing"});
    return {meta, blob:await response.json()};
  }
  const daysOld = date => { const t=Date.parse(date || ""); return Number.isFinite(t) ? (Date.now()-t)/86400000 : Infinity; };
  const fresh = date => daysOld(date) <= 2;
  const displayDate = value => value ? new Date(value).toLocaleString("th-TH", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"}) : "ไม่ทราบเวลา";
  function stockValue(data) {
    const portfolios = data?.portfolios || {};
    let total = 0, found = false, complete = Object.keys(portfolios).length>0, currencies = new Set(), pnlAvailable = true, pnl = 0, inputs=[], holdings=0, holdingsKnown=true;
    for (const portfolio of Object.values(portfolios)) {
      const account = portfolio?.account || {}, currency = String(portfolio?.meta?.currency || "").toUpperCase();
      if (Array.isArray(portfolio?.holdings)) holdings += portfolio.holdings.length; else holdingsKnown=false;
      if (account.total_balance != null && Number.isFinite(Number(account.total_balance)) && currency) { total += Number(account.total_balance); found = true; inputs.push({amount:Number(account.total_balance),currency}); }
      else complete=false;
      if (currency) currencies.add(currency);
      if (account.total_pnl_amount == null || account.total_pnl_percent == null) pnlAvailable = false;
      else pnl += Number(account.total_pnl_amount);
    }
    return {total:found && complete && currencies.size===1 ? total : null, currency:currencies.size===1 ? [...currencies][0] : (currencies.size ? "หลายสกุล" : ""), pnl:pnlAvailable && found && complete && currencies.size===1 ? pnl : null, count:Object.keys(portfolios).length, inputs,complete,holdings:holdingsKnown?holdings:null};
  }
  function assessCopy(data) {
    const q = data?.quality || {}, leads = Array.isArray(data?.leads) ? data.leads : [];
    const validations = q.validation || {}, f = q.fetch_leads || {};
    const expected = Number(validations.configured_leads ?? f.leads ?? leads.length), fetched = Number(validations.fetched_leads ?? leads.length);
    const failed = Object.keys(f.failed || {}).length, missing = (validations.missing_leads || []).length;
    const ok = q.fetch_account?.status === "ok" && f.status === "ok" && expected === fetched && failed === 0 && missing === 0;
    return {ok, leads, quality:q};
  }
  function statusMarkup(ok, known=true) { return `<span class="tag ${ok?"ok":"warn"}">${known?(ok?"ข้อมูลครบ":"ตรวจข้อมูล"):"ยังไม่มีข้อมูล"}</span>`; }
  function render({stock,copy,stockError,copyError,stockMeta,copyMeta}) {
    const stockTotals=stock?stockValue(stock):{total:null,currency:"",pnl:null,count:0};
    const copyTotals=copy?assessCopy(copy):{ok:false,leads:[],quality:{}};
    const wallet=copy?.account?.balance, walletCcy=copy?.account?.quote || "USDT";
    const allFresh=(!stockMeta || fresh(stockMeta.latest_date || stockMeta.generated_at)) && (!copyMeta || fresh(copyMeta.latest_date || copyMeta.generated_at));
    const fx=copy?.fx_to_thb || {}, allSourcesFresh=Boolean(stockMeta&&copyMeta&&fresh(stockMeta.latest_date||stockMeta.generated_at)&&fresh(copyMeta.latest_date||copyMeta.generated_at)&&fresh(copy?.fx_meta?.date));
    const converted=[];
    for(const item of stockTotals.inputs){const rate=item.currency==="THB"?1:Number(fx[item.currency]);if(!rate||!Number.isFinite(rate)){converted.length=0;break}converted.push(item.amount*rate)}
    const copyRate=walletCcy.toUpperCase()==="THB"?1:Number(fx[walletCcy.toUpperCase()]);
    const total=allSourcesFresh&&stockTotals.complete&&stockTotals.inputs.length>0&&converted.length===stockTotals.inputs.length&&wallet!=null&&Number.isFinite(Number(wallet))&&copyRate?converted.reduce((a,b)=>a+b,0)+Number(wallet)*copyRate:null;
    $("overall-total").textContent=fmt(total);
    const fxDate=copy?.fx_meta?.date;
    $("overall-currency").textContent=total==null?"THB · รอ FX หรือข้อมูลสดครบทั้งสองระบบ":`THB · FX ${fxDate||"ไม่ทราบวันที่"} · หุ้น + wallet เท่านั้น`;
    $("stock-total").textContent=fmt(stockTotals.total);
    $("stock-currency").textContent=stockTotals.currency || "สกุลเงินยังไม่ระบุ";
    $("copy-total").textContent=fmt(wallet);
    $("copy-currency").textContent=walletCcy;
    $("overall-return").textContent="—";
    $("overall-return-note").textContent="รอ PnL และเงินเข้าออกระดับพอร์ตของทั้งสองระบบ";
    $("top-update").innerHTML=`<strong>${allFresh?"● ล่าสุด":"● ข้อมูลเก่า"}</strong>${stockMeta?.latest_date?`Stock ${esc(stockMeta.latest_date)}`:"Stock —"} · ${copyMeta?.latest_date?`Quant ${esc(copyMeta.latest_date)}`:"Quant —"}`;
    $("attention-stock").innerHTML=`<span class="dot ${stockMeta&&fresh(stockMeta.latest_date)?"ok":"warn"}"></span> Stock · ${stockMeta?`อัปเดต ${esc(stockMeta.latest_date||"ไม่ระบุ")}`:"ยังไม่มี feed"}`;
    $("attention-copy").innerHTML=`<span class="dot ${copyMeta&&fresh(copyMeta.latest_date)?"ok":"warn"}"></span> Copy Quant · ${copyMeta?`อัปเดต ${esc(copyMeta.latest_date||"ไม่ระบุ")}`:"ยังไม่มี feed"}`;
    $("stock-status").innerHTML=statusMarkup(Boolean(stockMeta&&fresh(stockMeta.latest_date)),Boolean(stockMeta));
    $("copy-status").innerHTML=statusMarkup(copyTotals.ok,Boolean(copyMeta));
    const portfolios=stock?.portfolios||{};
    $("stock-rows").innerHTML=Object.entries(portfolios).slice(0,5).map(([name,p])=>`<div class="row"><span class="name">${esc(name)}</span><span class="data">${fmt(p?.account?.total_balance)} ${esc(p?.meta?.currency||"")}</span><span class="data">${p?.account?.total_pnl_percent==null?"—":`${Number(p.account.total_pnl_percent)>0?"+":""}${fmt(p.account.total_pnl_percent)}%`}</span></div>`).join("") || `<p class="fineprint">${stockError?esc(stockError):"ยังไม่มีข้อมูลพอร์ตหุ้น"}</p>`;
    const leads=copyTotals.leads;
    $("copy-rows").innerHTML=leads.slice(0,4).map(lead=>{const action=lead?.assessment?.action||"CHECK";const perf=lead?.performance?.["30D"]?.roi;return `<div class="row"><span class="name">${esc(lead.nickname||lead.portfolioId||"Lead")}</span><span class="data">${esc(action)}</span><span class="data">Lead 30D ${perf==null?"—":`${Number(perf)>0?"+":""}${fmt(perf)}%`}</span></div>`}).join("") || `<p class="fineprint">${copyError?esc(copyError):"ยังไม่มีข้อมูล lead"}</p>`;
    $("stock-asof").textContent=stockMeta?`รายงาน ${stockMeta.latest_date||"—"} · ${stockTotals.count} พอร์ต · หน่วย ${stockTotals.currency||"ไม่ระบุ"}`:"ไม่พบข้อมูล Stock Port";
    $("copy-asof").textContent=copy?.account?.as_of?`Wallet ณ ${displayDate(copy.account.as_of)} · ${leads.length} leads`:"ไม่พบข้อมูล Copy Quant";
    $("stock-value-detail").textContent=stockTotals.total==null?"—":`${fmt(stockTotals.total)} ${stockTotals.currency}`;
    $("stock-pnl").textContent=stockTotals.pnl==null?"—":`${stockTotals.pnl>0?"+":""}${fmt(stockTotals.pnl)} ${stockTotals.currency}`;
    $("stock-count").textContent=stockTotals.holdings==null?"—":fmt(stockTotals.holdings,0);
    $("copy-value-detail").textContent=wallet==null?"—":`${fmt(wallet)} ${walletCcy}`;
    const counts=leads.reduce((a,l)=>{const k=String(l?.assessment?.action||"CHECK").toUpperCase();a[k]=(a[k]||0)+1;return a},{ });
    $("copy-counts").textContent=`${counts.KEEP||0} / ${counts.WATCH||0} / ${counts.EXIT||0}`;
    if (stock && !stockTotals.currency) $("stock-warning").hidden=false;
    if (stock && stockTotals.currency==="หลายสกุล") $("stock-warning").textContent="มีหลายสกุลใน Stock Port จึงไม่แสดงผลรวมย่อยที่บวกสกุลต่างกันโดยตรง" ,$("stock-warning").hidden=false;
    if (copy && !copyTotals.ok) { $("copy-warning").hidden=false; $("copy-warning").textContent="snapshot มี lead ขาดหายหรือสถานะ fetch ไม่ครบ โปรดเปิดรายละเอียดเพื่อตรวจ quality"; }
    if (stockError && copyError) $("overall-warning").hidden=false;
    $("app").hidden=false;
    $("gate").hidden=true;
  }
  async function unlock() {
    const password=$("password").value;
    if(!password)return;
    $("open").disabled=true;$("gate-error").textContent="";$("loader").style.display="block";
    try {
      const [s,c]=await Promise.allSettled([load("./report/"),load("./copytrade/")]);
      const sm=s.status==="fulfilled"?s.value:null, cm=c.status==="fulfilled"?c.value:null;
      let stock=null,copy=null,stockError=null,copyError=null;
      if(sm){try{stock=sm.meta.encrypted?await decrypt(sm.blob,password):sm.blob}catch{stockError="รหัสผ่านไม่ตรงกับข้อมูล Stock Port"}}
      else stockError=s.reason?.message||"โหลดข้อมูล Stock ไม่สำเร็จ";
      if(cm){try{copy=cm.meta.encrypted?await decrypt(cm.blob,password):cm.blob}catch{copyError="รหัสผ่านไม่ตรงกับข้อมูล Copy Quant"}}
      else copyError=c.reason?.message||"โหลดข้อมูล Copy Quant ไม่สำเร็จ";
      if(!stock&&!copy)throw new Error(stockError&&copyError?"รหัสผ่านไม่ถูกต้อง หรือยังไม่มีข้อมูลที่ถอดรหัสได้":"ไม่พบข้อมูลสำหรับแสดงผล");
      sessionPassword=password;
      $("password").value="";
      render({stock,copy,stockError,copyError,stockMeta:sm?.meta,copyMeta:cm?.meta});
      routeFromHash();
    }catch(e){$("gate-error").textContent=e.message||"เปิด dashboard ไม่สำเร็จ"}
    finally{$("loader").style.display="none";$("open").disabled=false}
  }
  document.addEventListener("click", event => {
    const link = event.target.closest("a[data-route]");
    if (!link || !sessionPassword) return;
    event.preventDefault();
    navigate(link.dataset.route);
  });
  window.addEventListener("hashchange", routeFromHash);
  window.addEventListener("popstate", routeFromHash);
  window.addEventListener("message", event => {
    const frame = $("detail-frame");
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === "portfolio-ready") {
      if (sessionPassword) frame.contentWindow.postMessage({type:"portfolio-unlock", password:sessionPassword}, location.origin);
      return;
    }
    if (event.data?.type === "portfolio-route") navigate(event.data.route);
  });
  $("open").addEventListener("click",unlock);$("password").addEventListener("keydown",e=>{if(e.key==="Enter")unlock()});
})();
