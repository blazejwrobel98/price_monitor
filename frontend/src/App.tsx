import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { ProductPage } from "./pages/ProductPage";
import { SettingsPage } from "./pages/SettingsPage";

function ProductRoute() {
  const { id } = useParams();
  const n = Number(id);
  if (!Number.isFinite(n)) return <Navigate to="/" replace />;
  return <ProductPage id={n} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950">
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/product/:id" element={<ProductRoute />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
