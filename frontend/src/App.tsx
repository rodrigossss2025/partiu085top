import { BrowserRouter, Routes, Route } from "react-router-dom";

import { RadarPage } from "./pages/RadarPage";
import { ResultsPage } from "./pages/ResultsPage";
import { MillasLabPage } from "./pages/MillasLabPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AlertasPage } from "./pages/AlertasPage";

// Importando o componente que estava faltando
import { BottomNavBar } from "./components/BottomNavBar";

export default function App() {
  return (
    <BrowserRouter>
      {/* Envolvemos tudo em uma div com flex-col para garantir que
          o conteúdo não fique "atrás" da barra de navegação
      */}
      <div className="flex flex-col min-h-screen bg-slate-900 pb-20">
        <Routes>
          <Route path="/" element={<RadarPage />} />
          <Route path="/resultados" element={<ResultsPage />} />
          <Route path="/lab-milhas" element={<MillasLabPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/config" element={<SettingsPage />} />
        </Routes>

        {/* Adicionando a barra de navegação aqui embaixo */}
        <BottomNavBar />
      </div>
    </BrowserRouter>
  );
}