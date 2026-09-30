(() => {
  'use strict';

  const STORAGE_KEY = 'examforge-command-center-v4';
  const TIMETABLE_VERSION = 9;
  const LEGACY_STORAGE_KEYS = ['examforge-command-center-v3'];
  const DEFAULT_EXAMS = [
    { id:'ibps-so-it', name:'IBPS SO IT', prelims:'', mains:'', note:'Primary target — Professional Knowledge + Reasoning + Quant.' },
    { id:'ibps-po', name:'IBPS PO', prelims:'', mains:'', note:'Bank PO target — Quant + Reasoning + English + Mocks.' },
    { id:'rrb-po', name:'RRB PO', prelims:'2026-11-21', mains:'2026-12-20', note:'RRB PO preparation target.' },
    { id:'sbi-po', name:'SBI PO', prelims:'', mains:'', note:'SBI PO preparation target.' },
    { id:'clerk', name:'CLERK', prelims:'', mains:'', note:'Clerk preparation target — speed and accuracy.' }
  ];
  const SUBJECTS = ['Quant','Verbal','Logical Reasoning','Professional Knowledge','Full Mock Test','General Awareness','Data Science'];
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_WEEKLY_SUBTASKS = {};
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const EMBEDDED_DATA = {"app":{"name":"ExamForge — Competitive Exam Command Center","version":"5.0.0","target":["IBPS SO IT","IBPS PO","RRB PO","SBI PO","CLERK"]},"settings":{"weekStart":"monday","autoOpenToday":true,"dailyTargetPercent":85},"weekdayPlans":{"1":{"label":"Monday","quant":["%","Ratio","Average","Mix DI","Speed Maths"],"quantMode":"Concept + timed practice"},"2":{"label":"Tuesday","quant":["SDT","Time & Work","Partnership","DI","Speed Maths"],"quantMode":"Concept + timed practice"},"3":{"label":"Wednesday","quant":["SI & CI","Boat & Stream","P & L","DI","Speed Maths"],"quantMode":"Concept + timed practice"},"4":{"label":"Thursday","quant":["SDT","Mensuration","2 Mock Tests + Analysis","Speed Maths"],"quantMode":"Mocks + analysis + speed"},"5":{"label":"Friday","quant":["PnC","Probability","P & L","2 Mock Tests + Analysis"],"quantMode":"Mocks + analysis"}},"weekendPlans":{"6":{"label":"Saturday","blocks":[["09:00 AM","12:30 PM","Full Mock Test 1 + Analysis + 30 Min Speed Maths","mock"],["08:50 PM","11:15 PM","Full Mock Test 2 + Analysis","mock"],["11:15 PM","01:45 AM","Professional Knowledge Revision","pk"]]},"0":{"label":"Sunday","blocks":[["09:00 AM","12:30 PM","Full Mock Test 1 + Analysis + 30 Min Speed Maths","mock"],["01:30 PM","05:30 PM","3 Verbal Mock Test + Analysis + 2 L.R Mock Test + Analysis","english_reasoning"],["05:30 PM","01:30 AM","Rest + Movies + Relax Mind + Others","rest"]]}},"dailyBlocks":[["08:00 AM","09:00 AM","Fresh, Breakfast, Room and Table Clean","routine",60],["09:00 AM","11:15 AM","Quant Aptitude (According to Plan)","quant",135],["11:20 AM","12:30 PM","G.A. (Current Affairs)","gaCurrent",70],["12:30 PM","01:00 PM","Lunch","break",30],["01:00 PM","01:30 PM","Nap","recovery",30],["01:45 PM","02:15 PM","R.C. Practice","englishRC",30],["02:15 PM","03:05 PM","Grammar / Usage Practice","englishGrammar",50],["04:15 PM","05:30 PM","Logical Reasoning Practice","reasoning",75],["05:35 PM","06:30 PM","Exercise + Vocab","exercise",55],["06:30 PM","07:15 PM","Walk + Static G.A. (Dams, National, International, Govt Schemes etc)","staticGA",45],["07:15 PM","07:45 PM","Nap","recovery",30],["07:45 PM","08:45 PM","Dinner Plan + G.M. Rules","planning",60],["08:50 PM","09:50 PM","Logical Reasoning (B.R., Syllo, CnD, Machine I/O)","reasoningLate",60],["10:00 PM","01:00 AM","Professional Knowledge","pk",180],["01:00 AM","02:00 AM","Data Science","dataScience",60],["02:00 AM","08:00 AM","Sleep","sleep",360]],"taskTemplates":{"routine":[{"title":"Morning reset","subject":"Routine","target":"Fresh, Breakfast, Room and Table Clean","minutes":60,"priority":"medium"}],"quant":[{"title":"Quant Aptitude","subject":"Quant","target":"Complete today's Quant plan: % • Ratio • Average • Mix DI • Speed Maths","minutes":135,"priority":"high"}],"gaCurrent":[{"title":"G.A. (Current Affairs)","subject":"General Awareness","target":"Current affairs reading + notes + important facts","minutes":70,"priority":"high"}],"reasoning":[{"title":"Logical Reasoning Practice","subject":"Logical Reasoning","target":"Puzzles + logical sets; record approach, traps and errors","minutes":75,"priority":"high"}],"exercise":[{"title":"Exercise + Vocab","subject":"Routine","target":"Exercise + vocabulary revision","minutes":55,"priority":"low"}],"staticGA":[{"title":"Static G.A.","subject":"General Awareness","target":"Dams, National, International, Government Schemes and other static G.A.","minutes":45,"priority":"medium"}],"planning":[{"title":"Dinner Plan + G.M. Rules","subject":"Planning","target":"Dinner + G.M. Rules + next-day planning","minutes":60,"priority":"medium"}],"reasoningLate":[{"title":"Logical Reasoning — B.R., Syllo, CnD, Machine I/O","subject":"Logical Reasoning","target":"Timed reasoning practice for B.R., Syllo, CnD and Machine I/O","minutes":60,"priority":"high"}],"pk":[{"title":"Professional Knowledge","subject":"Professional Knowledge","target":"Professional Knowledge study + practice + error log","minutes":180,"priority":"high"}],"dataScience":[{"title":"Data Science","subject":"Data Science","target":"Core Data Science concepts + practice + short revision","minutes":60,"priority":"high"}],"englishRC":[{"title":"RC Practice","subject":"Verbal","target":"4–6 RC passages: timed reading + error log","minutes":30,"priority":"high"}],"englishGrammar":[{"title":"Grammar / Usage Practice","subject":"Verbal","target":"E.S. + E.D. + P.J. practice with mistake analysis","minutes":50,"priority":"high"}]}};

  let baseData = EMBEDDED_DATA;
  let state = blankState();
  let activeDate = startOfDay(new Date());
  let visibleMonth = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
  let filter = 'all';
  let examModalMode = 'add';
  let editingDescriptionTaskId = null;


  /* =========================================================
     CLOUD SYNC
     One shared planner state for every browser/device.
     No login/authentication: anyone with the site URL can edit
     the same shared state, as requested.
     ========================================================= */
  const CLOUD_API = '/api/state';
  let cloudReady = false;
  let cloudDirty = false;
  let cloudSaveTimer = null;
  let cloudSaveInFlight = false;
  let cloudSaveQueued = false;
  let lastCloudUpdatedAt = '';

  function cloudSupported(){
    return location.protocol === 'http:' || location.protocol === 'https:';
  }

  function localStateExists(){
    return !!localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.some(k=>!!localStorage.getItem(k));
  }

  function setCloudStatus(text, tone='neutral'){
    const el=document.getElementById('cloudSyncStatus');
    if(!el) return;
    el.textContent=text;
    el.dataset.tone=tone;
  }

  async function fetchCloudState(){
    if(!cloudSupported()) return {state:null,updatedAt:'',available:false};
    try{
      const res=await fetch(CLOUD_API,{cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      return {state:data.state||null,updatedAt:data.updatedAt||'',available:true};
    }catch(err){
      setCloudStatus('Cloud unavailable • using local copy','warn');
      return {state:null,updatedAt:'',available:false};
    }
  }

  async function pushCloudState(force=false){
    if(!cloudSupported() || (!cloudReady && !force) || cloudSaveInFlight) {
      if(cloudSaveInFlight) cloudSaveQueued=true;
      return false;
    }
    cloudSaveInFlight=true;
    setCloudStatus('Saving to cloud…','busy');
    try{
      const payload={state:clone(state), clientUpdatedAt:state.updatedAt||new Date().toISOString()};
      const res=await fetch(CLOUD_API,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      lastCloudUpdatedAt=data.updatedAt||payload.clientUpdatedAt;
      cloudDirty=false;
      setCloudStatus('Cloud synced ✓','ok');
      return true;
    }catch(err){
      cloudDirty=true;
      setCloudStatus('Sync pending • local copy safe','warn');
      return false;
    }finally{
      cloudSaveInFlight=false;
      if(cloudSaveQueued){ cloudSaveQueued=false; queueCloudSave(); }
    }
  }

  function queueCloudSave(){
    cloudDirty=true;
    if(!cloudReady || !cloudSupported()) return;
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer=setTimeout(()=>pushCloudState(),450);
  }

  async function syncFromCloud({forcePull=false}={}){
    if(!cloudSupported()){
      setCloudStatus('Local file mode • cloud sync needs Render','warn');
      return;
    }
    const remote=await fetchCloudState();
    if(!remote.available){ return; }

    if(remote.state){
      const remoteTime=Date.parse(remote.updatedAt||'')||0;
      const localTime=Date.parse(state.updatedAt||'')||0;
      const localHadData=localStateExists();

      if(forcePull || !localHadData){
        state=normalizeState(remote.state);
        lastCloudUpdatedAt=remote.updatedAt||'';
        localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
        cloudDirty=false;
        renderAll();
        setCloudStatus('Cloud loaded ✓','ok');
        return;
      }

      if(cloudDirty && localTime>=remoteTime){
        await pushCloudState(true);
        return;
      }

      if(remoteTime>localTime){
        state=normalizeState(remote.state);
        lastCloudUpdatedAt=remote.updatedAt||'';
        localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
        cloudDirty=false;
        renderAll();
        setCloudStatus('Updated from cloud ✓','ok');
        return;
      }

      setCloudStatus('Cloud synced ✓','ok');
      if(!lastCloudUpdatedAt) lastCloudUpdatedAt=remote.updatedAt||'';
      return;
    }

    // First deployment / empty database: publish the current desktop copy.
    await pushCloudState(true);
  }

  async function initializeCloudSync(hadLocalState){
    if(!cloudSupported()){
      setCloudStatus('Local file mode • deploy for cloud sync','warn');
      cloudReady=false;
      return;
    }
    setCloudStatus('Connecting to cloud…','busy');
    const remote=await fetchCloudState();
    if(!remote.available){
      cloudReady=true;
      cloudDirty=!!hadLocalState;
      if(hadLocalState) queueCloudSave();
      return;
    }

    if(remote.state){
      const remoteTime=Date.parse(remote.updatedAt||'')||0;
      const localTime=Date.parse(state.updatedAt||'')||0;
      if(hadLocalState && localTime>remoteTime){
        cloudReady=true;
        cloudDirty=true;
        lastCloudUpdatedAt=remote.updatedAt||'';
        await pushCloudState(true);
      } else {
        state=normalizeState(remote.state);
        localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
        cloudReady=true;
        cloudDirty=false;
        lastCloudUpdatedAt=remote.updatedAt||'';
        setCloudStatus('Cloud loaded ✓','ok');
      }
    } else {
      cloudReady=true;
      cloudDirty=true;
      await pushCloudState(true);
    }
  }

  async function manualCloudSync(){
    if(!cloudSupported()){
      toast('Deploy this project to Render to enable cloud sync.');
      return;
    }
    if(cloudDirty){
      await pushCloudState(true);
    } else {
      await syncFromCloud({forcePull:true});
    }
  }

  function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function dateKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function parseDate(s){ if(!s) return null; const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); }
  function fmtDate(d, options={weekday:'long',day:'numeric',month:'long',year:'numeric'}){ return d.toLocaleDateString('en-IN', options); }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function escapeHtml(v){ return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function diffDays(from, to){ const a = startOfDay(from).getTime(), b = startOfDay(to).getTime(); return Math.round((b-a)/86400000); }
  function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return startOfDay(x); }

  function blankState(){
    return {
      version:TIMETABLE_VERSION,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      selectedExamId:'rrb-po',
      exams:clone(DEFAULT_EXAMS),
      logs:{},
      overrides:{},
      mocks:[],
      notes:[],
      weeklySubtasks:clone(DEFAULT_WEEKLY_SUBTASKS)
    };
  }

  async function loadData(){
    try{
      const response = await fetch('./data.json', {cache:'no-store'});
      if(response.ok) baseData = await response.json();
    }catch(_){ baseData = EMBEDDED_DATA; }
  }

  function normalizeState(saved){
    const x = saved && typeof saved === 'object' ? saved : blankState();
    x.version = TIMETABLE_VERSION;
    x.logs ||= {};
    x.overrides ||= {};
    x.mocks ||= [];
    x.notes ||= [];
    if(!Array.isArray(x.notes)) x.notes=[];
    if(!x.weeklySubtasks || typeof x.weeklySubtasks!=='object') x.weeklySubtasks={};
    Object.keys(x.weeklySubtasks).forEach(d=>{
      if(!x.weeklySubtasks[d] || typeof x.weeklySubtasks[d] !== 'object') x.weeklySubtasks[d] = {};
    });
    // Remove only the old demo/example subtasks that were shipped in a previous build.
    const demoIds = new Set([
      'mon-quant-percent','mon-quant-di','mon-quant-speed',
      'tue-quant-average','tue-quant-td','tue-quant-speed'
    ]);
    Object.keys(x.weeklySubtasks).forEach(d=>{
      Object.keys(x.weeklySubtasks[d]).forEach(slot=>{
        if(Array.isArray(x.weeklySubtasks[d][slot])){
          x.weeklySubtasks[d][slot] = x.weeklySubtasks[d][slot].filter(item=>!demoIds.has(item?.id));
          if(!x.weeklySubtasks[d][slot].length) delete x.weeklySubtasks[d][slot];
        }
      });
      if(!Object.keys(x.weeklySubtasks[d]).length) delete x.weeklySubtasks[d];
    });
    // Remove matching demo-generated daily task copies as well, but never touch user-created plans.
    Object.values(x.logs || {}).forEach(log=>{
      if(!Array.isArray(log.tasks)) return;
      log.tasks = log.tasks.filter(t=>!(t.source==='weekly-subtask' && demoIds.has(String(t.weeklyIdentity||'').split('|').pop())));
    });
    if(!Array.isArray(x.mocks)) x.mocks=[];
    x.mocks=x.mocks.map(m=>({
      id:m.id||`mock-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      date:m.date||dateKey(new Date()), name:m.name||'Mock Test', type:m.type||'Full Mock Test',
      overallMarks:m.overallMarks??'', overallOutOf:m.overallOutOf??'',
      sections:{quant:{marks:m.sections?.quant?.marks??'',outOf:m.sections?.quant?.outOf??'',mistakes:m.sections?.quant?.mistakes||''},
      verbal:{marks:m.sections?.verbal?.marks??'',outOf:m.sections?.verbal?.outOf??'',mistakes:m.sections?.verbal?.mistakes||''},
      reasoning:{marks:m.sections?.reasoning?.marks??'',outOf:m.sections?.reasoning?.outOf??'',mistakes:m.sections?.reasoning?.mistakes||''},
      pk:{marks:m.sections?.pk?.marks??'',outOf:m.sections?.pk?.outOf??'',mistakes:m.sections?.pk?.mistakes||''}}
    }));
    x.exams = Array.isArray(x.exams) && x.exams.length ? x.exams : clone(DEFAULT_EXAMS);
    // Keep the exam dates supplied for the RRB PO target even when an older
    // browser save already exists with an empty RRB PO date.
    x.exams = x.exams.map(e => e.id === 'rrb-po'
      ? {...e, prelims: e.prelims || '2026-11-21', mains: e.mains || '2026-12-20'}
      : e
    );
    if(!x.exams.some(e=>e.id===x.selectedExamId)) x.selectedExamId = x.exams[0]?.id || '';
    Object.values(x.logs).forEach(log=>{
      if(!Array.isArray(log.tasks)) log.tasks=[];
      if(!Array.isArray(log.deletedTaskKeys)) log.deletedTaskKeys=[];
      if(!Number.isFinite(Number(log.timetableVersion))) log.timetableVersion=0;
      log.tasks.forEach(t=>{
        if(t.subject==='English') t.subject='Verbal';
        else if(t.subject==='Reasoning') t.subject='Logical Reasoning';
        else if(t.subject==='Mocks') t.subject='Full Mock Test';
        const inferred = inferTemplateKey(t);
        if((t.source||'timetable')==='timetable' && inferred) t.templateKey=inferred;
      });
    });
    return x;
  }

  function saveState(){
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    queueCloudSave();
  }

  function cleanGeneratedTasks(log){
    if(!Array.isArray(log.tasks)) return false;
    const seen = new Set();
    let changed = false;
    log.tasks = log.tasks.filter(t=>{
      const source = t.source || 'timetable';
      const normalizedTitle = String(t.title||'').trim().toLowerCase();
      if(source==='timetable' && normalizedTitle==='active revision'){ changed=true; return false; }
      if(source==='timetable'){
        const key = `${normalizedTitle}|${String(t.time||'').trim()}|${String(t.subject||'').trim().toLowerCase()}`;
        if(seen.has(key)){ changed=true; return false; }
        seen.add(key);
      }
      return true;
    });
    return changed;
  }

  function inferTemplateKey(t, dow=null){
    if(t.templateKey) return String(t.templateKey);
    const time=String(t.time||'').replace(/\s/g,'').toLowerCase();
    const title=String(t.title||'').trim().toLowerCase();
    if(title.includes('quant')) return 'weekday:quant';
    if(title.includes('verbal / english practice') || title.includes('english: 30 min')) return 'weekday:english';
    if(time==='01:45–04:10' && (title.includes('rc practice') || title.includes('r.c. practice'))) return 'weekday:english:legacy-rc';
    if(time==='01:45–04:10' && title.includes('grammar / usage')) return 'weekday:english:legacy-grammar';
    if(time==='01:45–04:10' && title.includes('editorial hour')) return 'weekday:english:legacy-editorial';
    if(title.includes('rc practice') || title.includes('r.c. practice')) return 'weekday:english:rc';
    if(title.includes('grammar / usage') || title.includes('grammar')) return 'weekday:english:grammar';
    if(title.includes('editorial hour') || title === 'editorial') return 'weekday:english:legacy-editorial';
    if(title.includes('reasoning set 1')) return 'weekday:reasoning';
    if(title.includes('reasoning set 2')) return 'weekday:reasoningLate';
    if(title.includes('exercise +')) return 'weekday:exercise';
    if(title.includes('vocabulary / g.m. revision')) return 'weekday:staticGA';
    if(title.includes('dinner + plan') || title.includes('dinner plan')) return 'weekday:planning';
    if(title.includes('professional knowledge')) return 'weekday:pk';
    if(title.includes('data science')) return 'weekday:dataScience';
    if(title.includes('g.a.') && title.includes('current')) return 'weekday:gaCurrent';
    if(title.includes('morning reset')) return 'weekday:routine';
    if(time==='08:00–09:00') return 'weekday:routine';
    return '';
  }

  function taskIdentity(t){
    const stable = inferTemplateKey(t);
    return stable
      ? `${String(t.source||'timetable')}|${stable}`
      : `${String(t.source||'timetable')}|${String(t.title||'').trim().toLowerCase()}|${String(t.time||'').trim()}|${String(t.subject||'').trim().toLowerCase()}`;
  }

  function templateKeyFor(section, idx=null){
    return `weekday:${section}${idx!==null?`:${idx}`:''}`;
  }

  function syncGeneratedTasks(log, d){
    const generated = buildTasks(d);
    const existingKeys = new Set(log.tasks.filter(t=>t.source==='timetable').map(taskIdentity));
    const deletedKeys = new Set(log.deletedTaskKeys || []);
    let changed = false;

    generated.forEach((t,i)=>{
      const key = taskIdentity(t);
      if(existingKeys.has(key) || deletedKeys.has(key)) return;
      log.tasks.push({...clone(t),id:`${dateKey(d)}-auto-${Date.now()}-${i+1}`,done:false,source:'timetable'});
      existingKeys.add(key);
      changed = true;
    });
    return changed;
  }

  function migrateExistingTimetableTasks(log, d){
    let changed = false;
    if(!Array.isArray(log.tasks)) return false;
    if(!Array.isArray(log.deletedTaskKeys)){ log.deletedTaskKeys=[]; changed=true; }

    // Remove duplicate generated tasks while keeping the first saved record.
    const seen = new Set();
    log.tasks = log.tasks.filter(t=>{
      if((t.source||'timetable')!=='timetable') return true;
      const key = taskIdentity(t);
      if(seen.has(key)){ changed=true; return false; }
      seen.add(key);
      return true;
    });

    // Migrate older 01:45–04:10 Verbal data into RC + Grammar only.
    // Editorial Hour was intentionally removed from the timetable.
    const obsoleteEditorialKeys = new Set([
      'timetable|weekday:english:editorial',
      'timetable|weekday:english:legacy-editorial',
      'timetable|weekday:english:editorial'
    ]);
    const hadObsoleteEditorial = log.tasks.some(t =>
      (t.source||'timetable') === 'timetable' &&
      (obsoleteEditorialKeys.has(taskIdentity(t)) || String(t.title||'').trim().toLowerCase() === 'editorial hour')
    );
    if(hadObsoleteEditorial){
      log.tasks = log.tasks.filter(t => !(
        (t.source||'timetable') === 'timetable' &&
        (obsoleteEditorialKeys.has(taskIdentity(t)) || String(t.title||'').trim().toLowerCase() === 'editorial hour')
      ));
      if(!log.deletedTaskKeys.includes('timetable|weekday:english:editorial')) log.deletedTaskKeys.push('timetable|weekday:english:editorial');
      changed = true;
    }

    const oldCombined = log.tasks.filter(t =>
      (t.source||'timetable')==='timetable' && inferTemplateKey(t)==='weekday:english'
    );
    const oldLegacyParts = log.tasks.filter(t =>
      (t.source||'timetable')==='timetable' && ['weekday:english:legacy-rc','weekday:english:legacy-grammar'].includes(inferTemplateKey(t))
    );
    const currentPartKeys = new Set(['weekday:english:rc','weekday:english:grammar']);
    const combinedDeleted = (log.deletedTaskKeys||[]).includes('timetable|weekday:english');

    const englishParts = [
      {key:'weekday:english:rc', idPart:'rc', title:'RC Practice', target:'4–6 RC passages: timed reading + error log', minutes:30, priority:'high', time:'01:45–02:15'},
      {key:'weekday:english:grammar', idPart:'grammar', title:'Grammar / Usage Practice', target:'E.S. + E.D. + P.J. practice with mistake analysis', minutes:50, priority:'high', time:'02:15–03:05'}
    ];

    if(combinedDeleted){
      for(const part of englishParts){
        const key='timetable|'+part.key;
        if(!log.deletedTaskKeys.includes(key)){ log.deletedTaskKeys.push(key); changed=true; }
      }
      const before=log.tasks.length;
      log.tasks = log.tasks.filter(t=>{
        const k=taskIdentity(t);
        return k!=='timetable|weekday:english' && !currentPartKeys.has(inferTemplateKey(t)) && !['weekday:english:legacy-rc','weekday:english:legacy-grammar'].includes(inferTemplateKey(t));
      });
      if(log.tasks.length!==before) changed=true;
    } else if(oldCombined.length || oldLegacyParts.length){
      const sourceTasks=[...oldCombined,...oldLegacyParts];
      const allDone=sourceTasks.length ? sourceTasks.every(t=>t.done) : false;
      const existingByKey=new Map(log.tasks.filter(t=>currentPartKeys.has(inferTemplateKey(t))).map(t=>[inferTemplateKey(t),t]));
      for(const part of englishParts){
        if(log.deletedTaskKeys.includes('timetable|'+part.key)) continue;
        if(!existingByKey.has(part.key)){
          log.tasks.push({
            id:`${dateKey(d)}-auto-${part.idPart}`,
            title:part.title, subject:'Verbal', target:part.target, minutes:part.minutes,
            priority:part.priority, time:part.time, group:'english', templateKey:part.key,
            done:allDone, source:'timetable'
          });
          existingByKey.set(part.key, log.tasks[log.tasks.length-1]);
          changed=true;
        }
      }
      const before=log.tasks.length;
      log.tasks = log.tasks.filter(t=>{
        const inf=inferTemplateKey(t);
        return inf!=='weekday:english' && !['weekday:english:legacy-rc','weekday:english:legacy-grammar'].includes(inf);
      });
      if(log.tasks.length!==before) changed=true;
    }

    // Clean obsolete Saturday generated practice tasks from previous builds.
    const oldSaturdayKeys = new Set([
      'timetable|weekend:6:1','timetable|weekend:6:2','timetable|weekend:6:3',
      'timetable|weekend:6:4','timetable|weekend:6:5'
    ]);
    const beforeSaturday=log.tasks.length;
    log.tasks = log.tasks.filter(t=>{
      if((t.source||'timetable')!=='timetable') return true;
      return !oldSaturdayKeys.has(taskIdentity(t));
    });
    if(log.tasks.length!==beforeSaturday) changed=true;

    log.tasks.forEach(t=>{
      if((t.source||'timetable')!=='timetable') return;
      const inferred=inferTemplateKey(t);
      if(inferred && t.templateKey!==inferred){t.templateKey=inferred;changed=true;}
      if(t.subject==='English'){t.subject='Verbal';changed=true;}
      if(t.subject==='Reasoning'){t.subject='Logical Reasoning';changed=true;}
      if(t.subject==='Mocks'){t.subject='Full Mock Test';changed=true;}
    });

    if(Number(log.timetableVersion||0)<TIMETABLE_VERSION){log.timetableVersion=TIMETABLE_VERSION;changed=true;}
    return changed;
  }


  function weekdayIndexForDate(d){ return String(d.getDay()); }
  function getWeeklyPlan(dow, slotKey){
    return (state.weeklySubtasks?.[String(dow)]?.[slotKey]) || [];
  }
  function isContainerTask(t){ return !!t?.isSubtaskContainer; }
  function isTrackableTask(t){ return !isContainerTask(t); }
  function weeklySubtaskIdentity(dow, slotKey, subId){ return `weekly-subtask|${dow}|${slotKey}|${subId}`; }
  function markSlotContainers(log, d){
    const slots=timetableSlotsForDay(d);
    slots.forEach(slot=>{
      const count=getWeeklyPlan(d.getDay(),slot.key).length;
      const parent=log.tasks.find(t=>inferTemplateKey(t)===slot.key && t.source==='timetable');
      if(parent) parent.isSubtaskContainer=count>0;
    });
  }
  function syncWeeklySubtasks(log,d){
    let changed=false;
    if(!Array.isArray(log.deletedTaskKeys)) log.deletedTaskKeys=[];
    const dow=d.getDay();
    const deleted=new Set(log.deletedTaskKeys);
    const slots=timetableSlotsForDay(d);
    slots.forEach(slot=>{
      const plan=getWeeklyPlan(dow,slot.key);
      if(!plan.length) return;
      plan.forEach((sub,idx)=>{
        const key=weeklySubtaskIdentity(dow,slot.key,sub.id);
        const existing=log.tasks.find(t=>t.source==='weekly-subtask' && t.weeklyIdentity===key);
        if(existing){
          existing.time=slot.time; existing.parentTemplateKey=slot.key; existing.minutes=Number(sub.minutes||5); existing.subject=sub.subject||slot.type; existing.title=sub.title; existing.target=sub.target||sub.title; existing.priority=sub.priority||'high';
          return;
        }
        if(deleted.has(key)) return;
        const task={
          id:`${dateKey(d)}-sub-${slot.key.replace(/[^a-z0-9]+/gi,'-')}-${sub.id}`,
          title:sub.title, subject:sub.subject||slot.type, target:sub.target||sub.title,
          minutes:Number(sub.minutes||5), priority:sub.priority||'high', time:slot.time,
          group:'weekly-subtask', source:'weekly-subtask', weeklyIdentity:key,
          parentTemplateKey:slot.key, weeklyDay:dow, done:false, isSubtask:true
        };
        const parentIndex=log.tasks.findIndex(t=>t.source==='timetable' && inferTemplateKey(t)===slot.key);
        if(parentIndex>=0){
          let insertAt=parentIndex+1;
          while(insertAt<log.tasks.length && log.tasks[insertAt].isSubtask && log.tasks[insertAt].parentTemplateKey===slot.key) insertAt++;
          log.tasks.splice(insertAt,0,task);
        }else log.tasks.push(task);
        changed=true;
      });
    });
    markSlotContainers(log,d);
    return changed;
  }

  function ensureLog(d){
    const k = dateKey(d);
    if(!state.logs[k]) state.logs[k] = {tasks:[], notes:'', score:'', sleep:'', productiveMinutesManual:0, dayStatus:'none', dayStatusAt:null, deletedTaskKeys:[], timetableVersion:TIMETABLE_VERSION};
    if(!Array.isArray(state.logs[k].tasks)) state.logs[k].tasks = [];
    if(!Array.isArray(state.logs[k].deletedTaskKeys)) state.logs[k].deletedTaskKeys = [];
    if(!Number.isFinite(Number(state.logs[k].timetableVersion))) state.logs[k].timetableVersion = 0;
    if(!['none','done','missed'].includes(state.logs[k].dayStatus)) state.logs[k].dayStatus = 'none';
    if(!('dayStatusAt' in state.logs[k])) state.logs[k].dayStatusAt = null;

    const cleaned = cleanGeneratedTasks(state.logs[k]);
    const migrated = migrateExistingTimetableTasks(state.logs[k], d);
    const weeklySynced = syncWeeklySubtasks(state.logs[k], d);
    let changed = cleaned || migrated || weeklySynced;

    if(!state.logs[k].tasks.length){
      const deleted = new Set(state.logs[k].deletedTaskKeys || []);
      state.logs[k].tasks = buildTasks(d)
        .filter(t => !deleted.has(taskIdentity(t)))
        .map((t,i)=>({...t,id:`${k}-auto-${i+1}`,done:false,source:'timetable'}));
      changed = true;
    } else if(syncGeneratedTasks(state.logs[k], d)) {
      changed = true;
    }

    if(changed) saveState();
    return state.logs[k];
  }

  function buildTasks(d){
    const dow=d.getDay();
    if(dow===0 || dow===6) return buildWeekendTasks(d);
    const plan=baseData.weekdayPlans?.[String(dow)] || {label:DAY_NAMES[dow],quant:[],quantMode:'Concept + timed practice'};
    const tt=baseData.taskTemplates||{};
    const tasks=[];
    const add=(section,time,key)=>{
      (tt[section]||[]).forEach((t)=>tasks.push({...clone(t),time,group:section,templateKey:key}));
    };

    add('routine','08:00–09:00','weekday:routine');
    const quant=clone(tt.quant?.[0]||{});
    quant.title='Quant Aptitude'; quant.subject='Quant';
    quant.target=plan.quant.join(' • '); quant.minutes=135; quant.priority='high';
    quant.time='09:00–11:15'; quant.group='quant'; quant.templateKey='weekday:quant';
    tasks.push(quant);
    add('gaCurrent','11:20–12:30','weekday:gaCurrent');
    add('englishRC','01:45–02:15','weekday:english:rc');
    add('englishGrammar','02:15–03:05','weekday:english:grammar');
    add('reasoning','04:15–05:30','weekday:reasoning');
    add('exercise','05:35–06:30','weekday:exercise');
    add('staticGA','06:30–07:15','weekday:staticGA');
    add('planning','07:45–08:45','weekday:planning');
    add('reasoningLate','08:50–09:50','weekday:reasoningLate');
    add('pk','10:00–01:00','weekday:pk');
    add('dataScience','01:00–02:00','weekday:dataScience');
    return tasks;
  }

  function buildWeekendTasks(d){
    const p=baseData.weekendPlans?.[String(d.getDay())];
    return (p?.blocks||[]).map((b,i)=>{
      const [start,end,title,group,blockMinutes]=b;
      let subject=group==='pk'?'Professional Knowledge':group==='mock'?'Full Mock Test':group==='english_reasoning'?'Verbal':group==='reasoning'?'Logical Reasoning':group==='english'?'Verbal':group==='rest'?'Routine':'Routine';
      if(title.toLowerCase().includes('lr')) subject='Logical Reasoning';
      return {
        title,
        subject,
        target:title,
        minutes:Number(blockMinutes||durationGuess(title,group)),
        priority:group==='rest'?'low':'high',
        time:`${start}–${end}`,
        group,
        templateKey:`weekend:${d.getDay()}:${i}`,
        id:`${dateKey(d)}-auto-${i+1}`,
        done:false,
        source:'timetable'
      };
    });
  }

  function durationGuess(title,group){
    if(group==='rest') return 480;
    if(title.includes('3 Verbal') || title.includes('2 LR')) return 240;
    if(title.includes('Mock Test 1')) return 210;
    return 210;
  }

  function getTasks(d){ return ensureLog(d).tasks; }
  function completion(tasks){ const arr=(tasks||[]).filter(isTrackableTask); return arr.length ? Math.round(arr.filter(t=>t.done).length/arr.length*100) : 0; }
  function productiveMinutes(d){
    const log=ensureLog(d);
    const taskMinutes=log.tasks.filter(t=>isTrackableTask(t) && t.done && !['Routine','Planning','Rest','Recovery','Break','Sleep'].includes(t.subject)).reduce((a,t)=>a+Number(t.minutes||0),0);
    return taskMinutes + Number(log.productiveMinutesManual||0);
  }
  function subjectMinutes(d,subject){ return getTasks(d).filter(t=>isTrackableTask(t) && t.done && t.subject===subject).reduce((a,t)=>a+Number(t.minutes||0),0); }
  function getAllLogKeys(){ return Object.keys(state.logs).sort(); }
  function getDayStatus(d){ return ensureLog(d).dayStatus || 'none'; }

  function setDayStatus(d,status){
    const log=ensureLog(d);
    log.dayStatus=status;
    log.dayStatusAt=new Date().toISOString();
    saveState();
    closeDayStatusModal();
    renderAll();
    toast(status==='done'?'Day marked DONE ✓':'Day marked MISSED ✕');
  }

  function resetDayStatus(d){
    const log=ensureLog(d);
    log.dayStatus='none';
    log.dayStatusAt=null;
    saveState();
    closeDayStatusModal();
    renderAll();
    toast('Day status reset — tasks were kept unchanged');
  }

  function openDayStatusModal(d){
    activeDate=startOfDay(d);
    visibleMonth=new Date(activeDate.getFullYear(),activeDate.getMonth(),1);
    document.getElementById('dayStatusTitle').textContent=`${fmtDate(activeDate,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
    const current=getDayStatus(activeDate);
    document.getElementById('dayStatusSubtitle').textContent=current==='done'
      ? 'Currently marked DONE. Choose again to keep it or mark it MISSED.'
      : current==='missed'
        ? 'Currently marked MISSED. Choose again to keep it or mark it DONE.'
        : 'Choose the result for this day. You can change it later by double-tapping the date again.';
    document.getElementById('dayStatusBackdrop').classList.remove('hidden');
  }

  function closeDayStatusModal(){ document.getElementById('dayStatusBackdrop').classList.add('hidden'); }


  function calculateStreak(){
    let d=startOfDay(new Date()), n=0;
    const todayKey=dateKey(d);
    if(state.logs[todayKey] && completion(getTasks(d))>=85) n=1; else if(!state.logs[todayKey]) d=addDays(d,-1);
    if(n===1) d=addDays(d,-1);
    while(true){
      const k=dateKey(d), log=state.logs[k];
      if(!log || !log.tasks.length || completion(log.tasks)<85) break;
      n++; d=addDays(d,-1); if(n>1000) break;
    }
    return n;
  }

  function getSelectedExam(){ return state.exams.find(e=>e.id===state.selectedExamId) || null; }

  function examDateLine(exam){
    const parts=[];
    if(exam.prelims) parts.push(`<span class="exam-date-chip prelims"><b>PRELIMS</b>${formatDateShort(exam.prelims)}</span>`);
    else parts.push(`<span class="exam-date-chip empty-date"><b>PRELIMS</b>Not set</span>`);
    if(exam.mains) parts.push(`<span class="exam-date-chip mains"><b>MAINS</b>${formatDateShort(exam.mains)}</span>`);
    else parts.push(`<span class="exam-date-chip empty-date"><b>MAINS</b>Not set</span>`);
    return parts.join('');
  }
  function formatDateShort(s){ const d=parseDate(s); return d ? d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Not set'; }
  function countdownText(s){
    const d=parseDate(s); if(!d) return 'Date not set';
    const days=diffDays(new Date(),d);
    if(days>1) return `${days} days left`;
    if(days===1) return 'Tomorrow';
    if(days===0) return 'Today';
    if(days===-1) return 'Yesterday';
    return `${Math.abs(days)} days ago`;
  }

  function getExamStageAndDate(exam){
    const today = new Date();
    const prelims = exam.prelims ? parseDate(exam.prelims) : null;
    const mains = exam.mains ? parseDate(exam.mains) : null;
    const prelimsRemaining = prelims ? diffDays(today, prelims) : null;
    const mainsRemaining = mains ? diffDays(today, mains) : null;

    if(prelims && prelimsRemaining >= 0) return { stage:'Prelims', date:exam.prelims, days:prelimsRemaining };
    if(mains && mainsRemaining >= 0) return { stage:'Mains', date:exam.mains, days:mainsRemaining };
    if(mains) return { stage:'Mains', date:exam.mains, days:mainsRemaining };
    if(prelims) return { stage:'Prelims', date:exam.prelims, days:prelimsRemaining };
    return { stage:'Set dates', date:'', days:null };
  }

  function examListDate(exam, key){
    const value = exam[key];
    return value ? formatDateShort(value) : '—';
  }

  function renderTopExamCountdowns(){
    const list = document.getElementById('datedExamList');
    const count = document.getElementById('datedExamCount');
    if(!list || !count) return;

    const datedExams = state.exams.filter(e => !!(e.prelims || e.mains));
    count.textContent = `${datedExams.length} ${datedExams.length===1?'exam':'exams'}`;

    if(!datedExams.length){
      list.innerHTML = '<div class="active-target-empty">Add an exam date from <b>+ Add Exam</b> to show its countdown here.</div>';
      return;
    }

    const today = new Date();
    const rows = datedExams.map(exam => {
      const target = getExamStageAndDate(exam);
      const isActive = exam.id === state.selectedExamId;
      const countdown = target.date ? countdownText(target.date) : 'Date not set';
      const stageClass = target.stage.toLowerCase();
      return `
        <button class="exam-countdown-row ${isActive?'active':''}" data-exam-id="${escapeHtml(exam.id)}" type="button">
          <span class="exam-countdown-name">
            <strong>${escapeHtml(exam.name)}</strong>
            <small><b>PRELIMS</b> ${escapeHtml(examListDate(exam,'prelims'))} <i>•</i> <b>MAINS</b> ${escapeHtml(examListDate(exam,'mains'))}</small>
          </span>
          <span class="exam-countdown-status ${stageClass}">
            <b>${escapeHtml(target.stage)}</b>
            <small>${escapeHtml(countdown)}</small>
          </span>
        </button>`;
    }).join('');

    list.innerHTML = rows;
    list.querySelectorAll('.exam-countdown-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.examId;
        if(!state.exams.some(e=>e.id===id)) return;
        state.selectedExamId = id;
        saveState();
        renderExamWidget();
        toast('Active exam changed');
      });
    });
  }

  function renderExamWidget(){
    const select=document.getElementById('examSelector');
    select.innerHTML=state.exams.map(e=>`<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`).join('');
    select.value=state.selectedExamId;
    const exam=getSelectedExam();
    const box=document.getElementById('selectedExamDetails');

    if(!exam){
      box.innerHTML='<div class="no-exam">No exam selected.</div>';
      renderTopExamCountdowns();
      return;
    }

    const target = getExamStageAndDate(exam);
    const nextStage = target.stage;
    const nextDate = target.date;

    box.innerHTML=`
      <div class="selected-exam-title"><div><strong>${escapeHtml(exam.name)}</strong><span>${escapeHtml(exam.note||'')}</span></div><button class="mini-link" id="editSelectedExam">Edit</button></div>
      <div class="exam-dates">${examDateLine(exam)}</div>
      <div class="exam-countdown"><div><span>ACTIVE STAGE</span><b>${escapeHtml(nextStage)}</b></div><div><span>COUNTDOWN</span><b>${escapeHtml(countdownText(nextDate))}</b></div></div>`;

    document.getElementById('editSelectedExam').addEventListener('click',()=>openExamModal('edit',exam.id));
    renderTopExamCountdowns();

    const focus=document.getElementById('examFocusNote');
    focus.textContent = nextStage==='Set dates'
      ? 'Set your Prelims and Mains dates above to turn on countdown mode.'
      : `${exam.name} • ${nextStage} is the current target stage • keep today’s plan aligned with the timetable.`;
  }

  function renderHero(){
    const tasks=getTasks(activeDate), trackableTasks=tasks.filter(isTrackableTask), done=trackableTasks.filter(t=>t.done).length, pct=completion(tasks);
    document.getElementById('dateTitle').textContent=fmtDate(activeDate);
    const dow=activeDate.getDay();
    document.getElementById('dayTheme').textContent=(dow===0||dow===6)?'Mock + analysis + recovery':'Execute the timetable • finish the plan • log the result';
    document.getElementById('dayProgressText').textContent=`${pct}%`;
    document.getElementById('dayProgressBar').style.width=`${pct}%`;
    document.getElementById('doneCount').textContent=done;
    document.getElementById('pendingCount').textContent=trackableTasks.length-done;
    document.getElementById('productiveHours').textContent=(productiveMinutes(activeDate)/60).toFixed(1)+'h';
    document.getElementById('streak').textContent=calculateStreak();
    const status=getDayStatus(activeDate);
    const statusLabel=status==='done'?'✓ DAY DONE':status==='missed'?'✕ DAY MISSED':'DAY STATUS: NOT MARKED';
    const note=document.getElementById('examFocusNote');
    if(status==='done') note.textContent=`✓ ${fmtDate(activeDate,{weekday:'short',day:'numeric',month:'short'})} is marked DONE — keep the streak alive.`;
    else if(status==='missed') note.textContent=`✕ ${fmtDate(activeDate,{weekday:'short',day:'numeric',month:'short'})} is marked MISSED — review the cause and restart immediately.`;
    else if(getSelectedExam()){ const exam=getSelectedExam(); const nextStage = exam.prelims && diffDays(new Date(),parseDate(exam.prelims))>=0 ? 'Prelims' : exam.mains ? 'Mains' : 'Set exam dates'; note.textContent = nextStage==='Set exam dates' ? 'Set your Prelims and Mains dates above to turn on countdown mode.' : `${exam.name} • ${nextStage} is the current target stage • keep today’s plan aligned with the timetable.`; }
  }

  function renderCalendar(){
    const year=visibleMonth.getFullYear(), month=visibleMonth.getMonth();
    document.getElementById('monthLabel').textContent=`${MONTHS[month]} ${year}`;
    document.getElementById('calendarHead').innerHTML=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div>${x}</div>`).join('');
    const first=new Date(year,month,1), last=new Date(year,month+1,0);
    const dayOffset=(first.getDay()+6)%7, total=Math.ceil((dayOffset+last.getDate())/7)*7;
    const todayKey=dateKey(startOfDay(new Date()));
    let html='';
    for(let i=0;i<total;i++){
      const num=i-dayOffset+1;
      const d=new Date(year,month,num);
      const inMonth=d.getMonth()===month;
      const tasks=getTasks(d), pct=completion(tasks), status=getDayStatus(d);
      const statusClass=status==='done'?'status-done-day':status==='missed'?'status-missed-day':'';
      const cls=[!inMonth?'muted-day':'',dateKey(d)===todayKey?'today':'',dateKey(d)===dateKey(activeDate)?'selected':'',statusClass,!statusClass&&pct>=85?'done':'',!statusClass&&pct>0?'partial':''].filter(Boolean).join(' ');
      const dayMark=status==='done'?'✓':status==='missed'?'✕':'';
      html+=`<button class="calendar-day ${cls}" data-date="${dateKey(d)}" title="Double-click / double-tap to mark DONE or MISSED"><span class="num">${d.getDate()}</span><span class="calendar-day-status">${dayMark}</span><span class="calendar-pct">${inMonth&&tasks.length?pct+'%':''}</span><span class="dot"></span></button>`;
    }
    document.getElementById('calendar').innerHTML=html;
    document.querySelectorAll('.calendar-day').forEach(b=>{
      b.addEventListener('click',()=>{
        activeDate=parseDate(b.dataset.date); visibleMonth=new Date(activeDate.getFullYear(),activeDate.getMonth(),1); filter='all'; updateFilterButtons(); renderAll();
      });
      b.addEventListener('dblclick',()=>openDayStatusModal(parseDate(b.dataset.date)));
      let lastTouch=0;
      b.addEventListener('touchend',ev=>{
        const now=Date.now();
        if(now-lastTouch<360){ ev.preventDefault(); openDayStatusModal(parseDate(b.dataset.date)); lastTouch=0; }
        else lastTouch=now;
      },{passive:false});
    });
  }

  function renderBoardSummary(){
    const tasks=getTasks(activeDate), trackableTasks=tasks.filter(isTrackableTask), done=trackableTasks.filter(t=>t.done).length;
    const minutes=productiveMinutes(activeDate);
    document.getElementById('boardSummary').innerHTML=`<span><b>${done}/${trackableTasks.length}</b> completed</span><span><b>${minutes} min</b> productive</span><span><b>${completion(tasks)}%</b> day score</span>`;
  }

  function renderTasks(){
    let tasks=getTasks(activeDate);
    if(filter==='pending') tasks=tasks.filter(t=>isContainerTask(t) ? (getSubtasksForTask(t.id).some(s=>!s.done)) : !t.done);
    if(filter==='done') tasks=tasks.filter(t=>isContainerTask(t) ? getSubtasksForTask(t.id).length && getSubtasksForTask(t.id).every(s=>s.done) : t.done);
    const box=document.getElementById('taskList');
    if(!tasks.length){ box.innerHTML='<div class="empty">No tasks in this filter. Deleted tasks stay removed for this day.</div>'; return; }

    const renderOne=(t, nested=false)=>{
      const target=String(t.target||'').trim();
      const title=String(t.title||'').trim();
      const showTarget=target && target.toLowerCase()!==title.toLowerCase() ? target : '';
      const subtasks=getSubtasksForTask(t.id);
      const isContainer=isContainerTask(t);
      const allSubDone=isContainer && subtasks.length && subtasks.every(s=>s.done);
      const containerLabel=isContainer ? `${subtasks.length} sub-task${subtasks.length===1?'':'s'}` : '';
      return `<div class="task ${t.done?'done':''} ${t.priority||'medium'} ${nested?'task-subtask':''} ${isContainer?'task-container':''}">
        <button class="check" data-id="${escapeHtml(t.id)}" title="${isContainer?'Toggle all sub-tasks':`Mark ${t.done?'pending':'done'}`}">${isContainer?(allSubDone?'✓':''):(t.done?'✓':'')}</button>
        <div class="task-main">
          <div class="task-title editable-task-field" data-edit-task="${escapeHtml(t.id)}" title="Double-click / double-tap to edit task">${escapeHtml(t.title)}</div>
          <div class="task-target editable-description ${showTarget?'':'empty-description'}" data-edit-desc="${escapeHtml(t.id)}" title="Double-click / double-tap to edit description">${showTarget?escapeHtml(showTarget):'Double-click / double-tap to add or edit description'}</div>
          <div class="task-meta"><span class="editable-task-subject" data-edit-task="${escapeHtml(t.id)}" title="Double-click / double-tap to edit subject">${escapeHtml(t.subject)}</span><span>${escapeHtml(t.time||'Custom')}</span><span>${Number(t.minutes||0)} min</span>${containerLabel?`<span class="subtask-count">${escapeHtml(containerLabel)}</span>`:''}</div>
        </div>
        <div class="task-side"><span class="pill ${escapeHtml(t.priority||'medium')}">${escapeHtml(t.priority||'medium')}</span><button class="delete-task" data-delete="${escapeHtml(t.id)}" title="Remove task">Remove</button></div>
      </div>`;
    };

    const out=[];
    tasks.forEach(t=>{
      if(t.isSubtask){ out.push(renderOne(t,true)); return; }
      out.push(renderOne(t,false));
    });
    box.innerHTML=out.join('');
    box.querySelectorAll('.check').forEach(b=>b.addEventListener('click',()=>setTaskDone(b.dataset.id)));
    box.querySelectorAll('.delete-task').forEach(b=>b.addEventListener('click',()=>deleteTask(b.dataset.delete)));
    box.querySelectorAll('[data-edit-task]').forEach(el=>{
      el.addEventListener('dblclick',()=>openTaskEditor(el.dataset.editTask));
      let lastTouch=0;
      el.addEventListener('touchend',ev=>{
        const now=Date.now();
        if(now-lastTouch<360){ ev.preventDefault(); openTaskEditor(el.dataset.editTask); lastTouch=0; }
        else lastTouch=now;
      },{passive:false});
    });
    box.querySelectorAll('[data-edit-desc]').forEach(el=>{
      el.addEventListener('dblclick',()=>beginDescriptionEdit(el.dataset.editDesc));
      let lastTouch=0;
      el.addEventListener('touchend',ev=>{
        const now=Date.now();
        if(now-lastTouch<360){ ev.preventDefault(); beginDescriptionEdit(el.dataset.editDesc); lastTouch=0; }
        else lastTouch=now;
      },{passive:false});
    });
  }

  function getSubtasksForTask(parentId){
    const log=ensureLog(activeDate), parent=log.tasks.find(t=>t.id===parentId);
    if(!parent) return [];
    return log.tasks.filter(t=>t.isSubtask && t.parentTemplateKey===inferTemplateKey(parent));
  }

  let editingTaskId = null;

  function openTaskEditor(id){
    const log=ensureLog(activeDate), task=log.tasks.find(t=>t.id===id);
    if(!task) return;
    editingTaskId=id;
    document.getElementById('editTaskTitle').value=task.title||'';
    document.getElementById('editTaskSubject').value=task.subject||'Other';
    document.getElementById('editTaskTarget').value=task.target||'';
    document.getElementById('editTaskTime').value=task.time||'Custom';
    document.getElementById('editTaskMinutes').value=Number(task.minutes||30);
    document.getElementById('editTaskPriority').value=task.priority||'medium';
    document.getElementById('taskEditModal').classList.remove('hidden');
    setTimeout(()=>document.getElementById('editTaskTitle')?.focus(),20);
  }

  function closeTaskEditor(){
    editingTaskId=null;
    document.getElementById('taskEditModal')?.classList.add('hidden');
  }

  function saveTaskEdit(e){
    e.preventDefault();
    if(!editingTaskId) return;
    const log=ensureLog(activeDate), task=log.tasks.find(t=>t.id===editingTaskId);
    if(!task){ closeTaskEditor(); return; }

    task.title=document.getElementById('editTaskTitle').value.trim() || task.title;
    task.subject=document.getElementById('editTaskSubject').value;
    task.target=document.getElementById('editTaskTarget').value.trim();
    task.time=document.getElementById('editTaskTime').value.trim() || task.time;
    task.minutes=Math.max(5,Number(document.getElementById('editTaskMinutes').value||task.minutes||30));
    task.priority=document.getElementById('editTaskPriority').value;

    // templateKey remains unchanged so an edited timetable task is not duplicated.
    saveState();
    closeTaskEditor();
    renderAll();
    toast('Task + subject updated ✓');
  }

  function beginDescriptionEdit(id){
    if(editingDescriptionTaskId) return;
    const log=ensureLog(activeDate), task=log.tasks.find(t=>t.id===id);
    if(!task) return;
    editingDescriptionTaskId=id;
    const el=Array.from(document.querySelectorAll('[data-edit-desc]')).find(node=>node.dataset.editDesc===id);
    if(!el) return;
    el.classList.add('description-editing');
    el.innerHTML=`<div class="description-editor">
      <textarea class="description-input" rows=3>${escapeHtml(task.target||'')}</textarea>
      <div class="description-actions">
        <button type="button" class="description-save" title="Save description">✓</button>
        <button type="button" class="description-cancel" title="Cancel changes">✕</button>
      </div>
    </div>`;
    const input=el.querySelector('.description-input');
    input.focus(); input.setSelectionRange(input.value.length,input.value.length);
    el.querySelector('.description-save').addEventListener('click',()=>saveDescriptionEdit(id,input.value));
    el.querySelector('.description-cancel').addEventListener('click',cancelDescriptionEdit);
    input.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();saveDescriptionEdit(id,input.value);}
      if(e.key==='Escape'){e.preventDefault();cancelDescriptionEdit();}
    });
  }

  function saveDescriptionEdit(id,value){
    const log=ensureLog(activeDate), task=log.tasks.find(t=>t.id===id);
    if(!task){ cancelDescriptionEdit(); return; }
    task.target=String(value||'').trim();
    editingDescriptionTaskId=null;
    saveState(); renderAll(); toast('Task description saved ✓');
  }

  function cancelDescriptionEdit(){
    editingDescriptionTaskId=null;
    renderTasks();
  }

  function setTaskDone(id){
    const log=ensureLog(activeDate), t=log.tasks.find(x=>x.id===id);
    if(!t) return;
    if(t.isSubtaskContainer){
      const subs=getSubtasksForTask(id);
      const next=!subs.length || !subs.every(s=>s.done);
      subs.forEach(s=>{s.done=next;});
      saveState(); renderAll(); toast(next?'All sub-tasks completed ✓':'Sub-tasks moved to pending');
      return;
    }
    t.done=!t.done;
    saveState(); renderAll();
    toast(t.done?'Task completed ✓':'Task moved to pending');
  }

  function deleteTask(id){
    const log=ensureLog(activeDate);
    const task=log.tasks.find(t=>t.id===id);
    if(!task) return;
    if(!confirm(`Remove “${task.title}” from this day? It will stay deleted for this date.`)) return;
    if(task.source==='timetable'){
      const key=taskIdentity(task);
      if(!Array.isArray(log.deletedTaskKeys)) log.deletedTaskKeys=[];
      if(!log.deletedTaskKeys.includes(key)) log.deletedTaskKeys.push(key);
    }
    log.tasks=log.tasks.filter(t=>t.id!==id);
    saveState();
    renderAll();
    toast('Task deleted from this day ✓');
  }

  const WEEKDAY_TIMETABLE = [
    {key:'weekday:routine',time:'08:00–09:00',label:'08:00 AM – 09:00 AM',title:'Fresh, Breakfast, Room and Table Clean',type:'Routine',minutes:60,editable:true},
    {key:'weekday:quant',time:'09:00–11:15',label:'09:00 AM – 11:15 AM',title:'Quant Aptitude',type:'Quant',minutes:135,editable:true,priority:true},
    {key:'weekday:gaCurrent',time:'11:20–12:30',label:'11:20 AM – 12:30 PM',title:'G.A. (Current Affairs)',type:'General Awareness',minutes:70,editable:true},
    {key:'break:lunch',time:'12:30–01:00',label:'12:30 PM – 01:00 PM',title:'Lunch',type:'Break',minutes:30,editable:false},
    {key:'recovery:nap1',time:'01:00–01:30',label:'01:00 PM – 01:30 PM',title:'Nap',type:'Recovery',minutes:30,editable:false},
    {key:'weekday:english:rc',time:'01:45–02:15',label:'01:45 PM – 02:15 PM',title:'RC Practice',type:'Verbal',minutes:30,editable:true},
    {key:'weekday:english:grammar',time:'02:15–03:05',label:'02:15 PM – 03:05 PM',title:'Grammar / Usage Practice',type:'Verbal',minutes:50,editable:true},
    {key:'weekday:reasoning',time:'04:15–05:30',label:'04:15 PM – 05:30 PM',title:'Logical Reasoning Practice',type:'Logical Reasoning',minutes:75,editable:true},
    {key:'weekday:exercise',time:'05:35–06:30',label:'05:35 PM – 06:30 PM',title:'Exercise + Vocab',type:'Routine',minutes:55,editable:true},
    {key:'weekday:staticGA',time:'06:30–07:15',label:'06:30 PM – 07:15 PM',title:'Walk + Static G.A.',type:'General Awareness',minutes:45,editable:true},
    {key:'recovery:nap2',time:'07:15–07:45',label:'07:15 PM – 07:45 PM',title:'Nap',type:'Recovery',minutes:30,editable:false},
    {key:'weekday:planning',time:'07:45–08:45',label:'07:45 PM – 08:45 PM',title:'Dinner Plan + G.M. Rules',type:'Planning',minutes:60,editable:true},
    {key:'weekday:reasoningLate',time:'08:50–09:50',label:'08:50 PM – 09:50 PM',title:'Logical Reasoning — B.R., Syllo, CnD, Machine I/O',type:'Logical Reasoning',minutes:60,editable:true},
    {key:'weekday:pk',time:'10:00–01:00',label:'10:00 PM – 01:00 AM',title:'Professional Knowledge',type:'Professional Knowledge',minutes:180,editable:true},
    {key:'weekday:dataScience',time:'01:00–02:00',label:'01:00 AM – 02:00 AM',title:'Data Science',type:'Data Science',minutes:60,editable:true},
    {key:'sleep',time:'02:00–08:00',label:'02:00 AM – 08:00 AM',title:'Sleep',type:'Sleep',minutes:360,editable:false}
  ];

  function weekendSlots(d){
    const dow=d.getDay(), p=baseData.weekendPlans?.[String(dow)], rows=p?.blocks||[];
    return rows.map((b,i)=>({key:`weekend:${dow}:${i}`,time:`${String(b[0]).replace(' AM','').replace(' PM','')}–${String(b[1]).replace(' AM','').replace(' PM','')}`,label:`${b[0]} – ${b[1]}`,title:b[2],type:(b[3]||'Routine'),minutes:Number(b[4]||durationGuess(b[2],b[3])),editable:true,priority:b[3]!=='rest'}));
  }

  function timetableSlotsForDay(d){
    return (d.getDay()===0 || d.getDay()===6) ? weekendSlots(d) : WEEKDAY_TIMETABLE;
  }

  function renderSchedule(){
    const box=document.getElementById('schedule');
    if(!box) return;
    const slots=timetableSlotsForDay(activeDate);
    const tasks=ensureLog(activeDate).tasks;
    const timetableByKey=new Map(tasks.filter(t=>t.source==='timetable').map(t=>[inferTemplateKey(t),t]));
    const rows=[];
    slots.forEach(slot=>{
      const parent=timetableByKey.get(slot.key);
      const subtasks=parent ? getSubtasksForTask(parent.id) : [];
      const subDone=subtasks.filter(t=>t.done).length;
      const isBreak=['Break','Recovery','Sleep'].includes(slot.type);
      if(!parent && isBreak){
        rows.push(`<div class="schedule-row schedule-static ${slot.type.toLowerCase()}">
          <div class="schedule-time">${escapeHtml(slot.label)}</div>
          <div><div class="schedule-activity">${escapeHtml(slot.title)}</div></div>
          <div class="schedule-actions"><span class="schedule-type">${escapeHtml(slot.type)}${slot.minutes?` • ${slot.minutes}m`:''}</span></div>
        </div>`);
        return;
      }
      if(!parent){
        rows.push(`<div class="schedule-row schedule-open-slot">
          <div class="schedule-time">${escapeHtml(slot.label)}</div>
          <div><div class="schedule-activity">Open time block</div><div class="schedule-note">Optional weekly sub-task plan</div></div>
          <div class="schedule-actions"><span class="schedule-type">OPEN</span><button type="button" class="schedule-plan-btn" data-subtask-slot="${escapeHtml(slot.key)}" title="Add weekly sub-tasks to this time block">＋ Plan</button></div>
        </div>`);
        return;
      }
      const target=String(parent.target||'').trim();
      const shortTarget=target && target.toLowerCase()!==String(parent.title||'').toLowerCase() ? ` • ${escapeHtml(target)}` : '';
      const subInfo=subtasks.length ? `<span class="schedule-subtasks">${subDone}/${subtasks.length}</span>` : '';
      rows.push(`<div class="schedule-row ${slot.priority?'priority-row':''} ${subtasks.length?'has-subtasks':''}">
        <div class="schedule-time">${escapeHtml(parent.time||slot.label)}</div>
        <div><div class="schedule-activity">${escapeHtml(parent.title)}</div><div class="schedule-note">${escapeHtml(parent.subject)}${shortTarget}</div></div>
        <div class="schedule-actions"><span class="schedule-type">${escapeHtml(parent.priority||slot.type)} • ${Number(parent.minutes||slot.minutes)}m</span>${subInfo}<button type="button" class="schedule-plan-btn" data-subtask-slot="${escapeHtml(slot.key)}" title="Manage weekly sub-tasks for this time block">${subtasks.length?'Plan':'＋ Plan'}</button></div>
      </div>`);
    });
    box.innerHTML=rows.join('') || '<div class="empty">No timetable blocks for this day.</div>';
    box.querySelectorAll('.schedule-plan-btn[data-subtask-slot]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); openWeeklySubtaskManager(btn.dataset.subtaskSlot);}));
  }

  function renderSubjects(){
    // Subject completion must be based on that subject's own assigned tasks,
    // not on how much time it represents compared with the entire day.
    // Example: 1 of 3 Verbal tasks done = 33%, while 3 of 3 = 100%.
    const tasks=getTasks(activeDate);
    document.getElementById('subjectStats').innerHTML=SUBJECTS.map(s=>{
      const subjectTasks=tasks.filter(t=>t.subject===s);
      const doneTasks=subjectTasks.filter(t=>t.done).length;
      const planned=subjectTasks.reduce((a,t)=>a+Number(t.minutes||0),0);
      const doneMinutes=subjectTasks.filter(t=>t.done).reduce((a,t)=>a+Number(t.minutes||0),0);
      const taskPct=subjectTasks.length?Math.round(doneTasks/subjectTasks.length*100):0;
      const timePct=planned?Math.round(doneMinutes/planned*100):0;
      return `<div class="subject-row" data-subject="${escapeHtml(s)}" title="${subjectTasks.length?`Click to show ${escapeHtml(s)} tasks`: 'No tasks assigned for this subject today'}">
        <div class="subject-line"><b>${escapeHtml(s)}</b><span>${doneTasks}/${subjectTasks.length} tasks • ${doneMinutes}/${planned} min</span></div>
        <div class="subject-meter"><div style="width:${taskPct}%"></div></div>
        <div class="subject-share"><strong>${taskPct}% task completion</strong> • ${timePct}% productive-time completion</div>
      </div>`;
    }).join('');
    document.querySelectorAll('#subjectStats .subject-row[data-subject]').forEach(row=>{
      row.addEventListener('click',()=>{
        const s=row.dataset.subject;
        filter='all';
        updateFilterButtons();
        renderTasks();
        const first=Array.from(document.querySelectorAll('#taskList .task')).find(el=>el.querySelector('.task-meta span')?.textContent===s);
        if(first) first.scrollIntoView({behavior:'smooth',block:'center'});
      });
    });
  }

  function dayRangeKeys(days){
    const end=startOfDay(new Date()), keys=[];
    if(days==='all') return getAllLogKeys();
    let start=addDays(end,-(Number(days)-1));
    for(let d=start; d<=end; d=addDays(d,1)) keys.push(dateKey(d));
    return keys;
  }

  function renderOverall(){
    const keys=dayRangeKeys(document.getElementById('analyticsRange').value);
    const stats={}; let completedDays=0, totalTracked=0;
    SUBJECTS.forEach(s=>stats[s]={planned:0,doneMinutes:0,totalTasks:0,doneTasks:0});
    keys.forEach(k=>{
      const log=state.logs[k]; if(!log?.tasks?.length) return;
      totalTracked++;
      if(completion(log.tasks)>=85) completedDays++;
      SUBJECTS.forEach(s=>{
        const st=stats[s], arr=log.tasks.filter(t=>t.subject===s);
        st.totalTasks+=arr.length;
        st.doneTasks+=arr.filter(t=>t.done).length;
        st.planned+=arr.reduce((a,t)=>a+Number(t.minutes||0),0);
        st.doneMinutes+=arr.filter(t=>t.done).reduce((a,t)=>a+Number(t.minutes||0),0);
      });
    });
    const rows=SUBJECTS.map(s=>{
      const st=stats[s];
      const taskPct=st.totalTasks?Math.round(st.doneTasks/st.totalTasks*100):0;
      const timePct=st.planned?Math.round(st.doneMinutes/st.planned*100):0;
      return `<div class="overall-row"><div class="subject-line"><b>${escapeHtml(s)}</b><span>${st.doneTasks}/${st.totalTasks} tasks • ${st.doneMinutes}/${st.planned} min</span></div><div class="subject-meter"><div style="width:${taskPct}%"></div></div><div class="subject-share"><strong>${taskPct}% task completion</strong> • ${timePct}% productive-time completion</div></div>`;
    }).join('');
    document.getElementById('overallStats').innerHTML=`<div class="overall-summary"><div><b>${completedDays}</b><span>85%+ days</span></div><div><b>${totalTracked}</b><span>tracked days</span></div><div><b>${keys.length}</b><span>range days</span></div></div>${rows}`;
  }

  function renderNextDay(){
    const d=addDays(activeDate,1), tasks=getTasks(d);
  }


  function summaryDaysCount(kind){ return kind==='week'?7:daysInMonth(activeDate.getFullYear(),activeDate.getMonth()); }
  function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
  function eachDateForPeriod(kind){
    const end=kind==='week'?startOfDay(new Date()):new Date(activeDate.getFullYear(),activeDate.getMonth(),daysInMonth(activeDate.getFullYear(),activeDate.getMonth()));
    if(kind==='week'){ const start=addDays(end,-6); const arr=[]; for(let d=start; d<=end; d=addDays(d,1)) arr.push(startOfDay(d)); return arr; }
    const start=new Date(end.getFullYear(),end.getMonth(),1), arr=[]; for(let d=start; d<=end; d=addDays(d,1)) arr.push(startOfDay(d)); return arr;
  }
  function plannedProductiveMinutesForDay(d){
    return getTasks(d).filter(t=>!['Routine','Planning','Rest','Recovery','Break','Sleep'].includes(t.subject)).reduce((a,t)=>a+Number(t.minutes||0),0);
  }
  function periodSummary(kind){
    const dates=eachDateForPeriod(kind), rows=dates.map(d=>{ const tasks=getTasks(d), done=tasks.filter(t=>t.done).length, productive=productiveMinutes(d), planned=plannedProductiveMinutesForDay(d), status=getDayStatus(d); return {d,tasks,done,pending:tasks.length-done,productive,planned,status,pct:completion(tasks)}; });
    const totalPlanned=rows.reduce((a,r)=>a+r.planned,0), totalProd=rows.reduce((a,r)=>a+r.productive,0);
    const completedDays=rows.filter(r=>r.pct>=85).length, markedDone=rows.filter(r=>r.status==='done').length, missedDays=rows.filter(r=>r.status==='missed').length;
    const productivityPct=totalPlanned?Math.min(100,Math.round(totalProd/totalPlanned*100)):0;
    return {rows,totalPlanned,totalProd,completedDays,markedDone,missedDays,productivityPct};
  }
  function openSummaryModal(kind){
    const data=periodSummary(kind), isWeek=kind==='week';
    document.getElementById('summaryModalTitle').textContent=isWeek?'Weekly Summary':'Monthly Summary';
    document.getElementById('summaryModalSubtitle').textContent=isWeek?'Last 7 days — consistency, unfinished work and productive study.':`${MONTHS[activeDate.getMonth()]} ${activeDate.getFullYear()} — complete performance review.`;
    const label=isWeek?'7 DAYS':`${MONTHS[activeDate.getMonth()].toUpperCase()} ${activeDate.getFullYear()}`;
    document.getElementById('summaryContent').innerHTML=`<div class="summary-period-tag">${label}</div><div class="summary-kpi-grid"><div><b>${data.productivityPct}%</b><span>Productive</span></div><div><b>${data.completedDays}</b><span>85%+ days</span></div><div><b>${data.markedDone}</b><span>Marked done</span></div><div><b>${data.missedDays}</b><span>Marked missed</span></div><div><b>${data.totalProd}m</b><span>Productive time</span></div><div><b>${data.totalPlanned}m</b><span>Planned productive</span></div></div><div class="summary-table-wrap"><table class="summary-table"><thead><tr><th>Date</th><th>Day</th><th>Incomplete</th><th>Productive</th><th>Day score</th><th>Result</th></tr></thead><tbody>${data.rows.map(r=>`<tr><td>${formatDateShort(dateKey(r.d))}</td><td>${r.d.toLocaleDateString('en-IN',{weekday:'short'})}</td><td>${r.pending}</td><td>${r.productive} min</td><td>${r.tasks.length?r.pct+'%':'—'}</td><td><span class="summary-status ${r.status}">${r.status==='done'?'DONE':r.status==='missed'?'MISSED':r.pct>=85?'85%+':r.pct>0?'STARTED':'NOT MARKED'}</span></td></tr>`).join('')}</tbody></table></div>`;
    document.getElementById('summaryModalBackdrop').classList.remove('hidden');
  }
  function closeSummaryModal(){ document.getElementById('summaryModalBackdrop').classList.add('hidden'); }

  function parseNum(v){ return v===''||v==null?'':Number(v); }
  function mockPct(marks,out){ return Number(out)>0?Math.round(Number(marks)/Number(out)*100):null; }
  function saveMock(e){
    e.preventDefault();
    const name=document.getElementById('mockName').value.trim(); if(!name){toast('Mock name is required');return;}
    const m={id:`mock-${Date.now()}`,date:document.getElementById('mockDate').value||dateKey(activeDate),name,type:document.getElementById('mockType').value,
      overallMarks:parseNum(document.getElementById('mockOverallMarks').value),overallOutOf:parseNum(document.getElementById('mockOverallOutOf').value),sections:{
        quant:{marks:parseNum(document.getElementById('mockQuantMarks').value),outOf:parseNum(document.getElementById('mockQuantOutOf').value),mistakes:document.getElementById('mockQuantMistakes').value.trim()},
        verbal:{marks:parseNum(document.getElementById('mockVerbalMarks').value),outOf:parseNum(document.getElementById('mockVerbalOutOf').value),mistakes:document.getElementById('mockVerbalMistakes').value.trim()},
        reasoning:{marks:parseNum(document.getElementById('mockReasoningMarks').value),outOf:parseNum(document.getElementById('mockReasoningOutOf').value),mistakes:document.getElementById('mockReasoningMistakes').value.trim()},
        pk:{marks:parseNum(document.getElementById('mockPKMarks').value),outOf:parseNum(document.getElementById('mockPKOutOf').value),mistakes:document.getElementById('mockPKMistakes').value.trim()}
      }};
    state.mocks.unshift(m); saveState(); clearMockForm(); renderMockHistory(); renderNotes(); toast('Mock analysis saved ✓');
  }
  function clearMockForm(){
    const f=document.getElementById('mockForm'); if(!f) return; f.reset(); document.getElementById('mockDate').value=dateKey(activeDate); document.getElementById('mockType').value='Full Mock Test';
  }
  function mockRecordScore(m){
    if(m.overallMarks!=='' && m.overallOutOf!=='') return `${m.overallMarks} / ${m.overallOutOf}`;
    const parts=Object.values(m.sections||{}).filter(x=>x.marks!==''&&x.outOf!=='');
    const a=parts.reduce((v,x)=>v+Number(x.marks||0),0), b=parts.reduce((v,x)=>v+Number(x.outOf||0),0); return b?`${a} / ${b}`:'—';
  }
  function mockDetail(m){
    const sections=[['Quant','quant'],['Verbal','verbal'],['Logical Reasoning','reasoning'],['Professional Knowledge','pk']];
    return `<div class="mock-detail-summary"><div><span>DATE</span><b>${formatDateShort(m.date)}</b></div><div><span>MOCK</span><b>${escapeHtml(m.name)}</b></div><div><span>TYPE</span><b>${escapeHtml(m.type)}</b></div><div><span>OVERALL</span><b>${escapeHtml(mockRecordScore(m))}</b></div></div><div class="mock-detail-grid">${sections.map(([label,key])=>{const s=m.sections[key]||{}; return `<div class="mock-detail-card"><div class="mock-detail-head"><b>${label}</b><strong>${s.marks!==''&&s.outOf!==''?escapeHtml(`${s.marks} / ${s.outOf}`):'—'}</strong></div><div class="mock-detail-percent">${mockPct(s.marks,s.outOf)!=null?mockPct(s.marks,s.outOf)+'%':'Score not entered'}</div><div class="mistake-box"><span>MISTAKES / NOTES</span><p>${escapeHtml(s.mistakes||'No mistakes written')}</p></div></div>`}).join('')}</div>`;
  }
  function openMockView(id){ const m=state.mocks.find(x=>x.id===id); if(!m)return; document.getElementById('mockViewTitle').textContent=m.name; document.getElementById('mockViewSubtitle').textContent=`${formatDateShort(m.date)} • ${m.type} • Overall ${mockRecordScore(m)}`; document.getElementById('mockViewContent').innerHTML=mockDetail(m); document.getElementById('mockViewBackdrop').classList.remove('hidden'); }
  function closeMockView(){document.getElementById('mockViewBackdrop').classList.add('hidden');}
  function deleteMock(id){ if(!confirm('Delete this mock record?'))return; state.mocks=state.mocks.filter(m=>m.id!==id); saveState(); renderMockHistory(); renderNotes(); toast('Mock record deleted'); }
  function renderMockHistory(){
    const box=document.getElementById('mockHistory'); if(!box)return; const filterVal=document.getElementById('mockHistoryFilter')?.value||'all'; const arr=state.mocks.filter(m=>filterVal==='all'||m.type===filterVal);
    document.getElementById('mockHistoryCount').textContent=`${state.mocks.length} saved`;
    if(!arr.length){box.innerHTML='<div class="empty">No mock records yet. Enter your first score above.</div>';return;}
    box.innerHTML=arr.map(m=>`<div class="mock-history-row"><div class="mock-history-main"><div class="mock-history-title"><b>${escapeHtml(m.name)}</b><span>${escapeHtml(m.type)}</span></div><div class="mock-history-meta">${formatDateShort(m.date)} • Overall <strong>${escapeHtml(mockRecordScore(m))}</strong></div></div><div class="mock-history-actions"><button class="mini-link view-mock" data-view-mock="${escapeHtml(m.id)}">View</button><button class="mini-link danger-text delete-mock" data-delete-mock="${escapeHtml(m.id)}">Delete</button></div></div>`).join('');
    box.querySelectorAll('[data-view-mock]').forEach(b=>b.addEventListener('click',()=>openMockView(b.dataset.viewMock))); box.querySelectorAll('[data-delete-mock]').forEach(b=>b.addEventListener('click',()=>deleteMock(b.dataset.deleteMock)));
  }

  
  const NOTE_STATUS_META={covered:{icon:'✓',label:'Covered'},incomplete:{icon:'◐',label:'Incomplete'},remaining:{icon:'!',label:'Remaining'},unseen:{icon:'○',label:'Unseen'}};
  const NOTE_SYMBOLS={Quant:'Σ',Verbal:'📖','Logical Reasoning':'🧠','Professional Knowledge':'💻','Full Mock Test':'🎯',Other:'✦'};
  function ensureNotes(){ if(!Array.isArray(state.notes)) state.notes=[]; }
  function openNotesModal(note=null, category=''){
    ensureNotes(); const m=document.getElementById('notesModal'); if(!m) return;
    const f=document.getElementById('notesForm'); f.dataset.editId=note?.id||'';
    document.getElementById('notesModalTitle').textContent=note?'Edit Note':'Add Note';
    document.getElementById('noteCategory').value=note?.category||category||'Quant';
    document.getElementById('noteTopic').value=note?.topic||''; document.getElementById('noteStatus').value=note?.status||'covered'; document.getElementById('noteDetails').value=note?.details||'';
    m.classList.remove('hidden'); setTimeout(()=>document.getElementById('noteTopic')?.focus(),20);
  }
  function closeNotesModal(){document.getElementById('notesModal')?.classList.add('hidden');}
  function renderNotes(){
    ensureNotes(); const list=document.getElementById('notesList'), empty=document.getElementById('notesEmpty'), sel=document.getElementById('notesCategoryFilter'); if(!list||!empty) return;
    const cat=sel?.value||'ALL'; const notes=state.notes.filter(n=>cat==='ALL'||n.category===cat).sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')));
    list.innerHTML='';
    if(!notes.length){empty.classList.remove('hidden');return;} empty.classList.add('hidden');
    notes.forEach(n=>{const meta=NOTE_STATUS_META[n.status]||NOTE_STATUS_META.unseen; const card=document.createElement('article'); card.className=`note-card note-cat-${slugNote(n.category)} note-status-${n.status}`; card.dataset.noteId=n.id; card.title='Double-click to edit this note'; card.innerHTML=`<div class="note-symbol">${NOTE_SYMBOLS[n.category]||'✦'}</div><div class="note-main"><div class="note-topline"><strong>${escapeHtml(n.topic)}</strong><span class="note-status-badge">${meta.icon} ${meta.label}</span></div><div class="note-category">${escapeHtml(n.category)}${n.date?' · '+escapeHtml(n.date):''}</div>${n.details?`<div class="note-details">${escapeHtml(n.details)}</div>`:''}</div><button class="note-delete" data-note-delete="${escapeHtml(n.id)}" type="button">Remove</button>`; list.appendChild(card);});
  }
  function slugNote(v){return String(v||'Other').toLowerCase().replace(/[^a-z0-9]+/g,'-');}
  function saveNote(e){
    e.preventDefault(); ensureNotes(); const f=e.currentTarget, id=f.dataset.editId; const data={category:document.getElementById('noteCategory').value,topic:document.getElementById('noteTopic').value.trim(),status:document.getElementById('noteStatus').value,details:document.getElementById('noteDetails').value.trim(),date:dateKey(activeDate),updatedAt:new Date().toISOString()}; if(!data.topic)return;
    if(id){const i=state.notes.findIndex(n=>n.id===id); if(i>=0)state.notes[i]={...state.notes[i],...data};} else state.notes.push({id:`note-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,createdAt:new Date().toISOString(),...data});
    saveState(); renderNotes(); closeNotesModal(); toast(id?'Note updated.':'Note added.');
  }
  function deleteNote(id){ensureNotes(); state.notes=state.notes.filter(n=>n.id!==id); saveState(); renderNotes(); toast('Note removed.');}
function renderAll(){
    ensureLog(activeDate);
    renderExamWidget(); renderHero(); renderCalendar(); renderSchedule(); renderBoardSummary(); renderTasks(); renderSubjects(); renderOverall(); renderMockHistory(); renderNotes();
  }

  function move(delta){ activeDate=addDays(activeDate,delta); visibleMonth=new Date(activeDate.getFullYear(),activeDate.getMonth(),1); filter='all'; updateFilterButtons(); renderAll(); }

  function resolveTaskTime(){
    const v=document.getElementById('taskTime').value;
    if(v==='CUSTOM') return document.getElementById('taskCustomTime').value.trim() || 'Custom time';
    return v || 'Flexible';
  }


  let weeklySubtaskSlotKey='';
  let weeklySubtaskDay=activeDate.getDay();
  let editingWeeklySubtaskId='';

  function getAllTimetableSlotDefinitions(){
    const all=[...WEEKDAY_TIMETABLE];
    all.push(...weekendSlots(new Date(2026,8,28))); // Saturday
    all.push(...weekendSlots(new Date(2026,8,27))); // Sunday
    return all;
  }
  function getSlotDefinition(slotKey){ return getAllTimetableSlotDefinitions().find(s=>s.key===slotKey) || null; }
  function slotMinutesForKey(slotKey){ return Number(getSlotDefinition(slotKey)?.minutes||0); }
  function weekDayLabel(dow){ return DAY_NAMES[dow] || 'Day'; }
  function availableSubtaskDays(slotKey){
    if(String(slotKey).startsWith('weekday:') || String(slotKey).startsWith('break:') || String(slotKey).startsWith('recovery:') || slotKey==='sleep') return [1,2,3,4,5];
    if(String(slotKey).startsWith('weekend:6:')) return [6];
    if(String(slotKey).startsWith('weekend:0:')) return [0];
    return [weeklySubtaskDay];
  }
  function renderWeeklySubtaskDays(){
    const box=document.getElementById('weeklySubtaskDays'); if(!box) return;
    const allowed=availableSubtaskDays(weeklySubtaskSlotKey);
    if(!allowed.includes(weeklySubtaskDay)) weeklySubtaskDay=allowed[0];
    box.innerHTML=allowed.map(dow=>{const name=DAY_NAMES[dow]; return `<button type="button" class="weekday-tab ${weeklySubtaskDay===dow?'active':''}" data-weekday="${dow}">${name.slice(0,3)}</button>`;}).join('');
    box.querySelectorAll('[data-weekday]').forEach(b=>b.addEventListener('click',()=>{weeklySubtaskDay=Number(b.dataset.weekday); editingWeeklySubtaskId=''; renderWeeklySubtaskManager();}));
  }
  function renderWeeklySubtaskManager(){
    const slot=getSlotDefinition(weeklySubtaskSlotKey); if(!slot) return;
    const plan=clone(getWeeklyPlan(weeklySubtaskDay,weeklySubtaskSlotKey));
    const total=plan.reduce((a,x)=>a+Number(x.minutes||0),0);
    const max=Number(slot.minutes||slotMinutesForKey(weeklySubtaskSlotKey)||0);
    document.getElementById('weeklySubtaskTitle').textContent=slot.title;
    document.getElementById('weeklySubtaskContext').textContent=`${slot.label} • ${slot.type} • ${weekDayLabel(weeklySubtaskDay)}`;
    document.getElementById('weeklySubtaskDayLabel').textContent=`${weekDayLabel(weeklySubtaskDay)} weekly plan`;
    document.getElementById('weeklySubtaskMinutes').textContent=`${total} / ${max} min`;
    document.getElementById('weeklySubtaskFoot').textContent= total<max ? `${max-total} minutes left in this block.` : total===max ? 'Time block fully planned.' : `${total-max} minutes over the block — reduce a sub-task before saving more.`;
    const list=document.getElementById('weeklySubtaskList');
    list.innerHTML=plan.length ? plan.map(s=>`<div class="weekly-subtask-item"><div><b>${escapeHtml(s.title)}</b><span>${Number(s.minutes)} min${s.target?` • ${escapeHtml(s.target)}`:''}</span></div><div class="weekly-subtask-item-actions"><button type="button" class="mini-link" data-edit-weekly-sub="${escapeHtml(s.id)}">Edit</button><button type="button" class="mini-link danger-text" data-delete-weekly-sub="${escapeHtml(s.id)}">Remove</button></div></div>`).join('') : '<div class="weekly-subtask-empty">No sub-tasks yet for this weekday.</div>';
    document.getElementById('weeklySubtaskForm').dataset.maxMinutes=String(max);
    document.getElementById('weeklySubtaskTitleInput').value='';
    document.getElementById('weeklySubtaskMinutesInput').value=45;
    document.getElementById('weeklySubtaskEditId').value='';
    document.getElementById('weeklySubtaskSaveBtn').textContent='＋ Add';
    list.querySelectorAll('[data-edit-weekly-sub]').forEach(b=>b.addEventListener('click',()=>editWeeklySubtask(b.dataset.editWeeklySub)));
    list.querySelectorAll('[data-delete-weekly-sub]').forEach(b=>b.addEventListener('click',()=>deleteWeeklySubtask(b.dataset.deleteWeeklySub)));
    renderWeeklySubtaskDays();
  }
  function openWeeklySubtaskManager(slotKey){
    weeklySubtaskSlotKey=slotKey;
    weeklySubtaskDay=activeDate.getDay();
    editingWeeklySubtaskId='';
    document.getElementById('weeklySubtaskModal')?.classList.remove('hidden');
    renderWeeklySubtaskManager();
    setTimeout(()=>document.getElementById('weeklySubtaskTitleInput')?.focus(),20);
  }
  function closeWeeklySubtaskManager(){ editingWeeklySubtaskId=''; document.getElementById('weeklySubtaskModal')?.classList.add('hidden'); }
  function editWeeklySubtask(id){
    const plan=getWeeklyPlan(weeklySubtaskDay,weeklySubtaskSlotKey), item=plan.find(x=>x.id===id); if(!item) return;
    document.getElementById('weeklySubtaskEditId').value=id;
    document.getElementById('weeklySubtaskTitleInput').value=item.title;
    document.getElementById('weeklySubtaskMinutesInput').value=Number(item.minutes||45);
    document.getElementById('weeklySubtaskSaveBtn').textContent='✓ Save';
    document.getElementById('weeklySubtaskTitleInput').focus();
  }
  function deleteWeeklySubtask(id){
    if(!confirm('Remove this weekly sub-task? It will stop appearing on future matching weekdays.')) return;
    const dow=String(weeklySubtaskDay);
    const plan=state.weeklySubtasks?.[dow]?.[weeklySubtaskSlotKey] || [];
    state.weeklySubtasks[dow][weeklySubtaskSlotKey]=plan.filter(x=>x.id!==id);
    const key=weeklySubtaskIdentity(weeklySubtaskDay,weeklySubtaskSlotKey,id);
    Object.values(state.logs).forEach(log=>{
      if(!Array.isArray(log.deletedTaskKeys)) log.deletedTaskKeys=[];
      if(!log.deletedTaskKeys.includes(key)) log.deletedTaskKeys.push(key);
      log.tasks=(log.tasks||[]).filter(t=>t.weeklyIdentity!==key);
    });
    saveState(); ensureLog(activeDate); renderAll(); renderWeeklySubtaskManager(); toast('Weekly sub-task removed');
  }
  function saveWeeklySubtask(e){
    e.preventDefault();
    const title=document.getElementById('weeklySubtaskTitleInput').value.trim();
    const mins=Math.max(5,Number(document.getElementById('weeklySubtaskMinutesInput').value||45));
    const editId=document.getElementById('weeklySubtaskEditId').value;
    if(!title) return;
    const slot=getSlotDefinition(weeklySubtaskSlotKey); if(!slot) return;
    const dow=String(weeklySubtaskDay);
    state.weeklySubtasks[dow] ||= {};
    const plan=state.weeklySubtasks[dow][weeklySubtaskSlotKey] ||= [];
    const currentTotal=plan.reduce((a,x)=>a+Number(x.minutes||0),0);
    const currentItem=editId ? plan.find(x=>x.id===editId) : null;
    const newTotal=currentTotal-(currentItem?Number(currentItem.minutes||0):0)+mins;
    if(newTotal>Number(slot.minutes||0)){ toast(`Only ${Math.max(0,Number(slot.minutes||0)-(currentTotal-(currentItem?Number(currentItem.minutes||0):0)))} minutes are available in this block.`); return; }
    if(editId && currentItem){ currentItem.title=title; currentItem.minutes=mins; currentItem.subject=slot.type; currentItem.target=currentItem.target||title; }
    else plan.push({id:`sub-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title,minutes:mins,subject:slot.type,target:title,priority:'high'});
    // Unlock the weekly identity if it was previously deleted.
    const savedId=editId || plan[plan.length-1].id;
    const log=ensureLog(activeDate);
    log.deletedTaskKeys=(log.deletedTaskKeys||[]).filter(k=>k!==weeklySubtaskIdentity(weeklySubtaskDay,weeklySubtaskSlotKey,savedId));
    saveState();
    ensureLog(activeDate);
    renderAll();
    renderWeeklySubtaskManager();
    toast(editId?'Weekly sub-task updated ✓':'Weekly sub-task added ✓');
  }

  function addCustomTask(e){
    e.preventDefault();
    const log=ensureLog(activeDate);
    const title=document.getElementById('taskTitle').value.trim(); if(!title) return;
    log.tasks.push({
      id:`${dateKey(activeDate)}-custom-${Date.now()}`,
      title,
      subject:document.getElementById('taskSubject').value,
      target:document.getElementById('taskTarget').value.trim()||'Complete and log result',
      minutes:Number(document.getElementById('taskMinutes').value||30),
      priority:document.getElementById('taskPriority').value,
      time:resolveTaskTime(),
      group:'custom',
      done:false,
      source:'custom'
    });
    saveState(); e.target.reset(); document.getElementById('taskMinutes').value=30; renderAll(); toast('Task assigned to selected day');
  }

  function exportJson(){
    const payload={meta:{exportedAt:new Date().toISOString(),app:baseData.app},timetable:baseData,tracker:state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=`examforge-complete-backup-${dateKey(new Date())}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('Complete JSON backup exported');
  }

  function importJson(file){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const obj=JSON.parse(reader.result);
        const incoming=obj.tracker||obj.progress||obj.state;
        if(!incoming || typeof incoming!=='object') throw new Error('missing tracker');
        state=normalizeState(incoming); saveState(); renderAll(); toast('JSON backup imported successfully');
      }catch(_){ toast('Invalid ExamForge JSON backup'); }
    };
    reader.readAsText(file);
  }

  function resetAll(){
    if(!confirm('Reset all local progress, custom tasks and exam targets?')) return;
    state=blankState(); saveState(); ensureLog(activeDate); renderAll(); toast('Local progress reset');
  }

  function openExamModal(mode='add', id=''){
    examModalMode=mode;
    document.getElementById('examModalTitle').textContent=mode==='edit'?'Edit Exam':'Add Exam';
    const exam=mode==='edit' ? state.exams.find(e=>e.id===id) : null;
    document.getElementById('examId').value=exam?.id||'';
    document.getElementById('examName').value=exam?.name||'';
    document.getElementById('prelimsDate').value=exam?.prelims||'';
    document.getElementById('mainsDate').value=exam?.mains||'';
    document.getElementById('examNote').value=exam?.note||'';
    renderSavedExams();
    document.getElementById('examModalBackdrop').classList.remove('hidden');
    setTimeout(()=>document.getElementById('examName').focus(),50);
  }

  function closeExamModal(){ document.getElementById('examModalBackdrop').classList.add('hidden'); }

  function renderSavedExams(){
    const box=document.getElementById('savedExams');
    box.innerHTML=`<div class="saved-head">Saved Exam Targets <span>${state.exams.length}</span></div>` + state.exams.map(e=>`<div class="saved-exam"><div><b>${escapeHtml(e.name)}</b><span>${escapeHtml(e.prelims?formatDateShort(e.prelims):'Prelims — not set')} • ${escapeHtml(e.mains?formatDateShort(e.mains):'Mains — not set')}</span></div><div class="saved-actions"><button class="mini-link" data-edit-exam="${escapeHtml(e.id)}">Edit</button><button class="mini-link danger-text" data-delete-exam="${escapeHtml(e.id)}">Delete</button></div></div>`).join('');
    box.querySelectorAll('[data-edit-exam]').forEach(b=>b.addEventListener('click',()=>openExamModal('edit',b.dataset.editExam)));
    box.querySelectorAll('[data-delete-exam]').forEach(b=>b.addEventListener('click',()=>deleteExam(b.dataset.deleteExam)));
  }

  function saveExam(e){
    e.preventDefault();
    const name=document.getElementById('examName').value.trim(); if(!name){ toast('Exam name is required'); return; }
    const id=document.getElementById('examId').value || `${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${Date.now()}`;
    const exam={id,name,prelims:document.getElementById('prelimsDate').value,mains:document.getElementById('mainsDate').value,note:document.getElementById('examNote').value.trim()};
    const idx=state.exams.findIndex(x=>x.id===id);
    if(idx>=0) state.exams[idx]=exam; else state.exams.push(exam);
    state.selectedExamId=id;
    saveState(); closeExamModal(); renderAll(); toast(examModalMode==='edit'?'Exam target updated':'Exam target added and selected');
  }

  function deleteExam(id){
    if(state.exams.length<=1){ toast('Keep at least one exam target'); return; }
    const exam=state.exams.find(e=>e.id===id); if(!exam) return;
    if(!confirm(`Delete ${exam.name}?`)) return;
    state.exams=state.exams.filter(e=>e.id!==id);
    if(state.selectedExamId===id) state.selectedExamId=state.exams[0].id;
    saveState(); renderSavedExams(); renderAll(); toast('Exam target deleted');
  }

  function updateFilterButtons(){ document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter)); }
  function toast(message){
    const region=document.getElementById('toastRegion'), el=document.createElement('div');
    el.className='toast'; el.textContent=message; region.appendChild(el); setTimeout(()=>el.remove(),2200);
  }


  document.getElementById('addNoteBtn')?.addEventListener('click',()=>openNotesModal());
  document.getElementById('notesCategoryFilter')?.addEventListener('change',renderNotes);
  document.querySelectorAll('[data-close-notes]').forEach(b=>b.addEventListener('click',closeNotesModal));
  document.getElementById('notesForm')?.addEventListener('submit',saveNote);
  document.getElementById('notesModal')?.addEventListener('click',e=>{if(e.target.id==='notesModal')closeNotesModal();});
  document.getElementById('notesList')?.addEventListener('dblclick',e=>{const card=e.target.closest('.note-card'); if(!card||e.target.closest('.note-delete'))return; const n=state.notes.find(x=>x.id===card.dataset.noteId); if(n)openNotesModal(n);});
  document.getElementById('notesList')?.addEventListener('click',e=>{const b=e.target.closest('[data-note-delete]'); if(b){e.stopPropagation();deleteNote(b.dataset.noteDelete);}});
  document.getElementById('noteCategoryGrid')?.addEventListener('dblclick',e=>{const b=e.target.closest('[data-note-category]'); if(!b)return; openNotesModal(null,b.dataset.noteCategory);});
  document.getElementById('noteCategoryGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-note-category]'); if(!b)return; document.getElementById('notesCategoryFilter').value=b.dataset.noteCategory; renderNotes();});
  document.getElementById('prevDay').addEventListener('click',()=>move(-1));
  document.getElementById('nextDay').addEventListener('click',()=>move(1));
  document.getElementById('todayBtn').addEventListener('click',()=>{ activeDate=startOfDay(new Date()); visibleMonth=new Date(activeDate.getFullYear(),activeDate.getMonth(),1); filter='all'; updateFilterButtons(); renderAll(); });
  document.getElementById('jumpMonth').addEventListener('click',()=>{ activeDate=startOfDay(new Date()); visibleMonth=new Date(activeDate.getFullYear(),activeDate.getMonth(),1); filter='all'; updateFilterButtons(); renderAll(); });
  document.getElementById('monthPrev').addEventListener('click',()=>{ visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1); renderCalendar(); });
  document.getElementById('monthNext').addEventListener('click',()=>{ visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1); renderCalendar(); });
  document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{ filter=b.dataset.filter; updateFilterButtons(); renderTasks(); }));
  document.getElementById('taskForm').addEventListener('submit',addCustomTask);
  document.getElementById('taskTime').addEventListener('change',e=>{
    const custom=document.getElementById('taskCustomTime');
    custom.classList.toggle('hidden',e.target.value!=='CUSTOM');
    if(e.target.value==='CUSTOM') custom.focus();
  });
  document.getElementById('markDayDone').addEventListener('click',()=>setDayStatus(activeDate,'done'));
  document.getElementById('markDayMissed').addEventListener('click',()=>setDayStatus(activeDate,'missed'));
  document.getElementById('resetDayStatus').addEventListener('click',()=>resetDayStatus(activeDate));
  document.getElementById('closeDayStatus').addEventListener('click',closeDayStatusModal);
  document.getElementById('dayStatusBackdrop').addEventListener('click',e=>{ if(e.target.id==='dayStatusBackdrop') closeDayStatusModal(); });
  document.getElementById('analyticsRange').addEventListener('change',renderOverall);
  document.getElementById('openWeeklySummary').addEventListener('click',()=>openSummaryModal('week'));
  document.getElementById('openMonthlySummary').addEventListener('click',()=>openSummaryModal('month'));
  document.getElementById('closeSummaryModal').addEventListener('click',closeSummaryModal);
  document.getElementById('summaryModalBackdrop').addEventListener('click',e=>{ if(e.target.id==='summaryModalBackdrop') closeSummaryModal(); });
  document.getElementById('mockForm').addEventListener('submit',saveMock);
  document.getElementById('clearMockForm').addEventListener('click',clearMockForm);
  document.getElementById('mockHistoryFilter').addEventListener('change',renderMockHistory);
  document.getElementById('closeMockView').addEventListener('click',closeMockView);
  document.getElementById('mockViewBackdrop').addEventListener('click',e=>{ if(e.target.id==='mockViewBackdrop') closeMockView(); });
  document.getElementById('saveJson').addEventListener('click',exportJson);
  document.getElementById('openJson').addEventListener('click',()=>document.getElementById('jsonFile').click());
  document.getElementById('jsonFile').addEventListener('change',e=>{ if(e.target.files[0]) importJson(e.target.files[0]); e.target.value=''; });
  document.getElementById('resetAll').addEventListener('click',resetAll);
  document.getElementById('syncNowBtn')?.addEventListener('click',manualCloudSync);
  window.addEventListener('focus',()=>{ if(cloudReady) syncFromCloud(); });
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && cloudReady) syncFromCloud(); });
  setInterval(()=>{ if(cloudReady && document.visibilityState==='visible') syncFromCloud(); },30000);
  document.getElementById('examSelector').addEventListener('change',e=>{ state.selectedExamId=e.target.value; saveState(); renderExamWidget(); toast('Active exam changed'); });
  document.getElementById('addExamBtn').addEventListener('click',()=>openExamModal('add'));
  document.getElementById('manageExamsBtn').addEventListener('click',()=>openExamModal('add'));
  document.getElementById('closeExamModal').addEventListener('click',closeExamModal);
  document.getElementById('cancelExam').addEventListener('click',closeExamModal);
  document.getElementById('examForm').addEventListener('submit',saveExam);
  document.getElementById('examModalBackdrop').addEventListener('click',e=>{ if(e.target.id==='examModalBackdrop') closeExamModal(); });
  document.getElementById('closeTaskEdit')?.addEventListener('click',closeTaskEditor);
  document.getElementById('cancelTaskEdit')?.addEventListener('click',closeTaskEditor);
  document.getElementById('taskEditModal')?.addEventListener('click',e=>{ if(e.target.id==='taskEditModal') closeTaskEditor(); });
  document.getElementById('taskEditForm')?.addEventListener('submit',saveTaskEdit);
  document.getElementById('closeWeeklySubtask')?.addEventListener('click',closeWeeklySubtaskManager);
  document.getElementById('weeklySubtaskForm')?.addEventListener('submit',saveWeeklySubtask);
  document.getElementById('weeklySubtaskModal')?.addEventListener('click',e=>{ if(e.target.id==='weeklySubtaskModal') closeWeeklySubtaskManager(); });

  window.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeExamModal(); closeDayStatusModal(); closeSummaryModal(); closeMockView(); closeTaskEditor(); closeWeeklySubtaskManager(); clearSectionFocus(); } });

  function validateTimetableDefinition(){
    const problems=[];
    const weekdayTimes=new Set();
    (baseData.dailyBlocks||[]).forEach(b=>{ const k=`${b[0]}–${b[1]}`; if(weekdayTimes.has(k)) problems.push(`Duplicate weekday time: ${k}`); weekdayTimes.add(k); });
    ['6','0'].forEach(dow=>{
      const seen=new Set();
      (baseData.weekendPlans?.[dow]?.blocks||[]).forEach(b=>{ const k=`${b[0]}–${b[1]}|${b[2]}`; if(seen.has(k)) problems.push(`Duplicate weekend block: ${dow} ${k}`); seen.add(k); });
    });
    const weekdayGenerated=buildTasks(new Date(2026,8,28));
    const ids=new Set();
    weekdayGenerated.forEach(t=>{const k=taskIdentity(t); if(ids.has(k)) problems.push(`Duplicate generated task: ${k}`); ids.add(k);});
    return problems;
  }



  /* =========================================================
     SECTION FOCUS MODE
     - Each main section gets a small maximize button.
     - Maximizing one section hides the other main sections.
     - Clicking the same button again restores all sections.
     - Escape also restores the full dashboard.
     ========================================================= */
  function getSectionFocusLabel(panel){
    const kicker = panel.querySelector('.section-kicker');
    const title = panel.querySelector('.section-title');
    return ((kicker?.textContent || title?.textContent || 'Section') + '').replace(/\s+/g,' ').trim();
  }

  function clearSectionFocus(){
    document.body.classList.remove('section-focus-mode');
    document.querySelectorAll('.focusable-section.is-section-focused').forEach(el=>el.classList.remove('is-section-focused'));
    document.querySelectorAll('.section-focus-toggle').forEach(btn=>{
      btn.textContent='⛶';
      btn.title='Maximize this section';
      btn.setAttribute('aria-label','Maximize this section');
      btn.setAttribute('aria-pressed','false');
    });
  }

  function focusSection(panel){
    const alreadyFocused = panel.classList.contains('is-section-focused');
    if(alreadyFocused){ clearSectionFocus(); return; }

    document.body.classList.add('section-focus-mode');
    document.querySelectorAll('.focusable-section.is-section-focused').forEach(el=>el.classList.remove('is-section-focused'));
    document.querySelectorAll('.section-focus-toggle').forEach(btn=>{
      btn.textContent='⛶';
      btn.title='Maximize this section';
      btn.setAttribute('aria-label','Maximize this section');
      btn.setAttribute('aria-pressed','false');
    });

    panel.classList.add('is-section-focused');
    const btn=panel.querySelector('.section-focus-toggle');
    if(btn){
      btn.textContent='↙';
      btn.title='Show all sections';
      btn.setAttribute('aria-label','Show all sections');
      btn.setAttribute('aria-pressed','true');
    }
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function setupSectionFocusControls(){
    const selectors = [
      'main .hero-grid > .panel-glass',
      'main > .panel-glass.section-panel',
      'main .main-col > .panel-glass.section-panel',
      'main .side-col > .panel-glass.section-panel'
    ];
    const panels = [];
    selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{ if(!panels.includes(el)) panels.push(el); }));

    panels.forEach((panel, index)=>{
      if(panel.classList.contains('focusable-section')) return;
      panel.classList.add('focusable-section');
      panel.dataset.focusSectionId = `focus-section-${index+1}`;

      const button=document.createElement('button');
      button.type='button';
      button.className='section-focus-toggle';
      button.textContent='⛶';
      button.title='Maximize this section';
      button.setAttribute('aria-label','Maximize this section');
      button.setAttribute('aria-pressed','false');
      button.dataset.focusLabel=getSectionFocusLabel(panel);
      button.addEventListener('click',()=>focusSection(panel));

      const head=panel.querySelector(':scope > .section-head');
      if(head){ head.appendChild(button); }
      else { panel.appendChild(button); }
    });
  }

  (async function init(){
    await loadData();
    validateTimetableDefinition();

    let saved=localStorage.getItem(STORAGE_KEY);
    if(!saved){
      for(const key of LEGACY_STORAGE_KEYS){
        saved=localStorage.getItem(key);
        if(saved) break;
      }
    }
    const hadLocalState=!!saved;
    try{ state=normalizeState(saved?JSON.parse(saved):blankState()); }catch(_){ state=blankState(); }

    activeDate=startOfDay(new Date());
    visibleMonth=new Date(activeDate.getFullYear(),activeDate.getMonth(),1);
    ensureLog(activeDate);
    const md=document.getElementById('mockDate'); if(md) md.value=dateKey(activeDate);
    setupSectionFocusControls();
    renderAll();

    // Cloud is authoritative across devices. On first Render use, an existing
    // desktop/local copy is uploaded once; on a new browser, the cloud copy is pulled.
    await initializeCloudSync(hadLocalState);
    if(cloudReady) renderAll();
  })();
})();
