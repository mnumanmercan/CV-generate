import Anthropic from '@anthropic-ai/sdk'

async function main() {
  const anthropic = new Anthropic()

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 300,
    messages: [
      { role: 'user', content: 'Merhaba, Claude' },
      { role: 'assistant', content: 'Merhaba!' },
      { role: 'user', content: 'LLM\'leri bana açıklayabilir misin? 250 karakteri geçmesin açıklaman.' },
    ],
  })
  console.log(msg)

  console.log(typeof msg)
}

main().catch(console.error)
