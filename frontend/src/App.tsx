import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RadarPage } from "./pages/RadarPage";
import { AlertasPage } from "./pages/AlertasPage";
import { MillasLabPage } from "./pages/MillasLabPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RadarPage />} />
        <Route path="/alertas" element={<AlertasPage />} />
        <Route path="/lab-milhas" element={<MillasLabPage />} />
        <Route path="/config" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
