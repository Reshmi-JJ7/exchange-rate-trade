let ROWS=[], SRC="";
const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>n.toLocaleString("en-IN",{minimumFractionDigits:d,maximumFractionDigits:d});
const tc=bn=>bn/10;                       // ₹ billion -> ₹ thousand crore
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const years=()=>[...new Set(ROWS.map(r=>r.year))].sort((a,b)=>a-b);
const rateOf=y=>ROWS.find(r=>r.year==y).rate;
const sel=()=>[...document.querySelectorAll(".sec:checked")].map(c=>c.value);
const get=(y,k)=>ROWS.find(r=>r.year==y&&r.sector==k)||{imp:0,exp:0};
const tot=(y,f)=>sel().reduce((s,k)=>s+get(y,k)[f],0);
const name=k=>SECTOR_NAMES[k]||k;

function loadCSV(text,label){
  const r=Papa.parse(text,{header:true,dynamicTyping:true,skipEmptyLines:true,transformHeader:h=>h.trim().toLowerCase()});
  const need=["year","usd_inr","sector","imports","exports"], miss=need.filter(c=>!(r.meta.fields||[]).includes(c));
  if(miss.length) return "Missing columns: "+miss.join(", ");
  const rows=r.data.filter(x=>need.every(c=>x[c]!==null&&x[c]!=="")&&[x.year,x.usd_inr,x.imports,x.exports].every(Number.isFinite))
    .map(x=>({year:x.year,rate:x.usd_inr,sector:String(x.sector).trim(),imp:x.imports,exp:x.exports}));
  if(new Set(rows.map(x=>x.year)).size<2) return "Need at least 2 years of complete rows.";
  ROWS=rows; SRC=label;
  const ks=[...new Set(rows.map(x=>x.sector))];
  $("secs").innerHTML=ks.map(k=>`<label><input type="checkbox" class="sec" value="${k}" checked> ${name(k)}</label>`).join("");
  document.querySelectorAll(".sec").forEach(c=>c.onchange=render);
  const ys=years(); ["base","cmp"].forEach(id=>$(id).innerHTML=ys.map(y=>`<option>${y}</option>`).join(""));
  $("base").value=ys[ys.length-1]; $("cmp").value=ys[0]; setRate(rateOf($("base").value));
  $("srcBadge").textContent=label; $("srcBadge").className="badge"+(label.startsWith("Demo")?"":" real");
  return "";
}
function calc(rate,y){
  const base=rateOf(y), imp=tot(y,"imp"), exp=tot(y,"exp");
  return {base,rate,imp,exp,chg:(rate-base)/base*100,impB:imp*base,expB:exp*base,impN:imp*rate,expN:exp*rate,balB:(exp-imp)*base,balN:(exp-imp)*rate};
}
const charts={};
function mk(id,cfg){charts[id]&&charts[id].destroy();charts[id]=new Chart($(id),cfg)}
const ax=(extra={})=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:css("--ink")}}},scales:{x:{ticks:{color:css("--mut")},grid:{color:css("--line")}},y:{ticks:{color:css("--mut")},grid:{color:css("--line")}}},...extra});
const money=v=>(v>=0?"+":"−")+"₹"+fmt(Math.abs(tc(v)))+" k Cr";

