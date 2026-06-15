import { db } from './index';
import { setores, funcionarios, competencias, escalaDias } from './schema';

async function seed() {
  console.log('Seeding database...');

  const [setor] = await db
    .insert(setores)
    .values({
      nome: '5 ANDAR',
      empresa: 'HOSPITAL TERESA DE LISIEUX',
      gerente: 'DELZUITA NASCIMENTO SOUZA',
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
      .values({ ...f, setorId })
      .onConflictDoUpdate({
        target: funcionarios.matricula,
        set: { nome: f.nome, coren: f.coren, updatedAt: new Date() },
      })
      .returning();
    insertedFuncs.push(func);
  }

  const [comp] = await db
    .insert(competencias)
    .values({ mes: 6, ano: 2026, setorId, observacoes: 'Escala de referência - Junho/2026' })
    .onConflictDoNothing()
    .returning();

  const competenciaId = comp?.id ?? 1;

  const turnoPatterns = [
    ['/', 'F', 'MT', 'F', 'SN'],
    ['MT', 'F', 'SN', '/', 'F'],
    ['SN', '/', 'F', 'MT', 'F'],
    ['M', 'F', 'T', 'F', 'M'],
    ['HC', 'F', 'HC', 'F', 'HC'],
  ];

  for (let fi = 0; fi < insertedFuncs.length; fi++) {
    const func = insertedFuncs[fi];
    const pattern = turnoPatterns[fi % turnoPatterns.length];

    for (let dia = 1; dia <= 30; dia++) {
      const turno = pattern[(dia - 1) % pattern.length];
      await db
        .insert(escalaDias)
        .values({ competenciaId, funcionarioId: func.id, tipoRegistro: 'turno', dia, turno, ativo: true })
        .onConflictDoNothing();
    }
  }

  console.log(`Seeded setor "${setor?.nome ?? '5 ANDAR'}" with ${insertedFuncs.length} funcionários`);
  console.log('Competência: 6/2026');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
