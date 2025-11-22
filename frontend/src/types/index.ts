// Esta é a definição OFICIAL da nossa oferta
export interface Oferta {
  origem: string;
  destino: string;
  data: string;
  data_ida: string;
  data_volta?: string;
  preco: string | number;
  moeda: string;
  link: string;
  timestamp: string;
  modo?: string;
  baseline?: string | number;
}