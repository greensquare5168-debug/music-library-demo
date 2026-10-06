(async function(){
  const d = await (await fetch('data/car156.json')).json();
  const a = d.album;

  document.getElementById('album').innerHTML = `
    <h1>${a.code}《${a.title}》</h1>
    <div class="album-meta">
      <span class="pill">${a.library}</span>
      <span class="pill">${a.year}</span>
      <span class="pill">${a.tracks_note}</span>
    </div>
    <div class="album-desc">${a.desc}</div>`;

  const usedN = d.tracks.filter(t=>t.pages.length).length;
  const chgN  = d.tracks.filter(t=>t.change).length;
  document.getElementById('stats').textContent =
    `共 ${d.tracks.length} 首　·　有使用 ${usedN} 首　·　需改作者 ${chgN} 首`;
  document.getElementById('excl-note').textContent =
    `共 ${d.excluded.length} 首（類型/關鍵字含 Links），不列入曲目。`;

  const excl = document.getElementById('excluded');
  excl.innerHTML = d.excluded.map(e=>`<li>#${e.no} ${e.title}（${e.composer}）</li>`).join('');

  const list = document.getElementById('tracks');
  const state = {q:'', f:'all'};

  function render(){
    const q = state.q.trim().toLowerCase();
    list.innerHTML = '';
    let shown = 0;
    d.tracks.forEach((t,i)=>{
      const hay = (t.title+' '+t.composer+' '+t.pages.join(' ')).toLowerCase();
      if (q && !hay.includes(q)) return;
      if (state.f==='used' && !t.pages.length) return;
      if (state.f==='change' && !t.change) return;
      shown++;
      const li = document.createElement('li');
      const used = t.pages.length>0;
      const badge = t.change
        ? `<span class="badge warn">需改作者</span>`
        : (used ? `<span class="badge ok">${t.pages.length} 頁</span>` : '');
      li.innerHTML = `
        <div class="tr-head">
          <span class="tr-no">#${i+1}</span>
          <span class="tr-title">${t.title}${badge}</span>
          <span class="tr-comp">${t.composer}</span>
        </div>
        <div class="tr-body">
          ${t.change?`<div class="change">站上：<b>${t.change.site}</b> → 應改：<b>${t.change.target}</b></div>`:''}
          <h4>使用頁面（${t.pages.length}）</h4>
          ${t.pages.length?`<ul>${t.pages.map(p=>`<li>${p}</li>`).join('')}</ul>`
                           :`<div class="muted">站上尚未發現使用</div>`}
        </div>`;
      li.querySelector('.tr-head').onclick = ()=> li.classList.toggle('open');
      list.appendChild(li);
    });
    document.getElementById('stats').textContent =
      `顯示 ${shown} / ${d.tracks.length} 首　·　有使用 ${usedN} 首　·　需改作者 ${chgN} 首`;
  }

  document.getElementById('q').addEventListener('input', e=>{state.q=e.target.value; render();});
  document.querySelectorAll('.filters button').forEach(b=>{
    b.onclick = ()=>{
      document.querySelectorAll('.filters button').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); state.f=b.dataset.f; render();
    };
  });
  render();
})();
