(async function(){
  const d = await (await fetch('data/car156.json')).json();
  const CO = {yoyotv:'YOYO TV', 'momo親子台':'MOMO 親子台', '巧連智':'巧連智', '公視':'公視', '古古食':'古古食'};
  const coName = k => CO[k] || k || '（未分類）';
  let album = null;   // 目前選取的專輯

  // ── 頂層：音樂圖書館 / 使用公司 ──
  function showView(v){
    curTop=(v==='comp')?'comp':'lib';
    document.querySelectorAll('.topnav button').forEach(x=>x.classList.toggle('on', x.dataset.v===v));
    document.getElementById('view-lib').hidden = v!=='lib';
    document.getElementById('view-comp').hidden = v!=='comp';
    document.getElementById('view-page').hidden = true;
  }
  document.querySelectorAll('.topnav button').forEach(b=> b.onclick=()=>showView(b.dataset.v));

  // ── 音樂圖書館：廠牌 → 專輯 → 曲目 ──
  const libBox = document.getElementById('lib');
  function renderLabels(){
    album=null;
    libBox.innerHTML = `<div class="crumb">音樂圖書館</div>
      <div class="album-card"><h2 style="margin:0 0 10px">🏷️ 廠牌</h2>
      <ul class="brandlist">${d.labels.map((L,i)=>
        `<li data-i="${i}"><span class="bname">${L.name}</span>
         <span class="muted">${L.note||''} · ${L.albums.length} 張專輯</span>
         <span class="go">›</span></li>`).join('')}</ul></div>`;
    libBox.querySelectorAll('.brandlist li').forEach(li=> li.onclick=()=>renderAlbums(+li.dataset.i));
  }
  function renderAlbums(i){
    const L=d.labels[i];
    libBox.innerHTML = `<div class="crumb"><a data-back>← 廠牌</a> / ${L.name}</div>
      <div class="album-card"><h2 style="margin:0 0 10px">💿 ${L.name} 的專輯</h2>
      <ul class="albumlist">${L.albums.map((A,j)=>
        `<li data-j="${j}"><span class="aname">${A.code}《${A.title}》</span>
         <span class="muted">${A.year} · ${A.tracks.length} 首</span><span class="go">›</span></li>`).join('')}</ul></div>`;
    libBox.querySelector('[data-back]').onclick=renderLabels;
    libBox.querySelectorAll('.albumlist li').forEach(li=> li.onclick=()=>renderAlbum(i,+li.dataset.j));
  }
  function renderAlbum(i,j){
    const a = d.labels[i].albums[j];
    libBox.innerHTML = `<div class="crumb"><a data-back>← 專輯列表</a> / ${a.code}</div>
      <div class="album-card" id="album"></div>
      <div class="toolbar">
        <input id="q" type="search" placeholder="搜尋曲名 / 作曲者 / 使用節目…">
        <div class="filters">
          <button data-f="all" class="on">全部</button>
          <button data-f="used">有使用</button>
        </div>
      </div>
      <div class="stats" id="stats"></div>
      <ul class="tracks" id="tracks"></ul>
      <section class="excluded"><h2>已排除（類型含 Links / 音效）</h2>
        <p class="muted" id="excl-note"></p><ul id="excluded"></ul></section>`;
    libBox.querySelector('[data-back]').onclick=renderLabels;
    document.getElementById('album').innerHTML=`
      <h1>${a.code}《${a.title}》</h1>
      <div class="album-meta">
        <span class="pill">${a.library}</span><span class="pill">${a.year}</span>
        <span class="pill">${a.tracks_note}</span>
        <a class="pill linkpill" href="${a.lib_url}" target="_blank" rel="noopener">音樂庫頁 ↗</a>
      </div><div class="album-desc">${a.desc}</div>`;
    document.getElementById('excl-note').textContent=`共 ${a.excluded.length} 首（類型/關鍵字含 Links），不列入曲目。`;
    document.getElementById('excluded').innerHTML=a.excluded.map(e=>`<li>#${e.no} ${e.title}（${e.composer}）</li>`).join('');
    buildTracks(a);
  }

  // ── 專輯內：曲目清單 ──
  function buildTracks(a){
    const list=document.getElementById('tracks');
    const usedN=a.tracks.filter(t=>t.pages.length).length;
    const state={q:'',f:'all'};
    function render(){
      const q=state.q.trim().toLowerCase(); list.innerHTML=''; let shown=0;
      a.tracks.forEach((t,i)=>{
        const hay=(t.title+' '+t.composer+' '+t.pages.map(p=>p.name).join(' ')).toLowerCase();
        if(q&&!hay.includes(q))return;
        if(state.f==='used'&&!t.pages.length)return;
        shown++;
        const badge=t.pages.length?`<span class="badge ok">${t.pages.length} 頁</span>`:'';
        const li=document.createElement('li');
        li.innerHTML=`
          <div class="tr-head"><span class="tr-no">#${i+1}</span>
            <span class="tr-title">${t.lib?`<a href="${t.lib}" target="_blank" rel="noopener">${t.title}</a>`:t.title}${badge}</span>
            <span class="tr-comp">${t.composer}</span></div>
          <div class="tr-body">
            <h4>使用頁面（${t.pages.length}）</h4>
            ${t.pages.length?`<ul>${t.pages.map(p=>`<li>${p.company?`<span class="co">${coName(p.company)}</span>`:''}<a data-page="${encodeURIComponent(p.name)}" href="#page=${encodeURIComponent(p.name)}">${p.name}</a></li>`).join('')}</ul>`
                             :`<div class="muted">站上尚未發現使用</div>`}
          </div>`;
        li.querySelector('.tr-head').onclick=()=>li.classList.toggle('open');
      li.querySelectorAll('[data-page]').forEach(a=>a.onclick=e=>{e.preventDefault();e.stopPropagation();openPage(decodeURIComponent(a.dataset.page));});
        list.appendChild(li);
      });
      document.getElementById('stats').textContent=
        `顯示 ${shown} / ${a.tracks.length} 首　·　有使用 ${usedN} 首`;
    }
    document.getElementById('q').addEventListener('input',e=>{state.q=e.target.value;render();});
    document.querySelectorAll('.filters button').forEach(b=> b.onclick=()=>{
      document.querySelectorAll('.filters button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); state.f=b.dataset.f; render();});
    render();
  }

  // ── 使用公司：公司 → 節目 → （季）→ 集 ──
  const target = d.labels.flatMap(L=>L.albums)[0];
  const comp=document.getElementById('companies');
  const order=['公視','yoyotv','momo親子台','巧連智','古古食'];
  const coIndex={};
  order.forEach(k=>coIndex[k]={});
  const seasonOf = n => {const m=(n||'').match(/第\s*(\d+)\s*季/); return m?+m[1]:null;};
  target.tracks.forEach(t=>t.pages.forEach(p=>{
    const k=p.company||'（未分類）'; coIndex[k]=coIndex[k]||{};
    const pr=p.program_label||p.program||'（其他）'; coIndex[k][pr]=coIndex[k][pr]||{};
    const sk=seasonOf(p.name); const s=(sk===null?'_':String(sk));
    coIndex[k][pr][s]=coIndex[k][pr][s]||{};
    coIndex[k][pr][s][p.name]=coIndex[k][pr][s][p.name]||{url:p.url,tracks:new Set()};
    coIndex[k][pr][s][p.name].tracks.add(t.title);
  }));
  const cnt=e=>Object.values(e).reduce((s,o)=>s+Object.keys(o).length,0);
  function coList(){
    comp.innerHTML=`<div class="crumb">使用公司</div>`+
      order.map(k=>{const nprog=Object.keys(coIndex[k]).length, npg=cnt(coIndex[k]);
        const dis=npg?'':'zero';
        return `<div class="album-card"><ul class="brandlist"><li data-c="${k}" class="${dis}"><span class="bname">🏢 ${coName(k)}</span><span class="muted">${nprog} 個節目 · ${npg} 頁</span><span class="go">›</span></li></ul></div>`;}).join('');
    comp.querySelectorAll('[data-c]').forEach(li=>li.onclick=()=>coProgs(li.dataset.c));
  }
  const po=target.programOrder||{};
  function coProgs(k){
    const progs=coIndex[k];
    const ord=Object.keys(progs).sort((a,b)=>((po[a]??1e9)-(po[b]??1e9))||a.localeCompare(b));
    comp.innerHTML=`<div class="crumb"><a data-back>← 使用公司</a> / ${coName(k)}</div>`+
      `<div class="album-card">`+(ord.length?
      `<ul class="albumlist">`+ord.map(pr=>`<li data-p="${pr}"><span class="aname">📺 ${pr}</span><span class="muted">${cnt(progs[pr])} 頁</span><span class="go">›</span></li>`).join('')+`</ul>`
      :`<div class="muted">（這張專輯在此公司沒有使用紀錄）</div>`)+`</div>`;
    comp.querySelector('[data-back]').onclick=coList;
    comp.querySelectorAll('[data-p]').forEach(li=>li.onclick=()=>coSeasons(k,li.dataset.p));
  }
  function coSeasons(k,pr){
    const seasons=coIndex[k][pr];
    const keys=Object.keys(seasons);
    const hasSeason = keys.some(x=>x!=='_');
    if(!hasSeason){ coPages(k,pr,'_'); return; }
    keys.sort((a,b)=>(a==='_'?1e9:+a)-(b==='_'?1e9:+b));
    comp.innerHTML=`<div class="crumb"><a data-back>← ${coName(k)}</a> / ${pr}</div>`+
      `<div class="album-card"><ul class="albumlist">`+
      keys.map(s=>`<li data-s="${s}"><span class="aname">${s==='_'?'（未分季）':'第 '+String(+s).padStart(2,'0')+' 季'}</span><span class="muted">${Object.keys(seasons[s]).length} 頁</span><span class="go">›</span></li>`).join('')+
      `</ul></div>`;
    comp.querySelector('[data-back]').onclick=()=>coProgs(k);
    comp.querySelectorAll('[data-s]').forEach(li=>li.onclick=()=>coPages(k,pr,li.dataset.s));
  }
  function coPages(k,pr,s){
    const pages=coIndex[k][pr][s];
    const label = s==='_'? pr : pr+' · 第 '+String(+s).padStart(2,'0')+' 季';
    comp.innerHTML=`<div class="crumb"><a data-back>← ${pr}</a> / ${label}</div>`+
      `<div class="album-card"><ul class="proglist">`+
      Object.keys(pages).sort().map(n=>`<li><a data-page="${encodeURIComponent(n)}" href="#page=${encodeURIComponent(n)}">${n}</a></li>`).join('')+
      `</ul></div>`;
    comp.querySelector('[data-back]').onclick=()=>coSeasons(k,pr);
    comp.querySelectorAll('[data-page]').forEach(a=>a.onclick=e=>{e.preventDefault();openPage(decodeURIComponent(a.dataset.page));});
  }
  // ── 站上頁面（在 GitHub 上重生） ──
  const ROLE=/^(標題|片頭曲|片尾曲|簡介|進廣告|插曲|主題曲|配樂|片頭|片尾|開頭|結尾|前奏|尾奏|BGM|回來|過場)\s*/;
  function itemHTML(x){
    const m=x.t.match(ROLE);
    const role=m?m[1]:'';
    const rest=m?x.t.slice(m[0].length).trim():x.t;
    const linked = x.u && rest && rest!=='？';
    const name = linked?`<a href="${x.u}" target="_blank" rel="noopener">${rest}</a>`:rest;
    const chip = linked?`<a class="src" href="${x.u}" target="_blank" rel="noopener">${srcLabel(x.u)} ↗</a>`:'';
    return `<li>${role?`<span class="role">${role}</span>`:''}<span class="tk">${name}</span>${x.c?`<span class="cp">${x.c}</span>`:''}${chip}</li>`;
  }
  function openPage(name){
    const info=(target.pagesInfo||{})['知識平台網 - '+name]||{sections:[]};
    const n=info.sections.reduce((s,x)=>s+x.items.length,0);
    ['view-lib','view-comp','view-page'].forEach(id=>document.getElementById(id).hidden=true);
    const box=document.getElementById('view-page'); box.hidden=false;
    box.innerHTML=`<div class="crumb"><a id="pback">← 回上一頁</a> / ${name}</div>
      <div class="album-card"><h1 style="font-size:20px;margin:0 0 4px">${name}</h1>
        <div class="muted">本頁使用的音樂（${n}）· 依站上單元順序</div>${info.yt&&info.yt.yt_links?`
        <div class="ytlinks">🎬 影片：${info.yt.yt_links.slice(0,1).map(u=>`<a href="${u}" target="_blank" rel="noopener">在 YouTube 開啟 ↗</a>`).join('')}</div>`:''}</div>`+
      (info.yt&&info.yt.embed?`<div class="album-card"><div class="ytframe"><iframe src="${info.yt.embed}" title="YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><div class="muted" style="margin-top:6px">（YouTube 影片視窗，對應原站嵌入）</div></div>`:'')+
      info.sections.map(sec=>`<div class="album-card">
        ${sec.s?`<div class="unit">${sec.s}</div>`:''}
        <ul class="proglist">${sec.items.map(itemHTML).join('')}</ul></div>`).join('')+
      `<div class="muted" style="margin-top:10px">↳ 這一頁原本在 Google Sites，現在已在 GitHub 上原生顯示（不再外連）。</div>`;
    document.getElementById('pback').onclick=()=>{box.hidden=true;showView(curTop);};
    window.scrollTo(0,0);
  }
  let curTop='lib';
  const srcLabel=u=>/youtube|youtu\.be/.test(u)?'YouTube':/warnerchappellpm/.test(u)?'WCPM':/universalproductionmusic/.test(u)?'UPM':/pointmusic/.test(u)?'音韶':'連結';
  coList();

  renderLabels();
  const h=location.hash||'';
  if(h==='#companies') showView('comp');
  else if(/^#page=/.test(h)){openPage(decodeURIComponent(h.slice(6)));}
  else if(/^#label=\d+/.test(h)) renderAlbums(+h.split('=')[1]);
  else if(/^#album=\d+-\d+/.test(h)){const m=h.split('=')[1].split('-');showView('lib');renderAlbum(+m[0],+m[1]);}
  else if(h==='#companies') showView('comp');
  else if(/^#co=/.test(h)){showView('comp');coProgs(decodeURIComponent(h.slice(4)));}
  else if(/^#cos=/.test(h)){const a=h.slice(5).split('|');showView('comp');coSeasons(decodeURIComponent(a[0]),decodeURIComponent(a[1]||''));}
  else if(/^#cop=/.test(h)){const a=h.slice(5).split('|');showView('comp');coPages(decodeURIComponent(a[0]),decodeURIComponent(a[1]||''),a[2]||'_');}
})();
