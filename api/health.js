/**
 * 健康检查接口
 */

module.exports = (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'feishu-bot'
  });
};
