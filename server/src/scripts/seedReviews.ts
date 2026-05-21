import type { CreationAttributes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { Jogo } from '../models/Jogo.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';

const REVIEW_TEXTS = [
    'Uma obra-prima absoluta. Cada detalhe foi pensado com carinho e o resultado é simplesmente incrível. Recomendo demais!',
    'Fiquei completamente viciado desde a primeira hora. A trilha sonora então... dá arrepio. Um dos melhores que já joguei.',
    'A história me prendeu do começo ao fim. Os personagens têm profundidade de verdade e as escolhas realmente importam.',
    'Visualmente deslumbrante e com gameplay fluido. Só não dou nota máxima porque o final poderia ser mais elaborado.',
    'Experiência única. Mistura perfeitamente exploração, combate e narrativa. Difícil de largar depois que você começa.',
    'Jogo honesto e bem-feito. Não reinventa a roda, mas entrega o que promete com muita qualidade. Vale cada centavo.',
    'A mecânica principal é genial e simples ao mesmo tempo. Fácil de aprender, difícil de dominar — exatamente como deve ser.',
    'Superou minhas expectativas em tudo. Mundo aberto rico em detalhes, side quests interessantes e combate satisfatório.',
];

async function main() {
    console.log('🔌 Conectando ao banco...');
    await sequelize.authenticate();

    const existingPosts = await Post.count();
    if (existingPosts > 0) {
        console.log(`ℹ️  Já existem ${existingPosts} posts no banco. Seed ignorado.`);
        await sequelize.close();
        return;
    }

    const [users, jogos] = await Promise.all([
        User.findAll({ attributes: ['id'], limit: 20 }),
        Jogo.findAll({ attributes: ['id'], limit: 50 }),
    ]);

    if (users.length === 0) {
        console.error('❌ Nenhum usuário encontrado. Cadastre pelo menos um usuário antes de rodar este seed.');
        await sequelize.close();
        process.exit(1);
    }

    if (jogos.length === 0) {
        console.error('❌ Nenhum jogo encontrado. Rode npm run seed:games antes deste seed.');
        await sequelize.close();
        process.exit(1);
    }

    for (let i = 0; i < REVIEW_TEXTS.length; i++) {
        await Post.create({
            userId: users[i % users.length]!.id,
            jogoId: jogos[i % jogos.length]!.id,
            content: REVIEW_TEXTS[i]!,
            mediaUrl: null,
            mediaType: null,
        } as CreationAttributes<Post>);
    }

    const reviews = REVIEW_TEXTS;

    console.log(`🎮 ${reviews.length} reviews inseridas com sucesso!`);
    await sequelize.close();
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
