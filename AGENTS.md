# AGENTS.md — opiniON

Guia para agentes de IA trabalharem neste repositório. Leia este arquivo antes de implementar mudanças.

## O que é o projeto

**opiniON** é uma rede social focada em jogos: usuários avaliam jogos, descobrem compatibilidade com outros perfis, publicam posts no feed e acompanham estatísticas no dashboard.

Monorepo com dois pacotes independentes:

| Pacote   | Pasta     | Stack principal                                      |
|----------|-----------|------------------------------------------------------|
| Backend  | `server/` | Node 22, Express 5, TypeScript, Sequelize, PostgreSQL |
| Frontend | `client/` | React 19, Vite, TypeScript, Tailwind CSS 4           |

Node: versão em `.nvmrc` (22).

---

## Estrutura de pastas

```
opiniON/
├── AGENTS.md              ← este arquivo
├── client/
│   └── src/
│       ├── pages/         # rotas/páginas (Home, Login, Dashboard, …)
│       ├── components/    # UI reutilizável (Navbar, PrivateRoute, …)
│       ├── services/      # chamadas HTTP (api.ts)
│       └── App.tsx        # rotas React Router
└── server/
    └── src/
        ├── index.ts       # bootstrap (DB + listen)
        ├── app.ts         # Express app (CORS, JSON, rotas)
        ├── config/        # sequelize, jwt, db
        ├── models/        # entidades Sequelize
        ├── repositories/  # acesso a dados (thin layer)
        ├── services/      # regras de negócio e validação
        ├── controllers/   # HTTP handlers
        ├── routes/        # definição de endpoints
        ├── middleware/    # authJwt, etc.
        ├── errors/        # AppError
        ├── utils/         # HTTP, request, paginação, mappers, funções reutilizáveis
        ├── types/         # augment Express Request
        └── scripts/       # seeds (seedGames, seedReviews)
```

---

## Arquitetura do backend (camadas)

Fluxo obrigatório para novas features de API:

```
HTTP Request
    → Routes (classe *Routes, método register)
    → Controller (monta input do req, chama service, responde HTTP)
    → Service (validação, autorização, orquestração)
    → Repository (Sequelize: find/create/update/destroy)
    → Model (Sequelize Model + init*Model)
```

**Responsabilidades por camada**

| Camada       | Faz                                                                 | Não faz                                      |
|--------------|---------------------------------------------------------------------|----------------------------------------------|
| Controller   | Montar objeto de input do `req`; `try/catch`; `sendSuccess` / `handleError` | Validação; regra de negócio; `sendError` manual; `handleError` local |
| Service      | Validar input; regras de negócio; `AppError`; orquestrar repositories; DTOs | Conhecer `req`/`res`; SQL/Sequelize direto (usar repository) |
| Repository   | Encapsular `Model.findByPk`, `findAll`, `create`, `update`, `destroy` | Validação de negócio                         |
| Model        | Schema Sequelize + `*Attrs` + `init*Model(sequelize)`             | Lógica de aplicação                          |

Rotas são montadas em `OpinionRoutes`, que agrega sub-rotas sob o prefixo `/api`:

- `/api/users` — cadastro, login, perfil, follow (seguir / seguidores)
- `/api/jogos` — catálogo de jogos
- `/api/posts` — feed e CRUD de publicações
- `/api/compatibility` — ratings, compatibilidade, stats do dashboard

---

## Convenções TypeScript (server)

- **ESM**: `"type": "module"`; imports relativos **sempre com sufixo `.js`** (ex.: `from '../services/postService.js'`).
- **Strict**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- **Indentação**: 4 espaços (`.editorconfig`).
- **Classes de rota**: `export class FooRoutes { readonly router: Router; constructor() { … register(); } private register(): void { … } }`.
- **Controllers**: funções exportadas (`export const createPost = async …`); instância única do service no topo do arquivo.
- **Services**: classe com injeção opcional no construtor (`constructor(private readonly repo = new Repo())`).
- **Erros de domínio**: `throw new AppError('mensagem em português', statusCode)`.
- **Respostas HTTP**: usar `sendSuccess` / `sendError` de `utils/httpResponse.ts`.

