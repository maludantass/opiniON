import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  addJogoToLista,
  getMinhasListas,
  removeJogoFromLista,
  type Lista,
} from "../services/api";

interface Props {
  token: string;
  jogoId: number;
  jogoTitle: string;
  onClose: () => void;
  onListaUpdated?: (listaId: number, updatedJogoIds: number[]) => void;
}

export default function AddToListaModal({
  token,
  jogoId,
  jogoTitle,
  onClose,
  onListaUpdated,
}: Props) {
  const [listas, setListas] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  useEffect(() => {
    getMinhasListas(token)
      .then(setListas)
      .catch(() => toast.error("Erro ao carregar listas"))
      .finally(() => setLoading(false));
  }, [token]);

  async function toggle(lista: Lista) {
    const isIn = lista.jogoIds.includes(jogoId);
    setToggling((prev) => new Set(prev).add(lista.id));
    try {
      const updated = isIn
        ? await removeJogoFromLista(token, lista.id, jogoId)
        : await addJogoToLista(token, lista.id, jogoId);

      const populated = { ...updated, jogos: lista.jogos };
      setListas((prev) => prev.map((l) => (l.id === lista.id ? populated : l)));
      onListaUpdated?.(lista.id, updated.jogoIds);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setToggling((prev) => {
        const s = new Set(prev);
        s.delete(lista.id);
        return s;
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-800">
              Adicionar à lista
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              {jogoTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Carregando listas...
          </p>
        ) : listas.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Você ainda não tem listas. Crie uma na aba Listas do seu perfil.
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {listas.map((lista) => {
              const isIn = lista.jogoIds.includes(jogoId);
              const busy = toggling.has(lista.id);
              return (
                <button
                  key={lista.id}
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(lista)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                    isIn
                      ? "bg-purple-50 border border-purple-200"
                      : "bg-gray-50 border border-gray-100 hover:bg-purple-50 hover:border-purple-200"
                  } disabled:opacity-50`}
                >
                  <div
                    className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition ${
                      isIn
                        ? "bg-[#6C3BFF] border-[#6C3BFF]"
                        : "border-gray-300"
                    }`}
                  >
                    {isIn && (
                      <svg
                        viewBox="0 0 10 8"
                        fill="none"
                        className="w-2.5 h-2 text-white"
                      >
                        <path
                          d="M1 4l2.5 2.5L9 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {lista.title}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {lista.jogoIds.length}{" "}
                      {lista.jogoIds.length === 1 ? "jogo" : "jogos"} ·{" "}
                      {lista.type === "public" ? "Pública" : "Privada"}
                    </p>
                  </div>
                  {busy && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ...
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl text-sm font-medium bg-[#6C3BFF] text-white hover:bg-[#5b30e0] transition"
        >
          Pronto
        </button>
      </div>
    </div>
  );
}
