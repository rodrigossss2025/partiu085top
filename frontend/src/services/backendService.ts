// frontend/src/services/backendService.ts

const API_BASE_URL = import.meta.env.VITE_API_URL;

console.log("🔗 Conectando Backend em:", API_BASE_URL);

// =================== FUNÇÃO GENÉRICA ===================

async function request(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      const raw = await response.text();
      console.error(`❌ Erro HTTP ${response.status} em ${endpoint}`, raw);
      throw new Error(`Erro HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erro em ${endpoint}:`, error);
    throw error;
  }
}

// =================== RADAR MANUAL ===================

export async function postExecutarManual(
  modo: "MANUAL" | "MANUAL_FLEX",
  destinos: string[],
  dataIda: string,
  dataVolta?: string
) {
  return request("/executar", {
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
  return request("/resultados");
}

// =================== DESTINOS ===================

export async function getDestinos() {
  return request("/destinos");
}

// =================== STATUS ===================

export async function getStatusRadar() {
  return request("/status_radar");
}

// =================== ALERTAS ===================

export async function getAlertas() {
  return request("/alertas");
}

export async function addAlerta(data: any) {
  return request("/alertas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAlerta(id: string) {
  return request(`/alertas/${id}`, { method: "DELETE" });
}

// =================== TELEGRAM ===================

export async function enviarOfertaTelegram(oferta: any) {
  return request("/telegram/oferta", {
    method: "POST",
    body: JSON.stringify(oferta),
  });
}
