export const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Para quem', href: '#para-quem' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'Contato', href: '#contato' },
] as const;

export const HERO_TRUST_ITEMS = [
  'Sem instalação — acesse pelo navegador',
  'Importação de planilhas XLSX e ODS',
  'Banco de horas calculado automaticamente',
  'Histórico completo de alterações',
] as const;

export const METRICS = [
  { value: '+190', label: 'Profissionais gerenciados' },
  { value: '+30', label: 'Escalas mensais' },
  { value: '100%', label: 'Controle digital' },
  { value: '0', label: 'Planilhas necessárias' },
  { value: '24/7', label: 'Acesso em tempo real' },
  { value: '3', label: 'Módulos integrados' },
] as const;

export const SOCIAL_PROOF_ITEMS = [
  'UTI',
  'Centro Cirúrgico',
  'Emergência',
  'Enfermaria',
  'Ambulatório',
  'Pronto-Socorro',
  'Maternidade',
  'Pediatria',
  'Oncologia',
  'Cardiologia',
] as const;

export const PERSONAS = [
  {
    role: 'Coordenador(a) de Enfermagem',
    pain: 'Perde horas montando escalas em planilhas, corrigindo conflitos e respondendo sobre plantões.',
    gain: 'Monta a escala na grade interativa, arrasta turnos, troca plantões e vê a cobertura em tempo real — tudo com histórico automático.',
    icon: 'stethoscope' as const,
  },
  {
    role: 'Gestor(a) Hospitalar',
    pain: 'Não tem visibilidade sobre déficit de cobertura, afastamentos ou custo de horas extras.',
    gain: 'Acompanha indicadores no dashboard: cobertura por setor, banco de horas, afastamentos e plantões extras em um único painel.',
    icon: 'building' as const,
  },
  {
    role: 'RH / Departamento Pessoal',
    pain: 'Recalcula banco de horas manualmente a cada alteração na escala e corre risco de inconsistências.',
    gain: 'O saldo de horas é atualizado automaticamente conforme a escala muda. Férias, INSS e licenças ficam registrados com rastreabilidade.',
    icon: 'users' as const,
  },
] as const;

export const PROBLEMS = [
  {
    area: 'Escalas',
    before: 'Planilhas compartilhadas por e-mail, versões desatualizadas e conflitos de plantão difíceis de rastrear.',
    after: 'Escalas centralizadas na grade interativa, com alertas de cobertura e histórico de cada alteração.',
  },
  {
    area: 'Banco de Horas',
    before: 'Planilha auxiliar recalculada manualmente a cada troca, falta ou plantão extra.',
    after: 'Saldo atualizado automaticamente em tempo real, por competência e por profissional.',
  },
  {
    area: 'Cobertura Assistencial',
    before: 'Descobrir déficit de plantão só no dia da operação, sem visão antecipada.',
    after: 'Dashboard com cobertura por setor, dias sem cobertura destacados e projeção mensal.',
  },
  {
    area: 'Auditoria e Conformidade',
    before: 'Alterações sem registro — impossível saber quem mudou o quê e quando.',
    after: 'Log completo de movimentações: trocas, faltas, plantões extras e afastamentos.',
  },
  {
    area: 'Importação e Migração',
    before: 'Retrabalho total ao migrar de planilha: redigitar semanas de escala.',
    after: 'Importação de XLSX e ODS com mapeamento de turnos, acelerando a adoção.',
  },
  {
    area: 'Comunicação',
    before: 'Profissionais ligam e mandam mensagens para confirmar plantões.',
    after: 'Escala acessível online, com status claro de turnos, férias e afastamentos.',
  },
] as const;

export const COMPARISON_ROWS = [
  { feature: 'Montagem de escala', spreadsheet: 'Manual, célula a célula', escala360: 'Grade interativa com drag-and-drop' },
  { feature: 'Banco de horas', spreadsheet: 'Planilha auxiliar separada', escala360: 'Cálculo automático integrado' },
  { feature: 'Histórico de alterações', spreadsheet: 'Inexistente ou limitado', escala360: 'Log completo por profissional' },
  { feature: 'Alertas de cobertura', spreadsheet: 'Conferência visual manual', escala360: 'Destaque automático de déficits' },
  { feature: 'Afastamentos (INSS, férias)', spreadsheet: 'Controle paralelo', escala360: 'Integrado à escala e ao banco' },
  { feature: 'Acesso remoto', spreadsheet: 'Arquivo local ou e-mail', escala360: 'Navegador, qualquer dispositivo' },
  { feature: 'Importação de dados', spreadsheet: 'Copiar e colar', escala360: 'Importação XLSX/ODS nativa' },
  { feature: 'Indicadores gerenciais', spreadsheet: 'Não disponível', escala360: 'Dashboard com KPIs operacionais' },
] as const;

