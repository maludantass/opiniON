import { Op } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { Jogo } from '../models/Jogo.js';
import { UserRating } from '../models/UserRating.js';
import { Post } from '../models/Post.js';
import { Lista } from '../models/Lista.js';

async function main() {
    await sequelize.authenticate();

    const ratings = await UserRating.destroy({ where: {} });
    const posts = await Post.update(
        { jogoId: null },
        { where: { jogoId: { [Op.ne]: null } } },
    );
    const listas = await Lista.update({ jogoIds: [] }, { where: {} });
    const jogos = await Jogo.destroy({ where: {} });

    console.log(`🧹 Limpeza concluída:`);
    console.log(`   ${jogos} jogos removidos`);
    console.log(`   ${ratings} ratings removidos`);
    console.log(`   ${posts[0]} posts desvinculados de jogos`);
    console.log(`   ${listas[0]} listas esvaziadas`);

    await sequelize.close();
}

main().catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
});
