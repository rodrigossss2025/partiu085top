// Definição OFICIAL da Oferta (alinhada com backend e frontend)
export interface Oferta {
  origem: string;
  destino: string;

  data?: string;
  data_ida: string;
  data_volta?: string;

  preco: number; // 🔥 agora é number (resolve TS2362/2363)
  moeda?: string;
  link?: string;

  timestamp?: string;
  data_hora?: string;
  created_at?: string;

  modo?: "AUTO" | "MANUAL" | string;

  baseline?: number; // 🔥 number
  percentual_baseline?: number | null; // 🔥 EXISTE AGORA

  // Permite evolução do backend sem quebrar TS
  [key: string]: any;
}
