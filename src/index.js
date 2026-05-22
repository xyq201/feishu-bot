const express = require('express');
const axios = require('axios');
const { getAIReply } = require('./ai');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.raw({ type: 'text/plain' }));

const CONFIG = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  verificationToken: process.env.FEISHU_VERIFICATION_TOKEN,
  port: process.env.PORT || 3000,
};

let tenantAccessToken = null;
let tokenExpireTime = 0;

async function getTenantAccessToken() {
  const now = Date.now();
  if (tenantAccessToken && now < tokenExpireTime) {
    return tenantAccessToken;
  }

  const response = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    { app_id: CONFIG.appId, app_secret: CONFIG.appSecret }
  );

  if (response.data.code === 0) {
    tenantAccessToken = response.data.tenant_access_token;
    tokenExpireTime = now + (response.data.expire - 60) * 1000;
    return tenantAccessToken;
  }
  throw new Error(response.data.msg);
}

async function sendMessage(receiveId, content, msgType = 'text') {
  const token = await getTenantAccessToken();
  const response = await axios.post(
    'https://open.feishu.cn/open-apis/im/v1/messages',
    { receive_id: receiveId, content: JSON.stringify(content), msg_type: msgType },
    { headers: { Authorization: `Bearer ${token}` }, params: { receive_id_type: 'open_id' } }
  );
  if (response.data.code !== 0) throw new Error(response.data.msg);
  return response.data.data;
}

app.post('/webhook', async (req, res) => {
  try {
    const { token, type, challenge, event } = req.body;

    if (type === 'url_verification') {
      if (token !== CONFIG.verificationToken) return res.status(403).json({ error: 'Invalid token' });
      return res.json({ challenge });
    }

    if (token !== CONFIG.verificationToken) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    if (type === 'event_callback' && event && event.type === 'im.message.receive_v1') {
      const message = event.message;
      const sender = event.sender;
      
      let userMessage = '';
      try {
        const content = JSON.parse(message.content);
        userMessage = content.text || '';
      } catch (e) {
        userMessage = message.content;
      }

      const aiReply = await getAIReply(userMessage);
      await sendMessage(sender.sender_id.open_id, { text: aiReply }, 'text');
    }

    res.json({ code: 0, msg: 'success' });
  } catch (error) {
    console.error('❌ 处理错误:', error.message);
    res.status(500).json({ code: -1, msg: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  app.listen(CONFIG.port, () => {
    console.log(`🚀 飞书 Bot 服务已启动！端口: ${CONFIG.port}`);
  });
}

start().catch(console.error);
