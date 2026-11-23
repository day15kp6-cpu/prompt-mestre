import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const status = atom({ plugin: 'prompt-mestre', key: 'status' } as const, '')

const SYSTEM = `Você é um engenheiro de prompts. Reescreva o pedido do usuário para um assistente de código (Claude Code) de forma mais assertiva e completa.
Regras: mantenha o idioma do usuário (português se for português); preserve toda a intenção, nomes, caminhos e números; não invente fatos nem requisitos; deixe explícitos objetivo, contexto, restrições e critério de pronto, só quando já estiverem implícitos no pedido; se algo essencial faltar, acrescente uma linha "Se faltar informação, pergunte antes de agir."; seja conciso.
Responda SOMENTE com o prompt melhorado, sem comentários, sem aspas, sem markdown em volta.`

let isBusy = false

async function improve($: any) {
  if (isBusy) return
  const { text } = await $.prompt.read()
  if (!text.trim()) {
    await update($, status, () => 'Digite um pedido primeiro')
    return
  }
  isBusy = true
  await update($, status, () => 'Melhorando…')
  const r = await $.model.complete({
    model: 'sonnet',
    system: SYSTEM,
    prompt: text,
    maxTokens: 2000,
    effort: 'low',
    timeoutMs: 60000,
  })
  isBusy = false
  if (!r.isAnswered || !r.text.trim()) {
    await update($, status, () => 'Não consegui melhorar; tente de novo')
    return
  }
  await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
  await update($, status, () => 'Pronto: revise e envie')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'melhorar', description: 'Melhora o pedido digitado (Prompt mestre)' })
    return next(e)
  })

  on('command.run', { command: 'melhorar' }, async ($, e, next) => {
    await improve($)
    return { text: await read($, status) }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const msg = await read($, status)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Button key="mestre" label="✨ Prompt mestre" onPress={() => improve($)} />
        {msg ? <Text dimColor> {msg}</Text> : null}
      </Box>
    )
  })
}
