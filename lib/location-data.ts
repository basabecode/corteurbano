export type ZonaCali = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export const ZONAS_CALI: ZonaCali[] = [
  { id: 'norte', label: 'Norte (Chipichape / Unicentro)', lat: 3.4516, lng: -76.5320 },
  { id: 'centro', label: 'Centro histórico', lat: 3.4372, lng: -76.5225 },
  { id: 'sur', label: 'Sur (Jardín / Tequendama)', lat: 3.3953, lng: -76.5395 },
  { id: 'oeste', label: 'Oeste (San Antonio / Ciudad Jardín)', lat: 3.4420, lng: -76.5520 },
  { id: 'este', label: 'Este (Siloé / Terrón Colorado)', lat: 3.4600, lng: -76.5100 },
  { id: 'aguablanca', label: 'Aguablanca / Distrito', lat: 3.4200, lng: -76.4800 },
];
