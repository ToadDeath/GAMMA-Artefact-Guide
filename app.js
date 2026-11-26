const $=s=>document.querySelector(s);let artifacts=[],recipes=[],translations={},activeFilter="all",compareIds=new Set(),selectedTier="";
const TIER_NAMES={0:["Atom","Ball","Bat","Beacon","Black Angel","Cell","Chain","Claw","Cocoon","Dragon's Eye","Electron","Fountain","Generator","Grapes","Heart","Knot","Lamp","Lucifer","Medal","Miser's Skull","Moon","Moss","Phantom Star","Sandstone","Scar","Seraphim","Signet","Sourpuss","Spike","Sun","Tapeworm","Thistle"],1:["Battery","Itcher","Jellyfish","Lost Soul","Mama's Beads","Meat Chunk","Nightstar","Soul","Sparkler","Stone Blood","Stone Flower"],2:["Bracelet","Crystal","Empty","Eye","Gravi","Kolobok","Lobster Eyes","Moonlight","Pin","Ring","Shell","Sponge","Wretched"],3:["Black Spray","Bubble","Fireball","Firefly","Flame","Flash","Full Empty","Goldfish","Prometheus","Snowflake"],4:["Compass","Death Lamp","Heart of the Oasis","Volat Emerald"]};
function applyUserTiers(){const byName=new Map();for(const [tier,names] of Object.entries(TIER_NAMES))for(const name of names)byName.set(name.toLowerCase(),Number(tier));for(const a of artifacts){const name=artifactName(a).trim().toLowerCase();a.customTier=byName.has(name)?byName.get(name):null;a.tier=a.customTier;}const ids=new Set(),duplicates=[];for(const a of artifacts){if(ids.has(a.id))duplicates.push(a.id);ids.add(a.id)}const names=new Map();for(const a of artifacts){const n=artifactName(a).trim().toLowerCase();if(n){if(!names.has(n))names.set(n,[]);names.get(n).push(a)}}window.artifactAudit={total:artifacts.length,classified:artifacts.filter(a=>a.tier!==null).length,unclassified:artifacts.filter(a=>a.tier===null),duplicateIds:duplicates,duplicateNames:[...names.values()].filter(group=>group.length>1)};}
const SOURCE_ICONS="https://raw.githubusercontent.com/simonwdev/stalker-anomaly-gamma-db/main/site/public/img/icons/";
const fmt=n=>{const v=Number(n);return Number.isFinite(v)?(Math.abs(v)>=10?Number(v.toFixed(1)).toString():Number(v.toFixed(2)).toString()):String(n??"0")};
const t=k=>k?(translations.en?.[String(k).toLowerCase()]||k):"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const val=a=>a.raw||{};
async function init(){try{const [a,r]=await Promise.all([fetch("data/artifacts.json").then(x=>{if(!x.ok)throw Error("artifact data");return x.json()}),fetch("data/recipes.json").then(x=>x.json())]);artifacts=a.artifacts;TIER_NAMES=a.customTiers||{};artifacts.forEach(a=>a.tier=a.customTier??null);recipes=r.recipes||[];render();loadTranslations()}catch(e){$("#artifact-grid").innerHTML='<div class="loading">DATABASE ERROR - CHECK DATA FILES</div>';console.error(e)}}
async function loadTranslations(){try{const r=await fetch("https://cdn.jsdelivr.net/gh/simonwdev/stalker-anomaly-gamma-db@main/site/public/data/gamma-0.9.5/translations.json");if(!r.ok)throw Error("localization unavailable");translations=await r.json();applyUserTiers();const known=artifacts.filter(a=>a.tier!==null);render();if($("#artifact-dialog").open){const id=$("#dialog-content").dataset.id;const a=artifacts.find(x=>x.id===id);if(a)openProfile(a)}}catch(e){console.warn("English localization could not be loaded; showing source identifiers.",e)}}
function renderTierSummary(){const counts=artifacts.filter(a=>a.tier!==null).reduce((m,a)=>(m[a.tier]=(m[a.tier]||0)+1,m),{});const order=["0","1","2","3","4"];$("#tier-summary").innerHTML='<button class="tier-pill active" data-tier="">ALL TIERS <b>'+Object.values(counts).reduce((a,b)=>a+b,0)+'</b></button>'+order.filter(k=>counts[k]).map(k=>'<button class="tier-pill" data-tier="'+k+'">'+(k==="unclassified"?"UNCLASSIFIED":"TIER "+k)+' <b>'+counts[k]+'</b></button>').join("");document.querySelectorAll(".tier-pill").forEach(b=>b.addEventListener("click",()=>{$("#tier").value=b.dataset.tier;selectedTier=b.dataset.tier;document.querySelectorAll(".tier-pill").forEach(x=>x.classList.toggle("active",x===b));render()}))}
function artifactName(a){return t(a.nameKey)}
function artifactDesc(a){return t(a.descriptionKey)}
function perksText(a){return t(a.perkKey)}
function matches(a,q){const all=[artifactName(a),a.id,artifactDesc(a),perksText(a),...a.stats.map(s=>s.label+" "+s.value)].join(" ").toLowerCase();return !q||all.includes(q)}
function filtered(){const q=$("#search").value.trim().toLowerCase(),tier=$("#tier").value,sort=$("#sort").value;let out=artifacts.filter(a=>a.tier!==null&&matches(a,q)&&(!tier||String(a.tier)===tier)&&(activeFilter==="all"||(activeFilter==="perk"&&a.perk)||(activeFilter==="craftable"&&a.craftable)||(activeFilter==="junk"&&a.junk)));return out.sort((a,b)=>sort==="name"?artifactName(a).localeCompare(artifactName(b)):sort==="weight"?a.weight-b.weight:sort==="cost"?a.cost-b.cost:a.tier-b.tier||artifactName(a).localeCompare(artifactName(b)))}
function renderMatrix(){
 const q=$("#search").value.trim().toLowerCase();
 const items=artifacts.filter(a=>a.tier!==null&&matches(a,q)&&(!$("#tier").value||String(a.tier)===$("#tier").value)&&(activeFilter==="all"||(activeFilter==="perk"&&a.perk)||(activeFilter==="craftable"&&a.craftable)||(activeFilter==="junk"&&a.junk)));
 const recipeById=new Map(recipes.map(r=>[r.id,r]));
 const recipeByName=new Map(recipes.map(r=>[r.name.toLowerCase(),r]));
 const artifactById=new Map(artifacts.map(a=>[a.id,a]));
 const alias={"cristall":"af_cristall","cristall flower":"af_cristall_flower","baloon":"af_baloon","gold fish":"af_gold_fish","night star":"af_night_star","oasis heart":"af_oasis_heart","skull miser":"af_skull_miser","spaika":"af_spaika","vyvert":"af_vyvert"};
 const recipeInputs=new Map();
 for(const r of recipes){
   const deps=[];
   for(const ing of r.ingredients){
     const key=ing.name.toLowerCase();
     const linked=recipeByName.get(key);
     const id=linked?.id||alias[key];
     if(id&&artifactById.has(id)&&items.some(a=>a.id===id)) deps.push({id,name:ing.name,amount:ing.amount});
   }
   recipeInputs.set(r.id,deps);
 }
 const depthMemo=new Map();
 function depth(id,stack=new Set()){
   if(depthMemo.has(id))return depthMemo.get(id);
   if(stack.has(id))return 0;
   const next=new Set(stack);next.add(id);
   const deps=recipeInputs.get(id)||[];
   const value=deps.length?1+Math.max(...deps.map(d=>depth(d.id,next))):0;
   depthMemo.set(id,value);return value;
 }
 const stages=new Map();
 for(const a of items){const d=depth(a.id);if(!stages.has(d))stages.set(d,[]);stages.get(d).push(a);}
 const ordered=[...stages.keys()].sort((a,b)=>a-b);
 const stageHtml=ordered.map((d,index)=>{
   const cards=stages.get(d).sort((a,b)=>artifactName(a).localeCompare(artifactName(b))).map(a=>{
     const recipe=recipeById.get(a.id),deps=recipeInputs.get(a.id)||[];
     const ingredients=recipe?'<div class="craft-inputs"><small>CRAFTED FROM</small>'+recipe.ingredients.map(i=>'<span>'+esc(i.amount)+' '+esc(i.name)+'</span>').join('')+'</div>':'<div class="craft-inputs natural"><small>PROGRESSION</small><span>Found / acquired in the Zone</span></div>';
     const effects=a.stats.length?a.stats.map(s=>'<i>'+esc(s.label)+' <strong class="'+(s.numeric<0?'neg':'')+'">'+(s.numeric>0?'+':'')+fmt(s.numeric)+esc(s.unit)+'</strong></i>').join(''):'<i>No listed modifiers</i>';
     return '<button class="progression-node '+(d===0?'base-node':'crafted-node')+'" data-id="'+esc(a.id)+'"><span class="node-top"><b>'+esc(artifactName(a))+'</b><em>TIER '+a.tier+'</em></span><img loading="lazy" src="'+SOURCE_ICONS+encodeURIComponent(a.id)+'.png" alt=""><span class="node-effects">'+effects+'</span>'+ingredients+'</button>';
   }).join('');
   return '<section class="progression-stage"><header><span>STAGE '+String(index+1).padStart(2,'0')+'</span><h3>'+(d===0?'Base artefacts':'Crafting step '+d)+'</h3><small>'+cards.length+' ARTEFACTS</small></header><div class="progression-nodes">'+cards+'</div></section>';
 }).join('');
 $("#matrix-count").textContent=items.length+' ARTEFACTS';
 $("#perk-matrix").innerHTML=stageHtml||'<div class="empty">NO MATCHES FOUND.</div>';
 $("#perk-matrix").querySelectorAll(".progression-node").forEach(b=>b.addEventListener("click",()=>{const a=artifacts.find(x=>x.id===b.dataset.id);if(a)openProfile(a)}));
}
function statBar(s){const max=100,percent=Math.min(100,Math.abs(s.numeric)/max*100);return '<div class="mini-stat"><span>'+esc(s.label)+'</span><b class="'+(s.numeric<0?"neg":"")+'">'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</b><div class="mini-track"><i class="'+(s.numeric<0?"neg":"")+'" style="width:'+Math.max(percent,3)+'%"></i></div></div>'}
function render(){renderMatrix();renderCompare()}
const groups=[["Protection","Protection"],["Recovery","Recovery"],["Mobility & utility","Mobility","Utility"],["Resistance caps","Resistance caps"]];
function statGroupMarkup(a){return groups.map(([title,...g])=>{const stats=a.stats.filter(s=>g.includes(s.group));if(!stats.length)return "";return '<div class="profile-section"><h3>'+title+'</h3><div class="stat-list">'+stats.map(s=>'<div class="stat-line"><span class="name">'+esc(s.label)+'</span><strong class="value '+(s.numeric<0?"neg":"")+'">'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</strong></div>').join("")+'</div></div>'}).join("")}
function openProfile(a){const dialog=$("#artifact-dialog");$("#dialog-content").dataset.id=a.id;$("#dialog-content").innerHTML='<div class="profile"><div class="profile-hero"><img src="'+SOURCE_ICONS+encodeURIComponent(a.id)+'.png" alt="" onerror="this.style.opacity=0.15"><div><div class="section-kicker">'+(a.tier===null?"UNCLASSIFIED":"TIER "+a.tier)+' / '+esc(a.id.toUpperCase())+'</div><h2>'+esc(artifactName(a))+'</h2><div class="profile-meta">'+fmt(a.weight)+' KG · '+fmt(a.cost)+' RU · RANK '+a.rank+(a.junk?" · JUNK":"")+(a.craftable?" · CRAFTABLE":"")+'</div><p class="profile-desc">'+esc(artifactDesc(a))+'</p></div></div>'+(a.perk?'<div class="profile-section"><div class="profile-perk"><b>SPECIAL PERK</b>'+esc(perksText(a))+'</div></div>':'')+statGroupMarkup(a)+'<div class="profile-section"><h3>Field data</h3><div class="stat-list"><div class="stat-line"><span class="name">Jump height</span><strong class="value">'+fmt(a.jumpHeight)+'</strong></div><div class="stat-line"><span class="name">Used in crafting</span><strong class="value">'+(a.usedInCrafting?"YES":"NO")+'</strong></div><div class="stat-line"><span class="name">Can be crafted</span><strong class="value">'+(a.craftable?"YES":"NO")+'</strong></div></div></div><div class="profile-actions"><button class="action-btn '+(compareIds.has(a.id)?"selected":"")+'" id="compare-toggle">'+(compareIds.has(a.id)?"REMOVE FROM COMPARE":"ADD TO COMPARE")+'</button></div><p class="profile-note">Exported GAMMA 0.9.5 values. Resistance and resistance cap are different properties.</p></div>';$("#compare-toggle").addEventListener("click",()=>{toggleCompare(a.id);openProfile(a)});if(!dialog.open)dialog.showModal()}
function toggleCompare(id){if(compareIds.has(id))compareIds.delete(id);else if(compareIds.size<2)compareIds.add(id);else{alert("Compare up to two artifacts at a time.");return}render();renderCompare()}
function renderCompare(){const section=$("#compare");if(compareIds.size===0){section.hidden=true;return}section.hidden=false;const items=[...compareIds].map(id=>artifacts.find(a=>a.id===id)).filter(Boolean);$("#compare-content").innerHTML='<div class="compare-grid">'+items.map(a=>'<div class="compare-item"><h4>'+esc(artifactName(a))+' / '+(a.tier===null?"UNCLASSIFIED":"TIER "+a.tier)+'</h4>'+a.stats.map(s=>'<div class="compare-row"><span>'+esc(s.label)+'</span><b>'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</b></div>').join("")+'<div class="compare-row"><span>Weight</span><b>'+fmt(a.weight)+' kg</b></div><div class="compare-row"><span>Cost</span><b>'+fmt(a.cost)+' RU</b></div></div>').join("")+'</div>'}
const recipeName=r=>t(r.name)||r.name;
function renderRecipes(){const q=$("#recipe-search").value.toLowerCase();const list=recipes.filter(r=>r.name.toLowerCase().includes(q)||r.ingredients.some(i=>(t(i.name)||i.name).toLowerCase().includes(q)));$("#recipe-list").innerHTML=list.map(r=>'<div class="recipe"><strong>'+esc(recipeName(r))+'</strong><small>ARTIFACT MELTER / RECIPE</small><div class="ingredients">'+r.ingredients.map(i=>'<span class="ingredient">'+esc(t(i.name)||i.name)+' '+esc(i.amount)+'</span>').join("")+'</div></div>').join("")||'<div class="empty">NO RECIPES FOUND</div>'}
$("#artifact-dialog").addEventListener("click",e=>{if(e.target===$("#artifact-dialog"))$("#artifact-dialog").close()});$(".dialog-close").addEventListener("click",()=>$("#artifact-dialog").close());$("#clear-compare").addEventListener("click",()=>{compareIds.clear();renderCompare()});["search","tier","sort"].forEach(id=>$("#"+id).addEventListener(id==="search"?"input":"change",render));document.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===b));activeFilter=b.dataset.filter;render()}));init();