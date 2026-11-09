# Bibliotech Remake

Frontend da biblioteca escolar da ETEC Raposo Tavares. A aplicação oferece catálogo público, área do leitor e gestão administrativa com dados demonstrativos.

## Executar

Requer Node.js 22.13+ ou 24 LTS e npm.

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

Abra o endereço local informado pelo Vite. Em produção, configure o servidor estático para servir `index.html` nas rotas da SPA.

| Perfil | E-mail | Senha inicial |
| --- | --- | --- |
| Aluno | `aluno@bibliotech.demo` | `Bibliotech123` |
| Administração | `admin@bibliotech.demo` | `Bibliotech123` |
| Aluno com atraso | `rafael@bibliotech.demo` | `Bibliotech123` |

A tela de login preenche as duas primeiras contas. Alterne entre elas pelo botão **Encerrar sessão**. Em **Administração → Configurações**, a opção **Restaurar demonstração** repõe as contas, o acervo e o histórico inicial.

## Rotas

| Área | Rotas |
| --- | --- |
| Pública | `/`, `/catalogo`, `/catalogo/:id`, `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha?token=…` |
| Aluno | `/aluno`, `/aluno/catalogo`, `/aluno/catalogo/:id`, `/aluno/reservas`, `/aluno/sobre`, `/aluno/configuracoes` |
| Administração | `/admin`, `/admin/acervo`, `/admin/reservas`, `/admin/usuarios`, `/admin/configuracoes` |

## Arquitetura

- `src/app` define as rotas. `src/layouts` e `src/components` reúnem a navegação e a interface compartilhada.
- `src/pages` contém as telas. React Hook Form e Zod validam autenticação, perfil e acervo.
- `src/types` define as entidades. `src/data` fornece o cenário inicial e os dados institucionais.
- `src/services/library.ts` valida as transições. `src/services/storage.ts` concentra a persistência local. O Context API expõe sessão, dados e ações.
- `src/styles` concentra os tokens e estilos. `src/components/Brand.tsx` contém a assinatura provisória e `public/covers` contém capas ilustrativas locais.
- `tests` cobre o ciclo de empréstimo, as transições inválidas, o limite de reservas, o bloqueio por atraso e a integridade dos exemplares.

## Regras demonstrativas

Solicitações pendentes não ocupam um exemplar. A aprovação vincula um exemplar disponível, registra a retirada e define a devolução para 14 dias depois. A devolução libera esse exemplar. O cancelamento se aplica às solicitações pendentes. Reservas devolvidas e canceladas permanecem no histórico. Pendências, empréstimos e atrasos contam para o limite de três reservas em andamento por leitor.

Ao detectar um novo atraso, o mock bloqueia a conta para novas reservas. A administração pode desbloqueá-la manualmente. Para desativar uma conta é preciso encerrar as reservas em andamento.

## Integração com Go e PostgreSQL

- Substituir a sessão local por autenticação de servidor e aplicar autorização por perfil em cada endpoint. Usar somente credenciais fictícias na demonstração, pois as senhas ficam no armazenamento do navegador.
- Substituir o armazenamento local por APIs REST e persistência relacional. Usar transações para atribuir exemplares e validar limites sob concorrência. Aplicar unicidade de ISBN e número de tombo no banco.
- Definir a política oficial de prazo, cancelamento, retirada e desbloqueio. Processar os atrasos no servidor.
- Implementar tokens de recuperação de uso único com expiração e envio real no servidor. O fluxo atual gera um link local de 15 minutos na mesma aba.
- Confirmar os metadados e as capas do acervo. Trocar a marca provisória e preencher horários, localização interna e atendimento com dados da escola.
- Confrontar as regras com **Bibliotech Remake — Análise do Projeto Anterior** quando o documento estiver disponível. A implementação inicial seguiu o briefing fornecido.