export const STEPS = [
  {
    step: 1,
    title: 'Cadastre sua equipe',
    description: 'Importe ou cadastre técnicos, enfermeiros, tipos de contrato e setores. Configure férias, afastamentos e limites de carga horária.',
    detail: 'Tempo médio de setup: 1 dia',
  },
  {
    step: 2,
    title: 'Monte ou importe a escala',
    description: 'Use a grade interativa para distribuir turnos (M, T, MT, SN…) ou importe planilhas existentes em XLSX/ODS para acelerar a migração.',
    detail: 'Suporte a múltiplos setores',
  },
  {
    step: 3,
    title: 'Acompanhe em tempo real',
    description: 'Monitore cobertura, banco de horas, plantões extras e indicadores no dashboard. Toda alteração fica registrada automaticamente.',
    detail: 'Atualização instantânea',
  },
] as const;

export const FEATURES = [
  {
    name: 'Escalas centralizadas',
    description: 'Substitua planilhas difíceis de manter por uma grade interativa com controle total de turnos, trocas e projeções mensais.',
    icon: 'calendar' as const,
    className: 'md:col-span-2',
    highlight: true,
  },
  {
    name: 'Banco de horas automático',
    description: 'Saldo calculado por competência, sem planilhas auxiliares. Compensações, extras e débitos refletidos em tempo real.',
    icon: 'clock' as const,
  },
  {
    name: 'Cobertura assistencial',
    description: 'Visualize cobertura por setor e dia. Dias sem cobertura e finais de semana destacados automaticamente na grade.',
    icon: 'eye' as const,
  },
  {
    name: 'Importação de planilhas',
    description: 'Migre escalas existentes com suporte nativo a XLSX e ODS. Reduza o tempo de adoção de semanas para horas.',
    icon: 'file' as const,
  },
  {
    name: 'Exportação de relatórios',
    description: 'Gere planilhas por setor ou mês completo para conferência com RH, auditorias e arquivamento.',
    icon: 'export' as const,
  },
  {
    name: 'Auditoria completa',
    description: 'Histórico de trocas, faltas, plantões extras e afastamentos. Saiba quem alterou, quando e o que mudou.',
    icon: 'gavel' as const,
    className: 'md:col-span-2',
  },
  {
    name: 'Gestão de equipes',
    description: 'Cadastro de técnicos e enfermeiros com contratos (CT, CLT, plantonista), setores, férias, INSS e licença gestacional.',
    icon: 'users' as const,
  },
  {
    name: 'Dashboard operacional',
    description: 'KPIs de cobertura, afastamentos, banco de horas e plantões extras — tudo consolidado para tomada de decisão.',
    icon: 'chart' as const,
  },
  {
    name: 'Trocas e plantões extras',
    description: 'Registre trocas entre profissionais e plantões extras diretamente na grade, com impacto automático no banco de horas.',
    icon: 'swap' as const,
  },
  {
    name: 'Multi-setor',
    description: 'Gerencie escalas de técnicos e enfermeiros em setores distintos, cada um com sua grade e regras de turno.',
    icon: 'layers' as const,
  },
] as const;