### Formato padrão de resposta JSON

```json
// Sucesso
{ "success": true, "data": { ... } }

// Erro
{ "success": false, "error": "mensagem", "details": {} }
```

Status HTTP de sucesso: padrão **200**; passar status explícito só no controller quando necessário (ex.: **201** em criação).

---

## Controller — padrão obrigatório

Referência canônica: [`followController.ts`](server/src/controllers/followController.ts).

### Responsabilidade única

O controller é uma **ponte HTTP**: recebe `req`, monta um objeto de input, chama o service e devolve a resposta. Nada além disso.

### Estrutura de cada handler

Todo handler segue **apenas** este formato:

```typescript
export const followUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await followService.follow({
            followerId: req.authUserId,
            targetUserId: req.params['id'],
        });
        sendSuccess(res, data, 201); // 201 só quando a operação for criação
    } catch (error) {
        handleError(res, error);
    }
};
```

### O que o controller DEVE fazer

| Ação | Como |
|------|------|
| Montar input | Objeto literal com valores brutos de `req.params`, `req.query`, `req.body`, `req.authUserId` — **sem converter nem validar** |
| Chamar service | `await fooService.metodo(input)` |
| Sucesso | `sendSuccess(res, data)` ou `sendSuccess(res, data, 201)` para status específico |
| Erro | `handleError(res, error)` no `catch` |

### O que o controller NÃO DEVE fazer

- **Validação** — não usar `Number.isFinite`, `if (!id)`, checar campos obrigatórios do body.
- **Regra de negócio** — não decidir permissões, duplicatas, “já segue”, etc.
- **Auth explícita** — não fazer `if (authId === undefined) sendError(...)`; repassar `req.authUserId` ao service (que usa `requireAuthUserId`).
- **Helpers locais** — não definir `handleError`, `parseUserIdParam`, `parseListFilter` no arquivo do controller.
- **`sendError` direto** — erros sempre via `throw new AppError(...)` no service e `handleError` no catch.
- **Acesso a banco** — não importar models nem repositories.

### HTTP — usar apenas `utils/httpResponse.ts`

| Função | Uso |
|--------|-----|
| `sendSuccess(res, data)` | Resposta 200 com `{ success: true, data }` |
| `sendSuccess(res, data, 201)` | Quando o endpoint criar recurso (POST que persiste) |
| `handleError(res, error)` | No `catch`; trata `AppError` e erros inesperados (500) |

**Nunca** reimplementar `handleError` ou lógica de `AppError` no controller.

### Inputs tipados no service

O controller passa interfaces definidas no service (ex.: `FollowActionInput`, `FollowListInput`). Campos vindos da HTTP podem ser `unknown` até o service validar.

---

## Service — padrão obrigatório

Referência canônica: [`followService.ts`](server/src/services/followService.ts).

### Responsabilidade

Toda **validação**, **regra de negócio**, **autorização** e **montagem de DTO** de resposta ficam no service. O service não conhece Express (`req`/`res`).

### Fluxo típico de um método

1. Receber objeto de input (interface exportada).
2. Normalizar/validar com utils (`parseRouteId`, `requireAuthUserId`, `parsePaginationQuery`, `normalizePagination`).
3. Aplicar regras de domínio (`AppError` com mensagem em português).
4. Orquestrar repositories.
5. Retornar DTO público (nunca entidade crua com campos sensíveis).

### Validação e parsing HTTP

Usar helpers de [`utils/request.ts`](server/src/utils/request.ts) no **início** do método:

| Helper | Função |
|--------|--------|
| `parseRouteId(value)` | `req.params['id']` → `number`; inválido → `AppError` 400 |
| `requireAuthUserId(id)` | `req.authUserId` → `number`; ausente → `AppError` 401 |
| `parsePaginationQuery({ limit, offset })` | Monta filtro de query sem validar limites finais |

Limites de paginação: [`utils/pagination.ts`](server/src/utils/pagination.ts) → `normalizePagination(filter)`.

### Regras de negócio no service

- Lançar `throw new AppError('mensagem', statusCode)` — nunca retornar erro como objeto de sucesso.
- Autorização de recurso (ex.: só o dono edita) no service, não no controller.
- Constantes de limite no topo do arquivo (ex.: `MAX_CONTENT_LENGTH`).
- Funções privadas `normalize*` para validação de domínio (trim, URLs, enums).
- Funções `assert*` para invariantes (ex.: não seguir a si mesmo).

### DTOs e mappers — preferir `utils`

| Util | Quando usar |
|------|-------------|
| [`utils/publicUser.ts`](server/src/utils/publicUser.ts) → `toPublicProfileUser` | Perfil público (`id`, `username`, `avatarUrl`) |
| `toPublic*` no service | Campos específicos do domínio (post, jogo, compatibilidade) |

Mover para `utils` quando a função for **pura**, sem dependência de repository, e reutilizável entre services.

### O que extrair do service para `utils`

| Extrair | Manter no service |
|---------|-------------------|
| Paginação genérica (`normalizePagination`) | Orquestração de múltiplos repos |
| Mappers puros (`toPublicProfileUser`) | Regras “já segue”, “não encontrado”, permissões |
| Parsing HTTP (`parseRouteId`, `requireAuthUserId`) | Lógica que depende de estado no banco |

### O que NÃO colocar no service

- Imports de `Request` / `Response`.
- `sendSuccess`, `sendError`, `handleError`.
- Queries Sequelize inline — usar repository.

---

## Utils do backend (resumo)

| Arquivo | Conteúdo |
|---------|----------|
| `httpResponse.ts` | `sendSuccess`, `sendError`, `handleError` |
| `request.ts` | `parseRouteId`, `requireAuthUserId`, `parsePaginationQuery` |
| `pagination.ts` | `normalizePagination` |
| `publicUser.ts` | `toPublicProfileUser`, tipo `PublicProfileUser` |

### Padrão de model Sequelize

```typescript
export interface EntityAttrs { id: number; … }
export class Entity extends Model<EntityAttrs> implements EntityAttrs {
    declare id: number;
    // …
}
export function initEntityModel(sequelize: Sequelize): void {
    Entity.init({ … }, { sequelize, tableName: 'entities', timestamps: true });
}
```

Registrar novos models em `config/sequelize.ts` via `init*Model(sequelize)`. Follow: `setupUserFollowAssociations()` em `UserFollow.ts` e `setupUserFollowScopes()` em `User.ts` (nessa ordem, após os `init*`).

### Scopes do User (follow)

Associações (`belongsTo`, `belongsToMany`) em `UserFollow.ts`; scopes Sequelize em `User.ts` (`setupUserFollowScopes`):

| Scope | Include |
|-------|---------|
| `withFollowers` | usuários que seguem este perfil (`as: 'followers'`) |
| `withFollowing` | usuários que este perfil segue (`as: 'following'`) |
| `withFollowRelations` | ambos |

Uso no repositório: `User.scope('withFollowers').findByPk(id)` ou `userRepository.findByIdWithFollowers(id)`.

Listagens paginadas de seguidores/seguindo: preferir `UserFollowRepository` + `include` do par `follower`/`followed`, não carregar todos via scope em perfis grandes.

### Padrão de repository

- Uma classe por entidade (`PostRepository`, `UserRepository`, …).
- Métodos tipados com `FindOptions`, `CreationAttributes`, `Transaction` quando necessário.
- Sem lógica de negócio — apenas delegação ao Model.

