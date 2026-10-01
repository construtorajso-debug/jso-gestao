const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function parseCurrency(value){if(typeof value==='number')return Number.isFinite(value)?value:0;let text=String(value??'').replace(/[^\d,.-]/g,'');if(!text)return 0;const comma=text.lastIndexOf(','),dot=text.lastIndexOf('.');if(comma>=0&&dot>=0){text=comma>dot?text.replace(/\./g,'').replace(',','.'):text.replace(/,/g,'')}else if(comma>=0)text=text.replace(',','.');else if(/^[-]?\d{1,3}(\.\d{3})+$/.test(text))text=text.replace(/\./g,'');return Number(text)||0}
const currencyNumber=n=>parseCurrency(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const money=n=>parseCurrency(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}), today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const schema={
 obras:['Cliente/Obra','Endereço do cliente','Celular do cliente','Data início','Valor inicial','Status'],
 recebimentos:['Data','Obra','Semana/Parcela','Descrição','Valor recebido','Forma de pagamento','Pago?','Observação'],
 extras:['Data','Obra','Serviço adicional','Quantidade','Valor','Aprovado?','Observação'],
 gastos:['Data','Obra','Categoria','Descrição','Qtd.','Valor total','Forma pagamento','Comprovante/Obs.','Responsável'],
 colaboradores:['Data','Obra','Colaborador','Função','Diária','Dias','Extras','Alimentação','Transporte','Pago?'],
 imprevistos:['Data','Obra','Motivo','Descrição','Valor','Responsável','Observação']};
const labels={inicio:'Quem Somos',dashboard:'Resumo Geral',obras:'Obras',andamento:'Obras em andamento',situacao:'Situação da obra',diario:'Diário de Obra',materiais:'Lista de material',recebimentos:'Recebimentos',extras:'Serviços Extras',gastos:'Gastos',colaboradores:'Colaboradores',clientes:'Clientes',categorias:'Categorias',orcamentos:'Orçamentos',graficos:'Painel Gráficos'};
const cats=['Combustível','Alimentação','Passagem/Transporte','Mão de obra','Material','Ferramentas','Aluguel de equipamentos','Imprevistos'];
const formChoices={
 'Status':['Andamento','Concluído','Pausado'],
 'Categoria':cats,
 'Pago?':['Não','Sim'],
 'Aprovado?':['Não','Sim'],
 'Forma de pagamento':['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Boleto','Outro'],
 'Forma pagamento':['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Boleto','Outro'],
 'Função':['Pedreiro','Ajudante','Mestre de obras','Eletricista','Encanador','Pintor','Gesseiro','Outro']
};
const currencyFields=new Set(['Valor inicial','Valor recebido','Valor','Valor total','Diária','Alimentação','Transporte']);
function isCurrencyField(kind,c){return currencyFields.has(c)||(kind==='colaboradores'&&c==='Extras')}
function choiceField(kind,c,editIndex){
 const id='f_'+slug(c);
 const previous=editIndex===null?(c==='Status'?'Andamento':''):String(db[kind][editIndex][c]??'');
 const options=c==='Obra'?[...new Set(db.obras.map(o=>o['Cliente/Obra']).filter(Boolean))]:formChoices[c];
 if(kind==='obras'&&c==='Cliente/Obra')return clientPicker(id,previous,'Cliente','f_Endereco_do_cliente','f_Celular_do_cliente');
 if(options){
  const values=[...options];if(previous&&!values.includes(previous))values.push(previous);
  return `<label>${esc(c)}<select id="${id}" ${c==='Obra'?'required':''}><option value="">Escolha ${c==='Obra'?'uma obra':'uma opção'}</option>${values.map(v=>`<option value="${esc(v)}" ${v===previous?'selected':''}>${esc(v)}</option>`).join('')}</select>${c==='Obra'&&!values.length?'<small>Cadastre a obra na aba Obras primeiro.</small>':''}</label>`;
 }
 if(isCurrencyField(kind,c))return `<label>${esc(c)} (R$)<span class="currency-wrap"><span>R$</span><input id="${id}" class="money-entry" type="text" inputmode="decimal" placeholder="0,00" value="${previous?esc(currencyNumber(previous)):''}"></span></label>`;
 return `<label>${esc(c)}<input id="${id}" type="${c==='Celular do cliente'?'tel':/Data/.test(c)?'date':/Dias|Qtd|Quantidade/.test(c)?'number':'text'}" ${c==='Celular do cliente'?'inputmode="tel"':''} ${/Dias|Qtd|Quantidade/.test(c)?'step="0.01"':''}></label>`;
}

