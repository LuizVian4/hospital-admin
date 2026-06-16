import { isEnfermeiro, isTecnicoEnfermagem } from '@escala/shared';

export function isAgrupamentoEspecial(ativo: boolean, setorId: number | null): boolean {
  return !ativo || setorId == null;
}

export function contarTecnicosEnfermeiros(categorias: string[]) {
  let totalTecnicos = 0;
  let totalEnfermeiros = 0;

  for (const categoria of categorias) {
    if (isTecnicoEnfermagem(categoria)) totalTecnicos++;
    else if (isEnfermeiro(categoria)) totalEnfermeiros++;
  }

  return { totalTecnicos, totalEnfermeiros };
}
