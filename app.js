const $=s=>document.querySelector(s);let artifacts=[],recipes=[],translations={},compareIds=new Set(),statMaxima={};
let TIER_NAMES={0:["Atom","Ball","Bat","Beacon","Black Angel","Cell","Chain","Claw","Cocoon","Dragon's Eye","Electron","Fountain","Generator","Grapes","Heart","Knot","Lamp","Lucifer","Medal","Miser's Skull","Moon","Moss","Phantom Star","Sandstone","Scar","Seraphim","Signet","Sourpuss","Spike","Sun","Tapeworm","Thistle"],1:["Battery","Itcher","Jellyfish","Lost Soul","Mama's Beads","Meat Chunk","Nightstar","Soul","Sparkler","Stone Blood","Stone Flower"],2:["Bracelet","Crystal","Empty","Eye","Gravi","Kolobok","Lobster Eyes","Moonlight","Pin","Ring","Shell","Sponge","Wrenched"],3:["Black Spray","Bubble","Fireball","Firefly","Flame","Flash","Full Empty","Goldfish","Prometheus","Snowflake"],4:["Compass","Death Lamp","Heart of the Oasis","Volat Emerald"]};
function applyUserTiers(){const byName=new Map();for(const [tier,names] of Object.entries(TIER_NAMES))for(const name of names)byName.set(name.toLowerCase(),Number(tier));for(const a of artifacts){const name=artifactName(a).trim().toLowerCase();a.customTier=byName.has(name)?byName.get(name):null;a.tier=a.customTier;}const ids=new Set(),duplicates=[];for(const a of artifacts){if(ids.has(a.id))duplicates.push(a.id);ids.add(a.id)}const names=new Map();for(const a of artifacts){const n=artifactName(a).trim().toLowerCase();if(n){if(!names.has(n))names.set(n,[]);names.get(n).push(a)}}window.artifactAudit={total:artifacts.length,classified:artifacts.filter(a=>a.tier!==null).length,unclassified:artifacts.filter(a=>a.tier===null),duplicateIds:duplicates,duplicateNames:[...names.values()].filter(group=>group.length>1)};}
const SOURCE_ICONS="https://raw.githubusercontent.com/simonwdev/stalker-anomaly-gamma-db/main/site/public/img/icons/";
const LOCAL_ARTIFACT_ICONS=new Set(["atom","ball","bat","battery","beacon","black_angel","black_spray","bracelet","bubble","cell","chain","claw","cocoon","compass","crystal","death_lamp","dragon_eye","electron","empty","eye","fireball","firefly","flame","flash","fountain","full_empty","generator","goldfish","grapes","gravi","heart","heart_of_the_oasis","itcher","jellyfish","knot","kolobok","lamp","lobster_eyes","lost_soul","lucifer","mama_beads","meat_chunk","medal","miser_skull","moon","moonlight","moss","nightstar","phantom_star","pin","prometheus","ring","sandstone","scar","seraphim","shell","signet","snowflake","soul","sourpuss","sparkler","spike","sponge","stone_blood","stone_flower","sun","tapeworm","thistle","volat_emerald","wrenched"]);
function artifactIcon(a){let slug=artifactName(a).toLowerCase().replace(/['’]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");slug=({dragons_eye:"dragon_eye",mamas_beads:"mama_beads",misers_skull:"miser_skull"})[slug]||slug;if(LOCAL_ARTIFACT_ICONS.has(slug))return "assets/artifacts/af_"+slug+".png";return SOURCE_ICONS+encodeURIComponent(a.id)+".png";}
const fmt=n=>{const v=Number(n);return Number.isFinite(v)?(Math.abs(v)>=10?Number(v.toFixed(1)).toString():Number(v.toFixed(2)).toString()):String(n??"0")};
const isVisibleStat=s=>!/jump/i.test(String(s.label||""));
const t=k=>k?(translations.en?.[String(k).toLowerCase()]||k):"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const val=a=>a.raw||{};
async function init(){try{const [a,r]=await Promise.all([fetch("data/artifacts.json").then(x=>{if(!x.ok)throw Error("artifact data");return x.json()}),fetch("data/recipes.json").then(x=>x.json())]);artifacts=a.artifacts;TIER_NAMES=a.customTiers||{};artifacts.forEach(a=>a.tier=a.customTier??null);buildStatMaxima();recipes=r.recipes||[];if(document.body.dataset.page==="crafting-tree")renderCraftingTree();else{renderAttributeOptions();render()}loadTranslations()}catch(e){$("#perk-matrix").innerHTML='<div class="loading">DATABASE ERROR - CHECK DATA FILES</div>';console.error(e)}}
async function loadTranslations(){
 const sources=[
  "https://cdn.jsdelivr.net/gh/simonwdev/stalker-anomaly-gamma-db@main/site/public/data/gamma-0.9.5/translations.json",
  "https://raw.githubusercontent.com/simonwdev/stalker-anomaly-gamma-db/main/site/public/data/gamma-0.9.5/translations.json"
 ];
 let lastError;
 for(const url of sources){
  try{
   const response=await fetch(url);
   if(!response.ok)throw Error("Localization request failed: "+response.status);
   translations=await response.json();
   applyUserTiers();
   render();
   if($("#artifact-dialog")?.open){
    const id=$("#dialog-content")?.dataset.id;
    const artifact=artifacts.find(x=>x.id===id);
    if(artifact)openProfile(artifact);
   }
   return;
  }catch(error){lastError=error;console.warn("Translation source unavailable:",url,error)}
 }
 console.error("Artefact guide could not load its English translations.",lastError);
 const target=$("#perk-matrix")||$("#crafting-tree-content");
 if(target)target.innerHTML='<div class="loading">COULD NOT LOAD ARTEFACT NAMES. PLEASE REFRESH THE PAGE.</div>';
}
function artifactName(a){return a.displayName||t(a.nameKey)}
function artifactDesc(a){return a.descriptionOverride||t(a.descriptionKey).replace(/\\n/g,"\n").replace(/\r\n?/g,"\n").replace(/\n{2,}/g,"\n").trim()}
function perksText(a){return a.perkDescription||t(a.perkKey)}
function matches(a,q){const all=[artifactName(a),a.id,artifactDesc(a),perksText(a),...a.stats.map(s=>s.label+" "+s.value)].join(" ").toLowerCase();return !q||all.includes(q)}
function buildStatMaxima(){
 statMaxima={};
 for(const a of artifacts)for(const s of a.stats||[]){
  const n=Number(s.numeric);
  if(n>0)statMaxima[s.label]=Math.max(statMaxima[s.label]||0,n);
 }
}
function renderAttributeOptions(){
 const select=$("#attribute");if(!select)return;
 const selected=select.value;
 const labels=[...new Set(artifacts.flatMap(a=>(a.stats||[]).filter(s=>Number(s.numeric)>0).map(s=>s.label)))].sort((a,b)=>a.localeCompare(b));
 select.innerHTML='<option value="">All attributes</option>'+labels.map(label=>'<option value="'+esc(label)+'">'+esc(label)+'</option>').join("");
 if(labels.includes(selected))select.value=selected;
}
function purposeScores(a){
 const positive=a.stats.filter(s=>Number(s.numeric)>0);
 const combat=positive.filter(s=>["Ballistic resistance","Impact resistance","Explosive resistance"].includes(s.label));
 const mutant=positive.filter(s=>["Rupture resistance","Psychic resistance"].includes(s.label));
 const anomaly=positive.filter(s=>["Burn resistance","Electrical resistance","Chemical resistance","Radiation resistance"].includes(s.label));
 const recovery=positive.filter(s=>s.group==="Recovery");
 return [
  {key:"combat",label:"Combat Defense",stats:combat},
  {key:"mutant",label:"Mutant Defense",stats:mutant},
  {key:"anomaly",label:"Anomaly Defense",stats:anomaly},
  {key:"recovery",label:"Health & Recovery",stats:recovery}
 ]
  .map(x=>({...x,score:x.stats.reduce((n,s)=>n+(Math.abs(Number(s.numeric)||0)/(statMaxima[s.label]||Math.abs(Number(s.numeric)||1))),0)}))
  .filter(x=>x.stats.length);
}
let downstreamPurposeCache=null;
function downstreamPurposeMap(){
 if(downstreamPurposeCache)return downstreamPurposeCache;
 const byId=new Map(artifacts.map(a=>[a.id,a]));
 const outputs=new Map(artifacts.map(a=>[a.id,[]]));
 for(const recipe of recipes)for(const ingredient of recipe.ingredients||[]){
  const id=ingredient.artifactId||ingredientArtifactId(ingredient.name);
  if(id&&outputs.has(id)&&byId.has(recipe.id))outputs.get(id).push(recipe.id);
 }
 const result=new Map();
 for(const a of artifacts){
  const own=purposeScores(a).sort((x,y)=>y.score-x.score);
  if(own.length<2||own[1].score<own[0].score*.8)continue;
  const queue=(outputs.get(a.id)||[]).map(id=>({id,depth:1}));
  const visited=new Set([a.id]),votes={combat:0,mutant:0,anomaly:0,recovery:0};
  while(queue.length){
   const {id,depth}=queue.shift();
   if(visited.has(id)||depth>4)continue;
   visited.add(id);
   const next=byId.get(id);if(!next)continue;
   const scores=purposeScores(next).sort((x,y)=>y.score-x.score);
   if(scores.length&&(!scores[1]||scores[0].score>=scores[1].score*1.2)){
    votes[scores[0].key]+=1/depth;
   }else{
    for(const outputId of outputs.get(id)||[])queue.push({id:outputId,depth:depth+1});
   }
  }
  const ranked=Object.entries(votes).sort((x,y)=>y[1]-x[1]);
  const total=ranked.reduce((n,x)=>n+x[1],0);
  if(total>0&&ranked[0][1]/total>=.75&&ranked[0][1]>ranked[1][1]){
   result.set(a.id,ranked[0][0]);
  }
 }
 downstreamPurposeCache=result;
 return result;
}
function purposeFor(a){
 const scores=purposeScores(a).sort((x,y)=>y.score-x.score||x.key.localeCompare(y.key));
 if(!scores.length)return {key:"other",label:"Other effects",stats:[],score:0};
 const downstream=downstreamPurposeMap().get(a.id);
 if(downstream&&scores.length>1&&scores[1].score>=scores[0].score*.8){
  const chosen=scores.find(x=>x.key===downstream);
  if(chosen)return chosen;
 }
 return scores[0];
}

const MUTANT_PART_ICONS={
  "Boar Leg": "boar_leg",
  "Burer Brain": "burer_brain",
  "Burer Hand": "burer_hand",
  "Cat Claw": "cat_claw",
  "Cat Tail": "cat_tail",
  "Cat Thyroid": "cat_thyroid",
  "Chimera Claw": "chimera_claw",
  "Chimera Horn": "chimera_horn",
  "Chimera Meat": "chimera_meat",
  "Controller Hand": "controller_hand",
  "Dog Heart": "dog_heart",
  "Dog Liver": "dog_liver",
  "Dog Meat": "dog_meat",
  "Dog Tail": "dog_tail",
  "Pseudodog Fang": "pseudodog_fang",
  "Flesh Eye": "flesh_eye",
  "Flesh Meat": "flesh_meat",
  "Fracture Hand": "fracture_hand",
  "Bloodsucker Heart": "bloodsucker_heart",
  "Chimera Heart": "chimera_heart",
  "Bloodsucker Jaw": "bloodsucker_jaw",
  "Bloodsucker Meat": "bloodsucker_meat",
  "Lurker Eye": "lurker_eye",
  "Lurker Tail": "lurker_tail",
  "Controller Brain Tissue": "controller_brain_tissue",
  "Pseudogiant Eye": "pseudogiant_eye",
  "Pseudogiant Hand": "pseudogiant_hand",
  "Pseudodog Meat": "pseudodog_meat",
  "Pseudodog Tail": "pseudodog_tail",
  "Psysucker Hand": "psysucker_hand",
  "Snork Hand": "snork_hand",
  "Snork Tendons": "snork_tendons",
  "Snork Mask": "snork_mask",
  "Boar Fang": "boar_fang",
  "Zombie Hand": "zombie_hand"
};
function mutantPartIcon(name){
 const slug=MUTANT_PART_ICONS[String(name||"").trim()];
 return slug ? "assets/artifacts/mutant_part_"+slug+".png" : "";
}
function craftingIconMarkup(ingredient,small=false){
 const artifactId=ingredient.artifactId||ingredientArtifactId(ingredient.name);
 const artifact=artifactId?artifacts.find(a=>a.id===artifactId):null;
 const src=artifact?artifactIcon(artifact):mutantPartIcon(ingredient.name);
 if(!src)return "";
 const cls=small?(artifact?"artifact-icon-small":"mutant-part-icon-small"):(artifact?"artifact-icon":"mutant-part-icon");
 return '<img class="'+cls+'" src="'+src+'" alt="" loading="lazy">';
}
function outputArtifactIconMarkup(recipe,small=false){
 const artifact=artifacts.find(a=>a.id===recipe.id);
 if(!artifact)return "";
 const cls=small?"artifact-icon-small":"artifact-icon";
 return '<img class="'+cls+'" src="'+artifactIcon(artifact)+'" alt="" loading="lazy">';
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
  const input=ingredient.artifactId||ingredientArtifactId(ingredient.name);
  if(input&&input!==recipe.id)edges.push({from:input,to:recipe.id});
 }
 cachedRecipeEdges=edges;recipeAdjacency=new Map();
 for(const edge of edges)for(const id of [edge.from,edge.to]){
  if(!recipeAdjacency.has(id))recipeAdjacency.set(id,[]);
  recipeAdjacency.get(id).push(edge);
 }
 return edges;
}
function roundedOrthogonalPath(points,r=8){
 let d="M "+points[0][0]+" "+points[0][1];
 for(let i=1;i<points.length-1;i++){
  const prev=points[i-1],cur=points[i],next=points[i+1];
  const inLen=Math.hypot(cur[0]-prev[0],cur[1]-prev[1]),outLen=Math.hypot(next[0]-cur[0],next[1]-cur[1]),radius=Math.min(r,inLen/2,outLen/2);
  const before=[cur[0]+(prev[0]-cur[0])*radius/(inLen||1),cur[1]+(prev[1]-cur[1])*radius/(inLen||1)];
  const after=[cur[0]+(next[0]-cur[0])*radius/(outLen||1),cur[1]+(next[1]-cur[1])*radius/(outLen||1)];
  d+=" L "+before[0]+" "+before[1]+" Q "+cur[0]+" "+cur[1]+" "+after[0]+" "+after[1];
 }
 const last=points[points.length-1];return d+" L "+last[0]+" "+last[1];
}
let hoverRouteId="",pinnedRouteIds=new Set();
function activeRoutes(){return pinnedRouteIds.size?[...pinnedRouteIds]:hoverRouteId?[hoverRouteId]:[]}
function routeColumnBoundary(source,target,base){
 const board=$("#perk-matrix .tier-board");if(!board)return (source.rect.right+target.rect.left)/2-base.left;
 const sourceCell=source.node.closest(".purpose-cell"),sr=source.rect,tr=target.rect;
 const sourceCenter=sr.left+sr.width/2,targetCenter=tr.left+tr.width/2;
 const cells=[...board.querySelectorAll(".purpose-cell")].map(el=>el.getBoundingClientRect()).filter(r=>r.width);
 const unique=[...new Set(cells.flatMap(r=>[r.left,r.right]).map(x=>Math.round(x*10)/10))];
 if(Math.abs(sourceCenter-targetCenter)<8){const cell=sourceCell?.getBoundingClientRect()||sr;return (Math.abs(sr.left-cell.left)<Math.abs(cell.right-sr.right)?cell.left:cell.right)-base.left}
 const lo=Math.min(sourceCenter,targetCenter),hi=Math.max(sourceCenter,targetCenter),mid=(lo+hi)/2;
 const between=unique.filter(x=>x>lo&&x<hi),pool=between.length?between:unique;
 return pool.sort((a,b)=>Math.abs(a-mid)-Math.abs(b-mid))[0]-base.left;
}
function clearRouteSegment(a,b,obstacles){
 if(Math.abs(a[0]-b[0])<.5){
  const x=a[0],lo=Math.min(a[1],b[1]),hi=Math.max(a[1],b[1]);
  return !obstacles.some(r=>x>r.left&&x<r.right&&hi>r.top&&lo<r.bottom);
 }
 if(Math.abs(a[1]-b[1])<.5){
  const y=a[1],lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);
  return !obstacles.some(r=>y>r.top&&y<r.bottom&&hi>r.left&&lo<r.right);
 }
 return false;
}
function findClearRoute(start,end,sourceNode,targetNode,layout,base,startAnchor=start,endAnchor=end,sharedLanes=null,existingSegments=[]){
 const clearance=7;
 const allNodes=[...layout.querySelectorAll(".artifact-node")];
 const obstacles=allNodes.filter(n=>n!==sourceNode&&n!==targetNode).map(n=>{
  const r=n.getBoundingClientRect(),tier0=!!n.closest(".tier0-area");return r.width&&r.height?{left:r.left-base.left-clearance,right:r.right-base.left+clearance,top:r.top-base.top-clearance,bottom:r.bottom-base.top+(tier0?8:clearance)}:null;
 }).filter(Boolean);
 if(!clearRouteSegment(startAnchor,start,obstacles)||!clearRouteSegment(end,endAnchor,obstacles))return null;
 const round=n=>Math.round(n*100)/100;
 const unique=values=>[...new Set(values.map(round))].sort((a,b)=>a-b);
 const width=layout.scrollWidth,height=layout.scrollHeight;
 const rawXs=unique([...(sharedLanes?.x||[]),start[0],end[0],3,width-3]);
 const dividers=sharedLanes?.dividers||[];
 const endpointXs=[round(start[0]),round(end[0])];
 const xs=rawXs.filter(x=>endpointXs.includes(x)||!dividers.some(d=>Math.abs(x-d)>0.05&&Math.abs(x-d)<=2.5));
 const ys=unique([...(sharedLanes?.y||[]),start[1],end[1],3,height-3]);
 const nx=xs.length,ny=ys.length,total=nx*ny;
 const blocked=new Uint8Array(total);
 const inside=(x,y,r)=>x>r.left+.01&&x<r.right-.01&&y>r.top+.01&&y<r.bottom-.01;
 for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
  const x=xs[ix],y=ys[iy],id=iy*nx+ix;
  if(obstacles.some(r=>inside(x,y,r)))blocked[id]=1;
 }
 const sx=xs.indexOf(round(start[0])),sy=ys.indexOf(round(start[1]));
 const ex=xs.indexOf(round(end[0])),ey=ys.indexOf(round(end[1]));
 if(sx<0||sy<0||ex<0||ey<0)return null;
 const startNodeId=sy*nx+sx,endNodeId=ey*nx+ex;
 if(blocked[startNodeId]||blocked[endNodeId])return null;
 const states=total*3,dist=new Float64Array(states),previous=new Int32Array(states),visited=new Uint8Array(states);
 dist.fill(Infinity);previous.fill(-1);
 const heap=[];
 const push=(state,cost)=>{
  let i=heap.length;heap.push({state,cost});
  while(i){const p=(i-1)>>1;if(heap[p].cost<=cost)break;heap[i]=heap[p];i=p}
  heap[i]={state,cost};
 };
 const pop=()=>{
  const first=heap[0],last=heap.pop();
  if(heap.length){let i=0;while(true){let child=i*2+1;if(child>=heap.length)break;if(child+1<heap.length&&heap[child+1].cost<heap[child].cost)child++;if(heap[child].cost>=last.cost)break;heap[i]=heap[child];i=child}heap[i]=last}
  return first;
 };
 const sharesChannel=(a,b)=>{
  const vertical=Math.abs(a[0]-b[0])<.5;
  if(vertical){
   const lo=Math.min(a[1],b[1]),hi=Math.max(a[1],b[1]);
   return existingSegments.some(s=>Math.abs(s.a[0]-a[0])<.5&&Math.abs(s.b[0]-a[0])<.5&&Math.min(Math.max(s.a[1],s.b[1]),hi)-Math.max(Math.min(s.a[1],s.b[1]),lo)>.5);
  }
  const horizontal=Math.abs(a[1]-b[1])<.5;
  if(horizontal){
   const lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);
   return existingSegments.some(s=>Math.abs(s.a[1]-a[1])<.5&&Math.abs(s.b[1]-a[1])<.5&&Math.min(Math.max(s.a[0],s.b[0]),hi)-Math.max(Math.min(s.a[0],s.b[0]),lo)>.5);
  }
  return false;
 };
 const startState=startNodeId*3+2;dist[startState]=0;push(startState,0);
 let finish=-1;
 while(heap.length){
  const item=pop(),state=item.state;
  if(visited[state]||item.cost!==dist[state])continue;
  visited[state]=1;
  const nodeId=Math.floor(state/3),dir=state%3;
  if(nodeId===endNodeId){finish=state;break}
  const iy=Math.floor(nodeId/nx),ix=nodeId%nx,x=xs[ix],y=ys[iy];
  const neighbors=[];
  if(ix>0)neighbors.push([nodeId-1,0,x-xs[ix-1],[xs[ix-1],y]]);
  if(ix+1<nx)neighbors.push([nodeId+1,0,xs[ix+1]-x,[xs[ix+1],y]]);
  if(iy>0)neighbors.push([nodeId-nx,1,y-ys[iy-1],[x,ys[iy-1]]]);
  if(iy+1<ny)neighbors.push([nodeId+nx,1,ys[iy+1]-y,[x,ys[iy+1]]]);
  for(const [nextId,nextDir,length,nextPoint] of neighbors){
   if(blocked[nextId]||!clearRouteSegment([x,y],nextPoint,obstacles))continue;
   const nextState=nextId*3+nextDir;
   if(visited[nextState])continue;
   const shared=sharesChannel([x,y],nextPoint);
   const cost=item.cost+length+(existingSegments.length&&!shared?length*.2:0)+(dir!==2&&dir!==nextDir?24:0);
   if(cost<dist[nextState]){dist[nextState]=cost;previous[nextState]=state;push(nextState,cost)}
  }
 }
 if(finish<0)return null;
 const route=[];
 for(let state=finish;state>=0;state=previous[state]){
  const nodeId=Math.floor(state/3),iy=Math.floor(nodeId/nx),ix=nodeId%nx;
  route.push([xs[ix],ys[iy]]);
  if(state===startState)break;
 }
 route.reverse();
 return route.filter((p,i)=>!i||Math.abs(p[0]-route[i-1][0])>.5||Math.abs(p[1]-route[i-1][1])>.5);
}
function drawRecipeLinks(){
 const layout=$("#perk-matrix .matrix-layout");if(!layout)return;
 const svg=layout.querySelector(".recipe-links");if(!svg)return;
 const routeIds=activeRoutes().slice().sort();
 if(!routeIds.length){svg.innerHTML="";svg.classList.remove("is-visible");layout.querySelectorAll(".artifact-node").forEach(node=>node.classList.remove("route-active","route-related","route-ingredient","route-upgrade"));return}
 recipeEdges();
 const width=layout.scrollWidth,height=layout.scrollHeight;
 svg.setAttribute("width",width);svg.setAttribute("height",height);svg.setAttribute("viewBox","0 0 "+width+" "+height);
 const base=layout.getBoundingClientRect(),paths=[],related=new Set(),ingredients=new Set(),upgrades=new Set(),selected=new Set(routeIds),unique=new Set(),existingSegments=[];
 const clearance=7;
 const sharedLanes={x:[],y:[],dividers:[]};
 layout.querySelectorAll(".purpose-cell:not(:nth-child(5n))").forEach(cell=>{const r=cell.getBoundingClientRect();if(r.width)sharedLanes.dividers.push(r.right-base.left-.5)});
 sharedLanes.dividers=[...new Set(sharedLanes.dividers.map(x=>Math.round(x*100)/100))];
 const tier0Area=layout.querySelector(".tier0-area"),tierBoard=layout.querySelector(".tier-board");
 const tier0Boundary=tier0Area&&tierBoard?(tier0Area.getBoundingClientRect().right-base.left):null;
 if(tier0Boundary!==null)sharedLanes.x.push(tier0Boundary);
 sharedLanes.x.push(...sharedLanes.dividers);
 layout.querySelectorAll(".artifact-node").forEach(node=>{
  const r=node.getBoundingClientRect();if(!r.width||!r.height)return;
  sharedLanes.x.push(r.left-base.left-clearance,r.right-base.left+clearance);
  sharedLanes.y.push(r.top-base.top-clearance,r.bottom-base.top+clearance);
 });
 const anchorFor=id=>{
  const node=layout.querySelector('[data-artifact-id="'+CSS.escape(id)+'"]');if(!node)return null;
  const tier0=node.closest(".tier0-area"),collapsed=!!(tier0&&!tier0.open),anchor=collapsed?tier0.querySelector(":scope > summary"):node;
  if(!anchor)return null;const rect=anchor.getBoundingClientRect();if(!rect.width||!rect.height)return null;
  return {node,rect,tier0:!!tier0,collapsed};
 };
 for(const routeId of routeIds){
  for(const edge of [...(recipeAdjacency.get(routeId)||[])].sort((a,b)=>(a.from+">"+a.to).localeCompare(b.from+">"+b.to))){
   const key=edge.from+">"+edge.to;if(unique.has(key))continue;unique.add(key);
   const source=anchorFor(edge.from),target=anchorFor(edge.to);if(!source||!target)continue;
   const sr=source.rect,tr=target.rect;
   const sx0=sr.left-base.left,sy0=sr.top-base.top,tx0=tr.left-base.left,ty0=tr.top-base.top;
   let sx,sy,tx,ty,startLead,endLead;
   if(source.tier0){
    sx=sx0+sr.width;sy=sy0+sr.height/2;
    startLead=[tier0Boundary!==null?tier0Boundary:sx+8,sy];
   }else{
    const right=tx0+tr.width/2>=sx0+sr.width/2;
    sx=sx0+(right?sr.width:0);sy=sy0+sr.height/2;
    startLead=[sx+(right?6:-6),sy];
   }
   if(target.tier0){
    tx=tx0+tr.width;ty=ty0+tr.height/2;
    endLead=[tier0Boundary!==null?tier0Boundary:tx+8,ty];
   }else{
    const right=tx0+tr.width/2>=sx0+sr.width/2;
    tx=tx0+(right?0:tr.width);ty=ty0+tr.height/2;
    endLead=[tx+(right?-6:6),ty];
   }
   const snapDivider=x=>{let nearest=null,distance=Infinity;for(const divider of sharedLanes.dividers){const delta=Math.abs(divider-x);if(delta<distance){distance=delta;nearest=divider}}return nearest!==null&&distance<=2.5?nearest:x};
   const routedStart=[source.tier0?startLead[0]:snapDivider(startLead[0]),startLead[1]];
   const routedEnd=[target.tier0?endLead[0]:snapDivider(endLead[0]),endLead[1]];
   const middle=findClearRoute(routedStart,routedEnd,source.node,target.node,layout,base,[sx,sy],[tx,ty],sharedLanes,existingSegments);
   if(!middle)continue;
   const points=[[sx,sy],...middle,[tx,ty]];
   for(let i=1;i<points.length;i++)existingSegments.push({a:points[i-1],b:points[i]});
   const forward=selected.has(edge.from);paths.push('<path class="'+(forward?"is-source":"is-target")+'" d="'+roundedOrthogonalPath(points,1.5)+'"/>');
   if(forward)upgrades.add(edge.to);else ingredients.add(edge.from);
   related.add(edge.from);related.add(edge.to);
  }
 }
 layout.querySelectorAll(".artifact-node").forEach(node=>{const id=node.dataset.artifactId;node.classList.toggle("route-active",selected.has(id));node.classList.toggle("route-related",related.has(id)&&!selected.has(id));node.classList.toggle("route-ingredient",ingredients.has(id)&&!selected.has(id));node.classList.toggle("route-upgrade",upgrades.has(id)&&!selected.has(id))});
 svg.innerHTML=paths.join("");svg.classList.toggle("is-visible",!!paths.length);
}
let hoverDrawPending=false;function selectHoverRoute(id){const next=id||"";if(next===hoverRouteId)return;hoverRouteId=next;if(pinnedRouteIds.size||hoverDrawPending)return;hoverDrawPending=true;requestAnimationFrame(()=>{hoverDrawPending=false;drawRecipeLinks()})}
function togglePinnedRoute(id){
 const wasPinned=pinnedRouteIds.has(id);
 if(wasPinned)pinnedRouteIds.delete(id);else pinnedRouteIds.add(id);
 if(wasPinned&&!pinnedRouteIds.size){
  // A pin button can retain keyboard focus after the pointer leaves its card.
  // Do not let that stale focus route reactivate when the final pin is removed.
  hoverRouteId="";
  const focused=document.activeElement;
  if(focused?.classList?.contains("route-pin"))focused.blur();
 }
 $("#perk-matrix").querySelectorAll(".route-pin").forEach(button=>{
  const pinned=pinnedRouteIds.has(button.dataset.pinId);button.classList.toggle("is-pinned",pinned);
  button.setAttribute("aria-pressed",String(pinned));button.title=pinned?"Unpin crafting connections":"Pin crafting connections";
 });
 drawRecipeLinks();
}
let routeRedrawPending=false;
function scheduleRouteRedraw(){
 if(!activeRoutes().length||routeRedrawPending)return;routeRedrawPending=true;
 requestAnimationFrame(()=>{routeRedrawPending=false;if(activeRoutes().length)drawRecipeLinks()});
}
function buildCraftingOrder(){
 const nodes=artifacts.filter(a=>a.tier!==null);
 const byId=new Map(nodes.map(a=>[a.id,a]));
 const groups=new Map();
 const edges=[];
 for(const a of nodes){
  const key=Number(a.tier)===0?"tier-0":String(a.tier)+":"+purposeFor(a).key;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(a);
 }
 for(const recipe of recipes){
  if(!byId.has(recipe.id))continue;
  for(const ingredient of recipe.ingredients||[]){
   const id=ingredient.artifactId||ingredientArtifactId(ingredient.name);
   if(id&&byId.has(id)&&id!==recipe.id)edges.push([id,recipe.id]);
  }
 }
 for(const list of groups.values())list.sort((a,b)=>artifactName(a).localeCompare(artifactName(b)));
 const positions=new Map();
 const updatePositions=()=>{for(const list of groups.values())list.forEach((a,i)=>positions.set(a.id,list.length<2?0:i/(list.length-1)))};
 const incident=new Map(nodes.map(a=>[a.id,[]]));
 for(const [x,y] of edges){incident.get(x)?.push([x,y]);incident.get(y)?.push([x,y])}
 const edgeCost=(edge)=>{const [x,y]=edge;return Math.abs((positions.get(x)??0)-(positions.get(y)??0))};
 updatePositions();
 for(let pass=0;pass<8;pass++){
  let changed=false;
  for(const list of groups.values()){
   if(list.length<2)continue;
   let swaps=0,improved=true;
   while(improved&&swaps<Math.min(24,list.length*2)){
    improved=false;
    let bestDelta=-1e-9,bestI=-1,bestJ=-1;
    for(let i=0;i<list.length-1;i++)for(let j=i+1;j<list.length;j++){
     const x=list[i],y=list[j],oldX=positions.get(x.id),oldY=positions.get(y.id);
     const affected=new Set([...(incident.get(x.id)||[]),...(incident.get(y.id)||[])]);
     let before=0;for(const edge of affected)before+=edgeCost(edge);
     const nx=list.length<2?0:j/(list.length-1),ny=i/(list.length-1);
     positions.set(x.id,nx);positions.set(y.id,ny);
     let after=0;for(const edge of affected)after+=edgeCost(edge);
     positions.set(x.id,oldX);positions.set(y.id,oldY);
     const delta=after-before;
     if(delta<bestDelta){bestDelta=delta;bestI=i;bestJ=j}
    }
    if(bestI>=0){
     const temp=list[bestI];list[bestI]=list[bestJ];list[bestJ]=temp;
     updatePositions();improved=true;changed=true;swaps++;
    }
   }
  }
  if(!changed)break;
 }
 const rank=new Map();
 for(const list of groups.values())list.forEach((a,i)=>rank.set(a.id,i));
 return rank;
}
function renderMatrix(){
 const q=$("#search").value.trim().toLowerCase(),attribute=$("#attribute")?.value||"";
 const eligible=artifacts.filter(a=>a.tier!==null&&matches(a,q)&&(!attribute||(a.stats||[]).some(s=>s.label===attribute&&Number(s.numeric)>0)));
 const tier0=eligible.filter(a=>Number(a.tier)===0);
 const items=eligible.filter(a=>Number(a.tier)>=1);
 const categories=[{key:"combat",title:"Combat Defense",note:"Ballistic, impact and explosive protection"},{key:"mutant",title:"Mutant Defense",note:"Rupture and psychic protection"},{key:"anomaly",title:"Anomaly Defense",note:"Burn, electrical, chemical and radiation protection"},{key:"recovery",title:"Health & Recovery",note:"Health, wound, stamina and radiation recovery"},{key:"other",title:"Other Effects",note:"Unusual modifiers that do not fit another category"}];
 const visibleCategories=categories.filter(c=>items.some(a=>purposeFor(a).key===c.key));
 const craftingRank=buildCraftingOrder();
 const sortItems=list=>list.sort((a,b)=>(craftingRank.get(a.id)??999)-(craftingRank.get(b.id)??999)||artifactName(a).localeCompare(artifactName(b)));
 const effectMarkup=list=>list.length?'<div class="effect-stack">'+list.map(s=>'<span class="effect-tag '+(Number(s.numeric)<0?"negative":"positive")+'">'+esc(s.label)+' <b>'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</b></span>').join("")+'</div>':"";
 const card=a=>{
  const stats=a.stats.filter(s=>Number(s.numeric)!==0&&isVisibleStat(s)&&!/^stopped bonus$/i.test(String(s.label||"")));
  const positives=stats.filter(s=>Number(s.numeric)>0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
  const negatives=stats.filter(s=>Number(s.numeric)<0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
   const perk=a.perkTitle?'<span class="perk-card">'+esc(a.perkTitle)+'</span>':"";
  const value='<span class="artifact-value">'+Number(a.cost||0).toLocaleString("en-US")+' RU</span>';
  const traitGap=positives.length&&negatives.length?'<span class="trait-gap"></span>':"";
  return '<article class="purpose-card artifact-node" data-artifact-id="'+esc(a.id)+'"><button class="route-pin" data-pin-id="'+esc(a.id)+'" type="button" aria-label="Pin crafting connections" aria-pressed="false" title="Pin crafting connections"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z"/></svg></button><button class="purpose-main" data-id="'+esc(a.id)+'" type="button"><img loading="lazy" src="'+artifactIcon(a)+'" alt=""><div class="purpose-copy"><span class="artifact-title-line"><b>'+esc(artifactName(a))+'</b>'+value+'</span>'+perk+effectMarkup(positives)+traitGap+effectMarkup(negatives)+'</div></button></article>';
 };
 const tier0Cards=sortItems([...tier0]).map(card).join("");
 const tierCounts=[1,2,3,4].map(t=>items.filter(a=>Number(a.tier)===t).length);
 const header='<div class="purpose-label-head"><b>CATEGORY</b></div>'+[1,2,3,4].map((t,i)=>'<div class="tier-column-head" data-tier="'+t+'"><b>TIER '+t+'</b><span>'+tierCounts[i]+' ARTEFACTS</span></div>').join("");
 const rows=visibleCategories.map(c=>{
  const cells=[1,2,3,4].map(t=>{
   const list=sortItems(items.filter(a=>Number(a.tier)===t&&purposeFor(a).key===c.key));
   return '<div class="purpose-cell" data-purpose="'+c.key+'" data-tier="'+t+'">'+(list.length?list.map(card).join(""):'<span class="tier-empty">-</span>')+'</div>';
  }).join("");
  const count=items.filter(a=>purposeFor(a).key===c.key).length;
  return '<div class="purpose-row-label"><b>'+c.title+'</b><small>'+c.note+'</small><em>'+count+' ARTEFACTS</em></div>'+cells;
 }).join("");
 $("#matrix-count").textContent=eligible.length+" ARTEFACTS";
 $("#perk-matrix").innerHTML='<div class="matrix-layout"><div class="matrix-content"><details class="tier0-area" open><summary class="tier-column-head tier0-header"><b>TIER 0</b><span>'+tier0.length+' ARTEFACTS</span></summary><div class="tier0-grid">'+(tier0Cards||'<span class="tier-empty">No Tier 0 artefacts match these filters.</span>')+'</div></details><div class="tier-board">'+header+rows+'</div></div><svg class="recipe-links" aria-hidden="true"></svg></div>';
 const matrix=$("#perk-matrix"),layout=matrix.querySelector(".matrix-layout");
 matrix.querySelectorAll(".purpose-card").forEach(card=>{
  const id=card.dataset.artifactId;
  card.addEventListener("mouseenter",()=>selectHoverRoute(id));
  card.addEventListener("mouseleave",()=>selectHoverRoute(""));
  card.addEventListener("focusin",()=>selectHoverRoute(id));
  card.addEventListener("focusout",event=>{if(!card.contains(event.relatedTarget))selectHoverRoute("")});
 });
 matrix.querySelectorAll(".purpose-main").forEach(b=>b.addEventListener("click",()=>{const a=artifacts.find(x=>x.id===b.dataset.id);if(a)openProfile(a)}));
 matrix.querySelectorAll(".route-pin").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();togglePinnedRoute(button.dataset.pinId)}));
 // Connector paths are positioned in board coordinates and move with the board. Do not reroute on scroll.
 matrix.querySelector(".tier0-area").addEventListener("toggle",scheduleRouteRedraw);
 matrix.querySelectorAll(".route-pin").forEach(button=>{const pinned=pinnedRouteIds.has(button.dataset.pinId);button.classList.toggle("is-pinned",pinned);button.setAttribute("aria-pressed",String(pinned))});
 drawRecipeLinks();
}

