import { DIA_INICIO_ESCALA, getPadraoEscala, resolverIndiceNoPadrao } from '@escala/shared';
import bcrypt from 'bcryptjs';
import { db } from './index';
import { setores, funcionarios, competencias, escalaInicios, users, empresas, usuarioEmpresas } from './schema';

const DEFAULT_EMPRESA_ID = '00000000-0000-4000-8000-000000000001';

async function seedAdminUser() {
  const email = (process.env.ADMIN_EMAIL || 'admin@hospital.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      nome: 'Administrador',
      ativo: true,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        nome: 'Administrador',
        ativo: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  await db
    .insert(usuarioEmpresas)
    .values({
      userId: user.id,
      empresaId: DEFAULT_EMPRESA_ID,
      papel: 'admin',
    })
    .onConflictDoNothing();

  console.log(`Admin user ready: ${email}`);
}

async function seed() {
  console.log('Seeding database...');

  await db
    .insert(empresas)
    .values({
      id: DEFAULT_EMPRESA_ID,
      nome: 'Empresa Demo',
      slug: 'empresa-demo',
      ativo: true,
    })
    .onConflictDoNothing();

  await seedAdminUser();

  const [setor] = await db
    .insert(setores)
    .values({
      empresaId: DEFAULT_EMPRESA_ID,
      nome: '5 ANDAR',
      empresa: 'Empresa Demo',
      gerente: 'Gerente Demo',
    })
    .onConflictDoNothing()
    .returning();

  const setorId = setor?.id ?? 1;

  const funcionariosData = [
    {
      matricula: '1170278',
      nome: 'JUCINARA CORREIA DOS SANTOS',
      coren: '1897232',
      categoria: 'TÉC. DE ENFERMAGEM',
      tipoContrato: 'EFETIVO',
      dataAdmissao: '2015-03-10',
      cargaHoraria: '180H',
      ordemEscala: 0,
    },
    {
      matricula: '1162073',
      nome: 'MARIA MAIZA SILVA',
      coren: '1234567',
      categoria: 'TÉC. DE ENFERMAGEM',
      tipoContrato: 'EFETIVO',
      dataAdmissao: '2018-06-15',
      cargaHoraria: '180H',
      ordemEscala: 1,
    },
    {
      matricula: '1185001',
      nome: 'ANA PAULA FERREIRA',
      coren: null,
      categoria: 'TÉC. DE ENFERMAGEM',
      tipoContrato: 'PROVISÓRIO',
      dataAdmissao: '2023-01-20',
      cargaHoraria: '180H',
      ordemEscala: 2,
    },
    {
      matricula: '1190002',
      nome: 'CARLOS EDUARDO LIMA',
      coren: '9876543',
      categoria: 'TÉC. DE ENFERMAGEM',
      tipoContrato: 'EFETIVO',
      dataAdmissao: '2019-11-05',
      cargaHoraria: '144H',
      ordemEscala: 3,
    },
    {
      matricula: '1195003',
      nome: 'FERNANDA COSTA OLIVEIRA',
      coren: '5551234',
      categoria: 'TÉC. DE ENFERMAGEM',
      tipoContrato: 'Temporário',
      dataAdmissao: '2024-08-01',
      cargaHoraria: '180H',
      ordemEscala: 4,
    },
  ];

  const insertedFuncs = [];
  for (const f of funcionariosData) {
    const [func] = await db
      .insert(funcionarios)
      .values({ ...f, setorId, empresaId: DEFAULT_EMPRESA_ID })
      .onConflictDoUpdate({
        target: [funcionarios.empresaId, funcionarios.matricula],
        set: { nome: f.nome, coren: f.coren, updatedAt: new Date() },
      })
      .returning();
    insertedFuncs.push(func);
  }

  const [comp] = await db
    .insert(competencias)
    .values({
      empresaId: DEFAULT_EMPRESA_ID,
      mes: 6,
      ano: 2026,
      setorId,
      tipo: 'tecnico',
      observacoes: 'Escala de referência - Junho/2026',
    })
    .onConflictDoNothing()
    .returning();

  const competenciaId = comp?.id ?? 1;
  const mes = 6;
  const ano = 2026;

  const turnoInicios = ['/', 'MT', 'SN', 'M', 'HC'];

  for (let fi = 0; fi < insertedFuncs.length; fi++) {
    const func = insertedFuncs[fi];
    const turnoInicio = turnoInicios[fi % turnoInicios.length];
    const padrao = getPadraoEscala(func.categoria ?? 'TÉC. DE ENFERMAGEM');
    if (!padrao) continue;

    const indicePadrao = resolverIndiceNoPadrao(padrao, DIA_INICIO_ESCALA, turnoInicio, {
      [DIA_INICIO_ESCALA]: turnoInicio,
    });

    await db.insert(escalaInicios).values({
      empresaId: DEFAULT_EMPRESA_ID,
      competenciaId,
      funcionarioId: func.id,
      mesInicio: mes,
      anoInicio: ano,
      turnoInicio,
      indicePadrao,
    });
  }

  console.log(`Seeded setor "${setor?.nome ?? '5 ANDAR'}" with ${insertedFuncs.length} funcionários`);
  console.log('Competência: 6/2026');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
