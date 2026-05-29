import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
} from 'framer-motion';
import Navbar from '../components/Navbar';
import { BookmarkIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  getSwiperNext,
  postSwiperSwipe,
  type Jogo,
  type SwipeAction,
} from '../services/api';
import toast from 'react-hot-toast';

type Phase = 'landing' | 'playing' | 'finished';
type ExitDirection = 'left' | 'right' | null;

const SWIPE_THRESHOLD = 120;
const EXIT_ANIMATION_MS = 350;

function SwiperBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 120% 100% at 50% 100%, #FFB347 0%, #FF6B35 35%, #C1121F 65%, #780000 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.35) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
        }}
      />
      {children}
    </div>
  );
}

function GameCover({ jogo, expanded }: { jogo: Jogo; expanded: boolean }) {
  if (jogo.imageUrl) {
    return (
      <img
        src={jogo.imageUrl}
        alt={jogo.title}
        className={`w-full object-cover transition-all duration-300 ${
          expanded ? 'h-72 sm:h-80' : 'h-56 sm:h-64'
        }`}
      />
    );
  }

  return (
    <div
      className={`w-full bg-gradient-to-br from-sky-300 via-blue-400 to-amber-300 transition-all duration-300 ${
        expanded ? 'h-72 sm:h-80' : 'h-56 sm:h-64'
      }`}
    />
  );
}

function shortDescription(description: string | null): string {
  if (!description) return 'Descubra se esse jogo combina com você!';
  const firstSentence = description.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 80) return `${firstSentence}.`;
  return description.length > 80 ? `${description.slice(0, 77)}...` : description;
}

function SwipeGameCard({
  jogo,
  expanded,
  onToggleExpand,
  exitDirection,
  onDragEnd,
  disabled,
}: {
  jogo: Jogo;
  expanded: boolean;
  onToggleExpand: () => void;
  exitDirection: ExitDirection;
  onDragEnd: (direction: 'left' | 'right') => void;
  disabled: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const passOpacity = useTransform(x, [-120, -40, 0], [1, 0.4, 0]);
  const saveOpacity = useTransform(x, [0, 40, 120], [0, 0.4, 1]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled || expanded) return;
    if (info.offset.x > SWIPE_THRESHOLD) onDragEnd('right');
    else if (info.offset.x < -SWIPE_THRESHOLD) onDragEnd('left');
  };

  const exitAnimate =
    exitDirection === 'left'
      ? { x: -600, rotate: -25, opacity: 0 }
      : exitDirection === 'right'
        ? { x: 600, rotate: 25, opacity: 0 }
        : { x: 0, rotate: 0, opacity: 1 };

  return (
    <motion.div
      className="relative w-full max-w-[340px]"
      style={{ x, rotate }}
      drag={!disabled && !expanded && !exitDirection ? 'x' : false}
      dragElastic={0.85}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitAnimate}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      {!expanded && !exitDirection && (
        <>
          <motion.div
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute left-4 top-6 z-10 rounded-lg border-4 border-red-500 px-3 py-1 text-lg font-bold uppercase tracking-wider text-red-500"
          >
            X
          </motion.div>
          <motion.div
            style={{ opacity: saveOpacity }}
            className="pointer-events-none absolute right-4 top-6 z-10 rounded-lg border-4 border-[#6C3BFF] px-3 py-1 text-lg font-bold uppercase tracking-wider text-[#6C3BFF]"
          >
            Salvar
          </motion.div>
        </>
      )}

      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative">
          <GameCover jogo={jogo} expanded={expanded} />
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={expanded ? 'Recolher card' : 'Expandir card'}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md transition hover:scale-105"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div className={`bg-white px-5 transition-all duration-300 ${expanded ? 'pb-6 pt-4' : 'py-4'}`}>
          <h2 className="text-xl font-bold text-gray-900">{jogo.title}</h2>
          <p
            className={`mt-2 text-sm leading-relaxed text-gray-600 ${
              expanded ? '' : 'line-clamp-2'
            }`}
          >
            {expanded
              ? jogo.description || 'Sem descrição disponível para este jogo.'
              : shortDescription(jogo.description)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <SwiperBackground>
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          Pronto pra descobrir que obras combinam com você?
        </h1>

        <button
          type="button"
          onClick={onStart}
          className="mt-10 rounded-full bg-[#EEEEFF] px-10 py-3.5 text-base font-semibold text-[#6C3BFF] shadow-lg transition hover:scale-105 hover:bg-white active:scale-95"
        >
          Iniciar Swiper
        </button>
      </div>
    </SwiperBackground>
  );
}

