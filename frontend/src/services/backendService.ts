// frontend/src/services/backendService.ts

// BASE ÚNICA: local usa localhost, produção usa Render
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
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
  // timestamp pra evitar cache
  const t = Date.now();
  return await request(`/resultados?t=${t}`);
}

// =================== DESTINOS (AUTOCOMPLETE) ===================

export async function getDestinos() {
  // Flask: @app.route("/api/destinos")
  return await request("/destinos");
}

// =================== AGENDADOR (CONFIG) ===================

export async function getStatusRadar() {
  // Flask: @app.route("/api/agendador/status")
  return await request("/agendador/status");
}

export async function iniciarAgendador() {
  return await request("/agendador/iniciar", { method: "POST" });
}

export async function pausarAgendador() {
  return await request("/agendador/pausar", { method: "POST" });
}

// =================== ALERTAS / LAB MILHAS ===================

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