export const SCREENSHOTS = [
  {
    id: 'dashboard',
    title: 'Dashboard Operacional',
    heading: 'Visão Gerencial',
    description:
      'Tenha uma visão consolidada da operação assistencial. Acompanhe cobertura por setor, profissionais afastados, déficit de plantão e saldo de banco de horas — sem abrir nenhuma planilha.',
    bullets: [
      'Indicadores de cobertura e afastamentos em tempo real',
      'Gráficos de banco de horas por competência',
      'Alertas visuais de setores com déficit',
      'Resumo de plantões extras e faltas do mês',
    ],
    mock: 'dashboard' as const,
  },
  {
    id: 'escala',
    title: 'Grade de Escalas',
    heading: 'Montagem Interativa',
    description:
      'Monte e edite escalas diretamente na grade mensal. Arraste turnos, registre trocas, faltas e plantões extras com histórico automático de cada movimentação.',
    bullets: [
      'Turnos M, T, MT, SN, F, FF, INSS e mais',
      'Drag-and-drop para reorganizar plantões',
      'Destaque de finais de semana e feriados',
      'Histórico de movimentações por célula',
    ],
    mock: 'escala' as const,
  },
  {
    id: 'banco-horas',
    title: 'Banco de Horas',
    heading: 'Controle Automático',
    description:
      'O saldo de horas de cada profissional é calculado automaticamente conforme a escala é alterada. Sem planilhas paralelas, sem recálculo manual.',
    bullets: [
      'Saldo por competência (mês/ano)',
      'Horas extras, compensações e débitos',
      'Integração direta com a grade de escala',
      'Exportação para conferência com RH',
    ],
    mock: 'bancoHoras' as const,
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      'Antes passávamos dois dias inteiros fechando a escala do mês. Agora montamos em horas e ainda temos visibilidade de quem está de férias ou afastado.',
    author: 'Lara Miranda',
    role: 'Supervisora de Enfermagem',
    sector: 'Administrativa',
    initials: 'LM',
  },
  {
    quote:
      'O banco de horas era um pesadelo — planilha separada, sempre desatualizada. Com o Escala360, o RH consulta o saldo e confia no número.',
    author: 'Carlos R.',
    role: 'Analista de RH',
    sector: 'Hospital Geral',
    initials: 'CR',
  },
  {
    quote:
      'Consigo ver de longe quais setores estão descobertos antes do plantão começar. Isso mudou completamente nossa gestão operacional.',
    author: 'Ana P.',
    role: 'Gestora Assistencial',
    sector: 'Emergência',
    initials: 'AP',
  },
  {
    quote:
      'A importação da planilha antiga nos poupou semanas de retrabalho. Em três dias já estávamos operando 100% no sistema.',
    author: 'Roberto L.',
    role: 'Coordenador de Técnicos',
    sector: 'Centro Cirúrgico',
    initials: 'RL',
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: 'O sistema substitui planilhas Excel?',
    answer:
      'Sim. Toda gestão de escalas — montagem, edição, trocas, afastamentos e banco de horas — é feita na plataforma. Você elimina versões conflitantes, e-mails com anexos e retrabalho manual.',
  },
  {
    question: 'É possível importar escalas existentes?',
    answer:
      'Sim. O sistema suporta importação nativa de planilhas XLSX e ODS. Isso acelera a migração: em vez de redigitar semanas de escala, você importa e ajusta diretamente na grade.',
  },
  {
    question: 'O banco de horas é automático?',
    answer:
      'Sim. O saldo é recalculado automaticamente a cada alteração na escala — trocas, faltas, plantões extras e compensações. Não é necessário manter planilha auxiliar.',
  },
  {
    question: 'Posso controlar férias e afastamentos?',
    answer:
      'Sim. Férias, licença gestacional, INSS e outros afastamentos são registrados no cadastro do profissional e refletidos automaticamente na grade e no banco de horas.',
  },
  {
    question: 'Quantos setores posso gerenciar?',
    answer:
      'Não há limite prático. O sistema suporta múltiplos setores com escalas independentes para técnicos de enfermagem e enfermeiros, cada um com sua grade mensal.',
  },
  {
    question: 'Preciso instalar algum software?',
    answer:
      'Não. O Escala360 é 100% web — acesse pelo navegador de qualquer computador ou tablet conectado à internet. Sem instalação, sem atualização manual.',
  },
  {
    question: 'Como funciona o histórico de alterações?',
    answer:
      'Toda movimentação na escala — troca de plantão, falta, plantão extra, alteração de turno — fica registrada com data, profissional envolvido e tipo de operação. Ideal para auditorias e conformidade.',
  },
  {
    question: 'Posso testar antes de contratar?',
    answer:
      'Sim. Você pode criar uma conta gratuitamente e explorar o sistema, ou solicitar uma demonstração guiada com nossa equipe.',
  },
] as const;

export const INTEGRATIONS = [
  { label: 'Importação XLSX', description: 'Planilhas Excel' },
  { label: 'Importação ODS', description: 'LibreOffice / BrOffice' },
  { label: 'Multi-setor', description: 'UTI, CC, Emergência…' },
  { label: 'Turnos flexíveis', description: 'M, T, MT, SN, HC…' },
  { label: 'Contratos variados', description: 'CT, CLT, Plantonista' },
  { label: 'Acesso web', description: 'Qualquer navegador' },
] as const;