export default function Swipe() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('landing');
  const [currentJogo, setCurrentJogo] = useState<Jogo | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadNext = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getSwiperNext(token);
      setCurrentJogo(data.jogo);
      setRemaining(data.remaining);
      if (!data.jogo) setPhase('finished');
    } catch {
      toast.error('Erro ao carregar próximo jogo');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleStart = () => {
    setPhase('playing');
    setExpanded(false);
    setExitDirection(null);
    loadNext();
  };

  const performSwipe = useCallback(
    async (action: SwipeAction) => {
      if (!token || !currentJogo || isProcessing) return;

      setIsProcessing(true);
      setExpanded(false);
      setExitDirection(action === 'pass' ? 'left' : 'right');

      await new Promise((resolve) => setTimeout(resolve, EXIT_ANIMATION_MS));

      try {
        await postSwiperSwipe(token, currentJogo.id, action);
        if (action === 'favorite') toast.success('Jogo salvo!');
      } catch {
        toast.error('Erro ao registrar swipe');
        setExitDirection(null);
        setIsProcessing(false);
        return;
      }

      setExitDirection(null);
      setIsProcessing(false);
      await loadNext();
    },
    [token, currentJogo, isProcessing, loadNext],
  );

  useEffect(() => {
    setExpanded(false);
  }, [currentJogo?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-[#EEEEFF]">
      <Navbar />

      {phase === 'landing' && <LandingView onStart={handleStart} />}

      {phase === 'playing' && (
        <SwiperBackground>
          <button
            type="button"
            onClick={() => {
              setPhase('landing');
              setCurrentJogo(null);
              setExitDirection(null);
            }}
            aria-label="Fechar swiper"
            className="absolute left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition hover:scale-105"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
            {loading && !currentJogo ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-64 w-[340px] animate-pulse rounded-3xl bg-white/20" />
                <p className="text-sm font-medium text-white/80">Carregando jogos...</p>
              </div>
            ) : currentJogo ? (
              <>
                <AnimatePresence mode="wait">
                  <SwipeGameCard
                    key={currentJogo.id}
                    jogo={currentJogo}
                    expanded={expanded}
                    onToggleExpand={() => setExpanded((v) => !v)}
                    exitDirection={exitDirection}
                    onDragEnd={(dir) => performSwipe(dir === 'left' ? 'pass' : 'favorite')}
                    disabled={isProcessing}
                  />
                </AnimatePresence>

                {!expanded && (
                  <div className="mt-8 flex items-center gap-10">
                    <button
                      type="button"
                      onClick={() => performSwipe('pass')}
                      disabled={isProcessing}
                      aria-label="Rejeitar jogo"
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6C3BFF] text-white shadow-lg transition hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => performSwipe('favorite')}
                      disabled={isProcessing}
                      aria-label="Salvar jogo"
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6C3BFF] text-white shadow-lg transition hover:scale-110 active:scale-95 disabled:opacity-50 [&_svg]:h-7 [&_svg]:w-7"
                    >
                      <BookmarkIcon filled />
                    </button>
                  </div>
                )}

                <p className="mt-6 text-sm font-medium text-white/70">
                  {remaining > 0 ? `${remaining} jogos restantes` : 'Último jogo!'}
                </p>
              </>
            ) : null}
          </div>
        </SwiperBackground>
      )}

      {phase === 'finished' && (
        <SwiperBackground>
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <h2 className="text-3xl font-bold text-white">Você viu todos os jogos!</h2>
            <p className="mt-4 max-w-md text-white/80">
              Volte mais tarde para descobrir novos títulos ou explore a comunidade.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full bg-[#EEEEFF] px-8 py-3 font-semibold text-[#6C3BFF] transition hover:scale-105"
              >
                Ir para Home
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="rounded-full border-2 border-white/60 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </SwiperBackground>
      )}
    </div>
  );
}