---

## Autenticação

- Login/registro em `UserService`; JWT assinado com `sub` (user id) e `email`.
- Middleware `authJwt()` em `middleware/authJwt.ts`: header `Authorization: Bearer <token>`.
- Request estendido em `types/express/index.d.ts`: `authUserId`, `authUserEmail`.
- Segredos: `JWT_SECRET`, `JWT_EXPIRES_IN` (ver `config/jwt.ts`).
- Senhas: bcrypt; rounds de `BCRYPT_ROUNDS` (padrão 12).

---

## Banco de dados

- PostgreSQL via Sequelize (`config/sequelize.ts`).
- Variáveis: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.
- Dev: `sequelize.sync({ alter: true })` quando `NODE_ENV !== 'production'` (`index.ts`).
- Entidades atuais: `User`, `Jogo`, `Post`, `UserRating`, `UserFollow` (tabela `user_follows`).
- Follow: relação direcional `followerId` → `followedId`; índice único `(followerId, followedId)`; `ON DELETE CASCADE` nas FKs.

---

## Frontend (client)

### Organização

- **Páginas** (`pages/`): uma por rota principal; podem conter subcomponentes locais (ícones, cards).
- **Componentes** (`components/`): layout compartilhado (`Navbar`, `Footer`, `PrivateRoute`).
- **API** (`services/api.ts`): único lugar para `fetch`; tipos de resposta exportados junto das funções.

### Rotas (`App.tsx`)

| Path                    | Proteção      | Página                    |
|-------------------------|---------------|---------------------------|
| `/login`, `/cadastro`   | pública       | Login, Cadastro           |
| `/`, `/comunidade`, …   | `PrivateRoute`| Home, Comunidade, etc.    |
| `/publicacao`           | pública       | Publicacao                |

Auth no cliente: `localStorage.getItem('token')`; rotas privadas redirecionam para `/login`.

### Chamadas à API

- Base URL: `import.meta.env.VITE_API_URL` ou `http://localhost:3000/api`.
- Funções autenticadas recebem `token` e usam `authHeaders(token)`.
- Tratar `response.ok`; ler `result.data` em sucesso; mensagens de erro em português quando possível.
- **Nota**: alguns handlers antigos usam `result.message`; o backend padronizado retorna `result.error` — alinhar ao padrão `{ success, data | error }` ao criar código novo.

### UI

- Tailwind CSS (utility classes inline nos JSX).
- Feedback: `react-hot-toast` (`Toaster` no `App.tsx`).
- Indentação no client: em geral 2 espaços nos arquivos existentes; manter consistência com o arquivo editado.

---

## Clean Code — regras do projeto

1. **Mudança mínima**: alterar só o necessário; não refatorar arquivos inteiros sem pedido.
2. **Controller fino, service gordo**: controller só monta input e responde HTTP; service concentra inteligência (ver seções acima).
3. **Uma responsabilidade por camada**: não pular repository indo direto do service ao Model (exceto código legado a ser migrado).
4. **DRY com moderação**: funções puras e reutilizáveis em `utils/`; `normalize*` de domínio podem ficar no service.
5. **Nomes em inglês no código**; **mensagens de erro e UX em português**.
6. **Tipos explícitos** em interfaces de input/output (`FollowActionInput`, `CreatePostInput`, etc.).
7. **Sem segredos no repositório**: `.env` local; nunca commitar credenciais.
8. **Sem testes automáticos ainda** — não adicionar suíte grande salvo pedido; validar manualmente endpoints e fluxos UI.
9. **Comentários**: só para lógica não óbvia (ex.: algoritmo de compatibilidade); o código deve ser legível por si.

**Código legado** (`userController`, `postController`, etc.) pode ainda ter validação no controller — ao tocar nesses arquivos, alinhar ao padrão do `followController`.

---

## Checklist: nova entidade / endpoint

