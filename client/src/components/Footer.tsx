export default function Footer() {
    return (
        <footer className="bg-purple-800 text-white px-8 py-12 mt-12">
            <div className="max-w-6xl mx-auto grid grid-cols-4 gap-10">
                {/* Coluna 1 - OpiniOn */}
                <div>
                    <img src="/opinion-neg.png" alt="OpiniOn" className="h-7 w-auto mb-4 brightness-0 invert" />
                    <ul className="space-y-2 text-sm text-purple-200">
                        <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Comunidade</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Minhas listas</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Meus curtidos</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Meu Perfil</a></li>
                    </ul>
                </div>

                {/* Coluna 2 - Saiba mais */}
                <div>
                    <h3 className="font-bold text-lg mb-4">Saiba mais</h3>
                    <ul className="space-y-2 text-sm text-purple-200">
                        <li><a href="#" className="hover:text-white transition-colors">Quem somos</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Termos e Condições</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Central de ajuda</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                    </ul>
                </div>

                {/* Coluna 3 - Categorias */}
                <div>
                    <h3 className="font-bold text-lg mb-4">Categorias</h3>
                    <ul className="space-y-2 text-sm text-purple-200">
                        <li><a href="#" className="hover:text-white transition-colors">Filmes</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Séries</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Jogos</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Música</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Livros</a></li>
                    </ul>
                </div>

                {/* Coluna 4 - Redes e App */}
                <div>
                    <h3 className="font-bold text-lg mb-4">Siga nossas redes</h3>
                    <div className="flex gap-3 mb-6">
                        {/* Instagram */}
                        <a href="#" className="w-10 h-10 bg-white bg-opacity-10 rounded-lg flex items-center justify-center hover:bg-opacity-20 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                            </svg>
                        </a>
                        {/* TikTok */}
                        <a href="#" className="w-10 h-10 bg-white bg-opacity-10 rounded-lg flex items-center justify-center hover:bg-opacity-20 transition-colors">
                            <svg width="18" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.98a8.15 8.15 0 0 0 4.77 1.52V7.07a4.85 4.85 0 0 1-1-.38z"/>
                            </svg>
                        </a>
                    </div>

                    <h3 className="font-bold text-lg mb-4">Baixe o app</h3>
                    <div className="flex flex-col gap-3">
                        <a href="#" className="flex items-center gap-3 bg-white text-gray-900 rounded-full px-4 py-2 hover:bg-gray-100 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            <span className="text-sm font-medium">Disponível an App Store</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 bg-white text-gray-900 rounded-full px-4 py-2 hover:bg-gray-100 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-2.93-2.92L3.18 23.76z" fill="#EA4335"/>
                                <path d="M22.47 10.23l-2.98-1.72-3.31 3.31 3.31 3.31 3-.73c.86-.5.86-1.66-.02-2.17z" fill="#FBBC05"/>
                                <path d="M3.17.24C2.83.47 2.6.86 2.6 1.4v21.2c0 .54.23.93.57 1.16l12.67-12.67L3.17.24z" fill="#4285F4"/>
                                <path d="M16.17 12L3.17.24c.34-.23.78-.26 1.17-.04l13.17 7.59-3.34 3.21z" fill="#34A853"/>
                            </svg>
                            <span className="text-sm font-medium">Disponível no Google Play</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-purple-700 text-center">
                <p className="text-purple-300 text-xs">© 2026 OpiniOn — Todos os direitos reservados</p>
            </div>
        </footer>
    );
}