(async function(){
  const d = await (await fetch('data/car156.json')).json();
  const CO = {yoyotv:'YOYO TV', 'momo親子台':'MOMO 親子台', '巧連智':'巧連智', '公視':'公視', '古古食':'古古食'};
  const coName = k => CO[k] || k || '（未分類）';
  let album = null;   // 目前選取的專輯

  // ── 頂層：音樂圖書館 / 使用公司 ──
  function showView(v){
    document.querySelectorAll('.topnav button').forEach(x=>x.classList.toggle('on', x.dataset.v===v));
    document.getElementById('view-lib').hidden = v!=='lib';
    document.getElementById('view-comp').hidden = v!=='comp';
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
          <button data-f="change">需改作者</button>
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
    const usedN=a.tracks.filter(t=>t.pages.length).length, chgN=a.tracks.filter(t=>t.change).length;
    const state={q:'',f:'all'};
    function render(){
      const q=state.q.trim().toLowerCase(); list.innerHTML=''; let shown=0;
      a.tracks.forEach((t,i)=>{
        const hay=(t.title+' '+t.composer+' '+t.pages.map(p=>p.name).join(' ')).toLowerCase();
        if(q&&!hay.includes(q))return;
        if(state.f==='used'&&!t.pages.length)return;
        if(state.f==='change'&&!t.change)return;
        shown++;
        const badge=t.change?`<span class="badge warn">需改作者</span>`
                            :(t.pages.length?`<span class="badge ok">${t.pages.length} 頁</span>`:'');
        const li=document.createElement('li');
        li.innerHTML=`
          <div class="tr-head"><span class="tr-no">#${i+1}</span>
            <span class="tr-title">${t.lib?`<a href="${t.lib}" target="_blank" rel="noopener">${t.title}</a>`:t.title}${badge}</span>
            <span class="tr-comp">${t.composer}</span></div>
          <div class="tr-body">
            ${t.change?`<div class="change">站上：<b>${t.change.site}</b> → 應改：<b>${t.change.target}</b></div>`:''}
            <h4>使用頁面（${t.pages.length}）</h4>
            ${t.pages.length?`<ul>${t.pages.map(p=>`<li>${p.company?`<span class="co">${coName(p.company)}</span>`:''}${p.url?`<a href="${p.url}" target="_blank" rel="noopener">${p.name}</a>`:p.name}</li>`).join('')}</ul>`
                             :`<div class="muted">站上尚未發現使用</div>`}
          </div>`;
        li.querySelector('.tr-head').onclick=()=>li.classList.toggle('open');
        list.appendChild(li);
      });
      document.getElementById('stats').textContent=
        `顯示 ${shown} / ${a.tracks.length} 首　·　有使用 ${usedN} 首　·　需改作者 ${chgN} 首`;
    }
    document.getElementById('q').addEventListener('input',e=>{state.q=e.target.value;render();});
    document.querySelectorAll('.filters button').forEach(b=> b.onclick=()=>{
      document.querySelectorAll('.filters button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); state.f=b.dataset.f; render();});
    render();
  }

  // ── 使用公司 ──
  const target = d.labels.flatMap(L=>L.albums)[0];
  const byco={};
  target.tracks.forEach(t=>t.pages.forEach(p=>{
    const k=p.company||'（未分類）'; byco[k]=byco[k]||{};
    byco[k][p.name]=byco[k][p.name]||{url:p.url,tracks:new Set()};
    byco[k][p.name].tracks.add(t.title);
  }));
  const comp=document.getElementById('companies');
  const order=['yoyotv','momo親子台','巧連智','公視','古古食'];
  Object.keys(byco).sort((x,y)=>(order.indexOf(x)<0?99:order.indexOf(x))-(order.indexOf(y)<0?99:order.indexOf(y)))
   .forEach(k=>{
    const progs=byco[k], names=Object.keys(progs).sort();
    const card=document.createElement('div'); card.className='album-card';
    card.innerHTML=`<h2 style="margin:0 0 8px">${coName(k)} <span class="muted" style="font-size:14px;font-weight:400">· ${names.length} 頁</span></h2>
      <ul class="proglist">${names.map(n=>{const e=progs[n];
        return `<li>${e.url?`<a href="${e.url}" target="_blank" rel="noopener">${n}</a>`:n}
          <span class="muted">— ${[...e.tracks].join('、')}</span></li>`;}).join('')}</ul>`;
    comp.appendChild(card);
  });

  renderLabels();
  const h=location.hash||'';
  if(h==='#companies') showView('comp');
  else if(/^#label=\d+/.test(h)) renderAlbums(+h.split('=')[1]);
  else if(/^#album=\d+-\d+/.test(h)){const m=h.split('=')[1].split('-');showView('lib');renderAlbum(+m[0],+m[1]);}
})();
