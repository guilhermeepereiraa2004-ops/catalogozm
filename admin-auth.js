const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function authRequest(path,body,setupToken){
 let response;try{response=await fetch('/api/auth/'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{...(body?{'Content-Type':'application/json'}:{}),...(setupToken?{'X-ZM-Setup-Token':setupToken}:{})},...(body?{body:JSON.stringify(body)}:{})});}catch{throw new Error('Não foi possível conectar. Verifique sua internet.');}
 const data=await response.json();
 if(!response.ok){if(response.status===429)throw new Error('Muitas tentativas. Aguarde um minuto para tentar novamente.');if(path==='sign-in/email')throw new Error('Usuário ou senha incorretos. Confira e tente novamente.');throw new Error(data.error||'Não foi possível concluir. Confira os dados e tente novamente.');}
 return data;
}
export const getAuthStatus=token=>authRequest('status',undefined,token);
export const signIn=data=>authRequest('sign-in/email',{email:data.login,password:data.password,rememberMe:false});
export const setupAdmin=(data,token)=>authRequest('setup',{name:data.name,email:data.email,password:data.password},token);
export const createTeamUser=({name,username,password})=>authRequest('users',{name,username,password});
export const signOut=()=>authRequest('sign-out',{});
export const changePassword=data=>authRequest('change-password',{currentPassword:data.currentPassword,newPassword:data.password,revokeOtherSessions:true});
function passwordField(name,label,autocomplete='current-password',confirmation=false){return `<label>${label}<div class="auth-password"><input id="auth-${name}" name="${name}" type="password" autocomplete="${autocomplete}" required ${autocomplete==='new-password'?'minlength="12"':''} maxlength="128"><button type="button" data-action="toggle-password" data-input="auth-${name}" aria-label="Mostrar ${label.toLowerCase()}" aria-pressed="false">Mostrar</button></div></label>`;}
export function authView({setup=false,setupAvailable=false}={}){
 if(setup&&!setupAvailable)return `<main id="main" class="auth-page"><section class="auth-card"><img class="auth-logo" src="/assets/logo-zm-exclusiva.jpg" alt="ZM Exclusiva Store"><h1>Acesso inicial protegido</h1><p>Abra o link de ativação temporário fornecido pelo responsável. Se já criou sua conta, use seu acesso no painel.</p><a class="button primary full" href="#admin">Ir para o login</a><a class="text-button full" href="#">Voltar à loja</a></section></main>`;
 return `<main id="main" class="auth-page"><section class="auth-card" aria-labelledby="auth-title"><a href="#" aria-label="Voltar à loja"><img class="auth-logo" src="/assets/logo-zm-exclusiva.jpg" alt="ZM Exclusiva Store"></a><div class="eyebrow">PAINEL DA LOJA</div><h1 id="auth-title">${setup?'Vamos criar seu acesso.':'Seu espaço,<br>do seu jeito.'}</h1><p class="auth-intro">${setup?'Escolha o e-mail e a senha que você usará para cuidar da sua loja.':'Entre para cuidar dos produtos, pedidos e Fluxo de caixa.'}</p><form id="${setup?'admin-setup-form':'admin-login-form'}">${setup?'<label>Seu nome<input name="name" autocomplete="name" required maxlength="100"></label>':''}${setup?'<label>E-mail<input name="email" type="email" autocomplete="username" required maxlength="254" placeholder="voce@exemplo.com" autocapitalize="none" spellcheck="false"></label>':'<label>Usuário<input name="login" type="text" autocomplete="username" required maxlength="254" autocapitalize="none" spellcheck="false"></label>'}${passwordField('password','Senha',setup?'new-password':'current-password')}${setup?'<p class="small muted">Use pelo menos 12 caracteres. Combine palavras que só você conhece.</p>'+passwordField('confirmation','Confirme a senha','new-password'):''}<p class="form-error" role="alert"></p><button class="button primary full" type="submit">${setup?'Criar meu acesso':'Entrar na minha loja'}</button></form>${!setup&&setupAvailable?'<a class="text-button full" href="#admin/setup">Criar o primeiro acesso</a>':''}<a class="auth-back" href="#">← Voltar para a loja</a><p class="auth-footnote">${setup?'Configuração inicial protegida e de uso único.':'Acesso exclusivo à administração da ZM Exclusiva.'}</p></section></main>`;
}
export function passwordView(){return `<button class="dialog-close icon-btn" data-action="close" aria-label="Fechar">×</button><div class="eyebrow">SUA CONTA</div><h2>Trocar senha</h2><form id="admin-password-form">${passwordField('currentPassword','Senha atual')}${passwordField('password','Nova senha','new-password')}${passwordField('confirmation','Confirme a nova senha','new-password')}<p class="small muted">Use pelo menos 12 caracteres. As outras sessões serão encerradas.</p><p class="form-error" role="alert"></p><button class="button primary full" type="submit">Salvar nova senha</button></form>`;}

export function usersView(){
 return `<button class="dialog-close icon-btn" data-action="close" aria-label="Fechar">×</button>
 <div class="eyebrow">EQUIPE DA LOJA</div><h2 id="admin-users-title">Usuários</h2>
 <p>Cadastre um acesso individual para uma pessoa da equipe.</p>
 <form id="admin-user-form" aria-labelledby="admin-users-title">
  <label>Nome da pessoa<input name="name" required maxlength="100" autocomplete="off"></label>
  <label>Nome de usuário<input name="username" required minlength="3" maxlength="32" autocapitalize="none" spellcheck="false" aria-describedby="team-username-help"></label>
  <p id="team-username-help" class="small muted">Use letras sem acento, números, hífen ou sublinhado. Comece com uma letra ou um número.</p>
  ${passwordField('password','Senha inicial','new-password')}
  <p class="small muted">Use pelo menos 12 caracteres. Cada pessoa pode trocar sua senha pelo painel.</p>
  <p class="form-error" role="alert"></p><p role="status"></p>
  <button class="button primary full" type="submit">Cadastrar usuário</button>
 </form>`;
}
