import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const status = atom({ plugin: 'prompt-mestre', key: 'status' } as const, '')
// Texto digitado antes da última alteração do mod; vazio = nada a desfazer.
const original = atom({ plugin: 'prompt-mestre', key: 'original' } as const, '')

const SEPARADOR = '--- Responda para eu melhorar o pedido ---'

const SYSTEM = `Você é um engenheiro de prompts. Melhore o pedido do usuário para um assistente de código (Claude Code).
Regras: mantenha o idioma do usuário; preserve toda a intenção, nomes, caminhos e números; não invente fatos nem requisitos; deixe explícitos objetivo, contexto, restrições e critério de pronto, só quando já estiverem implícitos no pedido; seja conciso.
Se o texto terminar com um bloco "${SEPARADOR}", ele traz perguntas que você fez antes e as respostas do usuário: incorpore as respostas ao pedido e descarte o bloco.
Formato da resposta, SEMPRE na primeira linha:
- "PROMPT:" e, na linha seguinte, o prompt melhorado, quando o pedido já dá para agir (mesmo que falte detalhe menor);
- "PERGUNTAS:" e, nas linhas seguintes, de 2 a 3 perguntas curtas iniciadas por "- ", só quando falta algo essencial e agir seria chute (objetivo, alvo ou arquivo indefinidos).
Nada além disso: sem comentários, sem aspas, sem markdown em volta.`

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
  const reply = r.isAnswered ? r.text.trim() : ''
  const isQuestions = /^PERGUNTAS:/i.test(reply)
  const body = reply.replace(/^(PROMPT|PERGUNTAS):\s*/i, '').trim()
  if (!body) {
    await update($, status, () => 'Não consegui melhorar; tente de novo')
    return
  }
  const next = isQuestions ? `${text.trimEnd()}\n\n${SEPARADOR}\n${body}\n` : body
  const filled = await $.prompt.fill({ text: next, mode: 'replace' })
  if (!filled.isFilled) {
    await update($, status, () => 'Não consegui escrever na caixa; tente de novo')
    return
  }
  await update($, original, () => text)
  await update($, status, () =>
    isQuestions ? 'Faltam informações: responda abaixo e clique de novo' : 'Pronto: revise e envie',
  )
}

async function undo($: any) {
  const text = await read($, original)
  if (!text) return
  const filled = await $.prompt.fill({ text, mode: 'replace' })
  if (!filled.isFilled) {
    await update($, status, () => 'Não consegui desfazer; tente de novo')
    return
  }
  await update($, original, () => '')
  await update($, status, () => 'Pedido original restaurado')
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
    const hasUndo = (await read($, original)) !== ''
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Button key="mestre" label="✨ Prompt mestre" onPress={() => improve($)} />
        {hasUndo ? <Button key="desfazer" label="↩ Desfazer" onPress={() => undo($)} /> : null}
        {msg ? <Text dimColor> {msg}</Text> : null}
      </Box>
    )
  })
}
