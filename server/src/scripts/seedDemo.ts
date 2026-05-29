import bcrypt from 'bcrypt';
import type { CreationAttributes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { Jogo } from '../models/Jogo.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { UserFollow } from '../models/UserFollow.js';
import { UserRating } from '../models/UserRating.js';

const DEMO_PASSWORD = 'demo123';

interface DemoUserSpec {
    email: string;
    username: string;
    avatarSeed: string;
}

const DEMO_USERS: DemoUserSpec[] = [
    { email: 'demo@opinion.com', username: 'demo_gamer', avatarSeed: 'demo_gamer' },
    { email: 'luna.rpg@opinion.com', username: 'LunaRPG', avatarSeed: 'LunaRPG' },
    { email: 'pixel.knight@opinion.com', username: 'PixelKnight', avatarSeed: 'PixelKnight' },
    { email: 'nova.stream@opinion.com', username: 'NovaStream', avatarSeed: 'NovaStream' },
    { email: 'retro.queen@opinion.com', username: 'RetroQueen', avatarSeed: 'RetroQueen' },
    { email: 'indie.soul@opinion.com', username: 'IndieSoul', avatarSeed: 'IndieSoul' },
    { email: 'fps.master@opinion.com', username: 'FPSMaster', avatarSeed: 'FPSMaster' },
    { email: 'cozy.gamer@opinion.com', username: 'CozyGamer', avatarSeed: 'CozyGamer' },
    { email: 'story.teller@opinion.com', username: 'StoryTeller', avatarSeed: 'StoryTeller' },
    { email: 'ranked.pro@opinion.com', username: 'RankedPro', avatarSeed: 'RankedPro' },
    { email: 'casual.fun@opinion.com', username: 'CasualFun', avatarSeed: 'CasualFun' },
    { email: 'speed.runner@opinion.com', username: 'SpeedRunner', avatarSeed: 'SpeedRunner' },
];

const REVIEW_POSTS = [
    'Uma obra-prima absoluta. Cada detalhe foi pensado com carinho e o resultado é simplesmente incrível. Recomendo demais!',
    'Fiquei completamente viciado desde a primeira hora. A trilha sonora então... dá arrepio. Um dos melhores que já joguei.',
    'A história me prendeu do começo ao fim. Os personagens têm profundidade de verdade e as escolhas realmente importam.',
    'Visualmente deslumbrante e com gameplay fluido. Só não dou nota máxima porque o final poderia ser mais elaborado.',
    'Experiência única. Mistura perfeitamente exploração, combate e narrativa. Difícil de largar depois que você começa.',
    'Jogo honesto e bem-feito. Não reinventa a roda, mas entrega o que promete com muita qualidade. Vale cada centavo.',
    'A mecânica principal é genial e simples ao mesmo tempo. Fácil de aprender, difícil de dominar — exatamente como deve ser.',
    'Superou minhas expectativas em tudo. Mundo aberto rico em detalhes, side quests interessantes e combate satisfatório.',
];

function avatarUrl(seed: string): string {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function monthsAgo(months: number, day = 15): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    d.setDate(day);
    d.setHours(12, 0, 0, 0);
    return d;
}

function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(10, 0, 0, 0);
    return d;
}

