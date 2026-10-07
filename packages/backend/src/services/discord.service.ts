const WEBHOOK_TIMEOUT_MS = 10_000;

export interface AccountCreatedNotice {
  nome: string;
  email: string;
  createdAt?: Date | null;
}

export function notifyAccountCreated(account: AccountCreatedNotice): void {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim() ?? '';
  if (!webhookUrl) {
    console.warn('Discord: cadastro não notificado, DISCORD_WEBHOOK_URL ausente');
    return;
  }
  if (!isDiscordWebhook(webhookUrl)) {
    console.warn('Discord: DISCORD_WEBHOOK_URL não é um webhook HTTPS do Discord');
    return;
  }

  void sendSignupEmbed(webhookUrl, account).catch((err) => {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error(`Discord: falha ao notificar cadastro (${message})`);
  });
}

function isDiscordWebhook(value: string): boolean {
  try {
    const url = new URL(value);
    const hostOk = url.hostname === 'discord.com' || url.hostname === 'discordapp.com';
    return url.protocol === 'https:' && hostOk && url.pathname.startsWith('/api/webhooks/');
  } catch {
    return false;
  }
}

async function sendSignupEmbed(webhookUrl: string, account: AccountCreatedNotice): Promise<void> {
  const createdAt = account.createdAt ?? new Date();
  const payload = {
    embeds: [
      {
        title: 'Nova conta criada',
        color: 5763719,
        fields: [
          { name: 'Ambiente', value: environmentLabel(), inline: true },
          { name: 'Nome', value: account.nome, inline: true },
          { name: 'E-mail', value: account.email, inline: true },
          { name: 'Data de cadastro', value: formatDateTime(createdAt) },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`status ${response.status}`);
  }
}

function environmentLabel(): string {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'Produção';
    case 'development':
      return 'Desenvolvimento';
    case 'staging':
      return 'Staging';
    default:
      return process.env.NODE_ENV?.trim() || 'Desconhecido';
  }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Bahia',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
