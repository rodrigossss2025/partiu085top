// frontend/src/services/backendService.ts

/**
 * Backend base URL
 * Definido exclusivamente por variável de ambiente (Vercel / .env)
 * Exemplo:
 *   VITE_API_URL=https://partiu085top-5kge.onrender.com
 */
const API_BASE_URL = import.meta.env.VITE_API_URL;

console.log("🔗 Conectando Backend em:", API_BASE_URL);

// =================== FUNÇÃO GENÉRICA ===================

async function request(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const raw = await response.text();
      console.error(`❌ Erro HTTP em ${endpoint}:`, response.status, raw);
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      console.error("❌ Resposta não-JSON:", raw.slice(0, 500));
      throw new Error("Resposta não é JSON");
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Falha ao acessar ${endpoint}:`, error);
    return { success: false, results: [], message: "Erro de conexão com o backend." };
  }
}

// =================== RADAR MANUAL ===================

export async function postExecutarManual(
  modo: "MANUAL" | "MANUAL_FLEX",
  destinos: string[],
  dataIda: string,
  dataVolta?: string
) {
  return await request("/api/executar", {
    method: "POST",
    body: JSON.stringify({
      modo,
      destinos,
      data_ida: dataIda,
      data_volta: dataVolta,
    }),
  });
}

// =================== RESULTADOS ===================

export async function getResultados() {
  const t = Date.now(); // evita cache agressivo
  return await request(`/api/resultados?t=${t}`);
}

// =================== DESTINOS (AUTOCOMPLETE) ===================

export async function getDestinos() {
  return await request("/api/destinos");
}

// =================== STATUS DO RADAR / AGENDADOR ===================

export async function getStatusRadar() {
  return await request("/api/status_radar");
}

// O agendador é automático no backend (Render)
export async function iniciarAgendador() {
  console.warn("iniciarAgendador(): agendador inicia automaticamente no backend.");
  return { success: false, message: "Agendador é automático." };
}

export async function pausarAgendador() {
  console.warn("pausarAgendador(): pausa remota não suportada.");
  return { success: false, message: "Pausa remota indisponível." };
}

// =================== ALERTAS ===================

export async function getAlertas() {
  return await request("/api/alertas");
}

export async function addAlerta(data: any) {
  return await request("/api/alertas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAlerta(id: string) {
  return await request(`/api/alertas/${id}`, {
    method: "DELETE",
  });
}

// =================== LAB MILHAS / PROCESSADOR DE TEXTO ===================

export async function postProcessarTexto(texto: string, modo: string) {
  return await request("/api/processar-texto", {
    method: "POST",
    body: JSON.stringify({ texto, modo }),
  });
}

// =================== AGENDADOR (EXECUÇÃO MANUAL) ===================

export async function executarAgendadorAgora() {
  return await request("/api/agendador/agora", {
    method: "POST",
  });
}

// =================== TELEGRAM ===================

export async function enviarOfertaTelegram(oferta: any) {
  return await request("/api/telegram/oferta", {
    method: "POST",
    body: JSON.stringify(oferta),
  });
}