function craftingTreeArtifactMarkup(id,stack=new Set()){
 const artifact=artifacts.find(a=>a.id===id);
 if(!artifact)return "";
 const recipe=recipes.find(r=>r.id===id);
 const icon='<img class="craft-tree-logo" src="'+artifactIcon(artifact)+'" alt="" loading="eager" decoding="async" onerror="this.onerror=null;this.src=&#39;'+SOURCE_ICONS+encodeURIComponent(artifact.id)+'.png&#39;">';
 const roleTags=craftTreeRoleMarkup(artifact);
 const row='<button class="craft-tree-item" type="button" data-craft-tree-artifact="'+esc(artifact.id)+'" aria-label="Open '+esc(artifactName(artifact))+' profile">'+icon+'<span><b>'+esc(artifactName(artifact))+'</b>'+(roleTags?'<span class="craft-tree-role-list">'+roleTags+'</span>':"")+'</span></button>';
 if(!recipe)return '<li class="craft-tree-leaf">'+row+'</li>';
 if(stack.has(id))return '<li class="craft-tree-leaf">'+row+'<small class="craft-tree-cycle">Circular recipe reference</small></li>';
 const nextStack=new Set(stack);nextStack.add(id);
 const children=(recipe.ingredients||[]).filter(i=>{
  const ingredientId=i.artifactId||ingredientArtifactId(i.name);
  return ingredientId&&artifacts.some(a=>a.id===ingredientId);
 }).map(i=>craftingTreeArtifactMarkup(i.artifactId||ingredientArtifactId(i.name),nextStack)).filter(Boolean).join("");
 if(!children)return '<li class="craft-tree-leaf">'+row+'</li>';
 return '<li class="craft-tree-branch">'+row+'<div class="craft-tree-recipe"><ul>'+children+'</ul></div></li>';
}
function drawCraftTreeConnectors(){
 document.querySelectorAll(".craft-tree-canvas").forEach(canvas=>{
  const svg=canvas.querySelector(".craft-tree-connectors");
  if(!svg)return;
  const rect=canvas.getBoundingClientRect(),width=Math.max(canvas.scrollWidth,rect.width),height=Math.max(canvas.scrollHeight,rect.height);
  svg.setAttribute("viewBox","0 0 "+width+" "+height);svg.setAttribute("width",width);svg.setAttribute("height",height);
  const paths=[];
  canvas.querySelectorAll(".craft-tree-branch").forEach(branch=>{
   const parent=branch.querySelector(":scope > .craft-tree-item");
   const children=branch.querySelectorAll(":scope > .craft-tree-recipe > ul > li > .craft-tree-item");
   if(!parent||!children.length)return;
   const pr=parent.getBoundingClientRect(),px=pr.left-rect.left,py=pr.top-rect.top+pr.height/2;
   children.forEach(child=>{
    const cr=child.getBoundingClientRect(),sx=cr.right-rect.left,sy=cr.top-rect.top+cr.height/2;
    const mid=sx+(px-sx)/2;
    const points=[[sx,sy],[mid,sy],[mid,py],[px,py]];
    paths.push('<path d="'+roundedOrthogonalPath(points,5)+'"/>');
   });
  });
  svg.innerHTML=paths.join("");
 });
}
let selectedCraftTreeId="";
function renderCraftingTree(){
 const roots=recipes.map(r=>({recipe:r,artifact:artifacts.find(a=>a.id===r.id)}))
  .filter(x=>x.artifact&&TIER_NAMES[4]?.some(name=>name.toLowerCase()===String(x.recipe.name||"").toLowerCase()))
  .sort((a,b)=>String(a.recipe.name||"").localeCompare(String(b.recipe.name||"")));
 if(!roots.some(x=>x.artifact.id===selectedCraftTreeId))selectedCraftTreeId=roots[0]?.artifact.id||"";
  const tabs=roots.map(({recipe,artifact})=>'<button class="chip craft-tree-tab'+(artifact.id===selectedCraftTreeId?' active':'')+'" type="button" role="tab" aria-selected="'+(artifact.id===selectedCraftTreeId)+'" aria-controls="craft-tree-panel" data-craft-tree-tab="'+esc(artifact.id)+'"><img src="'+artifactIcon(artifact)+'" alt="" loading="eager" decoding="async"><span>'+esc(recipe.name||artifactName(artifact))+'</span></button>').join("");
 const current=roots.find(x=>x.artifact.id===selectedCraftTreeId);
 const roleTags=current?craftTreeRoleMarkup(current.artifact):"";const panel=current?'<section class="craft-tree-root" id="craft-tree-panel" role="tabpanel"><h3 class="craft-tree-title">'+esc(current.recipe.name||artifactName(current.artifact))+(roleTags?'<span class="craft-tree-role-list">'+roleTags+'</span>':"")+'</h3><div class="craft-tree-scroll"><div class="craft-tree-canvas"><svg class="craft-tree-connectors" aria-hidden="true"></svg><ul>'+craftingTreeArtifactMarkup(current.artifact.id,new Set())+'</ul></div></div></section>':'<p class="tier-empty">No Tier 4 crafting recipes found.</p>';
 $("#crafting-tree-content").innerHTML='<header class="craft-tree-heading"><div><div class="section-kicker">GAMMA 0.9.5</div><h2>Crafting <em>Tree</em></h2></div></header><div class="craft-tree-tabs" role="tablist" aria-label="Tier 4 crafting trees">'+tabs+'</div>'+panel;
 $("#crafting-tree-content").querySelectorAll("[data-craft-tree-tab]").forEach(button=>button.addEventListener("click",()=>{
  selectedCraftTreeId=button.dataset.craftTreeTab;
  renderCraftingTree();
 }));
 $("#crafting-tree-content").querySelectorAll("[data-craft-tree-artifact]").forEach(button=>button.addEventListener("click",()=>{
  const artifact=artifacts.find(a=>a.id===button.dataset.craftTreeArtifact);
  if(artifact)openProfile(artifact);
 }));
 requestAnimationFrame(drawCraftTreeConnectors);
}
function statBar(s){const max=100,percent=Math.min(100,Math.abs(s.numeric)/max*100);return '<div class="mini-stat"><span>'+esc(s.label)+'</span><b class="'+(s.numeric<0?"neg":"")+'">'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</b><div class="mini-track"><i class="'+(s.numeric<0?"neg":"")+'" style="width:'+Math.max(percent,3)+'%"></i></div></div>'}
function render(){if(document.body.dataset.page==="crafting-tree"){renderCraftingTree();return}renderMatrix();renderCompare()}
const groups=[["Protection","Protection"],["Recovery","Recovery"],["Mobility & utility","Mobility","Utility"]];
function statGroupMarkup(a){
 const stats=a.stats.filter(s=>Number(s.numeric)!==0&&isVisibleStat(s));
 const positives=stats.filter(s=>Number(s.numeric)>0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
 const negatives=stats.filter(s=>Number(s.numeric)<0).sort((x,y)=>Math.abs(Number(y.numeric))-Math.abs(Number(x.numeric)));
 const lines=list=>list.map(s=>'<div class="stat-line"><span class="name">'+esc(s.label)+'</span><strong class="value '+(s.numeric<0?"neg":"")+'">'+(s.numeric>0?"+":"")+fmt(s.numeric)+esc(s.unit)+'</strong></div>').join("");
 return (positives.length?'<div class="profile-section"><div class="stat-list positive-list">'+lines(positives)+'</div></div>':"")+(negatives.length?'<div class="profile-section"><div class="stat-list negative-list">'+lines(negatives)+'</div></div>':"");
}
function craftArtifactLinkMarkup(artifact,content){
 return '<button type="button" class="craft-artifact-link" data-craft-artifact="'+esc(artifact.id)+'">'+content+'</button>';
}
function craftingProfileMarkup(a){
 const required=recipes.find(r=>r.id===a.id);
 const outputs=recipes.filter(r=>(r.ingredients||[]).some(i=>(i.artifactId||ingredientArtifactId(i.name))===a.id));
 if(!required&&!outputs.length)return "";
 const requirementMarkup=required?'<div class="craft-recipe-info"><div><span>Required tool</span><b class="craft-tool"><img src="assets/artifacts/itm_artefact_melter.png" alt="" loading="lazy">'+esc(required.tool||"Artifact Melter")+'</b></div><div><span>Recipe manual</span><b>'+esc(required.requiredManual||"No manual required")+'</b></div></div>':"";
 const requiredMarkup=required?'<div class="crafting-profile-group"><h4>Required materials</h4><div class="craft-material-list">'+required.ingredients.map(i=>{
  const id=i.artifactId||ingredientArtifactId(i.name),artifact=id?artifacts.find(x=>x.id===id):null;
  const content=craftingIconMarkup(i)+'<span>'+esc(craftingIngredientName(i))+'</span>';
  const item=artifact?craftArtifactLinkMarkup(artifact,content+'<b>'+esc(i.amount)+'</b>'):content+'<b>'+esc(i.amount)+'</b>';
  return '<div class="craft-material'+(artifact?' craft-material-linked':'')+'">'+item+'</div>';
 }).join("")+'</div></div>':"";
 const outputMarkup=outputs.length?'<div class="crafting-profile-group"><h4>Used to craft</h4><div class="craft-material-list">'+outputs.map(r=>{
  const artifact=artifacts.find(x=>x.id===r.id);
  const content=outputArtifactIconMarkup(r)+'<span>'+esc(recipeName(r))+'</span>';
  return '<div class="craft-material'+(artifact?' craft-material-linked':'')+'">'+(artifact?craftArtifactLinkMarkup(artifact,content):content)+'</div>';
 }).join("")+'</div></div>':"";
 return '<div class="profile-section"><h3>Crafting</h3>'+requirementMarkup+requiredMarkup+outputMarkup+'</div>';
}
function perkDetailsMarkup(a){
 if(!a.perkDetails)return "";
 const d=a.perkDetails;
 const thresholds=d.thresholds||[];
 const stacking=d.stacking||{};
 const diminishing=d.diminishingReturns||{};
 const lucifer=d.relatedArtifactId?'<button type="button" class="related-artifact-link" data-related-artifact="'+esc(d.relatedArtifactId)+'">Lucifer</button>':"";
 return '<div class="perk-detail"><h4>'+esc(d.heading||"ADDITIONAL MECHANICS")+'</h4><table class="perk-thresholds"><thead><tr><th>HEARTS EQUIPPED</th><th>LOW-HEALTH THRESHOLD</th></tr></thead><tbody>'+thresholds.map(x=>'<tr><td>'+esc(x.count)+'</td><td>'+esc(x.threshold)+'</td></tr>').join("")+'</tbody></table><div class="perk-properties"><div><span>'+esc(stacking.label||"Stacking")+'</span><b>'+esc(stacking.value||"")+'</b></div><div><span>'+esc(diminishing.label||"Diminishing returns")+'</span><b>'+esc(diminishing.value||"")+'</b></div></div><p class="perk-detail-note">'+esc(d.healingNote||"")+'</p><div class="perk-synergy"><h4>LUCIFER INTERACTION</h4><p>'+esc(d.luciferNote||"")+'</p><p class="perk-related">Related artefact: '+lucifer+'</p></div></div>';
}
function craftTreeRoleInfo(a){
 const positive=(a.stats||[]).filter(s=>Number(s.numeric)>0);
 const has=labels=>positive.some(s=>labels.includes(s.label));
 const tags=[];
 if(has(["Ballistic resistance","Impact resistance","Explosive resistance"]))tags.push({label:"Combat Defense",key:"combat"});
 if(has(["Rupture resistance","Psychic resistance"]))tags.push({label:"Mutant Defense",key:"mutant"});
 if(has(["Burn resistance","Electrical resistance","Chemical resistance","Radiation resistance"]))tags.push({label:"Anomaly Defense",key:"anomaly"});
 if(positive.some(s=>s.group==="Recovery"))tags.push({label:"Health & Recovery",key:"recovery"});
 if(tags.length)return tags;
 const purpose=purposeFor(a);
 if(purpose.key==="combat")return [{label:"Combat Defense",key:"combat"}];
 if(purpose.key==="anomaly")return [{label:"Anomaly Defense",key:"anomaly"}];
 if(purpose.key==="recovery")return [{label:"Health & Recovery",key:"recovery"}];
 return [{label:purpose.label,key:"other"}];
}
function craftTreeRoleMarkup(a){
 return craftTreeRoleInfo(a).map(tag=>'<small class="craft-tree-role craft-tree-role--'+tag.key+'">'+esc(tag.label)+'</small>').join("");
}
function openProfile(a){const dialog=$("#artifact-dialog");dialog.scrollTop=0;document.body.classList.add("dialog-open");$("#dialog-content").dataset.id=a.id;$("#dialog-content").innerHTML='<div class="profile"><div class="profile-hero"><img src="'+artifactIcon(a)+'" alt="" onerror="this.style.opacity=0.15"><div><h2>'+esc(artifactName(a))+'</h2><div class="profile-meta">'+(a.tier===null?"UNCLASSIFIED":"TIER "+a.tier)+' · '+fmt(a.weight)+' KG · '+fmt(a.cost)+' RU</div><p class="profile-desc">'+esc(artifactDesc(a))+'</p></div></div>'+(a.perk?'<div class="profile-section"><div class="profile-perk"><b>'+esc(a.perkTitle||"SPECIAL PERK")+'</b><div class="perk-description">'+esc(perksText(a))+'</div>'+perkDetailsMarkup(a)+'</div></div>':"")+statGroupMarkup(a)+craftingProfileMarkup(a)+'<div class="profile-actions"><button class="action-btn '+(compareIds.has(a.id)?"selected":"")+'" id="compare-toggle">'+(compareIds.has(a.id)?"REMOVE FROM COMPARE":"ADD TO COMPARE")+'</button></div></div>';$("#compare-toggle").addEventListener("click",()=>{toggleCompare(a.id);openProfile(a)});$("#dialog-content").querySelectorAll("[data-related-artifact]").forEach(button=>button.addEventListener("click",()=>{const related=artifacts.find(x=>x.id===button.dataset.relatedArtifact);if(related)openProfile(related)}));$("#dialog-content").querySelectorAll("[data-craft-artifact]").forEach(button=>button.addEventListener("click",()=>{const related=artifacts.find(x=>x.id===button.dataset.craftArtifact);if(related)openProfile(related)}));if(!dialog.open)dialog.showModal();dialog.scrollTop=0;requestAnimationFrame(()=>{dialog.scrollTop=0;dialog.querySelector(".profile")?.scrollTo(0,0);});}
function toggleCompare(id){if(compareIds.has(id))compareIds.delete(id);else if(compareIds.size<2)compareIds.add(id);else{alert("Compare up to two artifacts at a time.");return}render();renderCompare()}
function renderCompare(){
 const section=$("#compare");if(!section)return;
 if(compareIds.size===0){section.hidden=true;return}
 section.hidden=false;
 const items=[...compareIds].map(id=>artifacts.find(a=>a.id===id)).filter(Boolean);
 const groupOrder=["Protection","Resistance caps","Recovery","Mobility","Utility"];
 const statMap=new Map();
 items.forEach(a=>(a.stats||[]).filter(s=>Number(s.numeric)!==0&&isVisibleStat(s)).forEach(s=>{
  const key=s.label+"|"+s.unit;
  if(!statMap.has(key))statMap.set(key,{label:s.label,unit:s.unit,group:s.group||"Other"});
 }));
 const statRows=[...statMap.values()].sort((a,b)=>{
  const ga=groupOrder.indexOf(a.group),gb=groupOrder.indexOf(b.group);
  return (ga<0?99:ga)-(gb<0?99:gb)||a.label.localeCompare(b.label);
 });
 const groups=[{title:"Protection",keys:["Protection"]},{title:"Resistance caps",keys:["Resistance caps"]},{title:"Recovery",keys:["Recovery"]},{title:"Mobility & utility",keys:["Mobility","Utility"]},{title:"Other effects",keys:["Other"]}];
 const rows=groups.map(group=>{
  const list=statRows.filter(s=>group.keys.includes(s.group));
  if(!list.length)return "";
  return '<div class="compare-category">'+esc(group.title)+'</div>'+list.map(s=>{
   const key=s.label+"|"+s.unit;
   return '<div class="compare-row"><span>'+esc(s.label)+'</span>'+items.map(a=>{
    const found=(a.stats||[]).find(x=>x.label+"|"+x.unit===key&&Number(x.numeric)!==0&&isVisibleStat(x));
    return '<b>'+(found?(found.numeric>0?"+":"")+fmt(found.numeric)+esc(found.unit):" - ")+'</b>';
   }).join("")+'</div>';
  }).join("");
 }).join("");
 const metrics='<div class="compare-row compare-metric"><span>Weight</span>'+items.map(a=>'<b>'+fmt(a.weight)+' kg</b>').join("")+'</div><div class="compare-row compare-metric"><span>Cost</span>'+items.map(a=>'<b>'+fmt(a.cost)+' RU</b>').join("")+'</div>';
 $("#compare-content").innerHTML='<div class="compare-table" style="--compare-count:'+items.length+'"><div class="compare-headings"><span></span>'+items.map(a=>'<h4>'+esc(artifactName(a))+' / '+(a.tier===null?"UNCLASSIFIED":"TIER "+a.tier)+'</h4>').join("")+'</div>'+rows+metrics+'</div>';
}
const recipeName=r=>{const a=artifacts.find(x=>x.id===r.id);return a?artifactName(a):t(r.name)||r.name};
function craftingIngredientName(i){const id=i.artifactId||ingredientArtifactId(i.name);const a=id?artifacts.find(x=>x.id===id):null;return a?artifactName(a):i.name;}
function renderRecipes(){const q=$("#recipe-search").value.toLowerCase();const list=recipes.filter(r=>recipeName(r).toLowerCase().includes(q)||String(r.requiredManual||"").toLowerCase().includes(q)||r.ingredients.some(i=>craftingIngredientName(i).toLowerCase().includes(q)));$("#recipe-list").innerHTML=list.map(r=>'<div class="recipe"><strong>'+esc(recipeName(r))+'</strong>'+outputArtifactIconMarkup(r,true)+'<div class="recipe-tool"><img src="assets/artifacts/itm_artefact_melter.png" alt="" loading="lazy"><span>ARTIFACT MELTER</span></div><small class="recipe-manual">'+esc(r.requiredManual||"No fusion manual required")+'</small><div class="ingredients">'+r.ingredients.map(i=>'<span class="ingredient">'+craftingIconMarkup(i,true)+esc(craftingIngredientName(i))+' '+esc(i.amount)+'</span>').join("")+'</div></div>').join("")||'<div class="empty">NO RECIPES FOUND</div>'}
$("#artifact-dialog").addEventListener("close",()=>document.body.classList.remove("dialog-open"));

$("#artifact-dialog").addEventListener("click",e=>{if(e.target===$("#artifact-dialog"))$("#artifact-dialog").close()});$(".dialog-close").addEventListener("click",()=>$("#artifact-dialog").close());$("#clear-compare")?.addEventListener("click",()=>{compareIds.clear();renderCompare()});["search","attribute"].forEach(id=>$("#"+id)?.addEventListener(id==="search"?"input":"change",render));document.querySelectorAll(".chip[data-filter]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".chip[data-filter]").forEach(x=>x.classList.toggle("active",x===b));render()}));
let craftTreeResizeTimer=0;
window.addEventListener("resize",()=>{
 scheduleRouteRedraw();
 if(document.body.dataset.page==="crafting-tree"){
  clearTimeout(craftTreeResizeTimer);
  craftTreeResizeTimer=setTimeout(()=>requestAnimationFrame(drawCraftTreeConnectors),180);
 }
});
init();