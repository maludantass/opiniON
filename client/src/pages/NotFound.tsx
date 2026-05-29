import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
            <Navbar />
            <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
                <div className="rounded-3xl bg-white p-10 shadow-sm border border-gray-100 max-w-md w-full text-center flex flex-col items-center gap-6">
                    <div className="text-6xl font-extrabold text-[#6C3BFF] animate-pulse">
                        404
                    </div>
                    <div className="text-5xl">🎮</div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
                        <p className="text-gray-500 text-sm">
                            O jogo ou a página que você está procurando não existe ou foi movido.
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="w-full py-3 rounded-xl bg-[#6C3BFF] text-white hover:bg-[#5b30e0] transition-all font-semibold text-sm shadow-md shadow-purple-200 text-center"
                    >
                        Voltar para o Início
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}
