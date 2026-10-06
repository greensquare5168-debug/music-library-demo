(async function(){
  const d = await (await fetch('data/car156.json')).json();
  const a = d.album;
  const CO = {yoyotv:'YOYO TV', 'momo親子台':'MOMO 親子台', '巧連智':'巧連智', '公視':'公視', '古古食':'古古食'};
  const coName = k => CO[k] || k || '（未分類）';

  document.getElementById('album').innerHTML = `
    <h1>${a.code}《${a.title}》</h1>
    <div class="album-meta">
      <span class="pill">${a.library}</span>
      <span class="pill">${a.year}</span>
      <span class="pill">${a.tracks_note}</span>
      <a class="pill linkpill" href="${a.lib_url}" target="_blank" rel="noopener">音樂庫頁 ↗</a>
    </div>
    <div class="album-desc">${a.desc}</div>`;

  const usedN = d.tracks.filter(t=>t.pages.length).length;
  const chgN  = d.tracks.filter(t=>t.change).length;
  document.getElementById('excl-note').textContent = `共 ${d.excluded.length} 首（類型/關鍵字含 Links），不列入曲目。`;
  document.getElementById('excluded').innerHTML =
    d.excluded.map(e=>`<li>#${e.no} ${e.title}（${e.composer}）</li>`).join('');

  // ── 音樂圖書館 ──
  const list = document.getElementById('tracks');
  const state = {q:'', f:'all'};
  function renderTracks(){
    const q = state.q.trim().toLowerCase();
    list.innerHTML=''; let shown=0;
    d.tracks.forEach((t,i)=>{
      const hay = (t.title+' '+t.composer+' '+t.pages.map(p=>p.name).join(' ')).toLowerCase();
      if (q && !hay.includes(q)) return;
      if (state.f==='used' && !t.pages.length) return;
      if (state.f==='change' && !t.change) return;
      shown++;
      const used=t.pages.length>0;
      const badge = t.change ? `<span class="badge warn">需改作者</span>`
                             : (used?`<span class="badge ok">${t.pages.length} 頁</span>`:'');
      const li=document.createElement('li');
      li.innerHTML=`
        <div class="tr-head">
          <span class="tr-no">#${i+1}</span>
          <span class="tr-title">${t.lib?`<a href="${t.lib}" target="_blank" rel="noopener">${t.title}</a>`:t.title}${badge}</span>
          <span class="tr-comp">${t.composer}</span>
        </div>
        <div class="tr-body">
          ${t.change?`<div class="change">站上：<b>${t.change.site}</b> → 應改：<b>${t.change.target}</b></div>`:''}
          <h4>使用頁面（${t.pages.length}）</h4>
          ${t.pages.length?`<ul>${t.pages.map(p=>`<li>${p.company?`<span class="co">${coName(p.company)}</span>`:''}${p.url?`<a href="${p.url}" target="_blank" rel="noopener">${p.name}</a>`:p.name}</li>`).join('')}</ul>`
                           :`<div class="muted">站上尚未發現使用</div>`}
        </div>`;
      li.querySelector('.tr-head').onclick=()=>li.classList.toggle('open');
      list.appendChild(li);
    });
    document.getElementById('stats').textContent =
      `顯示 ${shown} / ${d.tracks.length} 首　·　有使用 ${usedN} 首　·　需改作者 ${chgN} 首`;
  }
  document.getElementById('q').addEventListener('input',e=>{state.q=e.target.value;renderTracks();});
  document.querySelectorAll('.filters button').forEach(b=>{
    b.onclick=()=>{document.querySelectorAll('.filters button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');state.f=b.dataset.f;renderTracks();};
  });
  renderTracks();

  // ── 使用公司 ──
  const byco = {};
  d.tracks.forEach(t=>t.pages.forEach(p=>{
    const k = p.company||'（未分類）';
    byco[k]=byco[k]||{};
    byco[k][p.name]=byco[k][p.name]||{url:p.url, tracks:new Set()};
    byco[k][p.name].tracks.add(t.title);
  }));
  const comp=document.getElementById('companies');
  const order=['yoyotv','momo親子台','巧連智','公視','古古食'];
  Object.keys(byco).sort((x,y)=>(order.indexOf(x)+99*(order.indexOf(x)<0))-(order.indexOf(y)+99*(order.indexOf(y)<0)))
   .forEach(k=>{
    const progs=byco[k]; const names=Object.keys(progs).sort();
    const card=document.createElement('div');
    card.className='album-card';
    card.innerHTML=`<h2 style="margin:0 0 8px">${coName(k)} <span class="muted" style="font-size:14px;font-weight:400">· ${names.length} 頁</span></h2>`+
      `<ul class="proglist">${names.map(n=>{
        const e=progs[n];
        return `<li>${e.url?`<a href="${e.url}" target="_blank" rel="noopener">${n}</a>`:n}
          <span class="muted">— ${[...e.tracks].join('、')}</span></li>`;}).join('')}</ul>`;
    comp.appendChild(card);
  });

  // ── 切換 ──
  function showView(v){
    document.querySelectorAll('.topnav button').forEach(x=>x.classList.toggle('on', x.dataset.v===v));
    document.getElementById('view-lib').hidden = v!=='lib';
    document.getElementById('view-comp').hidden = v!=='comp';
  }
  document.querySelectorAll('.topnav button').forEach(b=>{
    b.onclick=()=>showView(b.dataset.v);
  });
  if(location.hash==='#companies') showView('comp');
})();
