let selectedReportIndex = 0;
let preparedReportFile = null;
let preparedReportURL = null;

function clearPreparedReport() {
  if (preparedReportURL) URL.revokeObjectURL(preparedReportURL);
  preparedReportURL = null;
  preparedReportFile = null;
}
function reportView(index = selectedReportIndex) {
  clearPreparedReport();
  selectedReportIndex = Math.max(0, Math.min(index, db.obras.length - 1));
  const obra = db.obras[selectedReportIndex];
  const view = document.querySelector('#view');
  if (!obra) {
    view.innerHTML = '<h1>Situação da obra</h1><div class="panel"><p>Cadastre uma obra na aba Obras para criar o relatório do cliente.</p></div>';
    return;
  }
  const relatorio = effectiveReport(obra);
  const services = typeof jsoServiceSummary === 'function' ? jsoServiceSummary(obra) : null;
  const hasDiary = diaryEntries(obra).length > 0;
  view.innerHTML = `<div class="title"><h1>Situação da obra</h1></div><div class="panel report-panel">
    <label>Escolha a obra<select id="report-work">${db.obras.map((o,i)=>`<option value="${i}" ${i===selectedReportIndex?'selected':''}>${esc(o['Cliente/Obra']||'Obra sem nome')}</option>`).join('')}</select></label>
    <div class="formgrid report-fields">
      <label>Etapa atual<input id="report-stage" value="${esc(relatorio.etapa)}" placeholder="Ex.: Alvenaria do primeiro pavimento"></label>
      <label>Percentual executado<input id="report-percent" type="number" min="0" max="100" step="0.1" value="${esc(services ? services.percent : relatorio.percentual)}" ${services?'readonly':''} placeholder="0 a 100"></label>
      <label class="full">Serviços realizados<textarea id="report-done" ${hasDiary?'readonly':''} placeholder="Descreva o que já foi feito">${esc(hasDiary?diarySummary(obra):relatorio.realizados)}</textarea></label>
      ${hasDiary?`<label class="full">Complemento dos serviços (opcional)<textarea id="report-manual-done">${esc(obra.relatorio?.realizados)}</textarea></label><p class="full muted">Os serviços acima incluem automaticamente o Diário de Obra. Edite os registros no diário para corrigir datas, serviços ou fotos.</p>`:''}
      <label class="full">Próximas etapas<textarea id="report-next" placeholder="Descreva os próximos serviços">${esc(relatorio.proximas)}</textarea></label>
      <label class="full">Observações para o cliente<textarea id="report-notes" placeholder="Informações importantes sobre a obra">${esc(relatorio.observacoes)}</textarea></label>
    </div>
    <p class="muted">O PDF inclui status, andamento, diário e fotos desta obra e os valores de contrato, extras e recebimentos cadastrados. Gastos internos da empresa não aparecem.</p>
    <div class="actions"><button class="btn alt" data-action="report-save">Salvar situação</button><button class="btn yellow" data-action="report-generate">Gerar PDF</button></div>
    <div id="report-result" class="report-result" aria-live="polite"></div>
  </div>${diaryEntries(obra).length?`<section class="panel"><h2>Fotos do diário</h2><div class="work-photos">${diaryEntries(obra).flatMap(e=>(e.fotos||[]).map(f=>diaryPhotoCard(f))).join('')||'<p>Nenhuma foto no diário.</p>'}</div></section>`:''}`;
  hydrateDiaryPhotos();
  if (services) document.querySelector('.report-panel').insertAdjacentHTML('afterend', jsoTrackingHTML(obra));
}
function saveReport() {
  const obra = db.obras[selectedReportIndex];
  if (!obra) return false;
  const percentual = document.querySelector('#report-percent').value.trim();
  if (percentual !== '' && (Number(percentual) < 0 || Number(percentual) > 100)) {
    alert('Informe um percentual de 0 a 100.');
    return false;
  }
  obra.relatorio = {
    etapa: document.querySelector('#report-stage').value.trim(),
    percentual,
    realizados: (document.querySelector('#report-manual-done')||document.querySelector('#report-done')).value.trim(),
    proximas: document.querySelector('#report-next').value.trim(),
    observacoes: document.querySelector('#report-notes').value.trim(),
    atualizadoEm: new Date().toISOString()
  };
  save();
  clearPreparedReport();
  document.querySelector('#report-result').textContent = 'Situação salva neste aparelho.';
  return true;
}
async function prepareReportPDF() {
  if (!saveReport()) return;
  const button = document.querySelector('[data-action="report-generate"]');
  button.disabled = true;
  const result = document.querySelector('#report-result');
  result.textContent = 'Preparando o PDF e as fotos…';
  try {
    const obra = db.obras[selectedReportIndex];
    const bytes = await buildReportPDF(obra);
    const safeName = String(obra['Cliente/Obra']||'obra').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,45);
    const name = `Situacao_da_obra_${safeName}_${today()}.pdf`;
    preparedReportFile = new File([bytes], name, {type:'application/pdf'});
    preparedReportURL = URL.createObjectURL(preparedReportFile);
    const canShare = !!(navigator.share && navigator.canShare?.({files:[preparedReportFile]}));
    result.innerHTML = `<p>PDF pronto para enviar ao cliente.</p><div class="actions">${canShare?'<button class="btn" data-action="report-share">Enviar PDF</button>':''}<a class="btn alt" href="${preparedReportURL}" download="${esc(name)}">Salvar PDF</a></div>`;
  } catch (e) {
    result.textContent = 'Não foi possível gerar o PDF. Verifique as fotos e tente novamente.';
  } finally { button.disabled = false; }
}
async function shareReportPDF() {
  if (!preparedReportFile || !navigator.share) return;
  try { await navigator.share({files:[preparedReportFile],title:'Situação da obra'}); }
  catch(e) { if (e.name !== 'AbortError') alert('Não foi possível abrir o compartilhamento. Use Salvar PDF e envie o arquivo pelo WhatsApp.'); }
}