function render(){
  if(!ROWS.length) return;
  const rate=+$("rate").value, by=$("base").value, cy=$("cmp").value, c=calc(rate,by), ys=years(), ks=sel();
  $("rateVal").textContent="₹"+fmt(rate);
  const cls=v=>v>0?"up":v<0?"dn":"";
  $("kpis").innerHTML=
   `<div class="kpi"><small>Rate vs ${by} (₹${fmt(c.base)})</small><b class="${cls(c.chg)}">${c.chg>0?"+":""}${fmt(c.chg)}%</b><small>${c.chg>0?"Rupee weaker":c.chg<0?"Rupee stronger":"No change"}</small></div>
    <div class="kpi"><small>Import bill</small><b>₹${fmt(tc(c.impN))} k Cr</b><small class="${cls(c.chg)}">${money(c.impN-c.impB)} vs baseline</small></div>
    <div class="kpi"><small>Export revenue</small><b>₹${fmt(tc(c.expN))} k Cr</b><small class="${c.chg>0?"pos":"neg"}">${money(c.expN-c.expB)} vs baseline</small></div>
    <div class="kpi"><small>Trade balance</small><b class="${c.balN>=0?"pos":"neg"}">${money(c.balN)}</b><small>${c.balN>=0?"Surplus":"Deficit"} (baseline ${money(c.balB)})</small></div>`;

  mk("cTrend",{type:"line",data:{labels:ys,datasets:[{label:"USD-INR",data:ys.map(rateOf),borderColor:css("--acc"),tension:.25},{label:"Target",data:ys.map(()=>rate),borderColor:css("--bad"),borderDash:[6,4],pointRadius:0}]},options:ax()});
  const bals=ys.map(y=>tc((tot(y,"exp")-tot(y,"imp"))*rate));
  mk("cBal",{type:"bar",data:{labels:ys,datasets:[{data:bals,backgroundColor:bals.map(v=>v>=0?css("--good"):css("--bad"))}]},options:ax({plugins:{legend:{display:false}}})});

  const secBal=ks.map(k=>tc((get(by,k).exp-get(by,k).imp)*rate));
  $("tSec").textContent=`Net balance by sector, ${by} volumes at ₹${fmt(rate)} (₹ thousand crore)`;
  mk("cSec",{type:"bar",data:{labels:ks.map(name),datasets:[{data:secBal,backgroundColor:secBal.map(v=>v>=0?css("--good"):css("--bad"))}]},options:ax({indexAxis:"y",plugins:{legend:{display:false}}})});

  const t=(y,f)=>tc(tot(y,f)*rateOf(y));
  $("tCmp").textContent=`${cy} vs ${by}: actual rupee values (₹ thousand crore)`;
  mk("cCmp",{type:"bar",data:{labels:["Imports","Exports","Net balance"],datasets:[
    {label:`${cy} (₹${fmt(rateOf(cy))})`,data:[t(cy,"imp"),t(cy,"exp"),t(cy,"exp")-t(cy,"imp")],backgroundColor:css("--mut")},
    {label:`${by} (₹${fmt(rateOf(by))})`,data:[t(by,"imp"),t(by,"exp"),t(by,"exp")-t(by,"imp")],backgroundColor:css("--acc")}]},options:ax()});

  const f=v=>fmt(tc(v));
  $("secTable").innerHTML="<tr><th>Sector</th><th>Imports</th><th>Exports</th><th>Balance</th><th>Balance vs baseline</th></tr>"+
   ks.map(k=>{const g=get(by,k),b=(g.exp-g.imp)*rate,b0=(g.exp-g.imp)*c.base;return `<tr><td>${name(k)}</td><td>${f(g.imp*rate)}</td><td>${f(g.exp*rate)}</td><td class="${b>=0?"pos":"neg"}">${f(b)}</td><td>${money(b-b0)}</td></tr>`}).join("");
  const d=calc(c.base*1.1,by), a=calc(c.base*0.9,by), row=(n,fn)=>`<tr><td>${n}</td><td>${fn(d)}</td><td>${fn(a)}</td></tr>`;
  $("scen").innerHTML=`<tr><th></th><th>Depreciates 10% (₹${fmt(c.base*1.1)})</th><th>Appreciates 10% (₹${fmt(c.base*0.9)})</th></tr>`+
   row("Import bill",x=>"₹"+f(x.impN)+" k Cr")+row("Export revenue",x=>"₹"+f(x.expN)+" k Cr")+row("Trade balance",x=>`<span class="${x.balN>=0?"pos":"neg"}">${money(x.balN)}</span>`)+row("Change in balance",x=>money(x.balN-x.balB));
}
function setRate(v){v=Math.max(40,Math.min(150,+v));$("rate").value=v;$("rateNum").value=v.toFixed(1);render()}
$("rate").oninput=e=>setRate(e.target.value); $("rateNum").onchange=e=>setRate(e.target.value);
$("base").onchange=()=>setRate(rateOf($("base").value)); $("cmp").onchange=render;
$("bDep").onclick=()=>setRate(rateOf($("base").value)*1.1); $("bApp").onclick=()=>setRate(rateOf($("base").value)*0.9); $("bReset").onclick=()=>setRate(rateOf($("base").value));
$("all").onclick=()=>{document.querySelectorAll(".sec").forEach(c=>c.checked=true);render()}; $("none").onclick=()=>{document.querySelectorAll(".sec").forEach(c=>c.checked=false);render()};
$("csv").onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{const err=loadCSV(t,"Your CSV: "+f.name);$("csvMsg").textContent=err||"Loaded "+f.name})};

