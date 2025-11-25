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
      throw new Error(`Erro HTTP ${response.status}`);
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

// =================== AGENDADOR ===================

export async function getStatusRadar() {
  return await request("/agendador/status");
}

export async function iniciarAgendador() {
  return await request("/agendador/iniciar", { method: "POST" });
}

export async function pausarAgendador() {
  return await request("/agendador/pausar", { method: "POST" });
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

export async function postProcessarTexto(texto: string, modo: string) {
  return await request("/processar-texto", {
    method: "POST",
    body: JSON.stringify({ texto, modo }),
  });
}