function pdfText(value) {
  return String(value ?? '').replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^\x20-\xFF\n]/g,'');
}
async function photoAsJpeg(blob) {
  const max=1400;
  const canvas=document.createElement('canvas');
  let source=await (typeof createImageBitmap==='function'?createImageBitmap(blob).catch(()=>null):Promise.resolve(null));
  let temporaryURL;
  if(!source){
    temporaryURL=URL.createObjectURL(blob);
    source=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=temporaryURL}).catch(()=>null);
  }
  if(!source){if(temporaryURL)URL.revokeObjectURL(temporaryURL);return null}
  const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
  const scale=Math.min(1,max/Math.max(width,height));
  canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
  source.close?.();if(temporaryURL)URL.revokeObjectURL(temporaryURL);
  const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.78));
  return jpeg?new Uint8Array(await jpeg.arrayBuffer()):null;
}
async function buildReportPDF(obra) {
  const {PDFDocument,StandardFonts,rgb} = PDFLib;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Situação da obra - ${pdfText(obra['Cliente/Obra'])}`);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const red = rgb(.77,.12,.12), dark=rgb(.15,.15,.15), gray=rgb(.38,.38,.38), yellow=rgb(1,.77,0);
  const W=595.28,H=841.89, left=42,right=42;
  let page,y,pageNo=0;
  function nextPage(){
    page=pdf.addPage([W,H]);pageNo++;
    page.drawRectangle({x:0,y:H-10,width:W,height:10,color:red});
    page.drawText('JSO', {x:left,y:H-56,size:28,font:bold,color:red});
    page.drawText('CONSTRUÇÕES E REFORMAS', {x:112,y:H-48,size:12,font:bold,color:dark});
    page.drawText('A Construtora do Povo', {x:112,y:H-65,size:10,font:regular,color:gray});
    page.drawLine({start:{x:left,y:H-79},end:{x:W-right,y:H-79},thickness:2,color:yellow});
    page.drawText(`Página ${pageNo}`,{x:W-right-45,y:25,size:9,font:regular,color:gray});
    y=H-104;
  }
  function ensure(height){if(y-height<55)nextPage()}
  function line(text,{font=regular,size=11,color=dark,indent=0,gap=5}={}){
    const width=W-left-right-indent;
    for(const paragraph of pdfText(text).split('\n')){
      const words=paragraph.split(/\s+/).filter(Boolean);let current='';
      if (!words.length){ensure(size+5);y-=size+5;continue}
      for(const word of words){const candidate=current?current+' '+word:word;
        if(current && font.widthOfTextAtSize(candidate,size)>width){ensure(size+5);page.drawText(current,{x:left+indent,y,size,font,color});y-=size+5;current=word}else current=candidate;
      }
      if(current){ensure(size+5);page.drawText(current,{x:left+indent,y,size,font,color});y-=size+5}
    }
    y-=gap;
  }
  function section(title){ensure(32);y-=9;line(title.toUpperCase(),{font:bold,size:11,color:red,gap:7})}
  nextPage();
  line('RELATÓRIO DE SITUAÇÃO DA OBRA',{font:bold,size:17,color:red,gap:12});
  const date = new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeStyle:'short'}).format(new Date());
  line(`Emitido em: ${date}`,{size:10,color:gray,gap:12});
  section('Dados da obra');
  line(`Cliente / obra: ${obra['Cliente/Obra']||'-'}`);
  line(`Endereço: ${obra['Endereço do cliente']||'-'}`);
  line(`Início: ${obra['Data início']||'-'}    Status: ${obra.Status||'-'}`);
  section('Andamento');
  const r=effectiveReport(obra);
  const services=typeof jsoServiceSummary==='function'?jsoServiceSummary(obra):null;
  if(services)r.percentual=services.percent;
  line(`Etapa atual: ${r.etapa||'Não informada'}`);
  line(`Executado: ${r.percentual===''||r.percentual==null?'Não informado':r.percentual+'%'}`);
  line('Serviços realizados:',{font:bold,gap:2});line(r.realizados||'Não informados.',{indent:12});
  line('Próximas etapas:',{font:bold,gap:2});line(r.proximas||'Não informadas.',{indent:12});
  if(r.observacoes){line('Observações:',{font:bold,gap:2});line(r.observacoes,{indent:12})}
  if(services){
    section('Acompanhamento dos serviços contratados');
    line(`${services.done.length} de ${services.rows.length} serviços concluídos. Andamento: ${services.percent.toLocaleString('pt-BR')}%.`);
    line('Média das porcentagens dos serviços, com o mesmo peso para cada serviço.',{size:10,color:gray});
    line('Serviços concluídos:',{font:bold,gap:2});
    if(!services.done.length)line('Nenhum serviço concluído.',{indent:12});
    services.done.forEach(s=>line(`- ${s.group?s.group+' - ':''}${s.name}`,{indent:12,size:10,gap:1}));
    line('Serviços pendentes ou em andamento:',{font:bold,gap:2});
    if(!services.pending.length)line('Todos os serviços concluídos.',{indent:12});
    services.pending.forEach(s=>line(`- ${s.group?s.group+' - ':''}${s.name} (${progressRatio(s).toLocaleString('pt-BR',{maximumFractionDigits:1})}%)`,{indent:12,size:10,gap:1}));
  }
  const name=obra['Cliente/Obra'];
  const extras=db.extras.filter(x=>x.Obra===name&&x['Aprovado?']!=='Não');
  const recebimentos=db.recebimentos.filter(x=>x.Obra===name);
  const inicial=num(obra['Valor inicial']),extraTotal=extras.reduce((sum,x)=>sum+num(x.Valor),0),recebido=recebimentos.reduce((sum,x)=>sum+num(x['Valor recebido']),0);
  section('Situação financeira registrada');
  line(`Valor inicial: ${money(inicial)}`);line(`Serviços extras: ${money(extraTotal)}`);
  line(`Total contratado: ${money(inicial+extraTotal)}`,{font:bold});
  line(`Total recebido: ${money(recebido)}`);line(`Saldo a receber: ${money(inicial+extraTotal-recebido)}`,{font:bold});
  if(extras.length){line('Extras registrados:',{font:bold,gap:2});extras.forEach(x=>line(`- ${x['Serviço adicional']||'Serviço extra'}: ${money(num(x.Valor))}`,{indent:12,size:10,gap:1}))}
  if(recebimentos.length){line('Recebimentos registrados:',{font:bold,gap:2});recebimentos.forEach(x=>line(`- ${x.Data||'Sem data'}: ${money(num(x['Valor recebido']))} ${x.Descrição||''}`,{indent:12,size:10,gap:1}))}
  const fotos=reportPhotos(obra);
  section(`Fotos da obra (${fotos.length})`);
  if(!fotos.length)line('Nenhuma foto adicionada.');
  for(let i=0;i<fotos.length;i++){
    const registro=await getAttachment(fotos[i].id).catch(()=>null);
    if(!registro){line(`Foto ${i+1}: indisponível neste aparelho.`,{size:10,color:gray});continue}
    let jpeg;try{jpeg=await photoAsJpeg(registro.blob)}catch(e){jpeg=null}
    if(!jpeg){line(`Foto ${i+1}: formato não suportado no PDF.`,{size:10,color:gray});continue}
    const image=await pdf.embedJpg(jpeg);
    const size=image.scaleToFit(W-left-right,270);
    ensure(size.height+48);
    line(`Foto ${i+1}: ${registro.name||fotos[i].name||'Foto da obra'}`,{font:bold,size:10,gap:4});
    if(fotos[i].caption)line(fotos[i].caption,{size:10,color:gray,gap:4});
    ensure(size.height+20);
    page.drawImage(image,{x:left,y:y-size.height,width:size.width,height:size.height});
    y-=size.height+20;
  }
  ensure(35);line('Construtora JSO - Construções e Reformas',{font:bold,size:10,color:gray});
  return await pdf.save();
}
