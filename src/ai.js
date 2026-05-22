/**
 * AI 回复模块 - 支持 OpenAI 和 Claude
 */

async function getAIReply(message) {
  // 检查是否配置了 AI API
  if (process.env.OPENAI_API_KEY) {
    return await getOpenAIReply(message);
  } else if (process.env.ANTHROPIC_API_KEY) {
    return await getClaudeReply(message);
  } else {
    // 没有配置 AI，返回默认回复
    return `收到你的消息：${message}\n\n（提示：配置 AI API 可启用智能回复）`;
  }
}

async function getOpenAIReply(message) {
  const axios = require('axios');
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  try {
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: '你是一个 helpful 的飞书机器人助手，请用中文回答用户的问题。' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API 错误:', error.message);
    return '抱歉，AI 回复出现问题。';
  }
}

async function getClaudeReply(message) {
  const axios = require('axios');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: message }],
        system: '你是一个 helpful 的飞书机器人助手，请用中文回答用户的问题。'
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
      }
    );
    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude API 错误:', error.message);
    return '抱歉，AI 回复出现问题。';
  }
}

module.exports = { getAIReply };
