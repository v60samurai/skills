import { templates, type TemplateName } from './noticeTemplates'

type Mailer = { send(to: string, subject: string, body: string): Promise<void> }

// Email is the only channel. The relay retries three times.
export async function sendNotice(mailer: Mailer, template: TemplateName, to: string, values: Record<string, string>) {
  const t = templates[template]
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? '')
  await mailer.send(to, fill(t.subject), fill(t.body))
}
