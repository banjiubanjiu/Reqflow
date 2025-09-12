const express = require('express');
const qwenService = require('../services/qwenService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 测试
 *   description: 测试接口
 */

/**
 * @swagger
 * /api/test/qwen:
 *   post:
 *     tags: [测试]
 *     summary: 测试Qwen API连接
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hello, how are you?
 *     responses:
 *       200:
 *         description: AI回复成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reply:
 *                   type: string
 *                 apiKey:
 *                   type: string
 *       500:
 *         description: AI服务错误
 */
router.post('/qwen', async (req, res) => {
  try {
    const { message = 'Hello' } = req.body;
    
    console.log('Testing Qwen API with message:', message);
    console.log('API Key:', process.env.QWEN_API_KEY ? `${process.env.QWEN_API_KEY.substring(0, 10)}...` : 'NOT SET');
    
    const reply = await qwenService.chat([
      { role: 'user', content: message }
    ]);
    
    res.json({
      success: true,
      reply,
      apiKey: process.env.QWEN_API_KEY ? `${process.env.QWEN_API_KEY.substring(0, 10)}...` : 'NOT SET'
    });
    
  } catch (error) {
    console.error('Test Qwen Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      apiKey: process.env.QWEN_API_KEY ? `${process.env.QWEN_API_KEY.substring(0, 10)}...` : 'NOT SET'
    });
  }
});

module.exports = router;