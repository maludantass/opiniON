import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getMyRatings, updateUserProfile, type UserRating } from '../services/api';
import toast from 'react-hot-toast';

type TabType = 'favorited' | 'listed' | 'rated' | 'played';

function ProfileGameCard({ rating }: { rating: UserRating }) {
    if (!rating.jogo) return null;
    const game = rating.jogo;
    return (
        <div className="flex flex-col bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all">
            <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-inner relative">
                {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-semibold bg-gradient-to-br from-indigo-100 to-purple-100">
                        🎮
                    </div>
                )}
                {rating.category && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#6C3BFF]/90 text-white shadow-sm">
                        {rating.category}
                    </span>
                )}
            </div>
            <p className="text-sm font-bold text-gray-800 line-clamp-1 w-full mb-1" title={game.title}>
                {game.title}
            </p>
            <div className="flex items-center justify-between w-full mt-auto pt-2 border-t border-gray-50">
                {rating.rating !== null ? (
                    <div className="flex gap-0.5 text-amber-500 text-xs" aria-label={`Avaliação: ${rating.rating} de 5`}>
                        {Array.from({ length: 5 }, (_, idx) => (
                            <span key={idx} className="leading-none text-sm">{idx < rating.rating! ? "★" : "☆"}</span>
                        ))}
                    </div>
                ) : (
                    <span className="text-[10px] font-medium text-gray-400">Sem nota</span>
                )}
                {rating.played && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100">
                        Jogado
                    </span>
                )}
            </div>
        </div>
    );
}

export default function Perfil() {
    const { user, token, logout, updateUserLocal } = useAuth();
    const navigate = useNavigate();
    const [ratings, setRatings] = useState<UserRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('favorited');

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioInput, setBioInput] = useState(user?.bio ?? '');
    const [savingBio, setSavingBio] = useState(false);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        getMyRatings(token)
            .then((data) => {
                setRatings(data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSaveBio = async () => {
        if (!token || !user) return;
        setSavingBio(true);
        try {
            const updatedUser = await updateUserProfile(token, user.id, { bio: bioInput.trim() });
            updateUserLocal({ bio: updatedUser.bio });
            setIsEditingBio(false);
            toast.success("Bio atualizada com sucesso!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar bio");
        } finally {
            setSavingBio(false);
        }
    };

    if (!user) return null;

    const counts = {
        favorited: ratings.filter(r => r.favorited).length,
        listed: ratings.filter(r => r.listed).length,
        rated: ratings.filter(r => r.rating !== null).length,
        played: ratings.filter(r => r.played).length,
    };

    const filteredRatings = ratings.filter(r => {
        if (activeTab === 'favorited') return r.favorited;
        if (activeTab === 'listed') return r.listed;
        if (activeTab === 'rated') return r.rating !== null;
        if (activeTab === 'played') return r.played;
        return false;
    });

    const tabs: { id: TabType; label: string; count: number }[] = [
        { id: 'favorited', label: 'Curtidos', count: counts.favorited },
        { id: 'listed', label: 'Quero Jogar', count: counts.listed },
        { id: 'rated', label: 'Avaliados', count: counts.rated },
        { id: 'played', label: 'Já Joguei', count: counts.played },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
            <Navbar />
            <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar de Perfil */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 flex flex-col items-center">
                            <div className="flex flex-col items-center gap-4 mb-6">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.username ?? 'Avatar'} className="w-24 h-24 rounded-full object-cover border-4 border-purple-50 shadow-md" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-4xl font-bold text-purple-600 border-4 border-purple-50 shadow-md">
                                        {(user.username ?? user.email)[0]?.toUpperCase() ?? '?'}
                                    </div>
                                )}
                                <div className="text-center">
                                    <h1 className="text-xl font-bold text-gray-900">{user.username ?? 'Gamer'}</h1>
                                    <p className="text-gray-400 text-xs mt-0.5">@{user.username ?? 'gamer'}</p>
                                    <p className="text-gray-500 text-xs mt-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 inline-block">{user.email}</p>
                                </div>
                            </div>

                            {/* Seção de Bio */}
                            <div className="w-full border-t border-gray-100 pt-5 mt-2 flex flex-col items-start text-left">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sobre mim</h3>
                                {isEditingBio ? (
                                    <div className="w-full flex flex-col gap-2">
                                        <textarea
                                            value={bioInput}
                                            onChange={(e) => setBioInput(e.target.value)}
                                            placeholder="Escreva algo sobre você..."
                                            maxLength={500}
                                            className="w-full p-2.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6C3BFF]/50 resize-none h-20"
                                        />
                                        <div className="flex gap-2 justify-end w-full">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBioInput(user.bio ?? '');
                                                    setIsEditingBio(false);
                                                }}
                                                className="px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                disabled={savingBio}
                                                onClick={handleSaveBio}
                                                className="px-3 py-1 text-[11px] font-semibold bg-[#6C3BFF] hover:bg-[#5a2fd9] text-white rounded-lg transition disabled:opacity-60 shadow-sm cursor-pointer"
                                            >
                                                {savingBio ? "Salvando..." : "Salvar"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {user.bio ? (
                                            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100/50 break-words w-full">
                                                {user.bio}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic leading-relaxed">
                                                Nenhuma biografia adicionada.
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingBio(true)}
                                            className="mt-2 text-[11px] font-semibold text-[#6C3BFF] hover:text-[#5a2fd9] transition cursor-pointer"
                                        >
                                            Editar Bio
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-full border-t border-gray-100 pt-6">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm text-center"
                                >
                                    Sair da conta
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo Principal / Obras */}
                    <div className="flex-1 min-w-0">
                        <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
                            {/* Abas */}
                            <div className="flex border-b border-gray-100 overflow-x-auto gap-1 mb-8" style={{ scrollbarWidth: 'none' }}>
                                {tabs.map((tab) => {
                                    const active = tab.id === activeTab;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                                                active
                                                    ? 'border-[#6C3BFF] text-[#6C3BFF]'
                                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            <span>{tab.label}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                active
                                                    ? 'bg-purple-100 text-[#6C3BFF]'
                                                    : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Conteúdo da Aba */}
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                    Carregando jogos...
                                </div>
                            ) : filteredRatings.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16">
                                    <span className="text-4xl mb-3">🎮</span>
                                    <p className="text-sm font-medium">Nenhum jogo encontrado nesta seção.</p>
                                    <p className="text-xs text-gray-400 mt-1">Interaja com os jogos nas páginas Início ou Buscar para adicioná-los aqui!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {filteredRatings.map((rating) => (
                                        <ProfileGameCard key={rating.id} rating={rating} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
