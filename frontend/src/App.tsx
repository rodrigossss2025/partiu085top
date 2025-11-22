import { Routes, Route, HashRouter } from 'react-router-dom';
// ⚠️ CORREÇÃO: Adicionando explicitamente o sufixo .tsx em todas as importações para resolver o erro de compilação
import { RadarPage } from './pages/RadarPage.tsx';
import { ResultsPage } from './pages/ResultsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { BottomNavBar } from './components/BottomNavBar.tsx';
import { MillasLabPage } from './pages/MillasLabPage.tsx';
import { AlertasPage } from './pages/AlertasPage.tsx';

function App() {
  return (
    // Usa HashRouter pois o Vercel em modo SPA se dá melhor com ele.
    <HashRouter>
      {/* Container principal com fundo e cor de texto padronizados */}
      <div className="min-h-screen bg-slate-900 text-slate-100">

        {/* Área principal de conteúdo, centralizada e com margem inferior para a barra de navegação */}
        <main className="pb-24 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<RadarPage />} />
            <Route path="/resultados" element={<ResultsPage />} />
            <Route path="/config" element={<SettingsPage />} />
            <Route path="/lab" element={<MillasLabPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
          </Routes>
        </main>

        {/* Barra de navegação fixa no rodapé */}
        <BottomNavBar />
      </div>
    </HashRouter>
  );
}

export default App;