### Backend

1. `models/NovaEntidade.ts` — `Attrs`, class, `initNovaEntidadeModel`
2. Registrar em `config/sequelize.ts`
3. `repositories/novaEntidadeRepository.ts`
4. `services/novaEntidadeService.ts` — interfaces de input, validação via utils, `AppError`, DTO público
5. `controllers/novaEntidadeController.ts` — só `try/catch`, montar input, `sendSuccess`/`handleError` de `httpResponse.ts`
6. `routes/novaEntidadeRoutes.ts` — classe Routes
7. Montar em `routes/opinionRoutes.ts`: `this.router.use('/recurso', this.novaEntidadeRoutes.router)`
8. Proteger com `authJwt()` onde houver dado do usuário logado

### Frontend

1. Tipos e função em `services/api.ts`
2. Página ou integração em página existente
3. Rota em `App.tsx` se for nova tela
4. `PrivateRoute` se exigir login

---

## Comandos úteis

```bash
# Backend (em server/)
npm run dev          # tsx watch
npm run build && npm start
npm run seed:games
npm run seed:reviews

# Frontend (em client/)
npm run dev
npm run build
npm run lint
```

---

## Domínio resumido

- **Jogo**: título, tags, plataformas, imagem — catálogo para avaliar e exibir no feed.
- **UserRating**: nota, favorito, lista — base para compatibilidade (similaridade, tags em comum).
- **Post**: texto + mídia opcional; feed agrega autor e jogo associado.
- **Compatibility**: score entre usuários, distribuição, stats (jogo mais favoritado, tags, “primeiro amor”, etc.).
- **UserFollow**: um usuário segue outro; seguidores = linhas com `followedId` = id do perfil.

### Endpoints de follow (`/api/users`)

| Método | Rota | Auth |
|--------|------|------|
| `POST` | `/:id/follow` | JWT |
| `DELETE` | `/:id/follow` | JWT |
| `GET` | `/:id/follow-status` | JWT |
| `GET` | `/:id/followers` | — (paginado: `items`, `total`) |
| `GET` | `/:id/following` | — (paginado) |
| `GET` | `/:id/followers/include` | — (perfil + `followers` via scope) |
| `GET` | `/:id/following/include` | — (perfil + `following` via scope) |

---

## O que evitar

- Lógica de negócio ou validação em controllers.
- `handleError` / `parseUserIdParam` / checagem de auth duplicados em cada controller.
- `sendError` manual no controller em fluxo normal (usar `AppError` + `handleError`).
- Lógica de negócio em repositories.
- Expor `passwordHash` ou campos sensíveis nos DTOs.
- Imports sem `.js` no server.
- Criar rotas fora de `OpinionRoutes` sem atualizar `app.ts` (prefixo `/api` já está em `app.use('/api', opinionRoutes)`).
- `any` desnecessário; preferir tipos do Sequelize e interfaces locais.
- Commits, push ou mudanças em git config — só quando o usuário pedir explicitamente.

---

## Referência rápida de arquivos modelo

Ao implementar features similares, use como referência:

| Feature        | Model | Repository | Service | Controller | Routes |
|----------------|-------|------------|---------|------------|--------|
| Posts          | `models/Post.ts` | `postRepository.ts` | `postService.ts` | `postController.ts` | `postRoutes.ts` |
| Users          | `models/User.ts` | `userRepository.ts` | `userService.ts` | `userController.ts` | `userRoutes.ts` |
| Compatibilidade| `models/UserRating.ts` | `userRatingRepository.ts` | `compatibilityService.ts` | `compatibilityController.ts` | `compatibilityRoutes.ts` |
| Follow         | `models/UserFollow.ts` | `userFollowRepository.ts` | `followService.ts` | `followController.ts` | rotas em `userRoutes.ts` |

Este documento deve ser atualizado quando padrões arquiteturais mudarem de forma relevante.
