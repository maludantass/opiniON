import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Publicacao() {
  const [search, setSearch] = useState("");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main
        className="flex flex-1 flex-col items-center justify-center gap-10"
        style={{ background: "#6544ad" }}
      >
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Adicione seu jogo
        </h1>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar jogos..."
          className="w-full max-w-[500px] rounded-xl border-none px-4 py-3 text-base text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/40"
          style={{ background: "#ffffff" }}
        />
      </main>
    </div>
  );
}