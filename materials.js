const materialPDFs = new Map();
function clearMaterialPDFs(){for(const item of materialPDFs.values())URL.revokeObjectURL(item.url);materialPDFs.clear()}
function migrateOldMaterials(){
 db.listasMateriais??=[];
 if(db._materiaisMigrados)return;
 const grupos=new Map();
 for(const item of db.materiais||[]){
  const obra=item.obra||'';
  if(!grupos.has(obra))grupos.set(obra,[]);
  grupos.get(obra).push({material:String(item.material||''),quantidade:String(item.quantidade||'')});
 }
 for(const [obra,itens] of grupos){
  if(itens.length)db.listasMateriais.push({id:crypto.randomUUID(),cliente:obra||'Lista anterior',obra,data:today(),itens});
 }
 db._materiaisMigrados=true;save();
}
function materialRow(item={}){
 return `<div class="material-row"><label>Material<input class="material-name" value="${esc(item.material)}" placeholder="Ex.: Cimento CP II"></label><label>Quantidade<input class="material-quantity" value="${esc(item.quantidade)}" placeholder="Ex.: 20 sacos"></label><button class="btn danger" data-action="material-row-remove" aria-label="Remover material">×</button></div>`;
}
function materialShareText(lista){
 return `LISTA DE MATERIAL - JSO\nCliente: ${lista.cliente}${lista.obra?`\nObra: ${lista.obra}`:''}\n\n${lista.itens.map((item,i)=>`${i+1}. ${item.material} - ${item.quantidade}`).join('\n')}`;
}
function materialShareURL(lista){return 'https://wa.me/?text='+encodeURIComponent(materialShareText(lista))}
function materialView(editId=null){
 clearMaterialPDFs();
 migrateOldMaterials();
 const lista=db.listasMateriais.find(x=>x.id===editId);
 document.querySelector('#view').innerHTML=`<div class="title"><h1>Lista de material</h1></div>
 <section class="panel material-editor"><h2>${lista?'Editar lista':'Nova lista'}</h2>
 <div class="formgrid"><label>Cliente / nome da lista<input id="material-client" value="${esc(lista?.cliente)}" placeholder="Ex.: Henrique"></label>
 <label>Obra (opcional)<select id="material-work"><option value="">Sem obra vinculada</option>${db.obras.map(o=>`<option value="${esc(o['Cliente/Obra'])}" ${lista?.obra===o['Cliente/Obra']?'selected':''}>${esc(o['Cliente/Obra'])}</option>`).join('')}</select></label></div>
 <div class="material-rows" id="material-rows">${(lista?.itens?.length?lista.itens:[{}]).map(materialRow).join('')}</div>
 <div class="actions"><button class="btn alt" data-action="material-row-add">+ Adicionar material</button><button class="btn yellow" data-action="material-save" data-id="${esc(lista?.id)}">Salvar lista inteira</button>${lista?'<button class="btn alt" data-action="material-new">Nova lista</button>':''}</div>
 <p class="muted">Preencha todos os materiais e salve a lista uma vez só. A quantidade pode incluir a unidade, como “20 sacos” ou “3 m³”.</p></section>
 <section class="panel"><h2>Listas salvas</h2>${db.listasMateriais.length?`<div class="saved-material-lists">${db.listasMateriais.map(item=>`<div class="saved-list"><div><strong>${esc(item.cliente)}</strong>${item.obra?`<small>${esc(item.obra)}</small>`:''}<small>${item.itens.length} ${item.itens.length===1?'material':'materiais'}</small></div><div class="actions"><button class="btn alt" data-action="material-edit" data-id="${esc(item.id)}">Editar</button><a class="btn" href="${esc(materialShareURL(item))}" target="_blank" rel="noopener noreferrer">Enviar lista</a><button class="btn yellow" data-action="material-pdf" data-id="${esc(item.id)}">Gerar PDF</button><button class="btn danger" data-action="material-delete" data-id="${esc(item.id)}">Excluir</button></div><div class="material-pdf-result" data-material-pdf-result="${esc(item.id)}" aria-live="polite"></div></div>`).join('')}</div>`:'<p class="muted">Nenhuma lista salva.</p>'}</section>`;
}

