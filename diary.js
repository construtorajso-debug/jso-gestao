let selectedDiaryIndex=0;
function diaryEntries(obra){return [...(obra.diario||[])].sort((a,b)=>String(a.data).localeCompare(String(b.data))||String(a.atualizadoEm||'').localeCompare(String(b.atualizadoEm||'')))}
function diaryDate(date){return String(date||'').split('-').reverse().join('/')}
function diarySummary(obra){return diaryEntries(obra).map(e=>`${diaryDate(e.data)} — ${e.servicos}${e.observacoes?`\nObservações: ${e.observacoes}`:''}`).join('\n\n')}
function effectiveReport(obra){
 const r=obra.relatorio||{},entries=diaryEntries(obra),last=key=>[...entries].reverse().find(e=>e[key]!==''&&e[key]!=null);
 const stage=last('etapa'),percent=last('percentual');
 const prefer=e=>e&&(!r.atualizadoEm||String(e.atualizadoEm||'')>r.atualizadoEm);
 return {...r,etapa:prefer(stage)?stage.etapa:r.etapa||stage?.etapa,percentual:prefer(percent)?percent.percentual:r.percentual??percent?.percentual,realizados:[r.realizados,diarySummary(obra)].filter(Boolean).join('\n\n')};
}
function reportPhotos(obra){return [...(obra.fotos||[]),...diaryEntries(obra).flatMap(e=>(e.fotos||[]).map(f=>({...f,caption:`${diaryDate(e.data)} — ${e.servicos}`})))].filter((f,i,all)=>all.findIndex(x=>x.id===f.id)===i)}
function hydrateDiaryPhotos(){document.querySelectorAll('.diary-photo-placeholder').forEach(async el=>{try{const f=await getAttachment(el.dataset.photoId);if(!f)throw Error();const url=URL.createObjectURL(f.blob);if(!el.isConnected){URL.revokeObjectURL(url);return}photoURLs.add(url);const img=document.createElement('img');img.src=url;img.alt=f.name||'Foto do diário';el.replaceWith(img)}catch{if(el.isConnected)el.textContent='Foto indisponível neste aparelho'}})}
function diaryPhotoCard(f,editable=false){return `<div class="work-photo diary-photo" data-id="${esc(f.id)}"><button class="photo-open" data-action="work-photo-open" data-photo-id="${esc(f.id)}"><span class="diary-photo-placeholder" data-photo-id="${esc(f.id)}">Carregando foto…</span></button>${editable?'<button class="btn danger" data-action="diary-photo-remove">Remover foto</button>':''}</div>`}
function diaryView(index=selectedDiaryIndex){
 clearPhotoURLs();selectedDiaryIndex=Math.max(0,Math.min(Number(index),db.obras.length-1));const obra=db.obras[selectedDiaryIndex];
 document.querySelector('#view').innerHTML=`<div class="title"><h1>Diário de Obra</h1></div>${obra?`<section class="panel"><label>Escolha a obra<select id="diary-work">${db.obras.map((o,i)=>`<option value="${i}" ${i===selectedDiaryIndex?'selected':''}>${esc(o['Cliente/Obra'])}</option>`).join('')}</select></label><p>Registre os serviços e as fotos de cada dia. A situação da obra e o PDF usam automaticamente estes registros.</p><div class="actions"><button class="btn yellow" data-action="diary-new">+ Registro do dia</button><button class="btn alt" data-action="diary-report">Ver situação desta obra</button></div></section><div class="diary-entries">${diaryEntries(obra).reverse().map(e=>`<section class="panel"><div class="title"><h2>${diaryDate(e.data)}</h2><div class="actions"><button class="btn alt" data-action="diary-edit" data-id="${esc(e.id)}">Editar</button><button class="btn danger" data-action="diary-delete" data-id="${esc(e.id)}">Excluir</button></div></div>${e.etapa?`<p><b>Etapa:</b> ${esc(e.etapa)}</p>`:''}${e.percentual!==''&&e.percentual!=null?`<p><b>Executado:</b> ${esc(e.percentual)}%</p>`:''}<p class="diary-text">${esc(e.servicos)}</p>${e.observacoes?`<p class="diary-text"><b>Observações:</b> ${esc(e.observacoes)}</p>`:''}<div class="work-photos">${(e.fotos||[]).map(f=>diaryPhotoCard(f)).join('')}</div></section>`).join('')||'<section class="panel"><p>Nenhum registro nesta obra. Comece com Registro do dia.</p></section>'}</div>`:'<section class="panel"><p>Cadastre uma obra na aba Obras para iniciar o diário.</p></section>'}`;
 hydrateDiaryPhotos();
}
function diaryForm(id=''){
 const obra=db.obras[selectedDiaryIndex];if(!obra)return;const e=(obra.diario||[]).find(e=>e.id===id);
 clearPhotoURLs();document.querySelector('#view').innerHTML=`<div class="title"><h1>${e?'Editar registro':'Registro do dia'}</h1></div><section class="panel"><h2>${esc(obra['Cliente/Obra'])}</h2><div class="formgrid"><label>Data<input id="diary-date" type="date" value="${esc(e?.data||today())}" required></label><label>Percentual executado (opcional)<input id="diary-percent" type="number" min="0" max="100" step="0.1" value="${esc(e?.percentual)}" placeholder="0 a 100"></label><label class="full">Etapa atual (opcional)<input id="diary-stage" value="${esc(e?.etapa)}" placeholder="Ex.: Alvenaria"></label><label class="full">Serviços realizados no dia<textarea id="diary-services" required placeholder="Descreva os serviços executados">${esc(e?.servicos)}</textarea></label><label class="full">Observações<textarea id="diary-notes" placeholder="Informações sobre o andamento">${esc(e?.observacoes)}</textarea></label></div><h3>Fotos do dia</h3><div class="work-photos" id="diary-existing">${(e?.fotos||[]).map(f=>diaryPhotoCard(f,true)).join('')}</div><div class="photo-inputs"><label>Tirar foto<input id="diary-camera" type="file" accept="image/*" capture="environment" multiple></label><label>Adicionar fotos<input id="diary-files" type="file" accept="image/*" multiple></label></div><div id="diary-pending" aria-live="polite"></div><div class="actions"><button class="btn yellow" data-action="diary-save" data-id="${esc(id)}">Salvar registro</button><button class="btn alt" data-action="diary-cancel">Cancelar</button></div><p class="muted">O percentual é informado por você. Fotos e registros ficam neste aparelho e entram no backup.</p></section>`;hydrateDiaryPhotos();
}
async function saveDiary(id,button){
 const obra=db.obras[selectedDiaryIndex];if(!obra)return;
 const data=document.querySelector('#diary-date').value,servicos=document.querySelector('#diary-services').value.trim(),percentual=document.querySelector('#diary-percent').value.trim();
 if(!data||!servicos){alert('Informe a data e os serviços realizados.');return}
 if(percentual!==''&&(!Number.isFinite(Number(percentual))||Number(percentual)<0||Number(percentual)>100)){alert('Informe um percentual de 0 a 100.');return}
 const files=[...document.querySelector('#diary-camera').files,...document.querySelector('#diary-files').files];
 if(files.some(f=>!f.type.startsWith('image/'))){alert('Escolha apenas fotos.');return}
 const old=(obra.diario||[]).find(e=>e.id===id),kept=new Set([...document.querySelectorAll('#diary-existing .diary-photo')].map(el=>el.dataset.id));
 const fotos=(old?.fotos||[]).filter(f=>kept.has(f.id)),created=[];button.disabled=true;
 const previous=obra.diario;
 try{
  for(const file of files){const photoId=crypto.randomUUID();await putAttachment({id:photoId,name:file.name||'Foto do diário',type:file.type,blob:file});created.push(photoId);fotos.push({id:photoId,name:file.name||'Foto do diário'})}
  const entry={id:old?.id||crypto.randomUUID(),data,servicos,etapa:document.querySelector('#diary-stage').value.trim(),percentual,observacoes:document.querySelector('#diary-notes').value.trim(),fotos,atualizadoEm:new Date().toISOString()};
  obra.diario=old?(obra.diario||[]).map(e=>e.id===id?entry:e):[...(obra.diario||[]),entry];save();
  for(const f of old?.fotos||[])if(!kept.has(f.id))await deleteAttachment(f.id).catch(()=>{});
  diaryView();
 }catch{obra.diario=previous;for(const photoId of created)await deleteAttachment(photoId).catch(()=>{});alert('Não foi possível salvar. Verifique o espaço disponível no aparelho e tente novamente.');button.disabled=false}
}
async function deleteDiary(id){
 const obra=db.obras[selectedDiaryIndex],entry=obra?.diario?.find(e=>e.id===id);if(!entry||!confirm('Excluir este registro e as fotos dele?'))return;
 const previous=obra.diario;try{obra.diario=previous.filter(e=>e.id!==id);save();for(const f of entry.fotos||[])await deleteAttachment(f.id).catch(()=>{});diaryView()}catch{obra.diario=previous;alert('Não foi possível excluir o registro.')}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const {action,id}=b.dataset;
 if(action==='diary-new')diaryForm();else if(action==='diary-edit')diaryForm(id);else if(action==='diary-save')saveDiary(id,b);else if(action==='diary-delete')deleteDiary(id);else if(action==='diary-cancel')diaryView();else if(action==='diary-photo-remove')b.closest('.diary-photo').remove();else if(action==='diary-report')showDiaryReport();
});
function showDiaryReport(){clearPhotoURLs();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.v==='situacao'));reportView(selectedDiaryIndex)}
document.addEventListener('change',e=>{if(e.target.id==='diary-work')diaryView(e.target.value);if(['diary-camera','diary-files'].includes(e.target.id)){const files=[...document.querySelector('#diary-camera').files,...document.querySelector('#diary-files').files];document.querySelector('#diary-pending').textContent=`${files.length} foto(s) selecionada(s) para salvar.`}});
