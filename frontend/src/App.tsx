import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { ProductPage } from "./pages/ProductPage";

function ProductRoute() {
  const { id } = useParams();
  const n = Number(id);
  if (!Number.isFinite(n)) return <Navigate to="/" replace />;
  return <ProductPage id={n} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-full bg-zinc-950">
        <nav className="border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link to="/" className="text-sm font-semibold tracking-tight text-white">
              Price Monitor
            </Link>
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
              v0.0.1
            </span>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductRoute />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
