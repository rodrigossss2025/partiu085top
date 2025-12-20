import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RadarPage } from "./pages/RadarPage";
import { SettingsPage } from "./pages/SettingsPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RadarPage />} />
        <Route path="/Settings-Page" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
