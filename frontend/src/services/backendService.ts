// frontend/src/services/backendService.ts

// BASE ÚNICA: local usa localhost, produção usa Render
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("localhost") ||
    window.location.hostname.startsWith("127."));

export const API_BASE_URL = isLocal
  ? "http://127.0.0.1:5000/api"
  : "https://partiu085-api.onrender.com/api";

console.log("🔗 Backend:", API_BASE_URL);

async function request(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status} em ${url}`);
      return { success: false, message: "Erro HTTP", results: [] };
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erro ao acessar ${endpoint}:`, error);
    return { success: false, message: "Erro de conexão.", results: [] };
  }
}

// ---- RADAR
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

// ---- RESULTADOS
export async function getResultados() {
  return await request(`/resultados?t=${Date.now()}`);
}

// ---- DESTINOS
export async function getDestinos() {
  return await request("/destinos");
}

// ---- AGENDADOR
export async function getStatusRadar() {
  return await request("/agendador/status");
}

export async function iniciarAgendador() {
  return await request("/agendador/iniciar", { method: "POST" });
}

export async function pausarAgendador() {
  return await request("/agendador/pausar", { method: "POST" });
}

// ---- ALERTAS
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

export async function postProcessarTexto(texto: string, modo: string) {
  return await request("/processar-texto", {
    method: "POST",
    body: JSON.stringify({ texto, modo }),
  });
}
