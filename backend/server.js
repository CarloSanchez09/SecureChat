const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow any origin for testing
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

let users = [];
let registeredUsers = [];

// Load registered users from a file
const usersFilePath = path.join(__dirname, 'users.json');
if (fs.existsSync(usersFilePath)) {
  const usersData = fs.readFileSync(usersFilePath, 'utf8');
  registeredUsers = JSON.parse(usersData);
  console.log('Loaded registered users from file');
}

// API for user registration
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (registeredUsers.some(user => user.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  registeredUsers.push({ username, password });
  // Save to file
  fs.writeFileSync(usersFilePath, JSON.stringify(registeredUsers, null, 2), 'utf8');
  console.log(`User registered: ${username}`);
  res.status(201).json({ message: 'Registration successful' });
});

// API for user login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = registeredUsers.find(user => user.username === username);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }
  if (user.password !== password) {
    return res.status(400).json({ error: 'Invalid password' });
  }
  res.status(200).json({ message: 'Login successful' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send the list of registered users to the newly connected client
  socket.emit('registeredUsers', registeredUsers.map(user => user.username));

  socket.on('setUsername', (username) => {
    console.log('\n=== INTENTO DE ESTABLECER USUARIO ===');
    console.log('Nuevo usuario:', username);
    console.log('Usuarios actuales:', users);
    
    if (users.includes(username)) {
      console.log(`❌ El usuario ${username} ya está en uso`);
      socket.emit('usernameError', 'Username already exists. Please choose a different one.');
    } else {
      // Actualizar el nombre de usuario en el socket
      socket.username = username;
      
      // Verificar si el usuario ya está en la lista (para reconexiones)
      if (!users.includes(username)) {
        users.push(username);
      }
      
      console.log(`✅ Usuario ${username} establecido correctamente`);
      console.log('Lista actualizada de usuarios conectados:', users);
      
      // Notificar a todos los clientes sobre la lista actualizada de usuarios
      io.emit('userList', users);
      io.emit('registeredUsers', registeredUsers.map(user => user.username));
      
      // Confirmar al usuario que se ha conectado correctamente
      socket.emit('usernameSet', { 
        username: username,
        userList: users,
        registeredUsers: registeredUsers.map(user => user.username)
      });
    }
  });

  socket.on('chatMessage', (message) => {
    const messageData = {
      username: socket.username,
      text: message.text,
      recipient: message.recipient,
      timestamp: message.timestamp || new Date().toISOString(),
      read: false
    };

    console.log('\n=== NUEVO MENSAJE ===');
    console.log('De:', socket.username);
    console.log('Para:', message.recipient || 'Todos (General)');
    console.log('Mensaje:', message.text);
    console.log('Usuarios conectados:', users);

    if (message.recipient) {
      // Mensaje privado: enviar solo al remitente y al destinatario
      console.log('Buscando socket del destinatario:', message.recipient);
      
      // Listar todos los sockets conectados
      const allSockets = Array.from(io.sockets.sockets.values());
      console.log('Sockets conectados:', allSockets.map(s => ({
        id: s.id,
        username: s.username,
        connected: s.connected
      })));

      const recipientSocket = allSockets.find(
        s => s.username === message.recipient
      );
      
      if (recipientSocket) {
        console.log(`Enviando mensaje a ${message.recipient} (socket: ${recipientSocket.id})`);
        // Enviar al destinatario
        recipientSocket.emit('chatMessage', messageData);
        console.log(`✅ Mensaje enviado a ${message.recipient}`);
        
        // Enviar confirmación al remitente
        socket.emit('chatMessage', messageData);
        console.log(`✅ Confirmación enviada a ${socket.username}`);
      } else {
        console.log(`❌ Destinatario ${message.recipient} no encontrado entre los sockets conectados`);
        // Notificar al remitente que el destinatario no está disponible
        socket.emit('error', `El usuario ${message.recipient} no está conectado`);
      }
    } else {
      // Mensaje al chat general: enviar a todos
      console.log('Enviando mensaje general a todos los usuarios conectados');
      io.emit('chatMessage', messageData);
      console.log('✅ Mensaje general enviado a todos los usuarios');
    }
  });

  socket.on('typing', (data) => {
    io.emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.username) {
      users = users.filter(user => user !== socket.username);
      io.emit('userList', users);
      io.emit('registeredUsers', registeredUsers.map(user => user.username));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});