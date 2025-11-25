const axios = require('axios');

// ❗❗❗ EDIT THESE TWO LINES ONLY ❗❗❗
const BOT_TOKEN = '8470259022:AAEvcxMTV1xLmQyz2dcxwr94RbLsdvJGiqg'; // your bot token
const CHAT_ID   = '6142816761';               // your Telegram chat id

const TG = {
  api: axios.create({
    baseURL: `https://api.telegram.org/bot${BOT_TOKEN}`,
    timeout: 10000
  }),

  // store anything as a Telegram message (never deleted)
  async save(type, payload) {
    const text = `📦${type}|${JSON.stringify(payload)}`;
    return this.api.post('/sendMessage', { chat_id: CHAT_ID, text });
  },

  // fetch last 100 messages and filter by type
  async load(type) {
    const { data } = await this.api.get('/getUpdates?offset=-1&limit=100');
    const msgs = data.result.map(u => u.message?.text).filter(Boolean);
    return msgs
      .filter(t => t.startsWith(`📦${type}|`))
      .map(t => JSON.parse(t.split('|')[1]));
  },

  // send admin notification
  async notify(username) {
    return this.api.post('/sendMessage', {
      chat_id: CHAT_ID,
      text: `🆕 User <b>${username}</b> signed up to XMN Connect`,
      parse_mode: 'HTML'
    });
  }
};

module.exports = TG;
