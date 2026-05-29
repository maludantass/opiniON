import { sequelize } from '../config/sequelize.js';
import { Community } from '../models/Community.js';
import { CommunityMember } from '../models/CommunityMember.js';
import { Post } from '../models/Post.js';
import { PostLike } from '../models/PostLike.js';
import { User } from '../models/User.js';

async function main() {
    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();

    const [users, posts] = await Promise.all([
        User.findAll({ attributes: ['id'] }),
        Post.findAll({ attributes: ['id', 'userId'] }),
    ]);

    if (users.length === 0 || posts.length === 0) {
        console.error('❌ Rode seed:dev e seed:reviews antes deste script.');
        await sequelize.close();
        process.exit(1);
    }

    // PostLikes: cada usuário curte posts que não são seus
    let likesCount = 0;
    for (const post of posts) {
        const likers = users.filter(u => u.id !== post.userId);
        for (const liker of likers) {
            await PostLike.findOrCreate({ where: { userId: liker.id, postId: post.id } });
            likesCount++;
        }
    }
    console.log(`❤️  ${likesCount} curtidas inseridas.`);

    // Comunidades
    const existingCommunities = await Community.count();
    if (existingCommunities === 0) {
        const owner1 = users[0]!;
        const owner2 = users[1]!;

        const [c1, c2, c3] = await Promise.all([
            Community.create({
                name: 'Souls & Desafios',
                description: 'Para quem curte jogos difíceis e ama sofrer (com estilo).',
                imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
                type: 'public',
                inviteCode: null,
                ownerId: owner1.id,
                tags: ['Difícil', 'RPG', 'Ação'],
                games: ['Elden Ring', 'Hollow Knight', 'Celeste'],
            }),
            Community.create({
                name: 'Mundo Aberto FC',
                description: 'Amantes de open world de todos os estilos.',
                imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg',
                type: 'public',
                inviteCode: null,
                ownerId: owner2.id,
                tags: ['Mundo Aberto', 'Aventura', 'RPG'],
                games: ['Red Dead Redemption II', 'The Witcher 3', 'GTA V'],
            }),
            Community.create({
                name: 'Indie Lovers',
                description: 'Descobrindo as joias independentes do mundo dos games.',
                imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg',
                type: 'public',
                inviteCode: null,
                ownerId: users[2]!.id,
                tags: ['Indie', 'Casual', 'Narrativa'],
                games: ['Hollow Knight', 'Celeste', 'Stardew Valley', 'Hades'],
            }),
        ]);

        // Adicionar membros às comunidades
        const communities = [c1, c2, c3];
        for (const community of communities) {
            for (const user of users) {
                await CommunityMember.findOrCreate({
                    where: { communityId: community.id, userId: user.id },
                    defaults: { status: 'active' } as any,
                });
            }
        }

        console.log(`🏘️  3 comunidades criadas com ${users.length} membros cada.`);
    } else {
        console.log(`ℹ️  Comunidades já existem (${existingCommunities}). Pulando.`);
    }

    console.log('✅ Seed extra concluído!');
    await sequelize.close();
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
