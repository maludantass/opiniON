import bcrypt from 'bcrypt';
import type { CreationAttributes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { Jogo } from '../models/Jogo.js';
import { User } from '../models/User.js';
import { UserFollow } from '../models/UserFollow.js';
import { UserRating } from '../models/UserRating.js';

const JOGOS = [
    { title: 'Red Dead Redemption II', description: 'Épico de mundo aberto no velho oeste.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg', tags: ['Aventura', 'Mundo Aberto', 'Narrativa', 'Ação'], platforms: ['Windows'], releaseYear: 2019 },
    { title: 'The Witcher 3: Wild Hunt', description: 'RPG de mundo aberto com escolhas morais profundas.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg', tags: ['RPG', 'Mundo Aberto', 'Fantasia', 'Narrativa'], platforms: ['Windows', 'macOS', 'Linux'], releaseYear: 2015 },
    { title: 'Hollow Knight', description: 'Metroidvania desafiador em um reino de insetos.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg', tags: ['Indie', 'Metroidvania', 'Plataforma', 'Difícil'], platforms: ['Windows', 'macOS', 'Linux'], releaseYear: 2017 },
    { title: 'Fortnite', description: 'Battle royale com construção e eventos sazonais.', imageUrl: 'https://cdn2.unrealengine.com/fortnite-chapter-5-season-og-1920x1080-6ebdf19a83ee.jpg', tags: ['Battle Royale', 'Shooter', 'Multiplayer', 'Free to Play'], platforms: ['Windows'], releaseYear: 2017 },
    { title: 'Grand Theft Auto V', description: 'Mundo aberto criminoso em Los Santos.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg', tags: ['Mundo Aberto', 'Ação', 'Multiplayer', 'Crime'], platforms: ['Windows'], releaseYear: 2015 },
    { title: 'Street Fighter 6', description: 'Luta clássica modernizada com modo World Tour.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1364780/header.jpg', tags: ['Luta', 'Arcada', 'Multiplayer', 'Competitivo'], platforms: ['Windows'], releaseYear: 2023 },
    { title: 'Candy Crush Saga', description: 'Puzzle casual de combinar doces.', imageUrl: 'https://play-lh.googleusercontent.com/o8NaXFMDNGCdMG5ZEVv1LpLEJXkJMpFuCaijRQpQT8s18qPPlYHl8oJ9XFGM63F4WA', tags: ['Casual', 'Puzzle', 'Mobile', 'Free to Play'], platforms: ['Windows'], releaseYear: 2012 },
    { title: 'Minecraft', description: 'Sandbox de construção e sobrevivência infinita.', imageUrl: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/MC_The-Wild-Update_540x300.jpg', tags: ['Sandbox', 'Sobrevivência', 'Mundo Aberto', 'Multiplayer'], platforms: ['Windows', 'macOS', 'Linux'], releaseYear: 2011 },
    { title: 'Celeste', description: 'Plataforma preciso com história sobre saúde mental.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/504230/header.jpg', tags: ['Indie', 'Plataforma', 'Difícil', 'Narrativa'], platforms: ['Windows', 'macOS', 'Linux'], releaseYear: 2018 },
    { title: 'Among Us', description: 'Jogo de dedução social no espaço.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/945360/header.jpg', tags: ['Multiplayer', 'Social', 'Dedução', 'Casual'], platforms: ['Windows'], releaseYear: 2018 },
    { title: 'Elden Ring', description: 'Soulslike de mundo aberto do criador de Dark Souls.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg', tags: ['RPG', 'Mundo Aberto', 'Difícil', 'Fantasia'], platforms: ['Windows'], releaseYear: 2022 },
    { title: 'Stardew Valley', description: 'Simulador de fazenda relaxante com muito conteúdo.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg', tags: ['Simulação', 'RPG', 'Casual', 'Indie'], platforms: ['Windows', 'macOS', 'Linux'], releaseYear: 2016 },
    { title: 'Cyberpunk 2077', description: 'RPG de ficção científica em Night City.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg', tags: ['RPG', 'Mundo Aberto', 'Ficção Científica', 'Ação'], platforms: ['Windows'], releaseYear: 2020 },
    { title: 'Apex Legends', description: 'Battle royale por equipes com habilidades únicas.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1172470/header.jpg', tags: ['Battle Royale', 'Shooter', 'Multiplayer', 'Free to Play'], platforms: ['Windows'], releaseYear: 2019 },
    { title: 'Hades', description: 'Roguelike de ação com narrativa reativa brilhante.', imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg', tags: ['Roguelike', 'Ação', 'Indie', 'Narrativa'], platforms: ['Windows', 'macOS', 'Linux'], releaseYear: 2020 },
];

const USERS: { username: string; email: string; password: string }[] = [
    { username: 'Ana Luísa',    email: 'ana@opinon.dev',     password: '123456' },
    { username: 'Pedro Lins',   email: 'pedro@opinon.dev',   password: '123456' },
    { username: 'Gustavo',      email: 'gustavo@opinon.dev', password: '123456' },
    { username: 'Laura S.',     email: 'laura@opinon.dev',   password: '123456' },
    { username: 'Luca Peter',   email: 'luca@opinon.dev',    password: '123456' },
    { username: 'Mariana',      email: 'mariana@opinon.dev', password: '123456' },
];

async function main() {
    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // ── Jogos ───────────────────────────────────────────────────────────────
    const jogoCount = await Jogo.count();
    if (jogoCount === 0) {
        await Jogo.bulkCreate(JOGOS as CreationAttributes<Jogo>[]);
        console.log(`🎮 ${JOGOS.length} jogos inseridos.`);
    } else {
        console.log(`ℹ️  Jogos já existem (${jogoCount}), pulando.`);
    }

    // ── Usuários seed ────────────────────────────────────────────────────────
    let criados = 0;
    for (const u of USERS) {
        const existing = await User.findOne({ where: { email: u.email } });
        if (existing) continue;
        const passwordHash = await bcrypt.hash(u.password, 10);
        await User.create({ username: u.username, email: u.email, passwordHash } as CreationAttributes<User>);
        criados++;
    }
    if (criados > 0) {
        console.log(`👤 ${criados} usuários seed inseridos (senha: 123456).`);
    } else {
        console.log(`ℹ️  Usuários seed já existem.`);
    }

    // ── Ratings — adiciona para qualquer usuário sem avaliações ─────────────
    const allUsers = await User.findAll({ attributes: ['id'] });
    const jogos = await Jogo.findAll({ attributes: ['id'] });
    const ratings: CreationAttributes<UserRating>[] = [];

    for (const user of allUsers) {
        const existingCount = await UserRating.count({ where: { userId: user.id } });
        if (existingCount > 0) continue;

        const shuffled = [...jogos].sort(() => Math.random() - 0.5);
        const sample = shuffled.slice(0, 6 + Math.floor(Math.random() * 5));
        for (const jogo of sample) {
            ratings.push({
                userId: user.id,
                jogoId: jogo.id,
                rating: (Math.floor(Math.random() * 4) + 2) as 1 | 2 | 3 | 4 | 5,
                favorited: Math.random() > 0.6,
                listed: Math.random() > 0.5,
            } as CreationAttributes<UserRating>);
        }
    }

    if (ratings.length > 0) {
        await UserRating.bulkCreate(ratings, { ignoreDuplicates: true });
        console.log(`⭐ ${ratings.length} avaliações inseridas para ${allUsers.length} usuário(s).`);
    } else {
        console.log(`ℹ️  Todos os usuários já têm avaliações.`);
    }

    // ── Follows ─────────────────────────────────────────────────────────────
    const followCount = await UserFollow.count();
    if (followCount === 0) {
        const follows: CreationAttributes<UserFollow>[] = [];
        for (const follower of allUsers) {
            // cada usuário segue entre 2 e 4 outros aleatoriamente
            const others = allUsers.filter(u => u.id !== follower.id).sort(() => Math.random() - 0.5);
            const toFollow = others.slice(0, 2 + Math.floor(Math.random() * 3));
            for (const followed of toFollow) {
                follows.push({ followerId: follower.id, followedId: followed.id } as CreationAttributes<UserFollow>);
            }
        }
        await UserFollow.bulkCreate(follows, { ignoreDuplicates: true });
        console.log(`👥 ${follows.length} follows inseridos.`);
    } else {
        console.log(`ℹ️  Follows já existem (${followCount}), pulando.`);
    }

    console.log('\n✅ Seed concluído!');
    console.log('   Crie sua conta em /cadastro ou use um dos usuários criados:');
    for (const u of USERS) {
        console.log(`   ${u.email} / ${u.password}`);
    }

    await sequelize.close();
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