let db=JSON.parse(localStorage.getItem('jso_db')||'null')||{obras:[],recebimentos:[],extras:[],gastos:[],colaboradores:[],imprevistos:[],orcamentos:[]};db.materiais??=[];db.listasMateriais??=[];db.equipe??=[];db.servicosOrcamento??=[];for(const entry of db.colaboradores){const nome=String(entry.Colaborador||'').trim();if(nome&&!db.equipe.some(p=>p.nome.toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR')))db.equipe.push({nome,funcao:entry['Função']||'Outro',diaria:Number(entry['Diária'])||0});}
const save=()=>localStorage.setItem('jso_db',JSON.stringify(db)); const num=x=>parseCurrency(x);
function calc(work=null){const byWork=(rows,key='Obra')=>work===null?rows:rows.filter(x=>x[key]===work);let contratos=byWork(db.obras,'Cliente/Obra').reduce((sum,o)=>sum+num(o['Valor inicial']),0),extras=byWork(db.extras).filter(x=>x['Aprovado?']!=='Não').reduce((sum,x)=>sum+num(x.Valor),0),rec=byWork(db.recebimentos).reduce((sum,x)=>sum+num(x['Valor recebido']),0),gastos=byWork(db.gastos).reduce((sum,x)=>sum+num(x['Valor total']),0)+byWork(db.imprevistos).reduce((sum,x)=>sum+num(x.Valor),0)+byWork(db.colaboradores).reduce((sum,x)=>sum+num(x['Diária'])*num(x.Dias)+num(x.Extras)+num(x.Alimentação)+num(x.Transporte),0);return{contratos:contratos+extras,rec,gastos,saldo:contratos+extras-rec,caixa:rec-gastos,potencial:contratos+extras-gastos}}
let dashboardWork='';
function nav(){let n=document.querySelector('#nav');n.innerHTML=Object.entries(labels).map(([k,v])=>`<button data-v="${k}">${v}</button>`).join('')+`<button data-v="backup">Backup dos dados</button>`;n.onclick=e=>{if(e.target.dataset.v){show(e.target.dataset.v);n.classList.remove('open')}};}
const photoURLs=new Set();
function clearPhotoURLs(){for(const url of photoURLs)URL.revokeObjectURL(url);photoURLs.clear()}
function show(k){clearPhotoURLs();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.v===k)); if(k==='diario')return diaryView(); if(k==='inicio')return aboutView(); if(k==='clientes')return clientsView(); if(k==='andamento')return ongoingWorks(); if(k==='situacao')return reportView(); if(k==='materiais')return materialView(); if(k==='colaboradores')return attendanceView(); if(k==='dashboard'||k==='graficos')return dashboard(k); if(k==='categorias')return categories(); if(k==='orcamentos')return quotes(); if(k==='backup')return backup(); tableView(k)}
function aboutView(){
 document.querySelector('#view').innerHTML=`<section class="jso-home"><div class="jso-intro"><span class="jso-eyebrow">QUEM SOMOS</span><h1>Construtora JSO</h1><p class="jso-slogan">A Construtora do Povo</p><p>Construções e reformas para transformar seu projeto em realidade.</p></div><section class="panel"><h2>Construções e reformas</h2><p>A JSO atua com construção, reforma e acabamento, do início da obra aos detalhes finais.</p><h3>Principais serviços</h3><div class="jso-services"><div><strong>Estrutura e alvenaria</strong><p>Fundações, pilares, vigas, lajes e muros.</p></div><div><strong>Reformas e acabamentos</strong><p>Porcelanato, revestimentos, drywall e gesso.</p></div><div><strong>Elétrica e hidráulica</strong><p>Instalações e infraestrutura para sua obra.</p></div><div><strong>Pintura e fachadas</strong><p>Pintura interna e externa, texturas e impermeabilização.</p></div></div></section><section class="panel jso-contact"><h2>Fale com a JSO</h2><p>WhatsApp: (21) 99639-2113<br>Instagram: @casas_jso<br>E-mail: construtorajso@gmail.com</p></section></section>`;
}
function dashboard(k){const c=calc(),works=[...new Set(db.obras.map(o=>o['Cliente/Obra']).filter(Boolean))];if(dashboardWork&&!works.includes(dashboardWork))dashboardWork='';const w=dashboardWork?calc(dashboardWork):null;document.querySelector('#view').innerHTML=`<div class="title"><h1>${labels[k]}</h1></div><h2>Todos os trabalhos</h2><div class="cards"><div class="card"><small>Total contratos</small><strong>${money(c.contratos)}</strong></div><div class="card"><small>Total recebido</small><strong>${money(c.rec)}</strong></div><div class="card"><small>Saldo a receber</small><strong>${money(c.saldo)}</strong></div><div class="card"><small>Total gastos</small><strong>${money(c.gastos)}</strong></div><div class="card"><small>Resultado de caixa</small><strong>${money(c.caixa)}</strong></div><div class="card"><small>Resultado potencial</small><strong>${money(c.potencial)}</strong></div><div class="card"><small>Obras cadastradas</small><strong>${db.obras.length}</strong></div><button class="card card-link" data-action="ongoing"><small>Obras em andamento</small><strong>${db.obras.filter(o=>['Andamento','Em andamento'].includes(o.Status)).length}</strong></button><button class="card card-link" data-action="report-open"><small>Situação da obra</small><strong>Gerar PDF</strong></button><button class="card card-link" data-action="materials-open"><small>Lista de material</small><strong>${db.listasMateriais.length} listas</strong></button><div class="card"><small>Orçamentos</small><strong>${db.orcamentos.length}</strong></div></div><section class="panel"><h2>Resumo por obra</h2><label>Escolha a obra<select id="dashboard-work"><option value="">Selecione uma obra</option>${works.map(name=>`<option value="${esc(name)}" ${name===dashboardWork?'selected':''}>${esc(name)}</option>`).join('')}</select></label>${w?`<div class="cards" style="margin-top:16px"><div class="card"><small>Contrato e extras aprovados</small><strong>${money(w.contratos)}</strong></div><div class="card"><small>Recebido nesta obra</small><strong>${money(w.rec)}</strong></div><div class="card"><small>Falta receber</small><strong>${money(w.saldo)}</strong></div><div class="card"><small>Gastos nesta obra</small><strong>${money(w.gastos)}</strong></div><div class="card"><small>Resultado de caixa</small><strong>${money(w.caixa)}</strong></div><div class="card"><small>Resultado potencial</small><strong>${money(w.potencial)}</strong></div></div>`:'<p class="muted">Escolha uma obra para ver os valores dela.</p>'}</section>`}
function ongoingWorks(){
 const entries=db.obras.map((obra,index)=>({obra,index})).filter(({obra})=>['Andamento','Em andamento'].includes(obra.Status));
 document.querySelector('#view').innerHTML=`<div class="title"><h1>Obras em andamento</h1></div>${entries.length?`<div class="work-list">${entries.map(({obra,index})=>`<section class="panel work-card"><h2>${esc(obra['Cliente/Obra'])||'Obra sem nome'}</h2>${obra['Endereço do cliente']?`<p class="muted">${esc(obra['Endereço do cliente'])}</p>`:''}<div class="work-photos">${(obra.fotos||[]).map(foto=>`<div class="work-photo"><button class="photo-open" data-action="work-photo-open" data-photo-id="${esc(foto.id)}" aria-label="Abrir foto ${esc(foto.name)}"><span data-photo-id="${esc(foto.id)}">Carregando foto…</span></button><button class="btn danger" data-action="work-photo-delete" data-index="${index}" data-photo-id="${esc(foto.id)}">Excluir foto</button></div>`).join('')||'<p class="muted">Nenhuma foto adicionada.</p>'}</div><div class="photo-inputs"><label>Tirar foto<input type="file" accept="image/*" capture="environment" data-action="work-photo-upload" data-index="${index}"></label><label>Adicionar fotos<input type="file" accept="image/*" multiple data-action="work-photo-upload" data-index="${index}"></label></div></section>`).join('')}</div>`:`<div class="panel"><p>Nenhuma obra em andamento. Cadastre uma obra na aba Obras ou altere o status para Andamento.</p></div>`}`;
 document.querySelectorAll('.photo-open span[data-photo-id]').forEach(async placeholder=>{
  try{const file=await getAttachment(placeholder.dataset.photoId);if(!file)throw Error('missing');const url=URL.createObjectURL(file.blob);if(!placeholder.isConnected){URL.revokeObjectURL(url);return}photoURLs.add(url);const img=document.createElement('img');img.src=url;img.alt=file.name||'Foto da obra';placeholder.replaceWith(img)}catch(e){if(placeholder.isConnected)placeholder.textContent='Foto indisponível'}
 });
}
async function uploadWorkPhotos(input){
 const index=Number(input.dataset.index),obra=db.obras[index],files=[...input.files];if(!obra||!files.length)return;
 input.disabled=true;let added=0;
 try{
  for(const file of files){if(!file.type.startsWith('image/'))throw Error('image only');const id=crypto.randomUUID();await putAttachment({id,name:file.name||'Foto da obra',type:file.type,blob:file});obra.fotos??=[];obra.fotos.push({id,name:file.name||'Foto da obra'});save();added++}
  show('andamento');
 }catch(e){if(added)show('andamento');else input.disabled=false;alert('Não foi possível guardar uma das fotos. Verifique o formato e o espaço disponível no iPhone.')}
}
async function openWorkPhoto(id){
 try{const file=await getAttachment(id);if(!file)throw Error('missing');const url=URL.createObjectURL(file.blob);modal(`<h2>Foto da obra</h2><img src="${url}" alt="${esc(file.name)}" style="max-width:100%;height:auto"><div class="actions"><a class="btn" href="${url}" download="${esc(file.name)}">Salvar foto</a><button class="btn alt" data-action="close">Fechar</button></div>`);document.querySelector('#modal').dataset.objectUrl=url}catch(e){alert('Foto não encontrada neste aparelho. Restaure o backup que inclua as fotos.')}
}
async function deleteWorkPhoto(index,id){
 if(!confirm('Excluir esta foto da obra?'))return;
 const obra=db.obras[index];if(!obra)return;
 try{await deleteAttachment(id);obra.fotos=(obra.fotos||[]).filter(f=>f.id!==id);save();show('andamento')}catch(e){alert('Não foi possível excluir a foto. Tente novamente.')}
}
function tableView(k){
 const cols=schema[k], rows=db[k];
 document.querySelector('#view').innerHTML=`<div class="title"><h1>${labels[k]}</h1><button class="btn yellow" data-action="new" data-kind="${k}">+ Novo lançamento</button></div><div class="panel tablewrap"><table><thead><tr>${cols.map(x=>`<th>${x}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr>${cols.map(c=>`<td>${isCurrencyField(k,c)?money(r[c]):esc(r[c])}${k==='gastos'&&c==='Comprovante/Obs.'&&r.comprovanteId?`<br><button class="btn alt" data-action="receipt-view" data-index="${i}">Ver comprovante</button>`:''}</td>`).join('')}<td>${['obras','recebimentos','extras','gastos'].includes(k)?`<button class="btn alt" data-action="edit" data-kind="${k}" data-index="${i}">Editar</button> `:''}<button class="btn danger" data-action="delete" data-kind="${k}" data-index="${i}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`;
}
function payPeriod(){
 const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);
 const start=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 d.setDate(d.getDate()+6);
 return [start,[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')];
}
let attendanceDates=payPeriod();
const workPalette=[['#e5f0ff','#3273c8'],['#fff0d4','#ce8a12'],['#e9f7df','#589a35'],['#fce5ef','#c64c83'],['#eae8ff','#7663bf'],['#dcf6f4','#238d88'],['#ffe9dd','#c66a3b'],['#e9edf1','#697888']];
function workColor(name){let index=db.obras.findIndex(o=>o['Cliente/Obra']===name);if(index<0)index=[...String(name||'')].reduce((sum,c)=>sum+c.charCodeAt(0),0);return workPalette[index%workPalette.length]}
function workTag(name){if(!name)return '-';const [background,border]=workColor(name);return `<span class="work-tag" style="background:${background};border-color:${border}">${esc(name)}</span>`}
function payrollRows(){const [from,to]=attendanceDates,groups=new Map();for(const r of db.colaboradores){if(r.Data<from||r.Data>to||r['Pago?']==='Sim')continue;const name=String(r.Colaborador||'Sem nome').trim(),work=String(r.Obra||'Sem obra').trim(),key=name+'\u0000'+work;const row=groups.get(key)||{name,work,days:0,total:0};row.days+=num(r.Dias);row.total+=num(r['Diária'])*num(r.Dias)+num(r.Extras)+num(r.Alimentação)+num(r.Transporte);groups.set(key,row)}return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')||a.work.localeCompare(b.work,'pt-BR'))}
let preparedPayroll=null;
function clearPayrollPDF(){if(preparedPayroll){URL.revokeObjectURL(preparedPayroll.url);preparedPayroll=null}}

function attendanceView(){
 clearPayrollPDF();
 const [from,to]=attendanceDates;
 const rows=db.colaboradores.map((item,index)=>({item,index})).filter(({item})=>item.Data>=from&&item.Data<=to);
 const totals=new Map(),payroll=payrollRows();
 for(const {item} of rows){const name=item.Colaborador?.trim()||'Sem nome';const entry=totals.get(name)||{days:0,total:0,unpaid:0};const value=num(item['Diária'])*num(item.Dias)+num(item.Extras)+num(item.Alimentação)+num(item.Transporte);entry.days+=num(item.Dias);entry.total+=value;if(item['Pago?']!=='Sim')entry.unpaid+=value;totals.set(name,entry)}
 document.querySelector('#view').innerHTML=`<div class="attendance-screen"><div class="title"><h1>Colaboradores</h1><button class="btn yellow" data-action="attendance-manual">+ Novo lançamento</button></div>
 <div class="panel tablewrap"><table><thead><tr>${schema.colaboradores.map(c=>`<th>${esc(c)}</th>`).join('')}<th></th></tr></thead><tbody>${db.colaboradores.map((r,i)=>`<tr>${schema.colaboradores.map(c=>`<td>${c==='Obra'?workTag(r[c]):isCurrencyField('colaboradores',c)?money(r[c]):esc(r[c])}${c==='Colaborador'?`<button class="btn alt row-edit" data-action="attendance-edit" data-index="${i}">Editar</button>`:''}</td>`).join('')}<td><button class="btn danger" data-action="attendance-delete" data-index="${i}">Excluir</button></td></tr>`).join('')}</tbody></table></div>
 <div class="title attendance-heading"><h2>Controle de presença e pagamento</h2><button class="btn yellow" data-action="worker-new">+ Cadastrar colaborador</button></div>
 <div class="panel"><h2>Presença diária</h2><p><b>1.</b> Escolha o dia e a obra.</p><div class="formgrid"><label>Dia do trabalho<input id="attendance-date" type="date" value="${today()}"></label><label>Obra<select id="attendance-work"><option value="">Escolha uma obra</option>${db.obras.map(o=>`<option value="${esc(o['Cliente/Obra'])}">${esc(o['Cliente/Obra'])}</option>`).join('')}</select></label></div>
 <div id="attendance-choice" hidden><p><b>2.</b> Marque quem foi para a obra escolhida:</p><div class="attendance-people">${db.equipe.map((person,i)=>`<label class="attendance-person"><input type="checkbox" value="${i}"><span><b>${esc(person.nome)}</b><small>${esc(person.funcao||'Colaborador')} · diária ${money(person.diaria)}</small></span></label>`).join('')||'<p class="muted">Cadastre o primeiro colaborador para marcar a presença.</p>'}</div>
 <p id="attendance-selected" class="attendance-summary" role="status">Nenhum colaborador marcado.</p><button class="btn" data-action="attendance-save" disabled>Salvar presenças</button></div>
 <details class="team-settings"><summary>Editar cadastro e valor da diária</summary><div class="team-list">${db.equipe.map((person,i)=>`<div><span>${esc(person.nome)} · ${money(person.diaria)}</span><button class="btn alt" data-action="worker-edit" data-index="${i}">Editar cadastro</button></div>`).join('')||'<p>Cadastre um colaborador acima.</p>'}</div></details></div>
 <div class="panel"><h2>Conferir dias para pagamento</h2><div class="formgrid"><label>De<input id="attendance-from" type="date" value="${from}"></label><label>Até<input id="attendance-to" type="date" value="${to}"></label></div><div class="tablewrap"><table><thead><tr><th>Colaborador</th><th>Dias</th><th>Total no período</th><th>A pagar</th><th></th></tr></thead><tbody>${[...totals].map(([name,t])=>`<tr><td>${esc(name)}</td><td>${t.days}</td><td>${money(t.total)}</td><td>${money(t.unpaid)}</td><td>${t.unpaid?`<button class="btn alt" data-action="attendance-paid" data-name="${esc(name)}">Marcar pago</button>`:'Pago'}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum dia lançado neste período.</td></tr>'}</tbody></table></div></div>
 <div class="panel"><h2>Resumo a pagar por obra</h2><p class="muted">Considera somente os lançamentos ainda não marcados como pagos, entre ${from} e ${to}.</p><div class="tablewrap"><table><thead><tr><th>Colaborador</th><th>Obra</th><th>Dias</th><th>Valor a pagar</th></tr></thead><tbody>${payroll.map(row=>`<tr><td>${esc(row.name)}</td><td>${workTag(row.work)}</td><td>${row.days}</td><td>${money(row.total)}</td></tr>`).join('')||'<tr><td colspan="4">Não há valores a pagar neste período.</td></tr>'}</tbody></table></div><p class="payroll-total">Total a pagar: ${money(payroll.reduce((sum,row)=>sum+row.total,0))}</p><div class="actions"><button class="btn yellow" data-action="payroll-pdf" ${payroll.length?'':'disabled'}>Gerar PDF para pagamento</button></div><div id="payroll-pdf-result" aria-live="polite"></div></div>
 <div class="panel"><h2>Dias registrados</h2><div class="tablewrap"><table><thead><tr><th>Data</th><th>Colaborador</th><th>Obra</th><th>Dias</th><th>Diária</th><th>Pago?</th><th></th></tr></thead><tbody>${rows.map(({item,index})=>`<tr><td>${esc(item.Data)}</td><td>${esc(item.Colaborador)}<button class="btn alt row-edit" data-action="attendance-edit" data-index="${index}">Editar</button></td><td>${workTag(item.Obra)}</td><td>${esc(item.Dias)}</td><td>${money(item['Diária'])}</td><td>${esc(item['Pago?'])}</td><td><button class="btn danger" data-action="attendance-delete" data-index="${index}">Excluir</button></td></tr>`).join('')||'<tr><td colspan="7">Nenhum lançamento no período.</td></tr>'}</tbody></table></div><button class="btn alt" data-action="attendance-manual">Lançamento detalhado</button></div></div>`;
}
function workerForm(editIndex=null){const person=editIndex===null?null:db.equipe[editIndex];modal(`<h2>${person?'Editar':'Cadastrar'} colaborador</h2><div class="formgrid"><label>Nome<input id="worker-name" value="${esc(person?.nome)}" required></label><label>Função<select id="worker-role">${[...new Set([...formChoices['Função'],...(person?.funcao?[person.funcao]:[])])].map(x=>`<option ${x===person?.funcao?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Valor da diária (R$)<input id="worker-rate" class="money-entry" type="text" inputmode="decimal" placeholder="R$ 0,00" value="${person?esc(money(person.diaria)):''}"></label></div><div class="actions"><button class="btn" data-action="worker-save" data-index="${editIndex===null?'':editIndex}">Salvar colaborador</button><button class="btn alt" data-action="close">Cancelar</button></div>`)}
function saveWorker(editIndex=null){const name=document.querySelector('#worker-name').value.trim(),rate=document.querySelector('#worker-rate');if(!name){document.querySelector('#worker-name').focus();return}if(!rate.value||parseCurrency(rate.value)<0){rate.focus();return}if(db.equipe.some((p,i)=>i!==editIndex&&p.nome.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){alert('Esse colaborador já está cadastrado.');return}const person={nome:name,funcao:document.querySelector('#worker-role').value,diaria:parseCurrency(rate.value)};if(editIndex===null)db.equipe.push(person);else {const oldName=db.equipe[editIndex].nome;if(oldName!==name)db.colaboradores.forEach(r=>{if(r.Colaborador?.toLocaleLowerCase('pt-BR')===oldName.toLocaleLowerCase('pt-BR'))r.Colaborador=name});db.equipe[editIndex]=person}save();closeM();attendanceView()}
function updateAttendanceChoice(){const work=document.querySelector('#attendance-work'),choice=document.querySelector('#attendance-choice');if(!work||!choice)return;choice.hidden=!work.value;if(!work.value)return;const selected=[...document.querySelectorAll('.attendance-person input:checked')].map(input=>db.equipe[Number(input.value)]?.nome).filter(Boolean);document.querySelector('#attendance-selected').textContent=selected.length?`Marcados para ${work.value}: ${selected.join(', ')}.`:'Nenhum colaborador marcado.';document.querySelector('[data-action="attendance-save"]').disabled=!selected.length}
function saveAttendance(){const date=document.querySelector('#attendance-date').value,work=document.querySelector('#attendance-work').value,selected=[...document.querySelectorAll('.attendance-person input:checked')];if(!date){document.querySelector('#attendance-date').focus();return}if(!work){document.querySelector('#attendance-work').focus();return}if(!selected.length){alert('Marque pelo menos um colaborador.');return}let added=0,skipped=0;for(const input of selected){const person=db.equipe[Number(input.value)];if(!person)continue;if(db.colaboradores.some(r=>r.Data===date&&r.Colaborador?.toLocaleLowerCase('pt-BR')===person.nome.toLocaleLowerCase('pt-BR'))){skipped++;continue}db.colaboradores.push({Data:date,Obra:work,Colaborador:person.nome,'Função':person.funcao,'Diária':person.diaria,Dias:1,Extras:0,Alimentação:0,Transporte:0,'Pago?':'Não',controleDiario:true});added++}if(added)save();attendanceDates=[date,date];attendanceView();alert(`${added} presença(s) salva(s).${skipped?` ${skipped} já registrada(s) nesse dia.`:''}`)}
function markAttendancePaid(name){const [from,to]=attendanceDates;const matches=db.colaboradores.filter(r=>r.Data>=from&&r.Data<=to&&r.Colaborador===name&&r['Pago?']!=='Sim');if(!matches.length)return;if(!confirm(`Marcar como pagos ${matches.length} lançamento(s) de ${name} de ${from} a ${to}?`))return;matches.forEach(r=>r['Pago?']='Sim');save();attendanceView()}
async function buildPayrollPDF(rows,from,to){
 const {PDFDocument,StandardFonts,rgb}=PDFLib,pdf=await PDFDocument.create();
 const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const W=595.28,H=841.89,left=42,right=42,red=rgb(.77,.12,.12),dark=rgb(.17,.17,.17),gray=rgb(.42,.42,.42),yellow=rgb(1,.77,0);
 const clean=value=>pdfText(value).replace(/\u00a0/g,' ');
 const fit=(value,font,size,width)=>{let out=clean(value);while(out&&font.widthOfTextAtSize(out,size)>width)out=out.slice(0,-1);return out===clean(value)?out:out.trimEnd()+'…'.replace('…','...')};
 let page,y,pageNo=0;
 function newPage(){page=pdf.addPage([W,H]);pageNo++;page.drawRectangle({x:0,y:H-10,width:W,height:10,color:red});page.drawText('JSO',{x:left,y:H-54,size:27,font:bold,color:red});page.drawText('CONSTRUÇÕES E REFORMAS',{x:112,y:H-46,size:12,font:bold,color:dark});page.drawText('A Construtora do Povo',{x:112,y:H-63,size:10,font:regular,color:gray});page.drawLine({start:{x:left,y:H-78},end:{x:W-right,y:H-78},thickness:2,color:yellow});page.drawText(`Página ${pageNo}`,{x:W-right-47,y:23,size:9,font:regular,color:gray});y=H-108}
 function tableHead(){page.drawRectangle({x:left,y:y-22,width:W-left-right,height:28,color:red});for(const [text,x] of [['COLABORADOR',left+8],['OBRA',210],['DIAS',391],['A PAGAR',446]])page.drawText(text,{x,y:y-12,size:9,font:bold,color:rgb(1,1,1)});y-=36}
 newPage();page.drawText('RESUMO DE PAGAMENTO',{x:left,y,size:18,font:bold,color:red});y-=26;
 page.drawText(`Período: ${from.split('-').reverse().join('/')} a ${to.split('-').reverse().join('/')}`,{x:left,y,size:11,font:regular,color:dark});y-=20;
 page.drawText('Somente lançamentos ainda não marcados como pagos.',{x:left,y,size:9,font:regular,color:gray});y-=32;tableHead();
 for(const row of rows){if(y<78){newPage();tableHead()}const [,border]=workColor(row.work);const color=rgb(parseInt(border.slice(1,3),16)/255,parseInt(border.slice(3,5),16)/255,parseInt(border.slice(5,7),16)/255);page.drawText(fit(row.name,regular,10,155),{x:left+8,y,size:10,font:regular,color:dark});page.drawRectangle({x:208,y:y-4,width:4,height:17,color});page.drawText(fit(row.work,regular,10,165),{x:217,y,size:10,font:regular,color:dark});page.drawText(String(row.days),{x:393,y,size:10,font:regular,color:dark});page.drawText(clean(money(row.total)),{x:446,y,size:10,font:bold,color:dark});y-=26;page.drawLine({start:{x:left,y:y+7},end:{x:W-right,y:y+7},thickness:.5,color:rgb(.86,.86,.86)})}
 if(y<100)newPage();y-=20;page.drawText(`TOTAL A PAGAR: ${clean(money(rows.reduce((sum,row)=>sum+row.total,0)))}`,{x:left,y,size:14,font:bold,color:red});
 pdf.setTitle('Resumo de pagamento - Colaboradores JSO');return pdf.save();
}
async function preparePayrollPDF(button){const rows=payrollRows();if(!rows.length)return;const result=document.querySelector('#payroll-pdf-result');button.disabled=true;result.textContent='Preparando o PDF…';try{const [from,to]=attendanceDates,bytes=await buildPayrollPDF(rows,from,to),name=`Pagamento_Colaboradores_JSO_${from}_a_${to}.pdf`,file=new File([bytes],name,{type:'application/pdf'});clearPayrollPDF();preparedPayroll={file,url:URL.createObjectURL(file)};const canShare=!!(navigator.share&&navigator.canShare?.({files:[file]}));result.innerHTML=`<p>PDF pronto com colaboradores, obras, dias e total a pagar.</p><div class="actions">${canShare?'<button class="btn" data-action="payroll-share">Enviar PDF</button>':''}<a class="btn alt" href="${preparedPayroll.url}" download="${esc(name)}">Salvar PDF</a></div>`}catch(e){result.textContent='Não foi possível gerar o PDF. Tente novamente.'}finally{button.disabled=false}}
async function sharePayrollPDF(){if(!preparedPayroll||!navigator.share)return;try{await navigator.share({files:[preparedPayroll.file],title:'Pagamento dos colaboradores JSO'})}catch(e){if(e.name!=='AbortError')alert('Não foi possível enviar. Use Salvar PDF e anexe o arquivo no WhatsApp.')}}
function form(k,editIndex=null){
 const cols=schema[k];
 modal(`<h2>${editIndex===null?'Novo':'Editar'} — ${labels[k]}</h2><div class="formgrid">${cols.map(c=>choiceField(k,c,editIndex)).join('')}</div>${k==='gastos'?`<fieldset class="receipt-options"><legend>Comprovante (opcional)</legend><label>Tirar foto<input id="receipt-camera" type="file" accept="image/*" capture="environment"></label><label>Adicionar arquivo<input id="receipt-file" type="file" accept="image/*,.pdf,application/pdf"></label><small>Escolha uma das opções. O arquivo fica salvo neste aparelho e entra no backup.</small></fieldset>`:''}<div class="actions" style="margin-top:14px"><button class="btn" id="ok">Salvar</button><button class="btn alt" data-action="close">Cancelar</button></div>`);
 if(editIndex!==null)cols.filter(c=>c!=='Obra'&&!formChoices[c]&&!isCurrencyField(k,c)).forEach(c=>{document.querySelector('#f_'+slug(c)).value=db[k][editIndex][c]??''});
 document.querySelector('#ok').addEventListener('click',async()=>{
  const button=document.querySelector('#ok');button.disabled=true;
  try{
   const obraField=document.querySelector('#f_Obra');if(obraField&&!obraField.value){obraField.reportValidity();button.disabled=false;return;}
   const o={};cols.forEach(c=>{const value=document.querySelector('#f_'+slug(c)).value;o[c]=isCurrencyField(k,c)?parseCurrency(value):value});
   if(k==='obras'&&!o['Cliente/Obra'].trim()){document.querySelector('#f_Cliente_Obra').focus();button.disabled=false;return;}
   if(k==='obras'){const c=selectedClient('f_Cliente_Obra');if(!c){button.disabled=false;return}o.clienteId=c.id;}
   if(k==='gastos'){
    const file=document.querySelector('#receipt-camera').files[0]||document.querySelector('#receipt-file').files[0];
    if(file){o.comprovanteId=crypto.randomUUID();await putAttachment({id:o.comprovanteId,name:file.name||'Foto do comprovante',type:file.type||'application/octet-stream',blob:file});}
   }
   if(editIndex===null)db[k].push(o);else db[k][editIndex]={...db[k][editIndex],...o};if(k==='colaboradores'&&o.Colaborador?.trim()&&!db.equipe.some(p=>p.nome.toLocaleLowerCase('pt-BR')===o.Colaborador.trim().toLocaleLowerCase('pt-BR')))db.equipe.push({nome:o.Colaborador.trim(),funcao:o['Função']||'Outro',diaria:num(o['Diária'])});save();closeM();show(k);
  }catch(e){alert('Não foi possível salvar o lançamento. Verifique o espaço disponível no iPhone e tente novamente.');button.disabled=false;}
 });
}
async function del(k,i){
 if(confirm('Excluir este lançamento?')){
  const item=db[k][i];
  if(k==='gastos'&&item.comprovanteId)await deleteAttachment(item.comprovanteId).catch(()=>{});
  if(k==='obras')for(const foto of [...(item.fotos||[]),...(item.diario||[]).flatMap(e=>e.fotos||[])])await deleteAttachment(foto.id).catch(()=>{});
  db[k].splice(i,1);save();show(k);
 }
}
function categories(){document.querySelector('#view').innerHTML=`<h1>Categorias</h1><div class="panel"><table><thead><tr><th>Categoria</th><th>Tipo</th></tr></thead><tbody>${cats.map((x,i)=>`<tr><td>${x}</td><td>${['Operacional','Operacional','Operacional','Pessoal','Obra','Operacional','Operacional','Extra'][i]}</td></tr>`).join('')}</tbody></table></div>`}
function quotes(){document.querySelector('#view').innerHTML=`<div class="title"><h1>Orçamentos</h1><div class="actions"><button class="btn alt" data-action="service-manage">Meus serviços</button><button class="btn yellow" data-action="quote-new">+ Novo orçamento</button></div></div><div class="panel tablewrap"><table><thead><tr><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>${db.orcamentos.map((q,i)=>`<tr><td>${esc(q.cliente)}</td><td>${esc(q.data)}</td><td>${money(q.total)}</td><td>${esc(q.status)}</td><td><button class="btn" data-action="quote-print" data-index="${i}">PDF</button> <button class="btn alt" data-action="quote-approve" data-index="${i}">Virar obra</button></td></tr>`).join('')}</tbody></table></div>`}
const quoteServices=()=>[...JSO_QUOTE_CATALOG,...db.servicosOrcamento];
const difficultyFactor={normal:1,dificil:1.1,muito_dificil:1.2};
const difficultyName={normal:'Normal',dificil:'Difícil (+10%)',muito_dificil:'Muito difícil (+20%)'};
function renderServiceMatches(row){const input=row.querySelector('.quote-service-search'),list=row.querySelector('.quote-matches'),query=input.value.trim().toLocaleLowerCase('pt-BR');const matches=quoteServices().map((item,index)=>({item,index})).filter(({item})=>!query||item.nome.toLocaleLowerCase('pt-BR').includes(query)).slice(0,8);list.innerHTML=matches.map(({item,index})=>`<button type="button" class="quote-match" data-action="quote-pick" data-index="${index}">${esc(item.nome)} <small>${esc(item.unidade)} · ${money(item.valor)}</small></button>`).join('');list.hidden=!matches.length}
function chooseQuoteService(row,index){const item=quoteServices()[index];if(!item)return;row.querySelector('.quote-service-search').value=item.nome;row.querySelector('.quote-unit').value=item.unidade;row.querySelector('.quote-price').value=money(item.valor);row.querySelector('.quote-matches').hidden=true;updateQuoteTotal()}
function quoteForm(){modal(`<h2>Novo orçamento</h2><div class="formgrid">${clientPicker('qc','','Cliente','qe')}<label>Data<input id="qd" type="date" value="${today()}"></label><label class="full">Endereço<input id="qe"></label><label class="full">Prazo<input id="qp" placeholder="Ex.: 3 semanas"></label><label class="full">Forma de pagamento<input id="qpg" value="A combinar"></label><label class="full">Observações<textarea id="qo"></textarea></label></div><h3>Serviços</h3><p class="muted">Valores da planilha. Escolha a dificuldade em cada serviço; você pode digitar um serviço novo e seu valor aqui mesmo. Ele ficará salvo para os próximos orçamentos.</p><div id="items"></div><button class="btn alt" data-action="item-add">+ Serviço</button><h3 class="quote-grand-total">Total: ${money(0)}</h3><div class="actions" style="margin-top:14px"><button class="btn" id="saveQ">Salvar orçamento</button><button class="btn alt" data-action="close">Cancelar</button></div>`);addItem();document.querySelector('#saveQ').onclick=()=>{const client=selectedClient('qc');if(!client)return;const rows=[...document.querySelectorAll('.quote-item')];const items=rows.map(r=>{const descricao=r.querySelector('.quote-service-search').value.trim(),unidade=r.querySelector('.quote-unit').value.trim(),qtd=Number(r.querySelector('.quote-qty').value),valor= parseCurrency(r.querySelector('.quote-price').value),dificuldade=r.querySelector('.quote-difficulty').value;return {descricao,unidade,qtd,valor,dificuldade,valorFinal:Math.round(valor*difficultyFactor[dificuldade]*100)/100}}).filter(x=>x.descricao);if(!document.querySelector('#qc').value.trim()||!items.length||items.some(x=>!x.unidade||!Number.isFinite(x.qtd)||x.qtd<=0||x.valor<0)||rows.some(r=>r.querySelector('.quote-service-search').value.trim()&&!r.querySelector('.quote-price').value.trim())){alert('Informe o cliente e pelo menos um serviço com quantidade e valor válidos.');return}for(const item of items){if(!quoteServices().some(s=>s.nome.toLocaleLowerCase('pt-BR')===item.descricao.toLocaleLowerCase('pt-BR')))db.servicosOrcamento.push({nome:item.descricao,unidade:item.unidade,valor:item.valor})}const total=items.reduce((sum,x)=>sum+Math.round(x.qtd*x.valorFinal*100)/100,0);db.orcamentos.push({clienteId:client.id,celular:client.celular,cliente:client.nome,data:document.querySelector('#qd').value,endereco:document.querySelector('#qe').value,prazo:document.querySelector('#qp').value,pagamento:document.querySelector('#qpg').value,obs:document.querySelector('#qo').value,items,total,status:'Pendente'});save();closeM();quotes()}}
function addItem(){document.querySelector('#items').insertAdjacentHTML('beforeend',`<div class="quote-item"><div class="quote-service-label"><label>Serviço (busque ou digite um novo)<input class="quote-service-search" autocomplete="off" placeholder="Digite o nome do serviço"></label><div class="quote-matches" hidden></div></div><label>Unidade<input class="quote-unit" placeholder="m², unid..."></label><label>Quantidade<input class="quote-qty" type="number" value="1" min="0.01" step="0.01"></label><label>Valor base (R$)<input class="quote-price money-entry" type="text" inputmode="decimal" placeholder="R$ 0,00"></label><label>Dificuldade<select class="quote-difficulty"><option value="normal">Normal</option><option value="dificil">Difícil (+10%)</option><option value="muito_dificil">Muito difícil (+20%)</option></select></label><strong class="quote-line-total">Total: ${money(0)}</strong><button class="btn danger" data-action="item-remove" aria-label="Remover serviço">×</button></div>`)}
function updateQuoteTotal(){let total=0;document.querySelectorAll('.quote-item').forEach(r=>{const price=parseCurrency(r.querySelector('.quote-price').value),qty=Number(r.querySelector('.quote-qty').value)||0,factor=difficultyFactor[r.querySelector('.quote-difficulty').value];const unit=Math.round(price*factor*100)/100;const line=Math.round(qty*unit*100)/100;total+=line;r.querySelector('.quote-line-total').textContent=`${money(unit)} / ${r.querySelector('.quote-unit').value||'unid'} · Total: ${money(line)}`});const display=document.querySelector('.quote-grand-total');if(display)display.textContent=`Total: ${money(total)}`}
function serviceForm(index=null){const item=index===null?null:db.servicosOrcamento[index];modal(`<h2>${item?'Editar':'Cadastrar'} serviço</h2><div class="formgrid"><label class="full">Descrição<input id="service-name" value="${esc(item?.nome)}" placeholder="Nome do serviço"></label><label>Unidade<input id="service-unit" value="${esc(item?.unidade)}" placeholder="m², metro, unid..."></label><label>Valor base (R$)<input id="service-price" class="money-entry" type="text" inputmode="decimal" value="${item?esc(money(item.valor)):''}" placeholder="R$ 0,00"></label></div><div class="actions" style="margin-top:14px"><button class="btn" data-action="service-save" data-index="${index===null?'':index}">Salvar serviço</button><button class="btn alt" data-action="close">Cancelar</button></div>`)}
function manageServices(){modal(`<h2>Meus serviços</h2><p>Os 47 serviços da planilha já aparecem nos orçamentos. Cadastre aqui os que faltam.</p><button class="btn" data-action="service-new">+ Cadastrar serviço</button><div class="tablewrap" style="margin-top:14px"><table><thead><tr><th>Serviço</th><th>Unidade</th><th>Valor base</th><th>Ações</th></tr></thead><tbody>${db.servicosOrcamento.map((x,i)=>`<tr><td>${esc(x.nome)}</td><td>${esc(x.unidade)}</td><td>${money(x.valor)}</td><td><button class="btn alt" data-action="service-edit" data-index="${i}">Editar</button> <button class="btn danger" data-action="service-delete" data-index="${i}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`)}
function saveService(index){const nome=document.querySelector('#service-name').value.trim(),unidade=document.querySelector('#service-unit').value.trim(),priceText=document.querySelector('#service-price').value.trim(),valor=parseCurrency(priceText);if(!nome||!unidade||!priceText||!Number.isFinite(valor)||valor<0){alert('Informe descrição, unidade e valor válido.');return}const item={nome,unidade,valor};if(index===null)db.servicosOrcamento.push(item);else db.servicosOrcamento[index]=item;save();closeM();manageServices()}
function approve(i){let q=db.orcamentos[i];if(!db.obras.some(o=>o['Cliente/Obra']===q.cliente)){db.obras.push({clienteId:q.clienteId,'Endereço do cliente':q.endereco||'','Celular do cliente':q.celular||'','Cliente/Obra':q.cliente,'Data início':q.data,'Valor inicial':q.total,'Status':'Andamento'});q.status='Aprovado / Obra criada';save()}quotes()}
function printQuote(i){let q=db.orcamentos[i];modal(`<div id="printArea"><div style="border-top:12px solid #c51f1f;padding-top:12px"><h1 style="margin:0;color:#c51f1f">JSO — CONSTRUÇÕES E REFORMAS</h1><b>A Construtora do Povo</b><hr><h2>ORÇAMENTO</h2><p><b>Cliente:</b> ${esc(q.cliente)}<br><b>Data:</b> ${esc(q.data)}<br><b>Endereço:</b> ${esc(q.endereco)}</p><table><thead><tr><th>Serviço</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${q.items.map(x=>{const unit=x.valorFinal??x.valor;return `<tr><td>${esc(x.descricao)}${x.dificuldade?`<br><small>${esc(difficultyName[x.dificuldade]||'Normal')}</small>`:''}</td><td>${esc(x.qtd)} ${esc(x.unidade||'')}</td><td>${money(unit)}</td><td>${money(Math.round(x.qtd*unit*100)/100)}</td></tr>`}).join('')}</tbody></table><h2 style="text-align:right">Total: ${money(q.total)}</h2><p><b>Prazo:</b> ${esc(q.prazo)}<br><b>Pagamento:</b> ${esc(q.pagamento)}</p><p>${esc(q.obs)}</p><br><p>____________________________________<br>Cliente: ${esc(q.cliente)}</p><p>____________________________________<br>Construtora JSO</p></div></div><div class="actions no-print"><button class="btn" data-action="print">Gerar / salvar PDF</button><button class="btn alt" data-action="close">Fechar</button></div>`)}
function backup(){document.querySelector('#view').innerHTML=`<h1>Backup dos dados</h1><div class="panel"><p>Os dados ficam apenas neste aparelho e navegador. Exporte um backup regularmente e guarde o arquivo em local seguro. Fotos das obras e comprovantes também entram no backup. Se apagar os dados do Safari, você precisará importar o backup.</p><div class="actions"><button class="btn" data-action="backup-export">Exportar backup</button><label class="btn alt">Importar backup<input type="file" accept=".json" style="display:none" data-action="backup-import"></label></div></div>`}
function attachmentDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('jso_comprovantes',1);request.onupgradeneeded=()=>request.result.createObjectStore('arquivos',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function attachmentOperation(mode,operation){const database=await attachmentDB();return new Promise((resolve,reject)=>{const tx=database.transaction('arquivos',mode);let result;try{const req=operation(tx.objectStore('arquivos'));req.onsuccess=()=>{result=req.result};req.onerror=()=>reject(req.error);tx.oncomplete=()=>{database.close();resolve(result)};tx.onerror=()=>{database.close();reject(tx.error)}}catch(e){database.close();reject(e)}})}
const putAttachment=item=>attachmentOperation('readwrite',store=>store.put(item));
const getAttachment=id=>attachmentOperation('readonly',store=>store.get(id));
const deleteAttachment=id=>attachmentOperation('readwrite',store=>store.delete(id));
const allAttachments=()=>attachmentOperation('readonly',store=>store.getAll());
function fileDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
async function viewReceipt(i){
 try{const item=await getAttachment(db.gastos[i].comprovanteId);if(!item)throw Error('missing');const url=URL.createObjectURL(item.blob);const isImage=item.type.startsWith('image/');modal(`<h2>Comprovante</h2><p>${esc(item.name)}</p>${isImage?`<img src="${url}" alt="Comprovante" style="max-width:100%;height:auto">`:''}<div class="actions"><a class="btn" href="${url}" target="_blank" rel="noopener" download="${esc(item.name)}">Abrir / salvar arquivo</a><button class="btn alt" data-action="close">Fechar</button></div>`);document.querySelector('#modal').dataset.objectUrl=url}catch(e){alert('Comprovante não encontrado neste aparelho. Restaure um backup que inclua os arquivos.')}
}
async function exportData(){
 try{const attachments=await Promise.all((await allAttachments()).map(async item=>({id:item.id,name:item.name,type:item.type,data:await fileDataURL(item.blob)})));const backup={...db,_comprovantes:attachments};const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='JSO_backup_'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){alert('Não foi possível exportar o backup. Tente novamente.')}
}
function importData(f){
 const r=new FileReader();r.onload=async()=>{try{
  const restored=JSON.parse(r.result);if(!restored||!['obras','recebimentos','extras','gastos','colaboradores','orcamentos'].every(k=>Array.isArray(restored[k])))throw Error('Formato inválido');
  for(const item of restored._comprovantes||[]){if(!item.id||!item.data?.startsWith('data:'))throw Error('Arquivo inválido');const [header,base64]=item.data.split(',');const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));await putAttachment({id:item.id,name:item.name,type:item.type,blob:new Blob([bytes],{type:item.type||header.match(/^data:([^;]+)/)?.[1]||'application/octet-stream'})})}
  db=restored;delete db._comprovantes;db.materiais??=[];db.listasMateriais??=[];db.equipe??=[];db.servicosOrcamento??=[];for(const entry of db.colaboradores){const nome=String(entry.Colaborador||'').trim();if(nome&&!db.equipe.some(p=>p.nome.toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR')))db.equipe.push({nome,funcao:entry['Função']||'Outro',diaria:Number(entry['Diária'])||0});}initializeClients();save();alert('Backup restaurado.');show('dashboard')
 }catch(e){alert('Não foi possível restaurar o backup. Verifique o arquivo e o espaço disponível no iPhone.')}};r.readAsText(f)
}
function slug(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\W/g,'_')}function modal(h){document.body.insertAdjacentHTML('beforeend',`<div class="modal open" id="modal"><div class="dialog">${h}</div></div>`)}function closeM(){const m=document.querySelector('#modal');if(m?.dataset.objectUrl)URL.revokeObjectURL(m.dataset.objectUrl);m?.remove()}
document.querySelector('#menuBtn').addEventListener('click',()=>document.querySelector('#nav').classList.toggle('open'));
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');
 if(!button)return;
 const action=button.dataset.action, kind=button.dataset.kind, index=Number(button.dataset.index);
 if(action==='new')form(kind);
 else if(action==='edit')form(kind,index);
 else if(action==='quote-new')quoteForm();
 else if(action==='delete')del(kind,index);
 else if(action==='close')closeM();
 else if(action==='quote-print')printQuote(index);
 else if(action==='quote-approve')approve(index);
 else if(action==='item-add')addItem();
 else if(action==='quote-pick')chooseQuoteService(button.closest('.quote-item'),index);
 else if(action==='item-remove'){button.closest('.quote-item').remove();updateQuoteTotal()}
 else if(action==='service-manage')manageServices();
 else if(action==='service-new'){closeM();serviceForm()}
 else if(action==='service-edit'){closeM();serviceForm(index)}
 else if(action==='service-save')saveService(button.dataset.index===''?null:index);
 else if(action==='service-delete'){if(confirm('Excluir este serviço do catálogo?')){db.servicosOrcamento.splice(index,1);save();closeM();manageServices()}}
 else if(action==='print')window.print();
 else if(action==='backup-export')exportData();
 else if(action==='receipt-view')viewReceipt(index);
 else if(action==='ongoing')show('andamento');
 else if(action==='report-open')show('situacao');
 else if(action==='materials-open')show('materiais');
 else if(action==='material-new')materialView();
 else if(action==='material-row-add')addMaterialRow();
 else if(action==='material-row-remove'){button.closest('.material-row').remove()}
 else if(action==='material-save')saveMaterialList(button.dataset.id);
 else if(action==='material-edit')materialView(button.dataset.id);
 else if(action==='material-delete')deleteMaterialList(button.dataset.id);
 else if(action==='material-pdf')prepareMaterialPDF(button.dataset.id,button);
 else if(action==='material-pdf-share')shareMaterialPDF(button.dataset.id);
 else if(action==='report-save')saveReport();
 else if(action==='report-generate')prepareReportPDF();
 else if(action==='report-share')shareReportPDF();
 else if(action==='work-photo-open')openWorkPhoto(button.dataset.photoId);
 else if(action==='work-photo-delete')deleteWorkPhoto(index,button.dataset.photoId);
 else if(action==='worker-new')workerForm();
 else if(action==='worker-save')saveWorker(button.dataset.index===''?null:index);
 else if(action==='worker-edit')workerForm(index);
 else if(action==='attendance-save')saveAttendance();
 else if(action==='attendance-paid')markAttendancePaid(button.dataset.name);
 else if(action==='attendance-delete')del('colaboradores',index);
 else if(action==='attendance-edit')form('colaboradores',index);
 else if(action==='attendance-manual')form('colaboradores');
 else if(action==='payroll-pdf')preparePayrollPDF(button);
 else if(action==='payroll-share')sharePayrollPDF();
});
document.addEventListener('input',event=>{if(event.target.matches?.('.quote-service-search'))renderServiceMatches(event.target.closest('.quote-item'));if(event.target.closest('.quote-item'))updateQuoteTotal()});
document.addEventListener('focusin',event=>{if(event.target.matches?.('.quote-service-search'))renderServiceMatches(event.target.closest('.quote-item'))});
document.addEventListener('click',event=>{if(!event.target.closest('.quote-service-label'))document.querySelectorAll('.quote-matches').forEach(list=>list.hidden=true)});
document.addEventListener('focusin',event=>{if(event.target.matches?.('.money-entry'))event.target.select()});
document.addEventListener('change',event=>{
 if(event.target.id==='dashboard-work'){dashboardWork=event.target.value;dashboard(document.querySelector('nav button.active')?.dataset.v||'dashboard');return}
 if(event.target.closest?.('.quote-item'))updateQuoteTotal();
 if(event.target.matches?.('.money-entry')&&event.target.value.trim())event.target.value=event.target.closest('.currency-wrap')?currencyNumber(event.target.value):money(event.target.value);
 if(event.target.id==='attendance-work'||event.target.matches('.attendance-person input')){updateAttendanceChoice();return;}
 if(event.target.id==='attendance-from'||event.target.id==='attendance-to'){
  attendanceDates=[document.querySelector('#attendance-from').value,document.querySelector('#attendance-to').value];
  if(attendanceDates[0]>attendanceDates[1]){alert('A data inicial deve ser anterior à data final.');return}
  attendanceView();return;
 }
 if(event.target.dataset.action==='work-photo-upload')uploadWorkPhotos(event.target);
 if(event.target.id==='report-work')reportView(Number(event.target.value));
 if(event.target.id==='materials-work')materialView(event.target.value);
 if(event.target.id==='receipt-camera'&&event.target.files.length)document.querySelector('#receipt-file').value='';
 if(event.target.id==='receipt-file'&&event.target.files.length)document.querySelector('#receipt-camera').value='';
 if(event.target.dataset.action==='backup-import'&&event.target.files[0])importData(event.target.files[0]);
});
initializeClients();nav();show('inicio');
window.addEventListener('pageshow',()=>{closeM();document.querySelector('#client-modal')?.remove();show('inicio')});
const connectionNote=document.createElement('div');
connectionNote.id='connectionNote';
connectionNote.setAttribute('role','status');
document.querySelector('main').prepend(connectionNote);
function updateConnectionNote(){
 connectionNote.textContent=navigator.onLine?'':'Sem internet: lançamentos e PDFs continuam disponíveis neste aparelho. Faça backup dos dados regularmente.';
 connectionNote.hidden=navigator.onLine;
}
window.addEventListener('online',updateConnectionNote);
window.addEventListener('offline',updateConnectionNote);
updateConnectionNote();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
