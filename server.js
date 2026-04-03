// server.js
// 作用：创建一个"中间人"，前端把问题发给它，它加上API Key再发给DeepSeek

// 第1-3行：引入我们刚才安装的三个包
const express = require('express');   // 创建服务器的工具
const cors = require('cors');         // 允许跨域请求
require('dotenv').config();           // 读取.env文件中的环境变量

// 第5行：创建服务器实例
const app = express();

// 第7-8行：配置中间件（你可以理解为"插件"）
app.use(cors());                      // 让前端能调用这个后端
app.use(express.json());              // 自动解析JSON格式的请求体

// 第10-12行：从.env读取API Key（待会要创建.env文件）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  console.error('❌ 错误：请在.env文件中设置DEEPSEEK_API_KEY');
  process.exit(1);
}

// 第14行：定义一个"路由"——当前端访问 /chat 时执行什么
app.post('/chat', async (req, res) => {
  // 第15-16行：从前端发来的请求里取出数据
  const { systemPrompt, messages } = req.body;
  
  console.log(`📨 收到问题: ${messages[messages.length-1]?.content?.substring(0, 50)}...`);
  
  try {
    // 第19-29行：调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`  // 这里用上API Key
      },
      body: JSON.stringify({
        model: 'deepseek-chat',           // 使用DeepSeek的对话模型
        messages: [
          { role: 'system', content: systemPrompt },  // 思想家的人设
          ...messages                                  // 历史对话
        ],
        max_tokens: 1000,                 // 限制回复长度
        temperature: 0.7                  // 控制回答的创造性（0=保守，1=天马行空）
      })
    });
    
    // 第31-35行：解析DeepSeek返回的数据
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const reply = data.choices[0].message.content;
    console.log(`✅ 回复成功: ${reply.substring(0, 50)}...`);
    
    // 第37行：把答案返回给前端
    res.json({ reply });
    
  } catch (error) {
    console.error('❌ 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 第44行：启动服务器，监听3000端口
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📡 等待前端连接...`);
});