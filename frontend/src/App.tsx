import { BrowserRouter, Routes, Route } from "react-router-dom";

import { RadarPage } from "./pages/RadarPage";
import { ResultsPage } from "./pages/ResultsPage";
import { MillasLabPage } from "./pages/MillasLabPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AlertasPage } from "./pages/AlertasPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RadarPage />} />
        <Route path="/resultados" element={<ResultsPage />} />
        <Route path="/lab-milhas" element={<MillasLabPage />} />
        <Route path="/alertas" element={<AlertasPage />} />
        <Route path="/config" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
