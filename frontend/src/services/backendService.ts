// frontend/src/services/backendService.ts

// Endereço fixo da API em produção
const API_BASE_URL = "https://partiu085-api.onrender.com/api";

console.log("🔗 Conectando Backend em:", API_BASE_URL);

async function request(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Erro em ${endpoint}:`, error);
    return { success: false, message: "Erro de conexão.", results: [] };
  }
}

// =============================
// ===== ROTAS DO RADAR  =======
// =============================

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

export async function getResultados() {
  const t = Date.now();
  return await request(`/resultados?t=${t}`);
}

export async function getDestinosDisponiveis() {
  return await request("/destinos");
}

// ================================
// ====== ROTAS do AGENDADOR =====
// ================================

export async function getStatusRadar() {
  return await request("/agendador/status");
}

export async function iniciarAgendador() {
  return await request("/agendador/iniciar", { method: "POST" });
}

export async function pausarAgendador() {
  return await request("/agendador/pausar", { method: "POST" });
}

// =================================
// ======= ROTAS DE ALERTAS ========
// =================================

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
