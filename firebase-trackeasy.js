// firebase-trackeasy.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAd3RY1xWBfJJwNNHTbUB50xXPkcB-2b08",
  authDomain: "trackeasy-669e3.firebaseapp.com",
  projectId: "trackeasy-669e3",
  storageBucket: "trackeasy-669e3.firebasestorage.app",
  messagingSenderId: "656055712426",
  appId: "1:656055712426:web:c393bdb7ccf0afe820eed3"
};

const app = initializeApp(firebaseConfig);
const dbFirebase = getFirestore(app);

window.enviarWhatsFirebase = async function(id, tipoAviso) {
  // 1. Pega os dados DIRETO da memória do navegador para não dar erro
  const bancoLocal = JSON.parse(localStorage.getItem('portaria_v26')) || [];
  const it = bancoLocal.find(d => d.id === id);
  
  if (!it) return;

  // 2. Garante que o ID fique MAIÚSCULO (ex: se você digitou 11p, ele busca 11P)
  const idFirebase = (it.apto + it.bloco).toUpperCase();

  // 3. Abre a aba IMEDIATAMENTE no clique (Truque anti-bloqueio do celular)
  const novaAba = window.open('https://api.whatsapp.com/send?text=Carregando...', '_blank');

  try {
    const docRef = doc(dbFirebase, "moradores", idFirebase);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const dados = docSnap.data();
      
      // Limpa o número de telefone
      let numeroWhats = String(dados.whatsapp1).replace(/\D/g, ''); 
      if (numeroWhats.length <= 11) {
          numeroWhats = '55' + numeroWhats;
      }

      let msg = "";
      if (tipoAviso === 'portaria') {
        let permInfo = it.permanencia ? `\n⚠️ *Atenção:* Esta encomenda ficará na portaria até às *${it.permanencia}*. Após este horário, ela será encaminhada para a Mensageria.` : '';
        msg = `Olá! 👋 Temos uma ótima notícia: uma encomenda sua acaba de chegar à nossa portaria!\n\n👤 *Para:* ${it.morador}\n🏢 *Unidade:* ${it.apto} - Bloco ${it.bloco}\n📦 *Item:* ${it.descricao}\n🏷️ *Remetente:* ${it.remetente}\n🚚 *Empresa:* ${it.empresa}\n🔢 *Doc/NF:* ${it.nf}\n👮 *Recebido por:* ${it.recebedor}\n⏰ *Registrado em:* ${it.data} às ${it.hora}${permInfo}\n\nA portaria é 24h e você pode retirar a qualquer momento. Até já! 📦✨`;
        it.notificadoPortariaMorador = true;
      } else {
        const agora = new Date().toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
        msg = `Olá! 👋 Informamos que sua encomenda saiu da portaria e chegou à nossa *MENSAGERIA* e já está pronta para retirada.\n\n🏢 *Local:* Unidade ${it.apto} - Bloco ${it.bloco}\n📦 *Item:* ${it.descricao}\n⏰ *Aviso enviado às:* ${agora}\n\nAguardamos sua visita para a retirada. Tenha um excelente dia! 📦✨`;
        it.notificadoMensageria = true;
      }
      
      const linkFinal = `https://api.whatsapp.com/send?phone=${numeroWhats}&text=${encodeURIComponent(msg)}`;

      // Redireciona a aba que já estava aberta
      if (novaAba) {
        novaAba.location.href = linkFinal;
      } else {
        window.location.href = linkFinal; // Plano B se o celular for muito bloqueado
      }

      // Salva a alteração (check verde de notificado)
      const index = bancoLocal.findIndex(d => d.id === id);
      if (index !== -1) {
         bancoLocal[index] = it;
         localStorage.setItem('portaria_v26', JSON.stringify(bancoLocal));
      }
      
      // Atualiza a tela do sistema
      if (typeof window.render === "function") window.render();

    } else {
      if (novaAba) novaAba.close();
      alert(`❌ O apartamento ${idFirebase} ainda não tem número salvo no banco de dados!`);
    }
  } catch (error) {
    console.error("Erro Firebase:", error);
    if (novaAba) novaAba.close();
    alert("Erro de conexão com o Firebase.");
  }
};

// Sobrescreve os botões originais do seu sistema
window.enviarAvisoMorador = (id) => window.enviarWhatsFirebase(id, 'portaria');
window.enviarAvisoMensageria = (id) => window.enviarWhatsFirebase(id, 'mensageria');
