import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RadarPage } from "./pages/RadarPage";
import { MillasLabPage } from "./pages/MillasLabPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RadarPage />} />
        <Route path="/lab-milhas" element={<MillasLabPage />} />
      </Routes>
    </BrowserRouter>
  );
}
