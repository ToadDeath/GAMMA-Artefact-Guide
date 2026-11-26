const $=s=>document.querySelector(s);let artifacts=[],recipes=[],translations={},activeFilter="all",compareIds=new Set(),selectedTier="",statMaxima={};
let TIER_NAMES={0:["Atom","Ball","Bat","Beacon","Black Angel","Cell","Chain","Claw","Cocoon","Dragon's Eye","Electron","Fountain","Generator","Grapes","Heart","Knot","Lamp","Lucifer","Medal","Miser's Skull","Moon","Moss","Phantom Star","Sandstone","Scar","Seraphim","Signet","Sourpuss","Spike","Sun","Tapeworm","Thistle"],1:["Battery","Itcher","Jellyfish","Lost Soul","Mama's Beads","Meat Chunk","Nightstar","Soul","Sparkler","Stone Blood","Stone Flower"],2:["Bracelet","Crystal","Empty","Eye","Gravi","Kolobok","Lobster Eyes","Moonlight","Pin","Ring","Shell","Sponge","Wretched"],3:["Black Spray","Bubble","Fireball","Firefly","Flame","Flash","Full Empty","Goldfish","Prometheus","Snowflake"],4:["Compass","Death Lamp","Heart of the Oasis","Volat Emerald"]};
function applyUserTiers(){const byName=new Map();for(const [tier,names] of Object.entries(TIER_NAMES))for(const name of names)byName.set(name.toLowerCase(),Number(tier));for(const a of artifacts){const name=artifactName(a).trim().toLowerCase();a.customTier=byName.has(name)?byName.get(name):null;a.tier=a.customTier;}const ids=new Set(),duplicates=[];for(const a of artifacts){if(ids.has(a.id))duplicates.push(a.id);ids.add(a.id)}const names=new Map();for(const a of artifacts){const n=artifactName(a).trim().toLowerCase();if(n){if(!names.has(n))names.set(n,[]);names.get(n).push(a)}}window.artifactAudit={total:artifacts.length,classified:artifacts.filter(a=>a.tier!==null).length,unclassified:artifacts.filter(a=>a.tier===null),duplicateIds:duplicates,duplicateNames:[...names.values()].filter(group=>group.length>1)};}
const SOURCE_ICONS="https://raw.githubusercontent.com/simonwdev/stalker-anomaly-gamma-db/main/site/public/img/icons/";
const fmt=n=>{const v=Number(n);return Number.isFinite(v)?(Math.abs(v)>=10?Number(v.toFixed(1)).toString():Number(v.toFixed(2)).toString()):String(n??"0")};
const t=k=>k?(translations.en?.[String(k).toLowerCase()]||k):"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const val=a=>a.raw||{};
async function init(){try{const [a,r]=await Promise.all([fetch("data/artifacts.json").then(x=>{if(!x.ok)throw Error("artifact data");return x.json()}),fetch("data/recipes.json").then(x=>x.json())]);artifacts=a.artifacts;TIER_NAMES=a.customTiers||{};artifacts.forEach(a=>a.tier=a.customTier??null);buildStatMaxima();recipes=r.recipes||[];render();loadTranslations()}catch(e){$("#perk-matrix").innerHTML='<div class="loading">DATABASE ERROR - CHECK DATA FILES</div>';console.error(e)}}
async function loadTranslations(){try{const r=await fetch("https://cdn.jsdelivr.net/gh/simonwdev/stalker-anomaly-gamma-db@main/site/public/data/gamma-0.9.5/translations.json");if(!r.ok)throw Error("localization unavailable");translations=await r.json();applyUserTiers();const known=artifacts.filter(a=>a.tier!==null);render();if($("#artifact-dialog").open){const id=$("#dialog-content").dataset.id;const a=artifacts.find(x=>x.id===id);if(a)openProfile(a)}}catch(e){console.warn("English localization could not be loaded; showing source identifiers.",e)}}
function renderTierSummary(){const counts=artifacts.filter(a=>a.tier!==null).reduce((m,a)=>(m[a.tier]=(m[a.tier]||0)+1,m),{});const order=["0","1","2","3","4"];$("#tier-summary").innerHTML='<button class="tier-pill active" data-tier="">ALL TIERS <b>'+Object.values(counts).reduce((a,b)=>a+b,0)+'</b></button>'+order.filter(k=>counts[k]).map(k=>'<button class="tier-pill" data-tier="'+k+'">'+(k==="unclassified"?"UNCLASSIFIED":"TIER "+k)+' <b>'+counts[k]+'</b></button>').join("");document.querySelectorAll(".tier-pill").forEach(b=>b.addEventListener("click",()=>{$("#tier").value=b.dataset.tier;selectedTier=b.dataset.tier;document.querySelectorAll(".tier-pill").forEach(x=>x.classList.toggle("active",x===b));render()}))}
function artifactName(a){return t(a.nameKey)}
function artifactDesc(a){return t(a.descriptionKey).replace(/\\n/g,"\n").replace(/\r\n?/g,"\n").replace(/\n{2,}/g,"\n").trim()}
function perksText(a){return a.perkDescription||t(a.perkKey)}
function matches(a,q){const all=[artifactName(a),a.id,artifactDesc(a),perksText(a),...a.stats.map(s=>s.label+" "+s.value)].join(" ").toLowerCase();return !q||all.includes(q)}
function buildStatMaxima(){
 statMaxima={};
 for(const a of artifacts)for(const s of a.stats||[]){
  const n=Number(s.numeric);
  if(n>0)statMaxima[s.label]=Math.max(statMaxima[s.label]||0,n);
 }
}
function purposeFor(a){
 const positive=a.stats.filter(s=>Number(s.numeric)>0);
 const physical=positive.filter(s=>["Ballistic resistance","Impact resistance","Rupture resistance","Explosive resistance"].includes(s.label));
 const anomaly=positive.filter(s=>["Burn resistance","Electrical resistance","Chemical resistance","Radiation resistance","Psychic resistance"].includes(s.label));
 const recovery=positive.filter(s=>s.group==="Recovery");
 const mobilityUtility=positive.filter(s=>s.group==="Mobility"||s.group==="Utility");
 const scores=[{key:"physical",label:"Physical resistance",stats:physical},{key:"anomaly",label:"Anomaly resistance",stats:anomaly},{key:"recovery",label:"Healing & recovery",stats:recovery},{key:"mobilityUtility",label:"Mobility & utility",stats:mobilityUtility}].map(x=>({...x,score:x.stats.reduce((n,s)=>n+(Math.abs(Number(s.numeric)||0)/(statMaxima[s.label]||Math.abs(Number(s.numeric)||1))),0)})).filter(x=>x.stats.length);
 scores.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 return scores[0]||{key:"other",label:"Other effects",stats:[],score:0};
}
function ingredientArtifactId(name){
 const aliases={"cristall":"af_cristall","cristall flower":"af_cristall_flower","baloon":"af_baloon","gold fish":"af_gold_fish","night star":"af_night_star","oasis heart":"af_oasis_heart","skull miser":"af_skull_miser","spaika":"af_spaika","vyvert":"af_vyvert","fonar":"af_fonar","zhelch":"af_zhelch","ear":"af_ear","electra sparkler":"af_electra_sparkler","electra moonlight":"af_electra_moonlight","electra flash":"af_electra_flash","medusa":"af_medusa","mincer meat":"af_mincer_meat","glass":"af_glass","fire":"af_fire","fire loop":"af_fire_loop","blood":"af_blood","dummy battery":"af_dummy_battery","dummy dummy":"af_dummy_dummy","dummy glassbeads":"af_dummy_glassbeads","fuzz kolobok":"af_fuzz_kolobok","ice":"af_ice"};
 const key=String(name||"").trim().toLowerCase();
 const direct=artifacts.find(x=>x.id.toLowerCase()===key);
 if(direct)return direct.id;
 const named=artifacts.find(x=>artifactName(x).trim().toLowerCase()===key);
 return named?.id||aliases[key]||null;
}
let cachedRecipeEdges=null,recipeAdjacency=null;
function recipeEdges(){
 if(cachedRecipeEdges)return cachedRecipeEdges;
 const edges=[];
 for(const recipe of recipes)for(const ingredient of recipe.ingredients||[]){
  const input=ingredientArtifactId(ingredient.name);
  if(input&&input!==recipe.id)edges.push({from:input,to:recipe.id});
 }
 cachedRecipeEdges=edges;recipeAdjacency=new Map();
 for(const edge of edges)for(const id of [edge.from,edge.to]){
  if(!recipeAdjacency.has(id))recipeAdjacency.set(id,[]);
  recipeAdjacency.get(id).push(edge);
 }
 return edges;
}
function drawRecipeLinks(activeId){
 const board=$("#perk-matrix .tier-board");if(!board)return;
 const svg=board.querySelector(".recipe-links");if(!svg)return;
 if(!activeId){svg.innerHTML="";svg.classList.remove("is-visible");board.querySelectorAll(".artifact-node").forEach(node=>node.classList.remove("route-active","route-related"));return}
 recipeEdges();
 const edges=recipeAdjacency.get(activeId)||[],width=board.scrollWidth,height=board.scrollHeight;
 svg.setAttribute("width",width);svg.setAttribute("height",height);svg.setAttribute("viewBox","0 0 "+width+" "+height);
 const base=board.getBoundingClientRect(),paths=[],related=new Set(),unique=new Set();
 for(const edge of edges){
  const key=edge.from+">"+edge.to;if(unique.has(key))continue;unique.add(key);
  const source=board.querySelector('[data-artifact-id="'+CSS.escape(edge.from)+'"]'),target=board.querySelector('[data-artifact-id="'+CSS.escape(edge.to)+'"]');
  if(!source||!target)continue;
  const sr=source.getBoundingClientRect(),tr=target.getBoundingClientRect();
  const sx=sr.right-base.left+board.scrollLeft,sy=sr.top-base.top+sr.height/2,tx=tr.left-base.left+board.scrollLeft,ty=tr.top-base.top+tr.height/2;
  paths.push('<path class="'+(edge.from===activeId?"is-source":"is-target")+'" d="M '+sx+' '+sy+' L '+tx+' '+ty+'"/>');
  related.add(edge.from);related.add(edge.to);
 }
 board.querySelectorAll(".artifact-node").forEach(node=>{const id=node.dataset.artifactId;node.classList.toggle("route-active",id===activeId);node.classList.toggle("route-related",related.has(id)&&id!==activeId)});
 svg.innerHTML=paths.join("");
 svg.classList.add("is-visible");
}
function renderMatrix(){
 const q=$("#search").value.trim().toLowerCase(),tier=$("#tier").value,purpose=$("#purpose")?.value||"",sort=$("#sort").value;
 const eligible=artifacts.filter(a=>a.tier!==null&&matches(a,q)&&(!tier||String(a.tier)===tier)&&(activeFilter==="all"||(activeFilter==="perk"&&a.perk)||(activeFilter==="craftable"&&a.craftable)||(activeFilter==="junk"&&a.junk)));
 const tier0=eligible.filter(a=>Number(a.tier)===0);
 const items=eligible.filter(a=>Number(a.tier)>=1&&(!purpose||purposeFor(a).key===purpose));
 const categories=[{key:"physical",title:"Physical resistance",note:"Ballistic, impact, rupture and explosive protection"},{key:"anomaly",title:"Anomaly resistance",note:"Burn, electrical, chemical, radiation and psychic protection"},{key:"recovery",title:"Healing & recovery",note:"Health, wound, stamina and radiation recovery"},{key:"mobilityUtility",title:"Mobility & utility",note:"Movement, jump height, carry weight and practical effects"},{key:"other",title:"Other effects",note:"Unusual modifiers that do not fit another category"}];
 const visibleCategories=categories.filter(c=>items.some(a=>purposeFor(a).key===c.key));
 const sortItems=list=>list.sort((a,b)=>sort==="name"?artifactName(a).localeCompare(artifactName(b)):sort==="weight"?a.weight-b.weight:sort==="cost"?a.cost-b.cost:artifactName(a).localeCompare(artifactName(b)));
 const effectMarkup=list=>list.length?'<div class="effect-stack">'+list.map(s=>'<span class="effect-tag '+(Number(s.numeric)<0?"negative":"positive")+'">'+esc(s.label)+' <b>'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</b></span>').join("")+'</div>':"";
 const card=a=>{
  const stats=a.stats.filter(s=>Number(s.numeric)!==0);
  const positives=stats.filter(s=>Number(s.numeric)>0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
  const negatives=stats.filter(s=>Number(s.numeric)<0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
  const perk=a.perkTitle?'<span class="perk-card">'+esc(a.perkTitle)+'</span>':"";
  const value='<span class="artifact-value">'+Number(a.cost||0).toLocaleString("en-US")+' RU</span>';
  const traitGap=positives.length&&negatives.length?'<span class="trait-gap"></span>':"";
  return '<article class="purpose-card artifact-node" data-artifact-id="'+esc(a.id)+'"><button class="purpose-main" data-id="'+esc(a.id)+'"><img loading="lazy" src="'+SOURCE_ICONS+encodeURIComponent(a.id)+'.png" alt=""><span class="purpose-copy"><span class="artifact-title-line"><b>'+esc(artifactName(a))+'</b>'+value+'</span>'+perk+effectMarkup(positives)+traitGap+effectMarkup(negatives)+'</span></button></article>';
 };
 const tier0Cards=sortItems([...tier0]).map(card).join("");
 const tierCounts=[1,2,3,4].map(t=>items.filter(a=>Number(a.tier)===t).length);
 const header='<div class="purpose-label-head"><span>PRIMARY PURPOSE</span><small>FIND BY EFFECT</small></div>'+[1,2,3,4].map((t,i)=>'<div class="tier-column-head"><b>TIER '+t+'</b><span>'+tierCounts[i]+' ARTEFACTS</span></div>').join("");
 const rows=visibleCategories.map(c=>{
  const cells=[1,2,3,4].map(t=>{
   const list=sortItems(items.filter(a=>Number(a.tier)===t&&purposeFor(a).key===c.key));
   return '<div class="purpose-cell" data-purpose="'+c.key+'" data-tier="'+t+'">'+(list.length?list.map(card).join(""):'<span class="tier-empty">-</span>')+'</div>';
  }).join("");
  const count=items.filter(a=>purposeFor(a).key===c.key).length;
  return '<div class="purpose-row-label"><b>'+c.title+'</b><small>'+c.note+'</small><em>'+count+' ARTEFACTS</em></div>'+cells;
 }).join("");
 $("#matrix-count").textContent=eligible.length+" ARTEFACTS";
 $("#perk-matrix").innerHTML='<div class="matrix-layout"><section class="tier0-area"><header><div><b>TIER 0 / SPECIAL ARTEFACTS</b><small>Unique perk artefacts</small></div><span>'+tier0.length+' ARTEFACTS</span></header><div class="tier0-grid">'+(tier0Cards||'<span class="tier-empty">No Tier 0 artefacts match these filters.</span>')+'</div></section><div class="tier-board">'+header+rows+'</div><svg class="recipe-links" aria-hidden="true"></svg></div><p class="crafting-hint">HOVER AN ARTEFACT TO TRACE ITS CRAFTING CONNECTIONS · CLICK IT TO SEE ALL REQUIRED MATERIALS</p>';
 $("#perk-matrix").querySelectorAll(".purpose-main").forEach(b=>{
  b.addEventListener("click",()=>{const a=artifacts.find(x=>x.id===b.dataset.id);if(a)openProfile(a)});
  b.addEventListener("mouseenter",()=>drawRecipeLinks(b.dataset.id));
  b.addEventListener("focus",()=>drawRecipeLinks(b.dataset.id));
  b.addEventListener("mouseleave",()=>drawRecipeLinks(""));
  b.addEventListener("blur",()=>drawRecipeLinks(""));
 });
 drawRecipeLinks("");
}
function statBar(s){const max=100,percent=Math.min(100,Math.abs(s.numeric)/max*100);return '<div class="mini-stat"><span>'+esc(s.label)+'</span><b class="'+(s.numeric<0?"neg":"")+'">'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</b><div class="mini-track"><i class="'+(s.numeric<0?"neg":"")+'" style="width:'+Math.max(percent,3)+'%"></i></div></div>'}
function render(){renderMatrix();renderCompare()}
const groups=[["Protection","Protection"],["Recovery","Recovery"],["Mobility & utility","Mobility","Utility"]];
function statGroupMarkup(a){
 const stats=a.stats.filter(s=>Number(s.numeric)!==0);
 const positives=stats.filter(s=>Number(s.numeric)>0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
 const negatives=stats.filter(s=>Number(s.numeric)<0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
 const lines=list=>list.map(s=>'<div class="stat-line"><span class="name">'+esc(s.label)+'</span><strong class="value '+(s.numeric<0?"neg":"")+'">'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</strong></div>').join("");
 return (positives.length?'<div class="profile-section"><h3>Positive traits</h3><div class="stat-list">'+lines(positives)+'</div></div>':"")+(negatives.length?'<div class="profile-section"><h3>Negative traits</h3><div class="stat-list">'+lines(negatives)+'</div></div>':"");
}
function craftingProfileMarkup(a){
 const required=recipes.find(r=>r.id===a.id);
 const outputs=recipes.filter(r=>(r.ingredients||[]).some(i=>ingredientArtifactId(i.name)===a.id));
 if(!required&&!outputs.length)return "";
 const requiredMarkup=required?'<div class="crafting-profile-group"><h4>Required materials</h4><div class="craft-material-list">'+required.ingredients.map(i=>'<div class="craft-material"><span>'+esc(t(i.name)||i.name)+'</span><b>'+esc(i.amount)+'</b></div>').join("")+'</div></div>':"";
 const outputMarkup=outputs.length?'<div class="crafting-profile-group"><h4>Used to craft</h4><div class="craft-material-list">'+outputs.map(r=>'<div class="craft-material"><span>'+esc(recipeName(r))+'</span><b>OUTPUT</b></div>').join("")+'</div></div>':"";
 return '<div class="profile-section"><h3>Crafting</h3>'+requiredMarkup+outputMarkup+'</div>';
}
function openProfile(a){const dialog=$("#artifact-dialog");$("#dialog-content").dataset.id=a.id;$("#dialog-content").innerHTML='<div class="profile"><div class="profile-hero"><img src="'+SOURCE_ICONS+encodeURIComponent(a.id)+'.png" alt="" onerror="this.style.opacity=0.15"><div><div class="section-kicker">'+(a.tier===null?"UNCLASSIFIED":"TIER "+a.tier)+' / '+esc(a.id.toUpperCase())+'</div><h2>'+esc(artifactName(a))+'</h2><div class="profile-meta">'+fmt(a.weight)+' KG · '+fmt(a.cost)+' RU · RANK '+a.rank+(a.junk?" · JUNK":"")+(a.craftable?" · CRAFTABLE":"")+'</div><p class="profile-desc">'+esc(artifactDesc(a))+'</p></div></div>'+(a.perk?'<div class="profile-section"><div class="profile-perk"><b>'+esc(a.perkTitle||"SPECIAL PERK")+'</b><div class="perk-description">'+esc(perksText(a))+'</div></div></div>':"")+statGroupMarkup(a)+craftingProfileMarkup(a)+'<div class="profile-section"><h3>Field data</h3><div class="stat-list"><div class="stat-line"><span class="name">Jump height</span><strong class="value">'+fmt(a.jumpHeight)+'</strong></div><div class="stat-line"><span class="name">Used in crafting</span><strong class="value">'+(a.usedInCrafting?"YES":"NO")+'</strong></div><div class="stat-line"><span class="name">Can be crafted</span><strong class="value">'+(a.craftable?"YES":"NO")+'</strong></div></div></div><div class="profile-actions"><button class="action-btn '+(compareIds.has(a.id)?"selected":"")+'" id="compare-toggle">'+(compareIds.has(a.id)?"REMOVE FROM COMPARE":"ADD TO COMPARE")+'</button></div><p class="profile-note">Exported GAMMA 0.9.5 values. Resistance and resistance cap are different properties.</p></div>';$("#compare-toggle").addEventListener("click",()=>{toggleCompare(a.id);openProfile(a)});if(!dialog.open)dialog.showModal()}
function toggleCompare(id){if(compareIds.has(id))compareIds.delete(id);else if(compareIds.size<2)compareIds.add(id);else{alert("Compare up to two artifacts at a time.");return}render();renderCompare()}
function renderCompare(){const section=$("#compare");if(compareIds.size===0){section.hidden=true;return}section.hidden=false;const items=[...compareIds].map(id=>artifacts.find(a=>a.id===id)).filter(Boolean);$("#compare-content").innerHTML='<div class="compare-grid">'+items.map(a=>'<div class="compare-item"><h4>'+esc(artifactName(a))+' / '+(a.tier===null?"UNCLASSIFIED":"TIER "+a.tier)+'</h4>'+a.stats.map(s=>'<div class="compare-row"><span>'+esc(s.label)+'</span><b>'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</b></div>').join("")+'<div class="compare-row"><span>Weight</span><b>'+fmt(a.weight)+' kg</b></div><div class="compare-row"><span>Cost</span><b>'+fmt(a.cost)+' RU</b></div></div>').join("")+'</div>'}
const recipeName=r=>t(r.name)||r.name;
function renderRecipes(){const q=$("#recipe-search").value.toLowerCase();const list=recipes.filter(r=>r.name.toLowerCase().includes(q)||r.ingredients.some(i=>(t(i.name)||i.name).toLowerCase().includes(q)));$("#recipe-list").innerHTML=list.map(r=>'<div class="recipe"><strong>'+esc(recipeName(r))+'</strong><small>ARTIFACT MELTER / RECIPE</small><div class="ingredients">'+r.ingredients.map(i=>'<span class="ingredient">'+esc(t(i.name)||i.name)+' '+esc(i.amount)+'</span>').join("")+'</div></div>').join("")||'<div class="empty">NO RECIPES FOUND</div>'}
$("#artifact-dialog").addEventListener("click",e=>{if(e.target===$("#artifact-dialog"))$("#artifact-dialog").close()});$(".dialog-close").addEventListener("click",()=>$("#artifact-dialog").close());$("#clear-compare").addEventListener("click",()=>{compareIds.clear();renderCompare()});["search","tier","sort","purpose"].forEach(id=>$("#"+id).addEventListener(id==="search"?"input":"change",render));document.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===b));activeFilter=b.dataset.filter;render()}));init();