// ---------- Chatbot ----------
function snapshot(){
  const rate=+$("rate").value, by=$("base").value, c=calc(rate,by);
  return {data_source:SRC,data_notes:DATA_NOTES,units:"trade in US$ billion; INR values in ₹ billion (10 = ₹1 thousand crore)",sectors:sel().map(name),baseline_year:by,baseline_rate:c.base,target_rate:rate,rate_change_pct:+c.chg.toFixed(2),compare_year:$("cmp").value,
    baseline:{imports:+c.impB.toFixed(1),exports:+c.expB.toFixed(1),balance:+c.balB.toFixed(1)},at_target:{imports:+c.impN.toFixed(1),exports:+c.expN.toFixed(1),balance:+c.balN.toFixed(1)},
    by_sector:sel().map(k=>({sector:name(k),imports_usd:get(by,k).imp,exports_usd:get(by,k).exp})),yearly_usd_inr:Object.fromEntries(years().map(y=>[y,rateOf(y)]))};
}
function localAnswer(q){   // used when the Node server / API key is not available
  const s=snapshot(), up=s.rate_change_pct>0, w=up?"weaker":"stronger";
  if(/j-?curve/i.test(q)) return "J-curve: after a depreciation the trade balance often gets worse first, because import bills rise at once while export and import volumes adjust slowly. Later, volumes respond and the balance can improve. This tool holds volumes constant, so it shows only the first effect.";
  if(/elastic/i.test(q)) return "Elasticity shows how much demand reacts to price. Crude oil is inelastic, so a weaker rupee mostly raises the bill. Discretionary goods react more. IT services are billed in dollars, so a weaker rupee mainly raises their rupee earnings.";
  if(/deficit|surplus/i.test(q)) return "Trade balance = exports − imports. Negative is a deficit (red bars), positive is a surplus (green bars). At the target rate the selected sectors show a "+(s.at_target.balance>=0?"surplus":"deficit")+" of ₹"+fmt(Math.abs(s.at_target.balance)/10)+" thousand crore.";
  return `At ₹${fmt(s.target_rate)} the rupee is ${fmt(Math.abs(s.rate_change_pct))}% ${w} than in ${s.baseline_year}. Imports for the selected sectors cost ₹${fmt(s.at_target.imports/10)} k Cr (was ₹${fmt(s.baseline.imports/10)}), exports earn ₹${fmt(s.at_target.exports/10)} k Cr, and the balance is ₹${fmt(s.at_target.balance/10)} k Cr. A ${w} rupee ${up?"makes imports costlier and exports more competitive":"makes imports cheaper and exports less competitive"}. (Start server.js with an API key for full AI answers.)`;
}
const hist=[]; let busy=false;
["Why did the import bill change?","What does the trade balance chart show?","Which sector is hit most by a weaker rupee?","What is the J-curve?"].forEach(t=>{const b=document.createElement("button");b.textContent=t;b.onclick=()=>ask(t);$("chips").appendChild(b)});
function addMsg(cls,t){const d=document.createElement("div");d.className="msg "+cls;d.textContent=t;$("chat").appendChild(d);$("chat").scrollTop=1e9;return d}
const SECS=[["breakdown",/breakdown/i,"Sector breakdown"],["scenarios",/scenario/i,"Scenarios"],["yearly",/balance by year|yearly/i,"Trade balance by year"],["sectors",/sector (chart|graph)|net balance by sector/i,"Sector chart"],["comparison",/compar/i,"Comparison"],["trend",/trend|usd-?inr chart/i,"USD-INR trend"],["inputs",/\binputs?\b|controls/i,"Inputs"],["kpis",/overview|kpi|key numbers/i,"Overview"],["data",/\bdata\b|csv|upload/i,"Data"]];
function goTo(q){   // "go to comparison", "sector breakdown at target rate" etc. scroll to that section
  const verb=/^\s*(go to|take me to|show me|open|jump to|navigate to|scroll to|where is)\b/i.test(q);
  const short=q.split(/\s+/).length<=10&&!/^\s*(what|why|how|which|when|who|explain|is|does|do|can)\b/i.test(q);
  if(!verb&&!short) return false;
  const s=SECS.find(x=>x[1].test(q)); if(!s) return false;
  $(s[0]).scrollIntoView({behavior:"smooth"}); return s[2];
}
async function ask(q){
  q=q.trim(); if(!q||busy) return; $("q").value=""; addMsg("me",q); const nv=goTo(q); if(nv){addMsg("bot","Taking you to: "+nv);if(innerWidth<700)setTimeout(()=>chatOpen(false),900);return} busy=true; const out=addMsg("bot","Thinking…");
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q,state:snapshot(),history:hist.slice(-6)})});
    if(!r.ok) throw new Error("server"); const j=await r.json(); out.textContent=j.answer;
    hist.push({role:"user",content:q},{role:"assistant",content:j.answer});
  }catch(e){ out.textContent=localAnswer(q); }
  busy=false;
}
$("send").onclick=()=>ask($("q").value); $("q").onkeydown=e=>{if(e.key==="Enter")ask($("q").value)};

loadCSV(REAL_CSV,"Real data: MoC TradeStat, RBI, World Bank (FY2018 to FY2025)");

// ---------- highlight the nav link of the section on screen ----------
const links=[...document.querySelectorAll(".links a")];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(l=>l.classList.toggle("on",l.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-30% 0px -60% 0px"});
links.forEach(l=>{const t=document.querySelector(l.getAttribute("href"));if(t)io.observe(t)});

// ---------- floating chat button ----------
function chatOpen(o){$("chatPanel").hidden=!o;if(o)$("q").focus()}
$("fab").onclick=()=>chatOpen($("chatPanel").hidden);
$("closeChat").onclick=()=>chatOpen(false);
document.addEventListener("keydown",e=>{if(e.key==="Escape")chatOpen(false)});
