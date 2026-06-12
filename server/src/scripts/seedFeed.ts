import bcrypt from 'bcrypt';
import type { CreationAttributes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { Jogo } from '../models/Jogo.js';
import { Post } from '../models/Post.js';
import { PostComment } from '../models/PostComment.js';
import { PostLike } from '../models/PostLike.js';
import { User } from '../models/User.js';
import { UserFollow } from '../models/UserFollow.js';

const SEED_PASSWORD = '123456';

const USERS = [
    { username: 'Ana Luísa', email: 'ana@opinon.dev' },
    { username: 'Pedro Lins', email: 'pedro@opinon.dev' },
    { username: 'Gustavo', email: 'gustavo@opinon.dev' },
    { username: 'Laura S.', email: 'laura@opinon.dev' },
    { username: 'Luca Peter', email: 'luca@opinon.dev' },
    { username: 'Mariana', email: 'mariana@opinon.dev' },
];

const REVIEW_TEXTS = [
    'Uma obra-prima absoluta. Cada detalhe foi pensado com carinho e o resultado é simplesmente incrível.',
    'Fiquei completamente viciado desde a primeira hora. A trilha sonora então... dá arrepio.',
    'A história me prendeu do começo ao fim. Os personagens têm profundidade de verdade.',
    'Visualmente deslumbrante e com gameplay fluido. Recomendo demais!',
    'Experiência única. Mistura perfeitamente exploração, combate e narrativa.',
    'Jogo honesto e bem-feito. Entrega o que promete com muita qualidade.',
    'A mecânica principal é genial. Fácil de aprender, difícil de dominar.',
    'Superou minhas expectativas. Mundo aberto rico em detalhes e combate satisfatório.',
    'Não consigo parar de jogar. Cada sessão rende uma descoberta nova.',
    'Top 3 da minha vida gamer. Já zerei duas vezes e quero a terceira.',
    'Indie que parece AAA. Arte, som e design impecáveis.',
    'Multijogador viciante — chamei os amigos e virou tradição de sexta.',
];

const COMMENT_TEXTS = [
    'Concordo totalmente! Também amei essa parte.',
    'Boa review! Você chegou no boss final?',
    'Esse jogo merece mais reconhecimento.',
    'Tô na mesma! A trilha sonora é sensacional.',
    'Quero jogar agora depois de ler isso 😄',
    'Discordo um pouco do final, mas o resto é 10/10.',
    'Qual build você usou? Quero dicas!',
    'Salvei aqui pra comprar na promo.',
    'Joguei no co-op com amigos — experiência ainda melhor.',
    'Esse é meu favorito do ano também.',
    'Você viu o DLC? Vale a pena?',
    'Review perfeita, não tenho o que acrescentar.',
    'Tô no capítulo 3, sem spoilers por favor 🙏',
    'A comunidade desse jogo é muito acolhedora.',
    'Preciso voltar a zerar, faz tempo que não jogo.',
];

function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(10 + (days % 8), 0, 0, 0);
    return d;
}

async function main(): Promise<void> {
    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    console.log('👤 Garantindo usuários de teste...');
    const users: User[] = [];
    for (const spec of USERS) {
        let user = await User.findOne({ where: { email: spec.email } });
        if (!user) {
            user = await User.create({
                username: spec.username,
                email: spec.email,
                passwordHash,
            } as CreationAttributes<User>);
            console.log(`   + ${spec.email}`);
        }
        users.push(user);
    }

    const jogos = await Jogo.findAll({ attributes: ['id'], order: [['id', 'ASC']], limit: 30 });
    if (jogos.length === 0) {
        console.error('❌ Nenhum jogo no banco. Rode npm run seed:games antes.');
        process.exit(1);
    }

    let postCount = await Post.count();
    if (postCount < 12) {
        console.log('📝 Criando publicações de teste...');
        const postsToCreate: CreationAttributes<Post>[] = [];
        for (let i = 0; i < 12; i++) {
            postsToCreate.push({
                userId: users[i % users.length]!.id,
                jogoId: jogos[i % jogos.length]!.id,
                content: REVIEW_TEXTS[i % REVIEW_TEXTS.length]!,
                mediaUrl: null,
                mediaType: null,
                createdAt: daysAgo(i % 7),
                updatedAt: daysAgo(i % 7),
            });
        }
        await Post.bulkCreate(postsToCreate);
        postCount = await Post.count();
        console.log(`   ${postsToCreate.length} posts criados (total: ${postCount}).`);
    } else {
        console.log(`ℹ️  Posts já existem (${postCount}), pulando criação.`);
    }

    const followCount = await UserFollow.count();
    if (followCount === 0) {
        console.log('🤝 Criando relações de follow...');
        const follows: CreationAttributes<UserFollow>[] = [];
        for (const follower of users) {
            const others = users.filter((u) => u.id !== follower.id).sort(() => Math.random() - 0.5);
            const toFollow = others.slice(0, 3);
            for (const followed of toFollow) {
                follows.push({ followerId: follower.id, followedId: followed.id });
            }
        }
        await UserFollow.bulkCreate(follows, { ignoreDuplicates: true });
        console.log(`   ${follows.length} follows criados.`);
    } else {
        console.log(`ℹ️  Follows já existem (${followCount}), pulando.`);
    }

    const posts = await Post.findAll({ order: [['id', 'ASC']], limit: 12 });
    const likeCount = await PostLike.count();
    if (likeCount === 0 && posts.length > 0) {
        console.log('❤️  Criando curtidas de teste...');
        const likes: CreationAttributes<PostLike>[] = [];
        for (const post of posts) {
            const likers = users.filter((u) => u.id !== post.userId).slice(0, 2 + (post.id % 3));
            for (const liker of likers) {
                likes.push({ userId: liker.id, postId: post.id });
            }
        }
        await PostLike.bulkCreate(likes, { ignoreDuplicates: true });
        console.log(`   ${likes.length} curtidas criadas.`);
    }

    let commentCount = await PostComment.count();
    if (commentCount < 30) {
        console.log('💬 Criando comentários de teste...');
        const comments: CreationAttributes<PostComment>[] = [];
        let textIdx = 0;
        for (const post of posts) {
            const numComments = 2 + (post.id % 4);
            const commenters = users.filter((u) => u.id !== post.userId).sort(() => Math.random() - 0.5);
            for (let c = 0; c < numComments && c < commenters.length; c++) {
                comments.push({
                    userId: commenters[c]!.id,
                    postId: post.id,
                    content: COMMENT_TEXTS[textIdx % COMMENT_TEXTS.length]!,
                    createdAt: daysAgo(c + 1),
                    updatedAt: daysAgo(c + 1),
                });
                textIdx++;
            }
        }
        await PostComment.bulkCreate(comments, { ignoreDuplicates: true });
        commentCount = await PostComment.count();
        console.log(`   ${comments.length} comentários criados (total: ${commentCount}).`);
    } else {
        console.log(`ℹ️  Comentários já existem (${commentCount}), pulando.`);
    }

    console.log('\n✅ Feed de teste pronto!');
    console.log('   Faça login com qualquer conta abaixo (senha: 123456):');
    for (const u of USERS) {
        console.log(`   ${u.email}`);
    }
    console.log('\n   Acesse /feed para ver postagens de quem você segue.');

    await sequelize.close();
}

main().catch((err: unknown) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
