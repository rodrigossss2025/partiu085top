import { BrowserRouter, Routes, Route } from "react-router-dom";

import { RadarPage } from "./pages/RadarPage";
import { ResultsPage } from "./pages/ResultsPage";
import { MillasLabPage } from "./pages/MillasLabPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<RadarPage />} />

        {/* Resultados das buscas */}
        <Route path="/resultados" element={<ResultsPage />} />

        {/* Laboratório de Milhas / Conversor */}
        <Route path="/lab-milhas" element={<MillasLabPage />} />

        {/* Configurações / Agendador */}
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
