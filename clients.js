function clientKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR')}
function findClient(name){return db.clientes.find(c=>clientKey(c.nome)===clientKey(name))}
function initializeClients(){
 db.clientes??=[];db.imprevistos??=[];
 for(const c of db.clientes)c.id??=crypto.randomUUID();
 const register=(name,address='',phone='')=>{name=String(name||'').trim();if(!name)return null;let c=findClient(name);if(!c){c={id:crypto.randomUUID(),nome:name,endereco:address||'',celular:phone||''};db.clientes.push(c)}else{if(!c.endereco&&address)c.endereco=address;if(!c.celular&&phone)c.celular=phone}return c};
 for(const o of db.obras){const c=db.clientes.find(c=>c.id===o.clienteId)||register(o['Cliente/Obra'],o['Endereço do cliente'],o['Celular do cliente']);if(c)o.clienteId=c.id}
 for(const q of db.orcamentos){const c=db.clientes.find(c=>c.id===q.clienteId)||register(q.cliente,q.endereco,q.celular);if(c)q.clienteId=c.id}
 for(const l of db.listasMateriais){const c=db.clientes.find(c=>c.id===l.clienteId)||register(l.cliente);if(c)l.clienteId=c.id}
 save();
}
function clientPicker(id,value='',label='Cliente',addressId='',phoneId=''){
 const c=findClient(value);
 return `<div class="client-picker"><label for="${id}">${esc(label)}</label><input id="${id}" class="client-search" autocomplete="off" value="${esc(value)}" data-client-id="${esc(c?.id)}" data-address-id="${esc(addressId)}" data-phone-id="${esc(phoneId)}" placeholder="Digite nome ou celular para buscar" aria-controls="${id}-matches" aria-expanded="false"><div id="${id}-matches" class="client-matches" hidden></div></div>`;
}
function renderClientMatches(input){
 const list=document.getElementById(input.id+'-matches'),query=clientKey(input.value);
 const matches=db.clientes.filter(c=>!query||clientKey(c.nome).includes(query)||clientKey(c.celular).includes(query));
 list.innerHTML=matches.slice(0,12).map(c=>`<button type="button" class="btn alt client-match" data-action="client-pick" data-client-id="${esc(c.id)}" data-target="${input.id}">${esc(c.nome)}${c.celular?`<small>${esc(c.celular)}</small>`:''}</button>`).join('')+(!matches.length?'<p class="muted">Nenhum cliente encontrado.</p>':'')+`<button type="button" class="btn yellow client-match" data-action="client-new" data-target="${input.id}">+ Cadastrar cliente</button>`;
 list.hidden=false;input.setAttribute('aria-expanded','true');
}
function selectClient(input,id){
 const c=db.clientes.find(c=>c.id===id);if(!c)return;
 input.value=c.nome;input.dataset.clientId=c.id;
 for(const [field,value] of [[input.dataset.addressId,c.endereco],[input.dataset.phoneId,c.celular]]){const target=field&&document.getElementById(field);if(target)target.value=value||''}
 document.getElementById(input.id+'-matches').hidden=true;input.setAttribute('aria-expanded','false');
}
function selectedClient(id){const input=document.getElementById(id),c=findClient(input?.value);if(!c){alert('Escolha um cliente cadastrado ou use + Cadastrar cliente.');input?.focus();return null}input.dataset.clientId=c.id;return c}
function clientsView(){
 document.querySelector('#view').innerHTML=`<div class="title"><h1>Clientes</h1><button class="btn yellow" data-action="client-new">+ Cadastrar cliente</button></div><section class="panel"><label>Buscar cliente<input id="clients-filter" placeholder="Nome, celular ou endereço"></label><div id="clients-results"></div></section>`;renderClientsTable();
}
function renderClientsTable(){
 const query=clientKey(document.getElementById('clients-filter').value),clients=db.clientes.filter(c=>clientKey([c.nome,c.celular,c.endereco].join(' ')).includes(query)).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
 document.getElementById('clients-results').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Nome</th><th>Celular</th><th>Endereço</th><th>Ações</th></tr></thead><tbody>${clients.map(c=>`<tr><td>${esc(c.nome)}</td><td>${esc(c.celular)}</td><td>${esc(c.endereco)}</td><td><button class="btn alt" data-action="client-edit" data-client-id="${esc(c.id)}">Editar</button></td></tr>`).join('')||'<tr><td colspan="4">Nenhum cliente cadastrado.</td></tr>'}</tbody></table></div>`;
}
function clientForm(id='',target=''){
 const c=db.clientes.find(c=>c.id===id),input=target&&document.getElementById(target);
 document.querySelector('#client-modal')?.remove();
 document.body.insertAdjacentHTML('beforeend',`<div class="modal open" id="client-modal"><div class="dialog"><h2>${c?'Editar':'Cadastrar'} cliente</h2><div class="formgrid"><label>Nome<input id="client-name" value="${esc(c?.nome||input?.value)}" required></label><label>Celular<input id="client-phone" type="tel" inputmode="tel" value="${esc(c?.celular)}"></label><label class="full">Endereço<input id="client-address" value="${esc(c?.endereco)}"></label></div><div class="actions"><button class="btn" data-action="client-save" data-client-id="${esc(id)}" data-target="${esc(target)}">Salvar cliente</button><button class="btn alt" data-action="client-close">Cancelar</button></div></div></div>`);document.getElementById('client-name').focus();
}
function saveClient(id,target){
 const nome=document.getElementById('client-name').value.trim(),endereco=document.getElementById('client-address').value.trim(),celular=document.getElementById('client-phone').value.trim();
 if(!nome){document.getElementById('client-name').reportValidity();return}
 if(db.clientes.some(c=>c.id!==id&&clientKey(c.nome)===clientKey(nome))){alert('Esse cliente já está cadastrado. Busque pelo nome.');return}
 let c=db.clientes.find(c=>c.id===id);
 if(c){const oldName=c.nome;Object.assign(c,{nome,endereco,celular});
  for(const o of db.obras.filter(o=>o.clienteId===id)){const oldWork=o['Cliente/Obra'];if(clientKey(oldWork)===clientKey(oldName)&&oldWork!==nome){o['Cliente/Obra']=nome;for(const kind of ['recebimentos','extras','gastos','colaboradores','imprevistos'])for(const r of db[kind])if(r.Obra===oldWork)r.Obra=nome;for(const l of db.listasMateriais)if(l.obra===oldWork)l.obra=nome}o['Endereço do cliente']=endereco;o['Celular do cliente']=celular}
  for(const q of db.orcamentos.filter(q=>q.clienteId===id))Object.assign(q,{cliente:nome,endereco,celular});
  for(const l of db.listasMateriais.filter(l=>l.clienteId===id))l.cliente=nome;
 }else{c={id:crypto.randomUUID(),nome,endereco,celular};db.clientes.push(c)}
 save();document.getElementById('client-modal').remove();const input=target&&document.getElementById(target);if(input)selectClient(input,c.id);else clientsView();
}
document.addEventListener('input',e=>{if(e.target.matches('.client-search')){delete e.target.dataset.clientId;renderClientMatches(e.target)}if(e.target.id==='clients-filter')renderClientsTable()});
document.addEventListener('focusin',e=>{if(e.target.matches('.client-search'))renderClientMatches(e.target)});
document.addEventListener('keydown',e=>{if(!e.target.matches('.client-search'))return;const list=document.getElementById(e.target.id+'-matches');if(e.key==='Escape'){list.hidden=true;e.target.setAttribute('aria-expanded','false')}if(e.key==='ArrowDown'&&!list.hidden){e.preventDefault();list.querySelector('button')?.focus()}});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-action]');if(button){const {action,clientId,target}=button.dataset;
 if(action==='client-pick')selectClient(document.getElementById(target),clientId);
 else if(action==='client-new')clientForm('',target||'');
 else if(action==='client-edit')clientForm(clientId);
 else if(action==='client-save')saveClient(clientId,target);
 else if(action==='client-close')document.getElementById('client-modal').remove();
 }
 if(!e.target.closest('.client-picker'))document.querySelectorAll('.client-matches').forEach(list=>{list.hidden=true;document.getElementById(list.id.replace(/-matches$/,''))?.setAttribute('aria-expanded','false')});
});
