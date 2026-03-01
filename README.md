ARQUITETURA DO SISTEMA: de Barbearia
1. A Fundação (Core Stack)
Framework: Next.js (App Router). Escolhemos ele pela velocidade de renderização e por nos dar o poder de mesclar código de servidor e cliente de forma limpa.

Linguagem: TypeScript. A nossa primeira linha de defesa. Ele nos salvou de quebrar a agenda quando o horário vinha null. Tipagem estrita é inegociável em sistemas financeiros e de agendamento.

Hospedagem: Vercel. Deploy contínuo e infraestrutura Edge sem precisarmos configurar servidores (Serverless).

2. O Cérebro da Aplicação (State & Cache)
O segredo de um app rápido é não processar a mesma coisa duas vezes.

Estado Global (Client-Side): Zustand. Usamos para gerenciar os 5 passos do funil de agendamento do cliente. Ele é infinitamente mais leve e rápido que o Redux, evitando re-renderizações desnecessárias na tela.

Motor de Cache e Fetching: React Query (TanStack Query). Esse foi o nosso trunfo. Em vez de ler o banco de dados toda hora, ele salva uma "foto" da agenda na memória RAM do celular.

A Grande Sacada: Quando descobrimos o bug do horário fantasma (Cache Stale), nós hackeamos o React Query (staleTime: 0 e refetchOnMount: "always") para forçar a atualização imediata da agenda toda vez que o componente nascesse.

3. Banco de Dados e Segurança (The Vault)
Database: Firebase Firestore (NoSQL). Estrutura de documentos rápida e escalável. Separamos as coleções de forma inteligente: services, barbers, appointments, monthlyPlans.

A Trava Mestra (Live Check): O nosso maior orgulho arquitetural. Para evitar a Race Condition (dois clientes roubando o mesmo horário), não confiamos no Front-End. Injetamos uma Live Query que bate no Firebase no exato milissegundo antes de gravar. Se a vaga foi roubada, o sistema aborta a gravação e cospe um erro tático. Overbooking = Zero.

Tipagem de Status: Criamos um funil rigoroso: 'scheduled' (travando a cadeira), 'done' (caixa fechado) e 'cancelled' (vaga liberada de volta no pool).

4. FinOps (Otimização de Custos)
Radar Central Custo Zero: Em vez de usar o onSnapshot do Firebase (que manteria uma conexão socket aberta 24h cobrando do seu cartão a cada alteração), nós criamos um Sino de Notificação "Preguiçoso" (Lazy Polling). Ele só vai no banco buscar ficha nova quando o barbeiro clica no sistema ou atualiza a tela. Efeito de tempo real, mas com custo zero.

5. UI/UX e Motor Visual (O Design Brutalista)
Estilização: Tailwind CSS. Usamos a filosofia de "Design Brutalista" (Bordas pesadas border-4 border-black, blocos sólidos, amarelo neon, sombras secas shadow-[6px_6px_0px_0px_#000]). Isso corta o excesso de "fofura" corporativa e dá uma identidade urbana, agressiva e premium pra barbearia.

Animações Nativas: Não usamos bibliotecas pesadas de animação. O carrossel de cortes usa o motor da GPU (CSS Keyframes com @keyframes marquee), garantindo 60 FPS até em celulares antigos.

Splash Screen de Elite: Criamos uma tela de carregamento com sessionStorage. O cliente toma um "soco visual" da marca na primeira vez que abre, mas o sistema guarda isso na memória e não enche o saco nos próximos acessos.

6. A Experiência Mobile (PWA)
App Nativo sem Loja: O cliente instala o atalho direto na tela inicial do iPhone/Android. O sistema roda em Full Screen, sem a barra de navegação do Chrome, dando a imersão de um aplicativo de 100 mil reais, fugindo das taxas da Apple Store e Play Store.

Porta dos Fundos (Backdoor): Criamos uma rota oculta (/login) para os barbeiros acessarem o terminal de controle sem precisar de um app separado.