async function main(): Promise<void> {
    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();

    const jogos = await Jogo.findAll({ order: [['id', 'ASC']] });
    if (jogos.length < 30) {
        console.error('❌ Poucos jogos no banco. Rode npm run seed:games antes.');
        process.exit(1);
    }

    console.log('🧹 Limpando dados de demo anteriores...');
    await UserFollow.destroy({ where: {} });
    await Post.destroy({ where: {} });
    await UserRating.destroy({ where: {} });
    await User.destroy({ where: {} });

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    console.log('👤 Criando usuários...');
    const users = await User.bulkCreate(
        DEMO_USERS.map((u) => ({
            email: u.email,
            username: u.username,
            passwordHash,
            avatarUrl: avatarUrl(u.avatarSeed),
        })) as CreationAttributes<User>[],
    );

    const demo = users[0]!;
    const luna = users[1]!;
    const pixel = users[2]!;
    const nova = users[3]!;
    const retro = users[4]!;
    const indie = users[5]!;
    const fps = users[6]!;
    const cozy = users[7]!;
    const story = users[8]!;
    const ranked = users[9]!;
    const casual = users[10]!;
    const speed = users[11]!;

    const pick = (index: number) => jogos[index % jogos.length]!;

    // Jogo mais favoritado da plataforma (índice 0)
    const topGame = pick(0);
    const sharedFavGames = [pick(0), pick(1), pick(2), pick(3), pick(4)];
    const rareGames = [pick(25), pick(26), pick(27), pick(28)];
    const primeiroAmorGame = pick(5);

    type RatingRow = CreationAttributes<UserRating> & { createdAt?: Date; updatedAt?: Date };

    const ratingRows: RatingRow[] = [];

    // Demo — perfil rico para dashboard
    const demoRated = jogos.slice(0, 28);
    demoRated.forEach((jogo, i) => {
        const monthOffset = 17 - Math.floor(i * 0.65);
        ratingRows.push({
            userId: demo.id,
            jogoId: jogo.id,
            rating: (i % 5) + 1,
            favorited: i === 0 || i === 1 || i === 2 || i === 3 || sharedFavGames.some((g) => g.id === jogo.id) || rareGames.some((g) => g.id === jogo.id),
            listed: i === 6 || i === 7 || i === 8 || i === 9,
            createdAt: jogo.id === primeiroAmorGame.id ? monthsAgo(18, 3) : monthsAgo(Math.max(0, monthOffset)),
            updatedAt: monthsAgo(Math.max(0, monthOffset)),
        });
    });

    // Pico de atividade no mês atual
    for (let i = 0; i < 6; i++) {
        const jogo = pick(30 + i);
        ratingRows.push({
            userId: demo.id,
            jogoId: jogo.id,
            rating: 4 + (i % 2),
            favorited: i < 2,
            listed: false,
            createdAt: daysAgo(i + 1),
            updatedAt: daysAgo(i + 1),
        });
    }

    // Luna — alta compatibilidade com demo
    sharedFavGames.forEach((jogo, i) => {
        ratingRows.push({
            userId: luna.id,
            jogoId: jogo.id,
            rating: 4 + (i % 2),
            favorited: true,
            listed: i < 2,
            createdAt: monthsAgo(4 + i),
            updatedAt: monthsAgo(4 + i),
        });
    });
    jogos.slice(0, 18).forEach((jogo, i) => {
        if (sharedFavGames.some((g) => g.id === jogo.id)) return;
        ratingRows.push({
            userId: luna.id,
            jogoId: jogo.id,
            rating: 3 + (i % 3),
            favorited: false,
            listed: i % 4 === 0,
            createdAt: monthsAgo(6 + (i % 8)),
            updatedAt: monthsAgo(6 + (i % 8)),
        });
    });

    // Outros usuários — compatibilidade variada + favoritos globais
    const others = [pixel, nova, retro, indie, fps, cozy, story, ranked, casual, speed];
    others.forEach((user, userIdx) => {
        const sliceStart = userIdx * 3;
        const userGames = jogos.slice(sliceStart, sliceStart + 12);

        userGames.forEach((jogo, i) => {
            const alsoTop = i === 0 || (userIdx < 6 && i === 1);
            ratingRows.push({
                userId: user.id,
                jogoId: jogo.id,
                rating: 2 + ((userIdx + i) % 4),
                favorited: alsoTop || (userIdx === 0 && sharedFavGames.some((g) => g.id === jogo.id)),
                listed: i % 5 === 0,
                createdAt: monthsAgo(2 + ((userIdx + i) % 10)),
                updatedAt: monthsAgo(2 + ((userIdx + i) % 10)),
            });
        });

        if (userIdx < 6) {
            ratingRows.push({
                userId: user.id,
                jogoId: topGame.id,
                rating: 5,
                favorited: true,
                listed: false,
                createdAt: monthsAgo(1),
                updatedAt: monthsAgo(1),
            });
        }
    });

    console.log('⭐ Inserindo avaliações...');
    await UserRating.bulkCreate(ratingRows, { ignoreDuplicates: true });

    console.log('📝 Inserindo reviews da semana...');
    const postUsers = [luna, pixel, nova, retro, indie, story, cozy, fps];
    await Post.bulkCreate(
        REVIEW_POSTS.map((content, i) => ({
            userId: postUsers[i]!.id,
            jogoId: pick(i + 2).id,
            content,
            mediaUrl: null,
            mediaType: null,
            createdAt: daysAgo(i % 6),
            updatedAt: daysAgo(i % 6),
        })) as CreationAttributes<Post>[],
    );

    console.log('🤝 Criando relações de follow...');
    const followRows: CreationAttributes<UserFollow>[] = [
        { followerId: demo.id, followedId: luna.id },
        { followerId: demo.id, followedId: pixel.id },
        { followerId: pixel.id, followedId: demo.id },
        { followerId: nova.id, followedId: demo.id },
        { followerId: retro.id, followedId: demo.id },
        { followerId: indie.id, followedId: demo.id },
        { followerId: cozy.id, followedId: demo.id },
        { followerId: luna.id, followedId: pixel.id },
        { followerId: luna.id, followedId: nova.id },
        { followerId: story.id, followedId: luna.id },
        { followerId: ranked.id, followedId: luna.id },
        { followerId: casual.id, followedId: luna.id },
        { followerId: speed.id, followedId: luna.id },
    ];
    await UserFollow.bulkCreate(followRows, { ignoreDuplicates: true });

    console.log('\n✅ Demo pronta para capturas de tela!\n');
    console.log('Conta principal (use para login):');
    console.log(`  Email:    ${demo.email}`);
    console.log(`  Senha:    ${DEMO_PASSWORD}`);
    console.log('\nTelas sugeridas:');
    console.log('  /              → Home (jogos, reviews da semana, Conheça mais gamers)');
    console.log('  /dashboard     → Dashboard analítico com gráficos reais');
    console.log('  /comunidade    → Usuários compatíveis');
    console.log(`  /comunidade/${luna.id}  → Detalhe + botão Seguir/Deixar de seguir`);
    console.log(`  /comunidade/${pixel.id} → Perfil para testar "Seguir"`);
    console.log('  /publicacao    → Tela de adicionar jogos');
    console.log('\nJogo mais favoritado:', topGame.title);
    console.log('Primeiro amor (demo):', primeiroAmorGame.title);

    await sequelize.close();
}

main().catch((err: unknown) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
