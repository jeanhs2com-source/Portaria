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
  const bancoLocal = JSON.parse(localStorage.getItem('portaria_v26')) || [];
  const it = bancoLocal.find(d => d.id === id);
  if (!it) return;

  const idFirebase = (it.apto + it.bloco).toUpperCase();

  try {
    // 1. O SISTEMA VAI NO FIREBASE PRIMEIRO (Em segundo plano)
    const docRef = doc(dbFirebase, "moradores", idFirebase);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const dados = docSnap.data();
      
      let numeroWhats = String(dados.whatsapp1).replace(/\D/g, ''); 
      if (numeroWhats.length <= 11) {
          numeroWhats = '55' + numeroWhats;
      }

      let msg = "";
      if (tipoAviso === 'portaria') {
        let permInfo = it.permanencia ? `\n⚠️ *Atenção:* Esta encomenda ficará na portaria até às *${it.permanencia}*. Após este horário, ela será encaminhada para a Mensageria.` : '';
        msg = `Olá! 👋 Temos uma ótima notícia: uma encomenda sua acaba de chegar à nossa portaria!\n\n👤 *Para:* ${it.morador}\n🏢 *Unidade:* ${it.apto} - Bloco ${it.bloco}\n📦 *Item:* ${it.descricao}\n🏷️ *Remetente:* ${it.remetente}\n🚚 *Empresa:* ${it.empresa}\n🔢 *Doc/NF:* ${it.nf}\n👮 *Recebido por:* ${it.recebedor}\n⏰ *Registrado em:* ${it.data} às ${it.hora}${permInfo}\n\nA portaria é 24h e você pode retirar a qualquer momento. Até já! 📦✨`;
      } else {
        const agora = new Date().toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
        msg = `Olá! 👋 Informamos que sua encomenda saiu da portaria e chegou à nossa *MENSAGERIA* e já está pronta para retirada.\n\n🏢 *Local:* Unidade ${it.apto} - Bloco ${it.bloco}\n📦 *Item:* ${it.descricao}\n⏰ *Aviso enviado às:* ${agora}\n\nAguardamos sua visita para a retirada. Tenha um excelente dia! 📦✨`;
      }
      
      // Usa o link oficial e mais estável do WhatsApp
      const linkFinal = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(msg)}`;

      // 2. A MÁGICA ACONTECE AQUI: A confirmação zera o bloqueador de segurança do celular!
      const confirmarEnvio = confirm(`✅ Número encontrado no sistema!\n\nDeseja abrir o WhatsApp agora para o Apto ${idFirebase}?`);
      
      if (confirmarEnvio) {
        // 3. Abertura imediata após o seu clique (Garantia de 100% de sucesso)
        window.open(linkFinal, '_blank');
        
        // 4. Salva o check verde de Mensagem Enviada
        if (tipoAviso === 'portaria') it.notificadoPortariaMorador = true;
        else it.notificadoMensageria = true;
        
        const index = bancoLocal.findIndex(d => d.id === id);
        if (index !== -1) {
           bancoLocal[index] = it;
           localStorage.setItem('portaria_v26', JSON.stringify(bancoLocal));
        }
        if (typeof window.render === "function") window.render();
      }

    } else {
      alert(`❌ O apartamento ${idFirebase} ainda não tem número salvo no banco de dados!`);
    }
  } catch (error) {
    console.error("Erro Firebase:", error);
    alert("Erro de conexão com o banco de dados.");
  }
};

window.enviarAvisoMorador = (id) => window.enviarWhatsFirebase(id, 'portaria');
window.enviarAvisoMensageria = (id) => window.enviarWhatsFirebase(id, 'mensageria');
