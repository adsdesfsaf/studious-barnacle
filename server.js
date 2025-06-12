const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map(); // roomName -> Set<ws>

wss.on('connection', (ws) => {
  let room = null;
  let username = null;

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
      return;
    }
    if(data.type === 'join') {
      room = data.room;
      username = data.username;
      if (!rooms.has(room)) rooms.set(room, new Set());
      rooms.get(room).add(ws);
      broadcast(room, { type: 'sys', text: `${username} 加入了房间` });
      ws.send(JSON.stringify({ type: 'joined', room, username }));
    }
    if(data.type === 'msg' && room) {
      broadcast(room, { type:'msg', username, text: data.text, time: Date.now() });
    }
  });

  ws.on('close', () => {
    if (room && rooms.has(room)) {
      rooms.get(room).delete(ws);
      broadcast(room, { type: 'sys', text: `${username} 离开了房间` });
    }
  });

  function broadcast(room, msg) {
    if(!rooms.has(room)) return;
    for(const client of rooms.get(room)) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    }
  }
});

console.log('WebSocket聊天室服务已启动，端口8080');