function addMaterialRow(){document.querySelector('#material-rows').insertAdjacentHTML('beforeend',materialRow());document.querySelector('#material-rows .material-row:last-child .material-name')?.focus()}
function saveMaterialList(id){
 const cliente=document.querySelector('#material-client').value.trim();
 const obra=document.querySelector('#material-work').value;
 const itens=[...document.querySelectorAll('.material-row')].map(row=>({material:row.querySelector('.material-name').value.trim(),quantidade:row.querySelector('.material-quantity').value.trim()}));
 if(!cliente){alert('Informe o cliente ou nome da lista.');return}
 if(!itens.length||itens.some(item=>!item.material||!item.quantidade)){alert('Preencha material e quantidade em todas as linhas, ou remova as linhas vazias.');return}
 const existing=db.listasMateriais.find(x=>x.id===id);
 if(existing){Object.assign(existing,{cliente,obra,itens})}
 else db.listasMateriais.push({id:crypto.randomUUID(),cliente,obra,data:today(),itens});
 save();materialView();
}
function deleteMaterialList(id){
 if(!confirm('Excluir esta lista de material?'))return;
 db.listasMateriais=db.listasMateriais.filter(x=>x.id!==id);save();materialView();
}
function materialPDFResult(id){return [...document.querySelectorAll('[data-material-pdf-result]')].find(el=>el.dataset.materialPdfResult===id)}
async function prepareMaterialPDF(id,button){
 const lista=db.listasMateriais.find(x=>x.id===id);if(!lista)return;
 const result=materialPDFResult(id);button.disabled=true;result.textContent='Preparando o PDF…';
 try{
  const bytes=await buildMaterialPDF(lista);
  const safeName=String(lista.cliente||'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,45);
  const filename=`Lista_de_Material_JSO_${safeName}_${today()}.pdf`;
  const file=new File([bytes],filename,{type:'application/pdf'});
  const url=URL.createObjectURL(file);
  const old=materialPDFs.get(id);if(old)URL.revokeObjectURL(old.url);
  materialPDFs.set(id,{file,url});
  const canShare=!!(navigator.share&&navigator.canShare?.({files:[file]}));
  result.innerHTML=`<p>PDF pronto.</p><div class="actions">${canShare?`<button class="btn" data-action="material-pdf-share" data-id="${esc(id)}">Enviar PDF</button>`:''}<a class="btn alt" href="${url}" download="${esc(filename)}">Salvar PDF</a></div>`;
 }catch(e){result.textContent='Não foi possível gerar o PDF. Tente novamente.'}
 finally{button.disabled=false}
}
async function shareMaterialPDF(id){
 const item=materialPDFs.get(id);if(!item||!navigator.share)return;
 try{await navigator.share({files:[item.file],title:'Lista de material JSO'})}
 catch(e){if(e.name!=='AbortError')alert('Não foi possível compartilhar. Use Salvar PDF e anexe o arquivo no WhatsApp.')}
}
async function buildMaterialPDF(lista){
 const {PDFDocument,StandardFonts,rgb}=PDFLib;
 const pdf=await PDFDocument.create();pdf.setTitle(`Lista de material - ${pdfText(lista.cliente)}`);
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const W=595.28,H=841.89,left=42,right=42,red=rgb(.77,.12,.12),yellow=rgb(1,.77,0),dark=rgb(.15,.15,.15),gray=rgb(.38,.38,.38);
 let page,y,pageNumber=0;
 function nextPage(){
  page=pdf.addPage([W,H]);pageNumber++;
  page.drawRectangle({x:0,y:H-10,width:W,height:10,color:red});
  page.drawText('JSO',{x:left,y:H-56,size:28,font:bold,color:red});
  page.drawText('CONSTRUÇÕES E REFORMAS',{x:112,y:H-48,size:12,font:bold,color:dark});
  page.drawText('A Construtora do Povo',{x:112,y:H-65,size:10,font:regular,color:gray});
  page.drawLine({start:{x:left,y:H-79},end:{x:W-right,y:H-79},thickness:2,color:yellow});
  page.drawText(`Página ${pageNumber}`,{x:W-right-45,y:24,size:9,font:regular,color:gray});
  y=H-108;
 }
 function wrap(value,maxWidth,font,size){
  const words=pdfText(value).replace(/\s+/g,' ').trim().split(' ');const lines=[];let current='';
  for(const word of words){const candidate=current?current+' '+word:word;if(current&&font.widthOfTextAtSize(candidate,size)>maxWidth){lines.push(current);current=word}else current=candidate}
  if(current)lines.push(current);return lines.length?lines:['-'];
 }
 function header(){
  page.drawRectangle({x:left,y:y-22,width:W-left-right,height:28,color:red});
  page.drawText('MATERIAL',{x:left+10,y:y-12,size:10,font:bold,color:rgb(1,1,1)});
  page.drawText('QUANTIDADE',{x:W-right-145,y:y-12,size:10,font:bold,color:rgb(1,1,1)});
  y-=35;
 }
 nextPage();
 page.drawText('LISTA DE MATERIAL',{x:left,y,size:18,font:bold,color:red});y-=28;
 const data=lista.data?lista.data.split('-').reverse().join('/'):'-';
 for(const field of [`Cliente: ${lista.cliente||'-'}`,`Obra: ${lista.obra||'Não vinculada'}`,`Data: ${data}`]){
  for(const line of wrap(field,W-left-right,regular,11)){page.drawText(line,{x:left,y,size:11,font:regular,color:dark});y-=16}
  y-=3;
 }
 y-=12;header();
 lista.itens.forEach((item,index)=>{
  const materialLines=wrap(`${index+1}. ${item.material}`,W-left-right-162,regular,11);
  const quantityLines=wrap(item.quantidade,140,regular,11);
  const height=Math.max(materialLines.length,quantityLines.length)*15+14;
  if(y-height<75){nextPage();header()}
  if(index%2===0)page.drawRectangle({x:left,y:y-height+4,width:W-left-right,height,color:rgb(.97,.97,.97)});
  materialLines.forEach((text,i)=>page.drawText(text,{x:left+10,y:y-12-i*15,size:11,font:regular,color:dark}));
  quantityLines.forEach((text,i)=>page.drawText(text,{x:W-right-145,y:y-12-i*15,size:11,font:regular,color:dark}));
  y-=height;
 });
 if(y<130)nextPage();
 y-=35;
 page.drawLine({start:{x:left,y},end:{x:left+210,y},thickness:1,color:gray});
 page.drawText('Construtora JSO',{x:left,y:y-16,size:10,font:regular,color:gray});
 page.drawText('Lista sem valores - somente materiais e quantidades',{x:left,y:49,size:9,font:regular,color:gray});
 return await pdf.save();
}
