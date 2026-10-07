function showMaterialSuggestions(input){const box=input.closest('.material-row').querySelector('.material-suggestions');const query=materialKey(input.value);box.innerHTML=query?materialCatalog().filter(n=>materialKey(n).includes(query)).slice(0,12).map(n=>`<button type="button" class="btn alt" style="display:block;width:100%;text-align:left;margin:3px 0" data-action="material-pick" data-name="${esc(n)}">${esc(n)}</button>`).join(''):''}
document.addEventListener('input',event=>{if(event.target.matches('.material-name'))showMaterialSuggestions(event.target)});
document.addEventListener('click',event=>{const button=event.target.closest('[data-action="material-pick"]');if(!button)return;const row=button.closest('.material-row');row.querySelector('.material-name').value=button.dataset.name;row.querySelector('.material-suggestions').innerHTML='';row.querySelector('.material-quantity').focus()});
const MATERIAL_CATALOG = ["Cimento CP II", "Cimento CP III", "Cimento CP V", "Cimento branco", "Areia fina", "Areia média", "Areia grossa", "Areia lavada", "Brita 0", "Brita 1", "Brita 2", "Pó de pedra", "Saibro", "Argamassa AC I", "Argamassa AC II", "Argamassa AC III", "Argamassa branca", "Argamassa autonivelante", "Graute", "Cal hidratada", "Gesso em pó", "Rejunte cimentício", "Rejunte acrílico", "Rejunte epóxi", "Aditivo plastificante", "Impermeabilizante para argamassa", "Tijolo cerâmico 6 furos", "Tijolo cerâmico 8 furos", "Tijolo maciço", "Bloco de concreto 9 cm", "Bloco de concreto 14 cm", "Bloco de concreto 19 cm", "Bloco estrutural", "Canaleta de concreto", "Vergalhão CA-50 6,3 mm", "Vergalhão CA-50 8 mm", "Vergalhão CA-50 10 mm (3/8)", "Vergalhão CA-50 12,5 mm", "Vergalhão CA-50 16 mm", "Vergalhão CA-60 5 mm", "Coluna pronta 3/8", "Estribo", "Arame recozido", "Tela soldada", "Treliça metálica", "Espaçador para ferragem", "Concreto usinado", "Vigota para laje", "Lajota cerâmica", "EPS para laje", "Tábua para forma", "Compensado plastificado", "Sarrafo", "Pontalete", "Escora metálica", "Pranchão de madeira", "Viga de madeira", "Caibro", "Ripa", "Madeira para deck", "Prego 17×21", "Prego de aço 17×21", "Parafuso para madeira", "Parafuso para drywall", "Bucha 6 mm", "Bucha 8 mm", "Bucha 10 mm", "Chumbador", "Sikadur (adesivo epóxi)", "Selante PU", "Silicone neutro", "Espuma expansiva", "Adesivo de contato", "Cola para PVC", "Fita veda rosca", "Tubo PVC soldável 20 mm", "Tubo PVC soldável 25 mm", "Tubo PVC soldável 32 mm", "Tubo PVC soldável 40 mm", "Tubo PVC soldável 50 mm", "Tubo PVC esgoto 40 mm", "Tubo PVC esgoto 50 mm", "Tubo PVC esgoto 75 mm", "Tubo PVC esgoto 100 mm", "Tubo PVC esgoto 150 mm", "Tubo CPVC", "Tubo PEX", "Tubo PPR", "Joelho PVC soldável", "Joelho PVC esgoto", "Tê PVC soldável", "Tê PVC esgoto", "Luva PVC", "União PVC", "Adaptador soldável com rosca", "Redução PVC", "Registro de gaveta", "Registro de pressão", "Registro de esfera", "Caixa d’água", "Caixa sifonada", "Caixa de gordura", "Caixa de inspeção", "Ralo", "Sifão", "Engate flexível", "Torneira", "Misturador", "Chuveiro", "Vaso sanitário", "Caixa acoplada", "Assento sanitário", "Cuba de banheiro", "Cuba de cozinha", "Válvula para lavatório", "Bomba d’água", "Boia para caixa d’água", "Eletroduto corrugado 20 mm", "Eletroduto corrugado 25 mm", "Eletroduto corrugado 32 mm", "Eletroduto rígido", "Caixa elétrica 4×2", "Caixa elétrica 4×4", "Caixa octogonal", "Caixa de passagem elétrica", "Quadro de distribuição", "Cabo elétrico 1,5 mm²", "Cabo elétrico 2,5 mm²", "Cabo elétrico 4 mm²", "Cabo elétrico 6 mm²", "Cabo elétrico 10 mm²", "Cabo elétrico 16 mm²", "Cabo PP 3 vias", "Cabo PP 4 vias", "Cabo de rede", "Disjuntor monopolar", "Disjuntor bipolar", "Disjuntor tripolar", "Dispositivo DR", "DPS", "Haste de aterramento", "Conector elétrico", "Fita isolante", "Tomada 10 A", "Tomada 20 A", "Interruptor simples", "Interruptor paralelo", "Placa e suporte elétrico", "Lâmpada LED", "Spot LED", "Painel LED", "Fita LED", "Luminária", "Ventilador de teto", "Porcelanato", "Piso cerâmico", "Revestimento cerâmico", "Pastilha", "Rodapé", "Soleira de granito", "Peitoril de granito", "Bancada de granito", "Bancada de mármore", "Espaçador para revestimento", "Nivelador de piso", "Cunha para nivelador", "Disco diamantado", "Manta asfáltica", "Primer asfáltico", "Manta líquida", "Argamassa polimérica", "Tela para impermeabilização", "Fita para vedação", "Tinta acrílica branca", "Tinta acrílica colorida", "Tinta látex PVA", "Tinta esmalte", "Tinta para piso", "Tinta para telhado", "Tinta epóxi", "Massa corrida PVA", "Massa acrílica", "Selador acrílico", "Fundo preparador", "Grafiato", "Textura acrílica", "Verniz", "Stain para madeira", "Solvente", "Thinner", "Aguarrás", "Lixa para parede", "Lixa para madeira", "Lixa para metal", "Rolo de pintura", "Pincel", "Trincha", "Fita crepe", "Lona plástica", "Bandeja de pintura", "Chapa drywall ST", "Chapa drywall RU", "Chapa drywall RF", "Guia para drywall", "Montante para drywall", "Perfil F530", "Cantoneira", "Tabica", "Tirante", "Fita para drywall", "Massa para drywall", "Lã de vidro", "Lã de rocha", "Forro PVC", "Placa de gesso", "Moldura de gesso", "Telha cerâmica", "Telha de fibrocimento", "Telha metálica", "Telha sanduíche", "Cumeeira", "Rufo", "Calha", "Condutor pluvial", "Manta térmica", "Parafuso para telha", "Porta de madeira", "Porta de alumínio", "Janela de alumínio", "Janela de vidro", "Batente", "Guarnição", "Fechadura", "Dobradiça", "Puxador", "Vidro temperado", "Guarda-corpo", "Tubo de cobre 1/4", "Tubo de cobre 3/8", "Tubo de cobre 1/2", "Isolamento para tubo de cobre", "Mangueira de dreno", "Suporte de ar-condicionado", "Skimmer para piscina", "Dispositivo de retorno para piscina", "Dispositivo de aspiração para piscina", "Ralo de fundo para piscina", "Filtro de piscina", "Bomba de piscina", "Refletor de piscina", "Mangueira para piscina", "Disco para madeira (serra mármore)", "Broca SDS", "Broca SDS longa 1/2", "Broca para concreto", "Broca para madeira", "Broca para metal", "Disco de corte para metal", "Disco de desbaste", "Serra copo", "Desempenadeira", "Colher de pedreiro", "Espátula", "Trena", "Nível", "Linha de pedreiro", "Balde", "Carrinho de mão", "Enxada", "Pá", "Martelete", "Luvas de proteção", "Óculos de proteção", "Capacete", "Máscara PFF2", "Protetor auricular", "Botina de segurança", "Cinto de segurança"];
function materialKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR')}
function materialCatalog(){db.catalogoMateriais??=[];const names=[...MATERIAL_CATALOG,...db.catalogoMateriais,...(db.listasMateriais||[]).flatMap(l=>(l.itens||[]).map(i=>i.material))];return [...new Map(names.filter(Boolean).map(n=>[materialKey(n),n])).values()].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function refreshMaterialOptions(){const list=document.querySelector('#material-catalog');if(list)list.innerHTML=materialCatalog().map(n=>`<option value="${esc(n)}"></option>`).join('')}
document.addEventListener('click',event=>{const button=event.target.closest('[data-action="material-catalog-add"]');if(!button)return;const name=button.closest('.material-row').querySelector('.material-name').value.trim();if(!name){alert('Digite o nome do material para cadastrar.');return}if(materialCatalog().some(n=>materialKey(n)===materialKey(name))){alert('Este material já está no catálogo.');return}db.catalogoMateriais??=[];db.catalogoMateriais.push(name);save();refreshMaterialOptions();button.textContent='Cadastrado ✓'});
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
 return `<div class="material-row"><label>Material<input class="material-name" autocomplete="off" value="${esc(item.material)}" placeholder="Digite para buscar ou cadastrar"><div class="material-suggestions" aria-live="polite"></div><button type="button" class="btn alt" data-action="material-catalog-add">+ Cadastrar material</button></label><label>Quantidade<input class="material-quantity" value="${esc(item.quantidade)}" placeholder="Ex.: 20 sacos"></label><button class="btn danger" data-action="material-row-remove" aria-label="Remover material">×</button></div>`;
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
 <div class="formgrid">${clientPicker('material-client',lista?.cliente||'')}
 <label>Obra (opcional)<select id="material-work"><option value="">Sem obra vinculada</option>${db.obras.map(o=>`<option value="${esc(o['Cliente/Obra'])}" ${lista?.obra===o['Cliente/Obra']?'selected':''}>${esc(o['Cliente/Obra'])}</option>`).join('')}</select></label></div>
 <datalist id="material-catalog">${materialCatalog().map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist><div class="material-rows" id="material-rows">${(lista?.itens?.length?lista.itens:[{}]).map(materialRow).join('')}</div>
 <div class="actions"><button class="btn alt" data-action="material-row-add">+ Adicionar material</button><button class="btn yellow" data-action="material-save" data-id="${esc(lista?.id)}">Salvar lista inteira</button>${lista?'<button class="btn alt" data-action="material-new">Nova lista</button>':''}</div>
 <p class="muted">Digite o nome para buscar no catálogo. Se não encontrar, use “Cadastrar material” na mesma linha. Preencha todos os materiais e salve a lista uma vez só. A quantidade pode incluir a unidade, como “20 sacos” ou “3 m³”.</p></section>
 <section class="panel"><h2>Listas salvas</h2>${db.listasMateriais.length?`<div class="saved-material-lists">${db.listasMateriais.map(item=>`<div class="saved-list"><div><strong>${esc(item.cliente)}</strong>${item.obra?`<small>${esc(item.obra)}</small>`:''}<small>${item.itens.length} ${item.itens.length===1?'material':'materiais'}</small></div><div class="actions"><button class="btn alt" data-action="material-edit" data-id="${esc(item.id)}">Editar</button><a class="btn" href="${esc(materialShareURL(item))}" target="_blank" rel="noopener noreferrer">Enviar lista</a><button class="btn yellow" data-action="material-pdf" data-id="${esc(item.id)}">Gerar PDF</button><button class="btn danger" data-action="material-delete" data-id="${esc(item.id)}">Excluir</button></div><div class="material-pdf-result" data-material-pdf-result="${esc(item.id)}" aria-live="polite"></div></div>`).join('')}</div>`:'<p class="muted">Nenhuma lista salva.</p>'}</section>`;
}

function addMaterialRow(){document.querySelector('#material-rows').insertAdjacentHTML('beforeend',materialRow());document.querySelector('#material-rows .material-row:last-child .material-name')?.focus()}
function saveMaterialList(id){
 const client=selectedClient('material-client');if(!client)return;const cliente=client.nome,clienteId=client.id;
 const obra=document.querySelector('#material-work').value;
 const itens=[...document.querySelectorAll('.material-row')].map(row=>({material:row.querySelector('.material-name').value.trim(),quantidade:row.querySelector('.material-quantity').value.trim()}));
 if(!cliente){alert('Informe o cliente ou nome da lista.');return}
 if(!itens.length||itens.some(item=>!item.material||!item.quantidade)){alert('Preencha material e quantidade em todas as linhas, ou remova as linhas vazias.');return}
 const existing=db.listasMateriais.find(x=>x.id===id);
 if(existing){Object.assign(existing,{clienteId,cliente,obra,itens})}
 else db.listasMateriais.push({id:crypto.randomUUID(),clienteId,cliente,obra,data:today(),itens});
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


/* Lista de Flávia: teto drywall, área estimada 16,42 m². */
(function(){
 const key='lista-flavia-drywall-20261007';
 function adicionarListaFlavia(){
  if((db.importacoesListas||[]).includes(key))return;
  const snapshot=JSON.stringify(db);
  try{
   db.clientes??=[];db.listasMateriais??=[];db.importacoesListas??=[];
   let client=findClient('Flávia');
   if(!client){client={id:crypto.randomUUID(),nome:'Flávia',endereco:'',celular:''};db.clientes.push(client)}
   if(!db.listasMateriais.some(l=>l.id===key))db.listasMateriais.push({
    id:key,clienteId:client.id,cliente:client.nome,obra:'',data:'2026-10-07',
    obs:'Teto drywall: área estimada 16,42 m². Sala 3,60 × 5 m; descontado vão da escada 1,10 × 3 m; acrescentada faixa 2,15 × 0,80 m. Parte com X sem teto. Quantidades estimadas com sobra para recortes. Comprimento dos tirantes conforme rebaixamento. Sem pintura ou fechamento vertical na borda da escada.',
    itens:[{"material":"Chapa drywall ST 12,5 mm - 1,20 × 1,80 m","quantidade":"9 chapas"},{"material":"Perfil F-530 de 3 m","quantidade":"12 barras"},{"material":"Cantoneira de perímetro de 3 m","quantidade":"8 barras"},{"material":"União para perfil F-530","quantidade":"12 unidades"},{"material":"Conjunto tirante + regulador para F-530 (comprimento conforme rebaixamento)","quantidade":"30 conjuntos"},{"material":"Fixação dos tirantes adequada à laje","quantidade":"30 unidades"},{"material":"Buchas e parafusos para cantoneiras nas paredes","quantidade":"50 conjuntos"},{"material":"Parafuso TN25 para chapas","quantidade":"500 unidades"},{"material":"Parafuso metal/metal TRPF13","quantidade":"100 unidades"},{"material":"Massa própria para juntas de drywall","quantidade":"10 kg"},{"material":"Fita de papel para juntas","quantidade":"1 rolo de 50 m"},{"material":"Lixa 180 ou 220","quantidade":"5 folhas"}]
   });
   db.importacoesListas.push(key);save();
  }catch(error){db=JSON.parse(snapshot);console.error('Não foi possível salvar a lista de Flávia.',error)}
 }
 function abrirListaFlavia(){
  adicionarListaFlavia();
  if(new URLSearchParams(location.search).get('lista')==='flavia20261007')show('materiais');
 }
 abrirListaFlavia();window.addEventListener('pageshow',abrirListaFlavia);
})();

