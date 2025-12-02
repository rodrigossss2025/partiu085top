// frontend/src/services/backendService.ts

// Detecta ambiente local corretamente
const isLocal =
  typeof window !== "undefined" &&
  (
    window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.")
  );

const API_BASE_URL = isLocal
  ? "http://127.0.0.1:5000/api"
  : "https://partiu085-api.onrender.com/api";

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
      console.error(`❌ Erro HTTP em ${endpoint}:`, response.status);
      const raw = await response.text();
      console.error("Resposta bruta:", raw.slice(0, 500));
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      console.error("Resposta NÃO-JSON recebida:", raw.slice(0, 500));
      throw new Error("Resposta não é JSON");
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erro em ${endpoint}:`, error);
    return { success: false, message: "Erro de conexão.", results: [] };
  }
}

// =================== RADAR MANUAL ===================

export async function postExecutarManual(
  modo: "MANUAL" | "MANUAL_FLEX",
  destinos: string[],
  dataIda: string,
  dataVolta?: string
) {
  return await request("/executar", {
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
  const t = Date.now(); // evita cache
  return await request(`/resultados?t=${t}`);
}

// =================== DESTINOS ===================

export async function getDestinos() {
  return await request("/destinos");
}

// =================== STATUS DO RADAR / AGENDADOR ===================

export async function getStatusRadar() {
  // backend expõe /api/status_radar (sem /agendador)
  return await request("/status_radar");
}

// hoje o agendador sobe automaticamente com o backend;
// mantemos as funções apenas para não quebrar a UI
export async function iniciarAgendador() {
  console.warn("iniciarAgendador(): controle manual desabilitado; agendador é automático.");
  return { success: false, message: "Agendador inicia automaticamente com o backend." };
}

export async function pausarAgendador() {
  console.warn("pausarAgendador(): controle manual desabilitado; agendador é automático.");
  return { success: false, message: "Pausa remota do agendador indisponível." };
}

// =================== ALERTAS ===================

export async function getAlertas() {
  return await request("/alertas");
}

export async function addAlerta(data: any) {
  return await request("/alertas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAlerta(id: string) {
  return await request(`/alertas/${id}`, { method: "DELETE" });
}

// =================== LAB MILLAS / PROCESSADOR DE TEXTO ===================

export async function postProcessarTexto(texto: string, modo: string) {
  return await request("/processar-texto", {
    method: "POST",
    body: JSON.stringify({ texto, modo }),
  });
}

export async function executarAgendadorAgora() {
  const res = await fetch("/api/agendador/agora", {
    method: "POST",
  });
  return res.json();
}

