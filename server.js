// Run: node --env-file=.env server.js   (Node 20.6+), then open http://localhost:3000
// No npm install needed: this calls the Gemini REST API directly with fetch.
const http=require("http"),fs=require("fs"),path=require("path");
const KEY=process.env.GEMINI_API_KEY, PORT=process.env.PORT||3000;
let MODEL=process.env.GEMINI_MODEL||"";   // if empty, the newest available Gemini Flash model is picked automatically
const TYPES={".html":"text/html",".js":"text/javascript",".css":"text/css",".csv":"text/csv"};
const SYSTEM="You are the assistant inside the Exchange Rate & Trade Analyzer, a student project on USD-INR and India's trade across sectors. Answer the user's question about the charts and numbers using ONLY the dashboard state JSON for figures (never invent numbers). Explain simply: import costs, export competitiveness, inflation, trade balance, elasticity, J-curve. Under 150 words, plain text. If data_source says Demo, mention figures are approximate when relevant. If the question is unrelated or unanswerable from the data, say so.";
async function pickModel(){
  if(MODEL) return MODEL;
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",{headers:{"x-goog-api-key":KEY}});
  const j=await r.json();
  if(!r.ok) throw new Error("Could not list models: "+((j.error&&j.error.message)||JSON.stringify(j)));
  const all=(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")).map(m=>m.name.replace("models/",""));
  const c=all.filter(n=>/^gemini-[\d.]+-flash(-lite)?$/.test(n));
  if(!c.length) throw new Error("No stable Gemini Flash model for this key. Available: "+all.slice(0,15).join(", ")+". Set GEMINI_MODEL in .env.");
  const v=n=>parseFloat(n.match(/[\d.]+/)[0]);
  c.sort((a,b)=>v(b)-v(a)||(a.endsWith("lite")?1:-1)-(b.endsWith("lite")?1:-1));
  return MODEL=c[0];
}
const json=(res,code,obj)=>res.writeHead(code,{"content-type":"application/json"}).end(JSON.stringify(obj));
http.createServer(async(req,res)=>{
  if(req.method==="POST"&&req.url==="/api/chat"){
    let b="";for await(const c of req)b+=c;
    try{
      if(!KEY) throw new Error("No GEMINI_API_KEY found. Check that .env is in the same folder as server.js and has the line GEMINI_API_KEY=your-key, and start with: node --env-file=.env server.js");
      const {question,state,history=[]}=JSON.parse(b);
      const h=history.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]}));
      while(h.length&&h[0].role!=="user")h.shift();          // Gemini needs the first turn to be the user's
      h.push({role:"user",parts:[{text:"DASHBOARD STATE:\n"+JSON.stringify(state)+"\n\nQUESTION: "+question}]});
      await pickModel();
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:"POST",
        headers:{"content-type":"application/json","x-goog-api-key":KEY},
        body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM}]},contents:h,generationConfig:{maxOutputTokens:1500}})});
      const j=await r.json();
      if(!r.ok) throw new Error((j.error&&j.error.message)||JSON.stringify(j));
      const answer=((j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[]).map(p=>p.text||"").join("").trim();
      if(!answer) throw new Error("Gemini returned an empty reply (finish reason: "+(j.candidates&&j.candidates[0]&&j.candidates[0].finishReason)+")");
      json(res,200,{answer});
    }catch(e){console.error("CHAT ERROR:",e.message);json(res,500,{error:String(e.message).slice(0,300)})}
    return;
  }
  const f=path.join(__dirname,req.url==="/"?"index.html":path.normalize(req.url.split("?")[0]).replace(/^(\.\.[\/\\])+/,""));
  fs.readFile(f,(e,d)=>e?res.writeHead(404).end("Not found"):res.writeHead(200,{"content-type":TYPES[path.extname(f)]||"text/plain"}).end(d));
}).listen(PORT,()=>{console.log("http://localhost:"+PORT+(KEY?"":"  (NO GEMINI_API_KEY found: chat uses built-in answers)"));if(KEY)pickModel().then(m=>console.log("Gemini model in use: "+m)).catch(e=>console.error("MODEL LOOKUP FAILED:",e.message))});
