UPDATE "empresas"
SET
  "nome" = 'Empresa Demo',
  "slug" = 'empresa-demo',
  "updated_at" = now()
WHERE "id" = '00000000-0000-4000-8000-000000000001'
  AND "slug" = 'hospital-teresa-de-lisieux';

UPDATE "setores"
SET "empresa" = 'Empresa Demo'
WHERE "empresa_id" = '00000000-0000-4000-8000-000000000001'
  AND "empresa" = 'HOSPITAL TERESA DE LISIEUX';
