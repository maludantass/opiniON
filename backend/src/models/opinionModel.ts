import pool from '../config/db';

// Neste arquivo você colocará as funções que interagem diretamente com o PostgreSQL
export const getLatestOpinion = async () => {
  try {
    // Exemplo de como seria a query:
    // const result = await pool.query('SELECT * FROM opinions ORDER BY id DESC LIMIT 1');
    // return result.rows[0];
    
    // Retorno simulado temporário para testar o fluxo antes da tabela existir
    return {
      id: 1,
      message: 'Olá do Backend! O fluxo React -> Express (MVC) está funcionando perfeitamente 🚀'
    };
  } catch (error) {
    console.error('Erro no OpinionModel:', error);
    throw error;
  }
};
