import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RadarPage } from "./pages/RadarPage";
import { AlertasPage } from "./pages/AlertasPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RadarPage />} />
        <Route path="/alertas" element={<AlertasPage />} />
      </Routes>
    </BrowserRouter>
  );
}
