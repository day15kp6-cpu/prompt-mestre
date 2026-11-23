# prompt-mestre

Mod do Claude Code que adiciona o botão **✨ Prompt mestre** na faixa acima da caixa de prompt. Você digita o pedido, clica no botão e o texto é reescrito por um modelo para ficar mais assertivo: objetivo, contexto, restrições e critério de pronto explícitos, sem inventar requisitos. Você revisa e envia; o mod nunca envia sozinho. Também há o comando `/melhorar`, que faz a mesma coisa.

Cada uso faz uma chamada ao modelo `sonnet` (esforço baixo), que entra no custo da sessão.

## Instalação

No prompt de uma sessão de terminal:

```
/plugin install prompt-mestre --marketplace day15kp6-cpu/prompt-mestre
```

Pelo shell:

```
claude plugin install prompt-mestre --marketplace day15kp6-cpu/prompt-mestre
```

No app desktop, onde `/plugin` não roda: clique em **+** ao lado da caixa de prompt, depois **Plugins**, **Add marketplace** com `day15kp6-cpu/prompt-mestre`, e **Add plugin**.

O repositório é privado: só instala quem pode ler no GitHub e tem credencial git para github.com na máquina (chave SSH, ou `gh auth login` e depois `gh auth setup-git`).

## Uso

1. Digite o pedido na caixa de prompt, sem enviar.
2. Clique em **✨ Prompt mestre** (ou rode `/melhorar`).
3. O texto da caixa é substituído pela versão melhorada. Revise e envie.
4. Não gostou? Clique em **↩ Desfazer** para voltar ao texto que você tinha digitado (o botão aparece depois de cada melhoria e restaura o texto da caixa por inteiro, incluindo edições feitas depois).

## Pedido vago demais

Quando falta algo essencial (objetivo ou alvo indefinidos), o mod não chuta: ele acrescenta 2 ou 3 perguntas ao fim do seu texto, sob a linha `--- Responda para eu melhorar o pedido ---`. Responda ali mesmo na caixa e clique em **✨ Prompt mestre** de novo: as respostas são incorporadas e o bloco de perguntas some.
