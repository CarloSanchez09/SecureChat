import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiUser, FiMoon, FiSun, FiUsers, FiSettings, FiSearch, FiMoreVertical, FiCheck, FiCheckCircle, FiPaperclip, FiImage, FiSmile, FiPhone, FiVideo, FiLogOut, FiMenu, FiTrash2 } from 'react-icons/fi';
import Auth from './Auth';
import './Chat.css';

// Usar la dirección IP actual para la conexión
const API_URL = 'http://192.168.0.110:3001';

const socket = io(API_URL, { 
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000
});

console.log('Conectando al servidor en:', API_URL);

function Chat() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatList, setChatList] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedChats = localStorage.getItem(`chatList_${savedUser || ''}`);
    return savedChats ? JSON.parse(savedChats) : ['General Chat'];
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [typingStatus, setTypingStatus] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastMessages, setLastMessages] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.body.className = darkMode ? 'dark-theme' : 'light-theme';
  }, [darkMode]);

  useEffect(() => {
    if (username) {
      localStorage.setItem('currentUser', username);
      localStorage.setItem(`chatList_${username}`, JSON.stringify(chatList));
    }
  }, [chatList, username]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔌 Iniciando conexión Socket.IO...');
      
      socket.on('connect', () => {
        console.log('✅ Conectado al servidor Socket.IO');
        console.log('ID del socket:', socket.id);
        console.log('Usuario autenticado:', username);
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error);
      });
      
      socket.on('disconnect', (reason) => {
        console.warn('⚠️ Desconectado del servidor. Razón:', reason);
      });
      
      socket.on('error', (error) => {
        console.error('❌ Error en el socket:', error);
      });

      socket.on('chatMessage', (msg) => {
        console.log('\n=== MENSAJE RECIBIDO EN FRONTEND ===');
        console.log('De:', msg.username);
        console.log('Para:', msg.recipient || 'Todos (General)');
        console.log('Contenido:', msg.text);
        console.log('Usuario actual:', username);
        console.log('Chat seleccionado:', selectedChat);
        
        // Verificar si el mensaje es para el usuario actual o es un mensaje general
        const isGeneralMessage = !msg.recipient;
        const isPrivateMessageForMe = msg.recipient === username;
        const isMyOwnMessage = msg.username === username && msg.recipient === selectedChat;
        
        const isForCurrentUser = isGeneralMessage || isPrivateMessageForMe || isMyOwnMessage;
        
        console.log('Es mensaje general:', isGeneralMessage);
        console.log('Es mensaje privado para mí:', isPrivateMessageForMe);
        console.log('Es mi propio mensaje de confirmación:', isMyOwnMessage);
        console.log('Mostrar mensaje:', isForCurrentUser);

        if (isForCurrentUser) {
          console.log('✅ Mostrando mensaje en el chat');
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages, msg];
            console.log('Mensajes actuales:', newMessages);
            return newMessages;
          });
          
          // Actualizar última vista de mensaje
          const chatKey = msg.recipient || 'General Chat';
          setLastMessages((prev) => {
            const newLastMessages = { ...prev, [msg.username]: msg.text };
            console.log('Últimos mensajes actualizados:', newLastMessages);
            return newLastMessages;
          });
          
          // Actualizar contador de mensajes no leídos
          if (msg.recipient && msg.recipient !== selectedChat && msg.username !== username) {
            setUnreadMessages((prev) => {
              const newUnread = { 
                ...prev, 
                [msg.username]: (prev[msg.username] || 0) + 1 
              };
              console.log('Contadores de no leídos actualizados:', newUnread);
              return newUnread;
            });
          }
          
          scrollToBottom();
        } else {
          console.log('❌ Mensaje filtrado, no se muestra');
        }
      });

      socket.on('usernameSet', (data) => {
        console.log('✅ Usuario establecido correctamente:', data);
        setUsers(data.userList);
        setRegisteredUsers(data.registeredUsers);
      });

      socket.on('userList', (userList) => {
        console.log('📋 Lista de usuarios conectados actualizada:', userList);
        setUsers(userList);
      });

      socket.on('registeredUsers', (registeredList) => {
        console.log('📋 Lista de usuarios registrados actualizada:', registeredList);
        setRegisteredUsers(registeredList);
      });
      
      // Manejar errores de nombre de usuario
      socket.on('usernameError', (error) => {
        console.error('❌ Error al establecer el nombre de usuario:', error);
        alert(error);
      });
      
      // Manejar errores generales
      socket.on('error', (error) => {
        console.error('❌ Error en la conexión:', error);
        alert(`Error de conexión: ${error}`);
      });

      socket.on('usernameError', (error) => {
        alert(error);
      });

      socket.on('typing', (data) => {
        if (data.user !== username && selectedChat === data.user) {
          setTypingStatus(`${data.user} is typing...`);
          setTimeout(() => setTypingStatus(''), 2000);
        }
      });

      return () => {
        socket.off('connect');
        socket.off('chatMessage');
        socket.off('userList');
        socket.off('registeredUsers');
        socket.off('usernameError');
        socket.off('typing');
      };
    }
  }, [username, selectedChat, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChat]);

  useEffect(() => {
    if (message && selectedChat) {
      socket.emit('typing', { user: username });
    }
  }, [message, username, selectedChat]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = registeredUsers.filter(user => user.toLowerCase().includes(searchQuery.toLowerCase()) && user !== username);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, registeredUsers, username]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginSuccess = (loggedInUsername) => {
    console.log('🚀 Iniciando sesión como:', loggedInUsername);
    
    // Primero establecemos el estado local
    setUsername(loggedInUsername);
    setIsAuthenticated(true);
    
    // Luego intentamos establecer el nombre de usuario en el servidor
    console.log('Enviando setUsername al servidor...');
    socket.emit('setUsername', loggedInUsername, (response) => {
      if (response && response.error) {
        console.error('Error al establecer el nombre de usuario:', response.error);
        alert(`Error al iniciar sesión: ${response.error}`);
        setIsAuthenticated(false);
        setUsername('');
        return;
      }
      
      console.log('✅ Nombre de usuario establecido en el servidor');
      // Cargar chats guardados después de que el nombre de usuario se haya establecido correctamente
      const savedChats = localStorage.getItem(`chatList_${loggedInUsername}`);
      setChatList(savedChats ? JSON.parse(savedChats) : ['General Chat']);
      
      // Seleccionar automáticamente el chat general
      setSelectedChat('General Chat');
    });
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleChatSelect = (chatUser) => {
    setSelectedChat(chatUser);
    setUnreadMessages((prev) => ({ ...prev, [chatUser]: 0 }));
    if (!chatList.includes(chatUser)) {
      setChatList((prev) => [...prev, chatUser]);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && username) {
      const msgObj = {
        text: message,
        recipient: selectedChat === 'General Chat' ? null : selectedChat,
        timestamp: new Date().toISOString(),
        read: false
      };
      socket.emit('chatMessage', msgObj);
      setMessage('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    socket.disconnect();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const filteredUsers = users.filter(user => user !== username);

  const handleDeleteChat = (chatToDelete) => {
    if (chatToDelete === 'General Chat') return;
    if (window.confirm(`¿Seguro que quieres eliminar el chat/contacto "${chatToDelete}"?`)) {
      setChatList((prev) => {
        const updated = prev.filter(chat => chat !== chatToDelete);
        localStorage.setItem(`chatList_${username}`, JSON.stringify(updated));
        if (selectedChat === chatToDelete) setSelectedChat(null);
        return updated;
      });
      setLastMessages((prev) => {
        const copy = { ...prev };
        delete copy[chatToDelete];
        return copy;
      });
      setUnreadMessages((prev) => {
        const copy = { ...prev };
        delete copy[chatToDelete];
        return copy;
      });
    }
  };

  const getVisibleMessages = () => {
    if (!selectedChat) return [];
    
    if (selectedChat === 'General Chat') {
      // Mostrar mensajes generales (sin destinatario)
      return messages.filter(msg => !msg.recipient);
    } else {
      // Mostrar mensajes privados entre el usuario actual y el chat seleccionado
      return messages.filter(msg => {
        // Mensaje enviado por el usuario actual al chat seleccionado
        const isSentByMe = msg.username === username && msg.recipient === selectedChat;
        // Mensaje recibido del chat seleccionado (el remitente es el chat seleccionado y el destinatario es el usuario actual)
        const isReceivedFromSelected = msg.username === selectedChat && msg.recipient === username;
        // Mensaje enviado por el usuario actual y recibido por el chat seleccionado (caso de confirmación)
        const isConfirmation = msg.username === username && msg.recipient === selectedChat;
        
        return isSentByMe || isReceivedFromSelected || isConfirmation;
      });
    }
  };

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} darkMode={darkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="main-chat-container-fixed">
      <div className="sidebar-fixed">
        <div className={`d-flex align-items-center justify-content-between p-3 border-bottom ${darkMode ? 'bg-secondary' : 'bg-white'} shadow-sm`} style={{height: '64px'}}>
          <div className="d-flex align-items-center">
            <h3 className="mb-0 fw-bold">SecureChat</h3>
          </div>
          <div>
            <button className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'} me-2`} onClick={toggleTheme}>
              {darkMode ? <FiSun size={22} /> : <FiMoon size={22} />}
            </button>
            <button className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'} me-2`}>
              <FiSettings size={22} />
            </button>
            <button className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'}`} onClick={handleLogout}>
              <FiLogOut size={22} />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="input-group mb-3 rounded-pill overflow-hidden shadow-sm">
            <span className={`input-group-text ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} border-0 rounded-pill pe-0`} id="basic-addon1"><FiSearch size={20} /></span>
            <input 
              type="text" 
              className={`form-control ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} border-0 rounded-pill ps-2 py-2`} 
              placeholder="Search conversations" 
              style={{ fontSize: '0.95rem' }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <div className={`dropdown-menu d-block position-absolute w-100 ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`} style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
              {searchResults.map((user, index) => (
                <button
                  key={index}
                  className={`dropdown-item ${darkMode ? 'text-light' : 'text-dark'}`}
                  onClick={() => {
                    handleChatSelect(user);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  {user}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="list-group list-group-flush" style={{ fontSize: '0.95rem', overflowY: 'auto', flex: 1, height: 'calc(100vh - 128px)' }}>
          {chatList.map((chat, index) => (
            <motion.div key={index} whileHover={{ scale: 1.01 }} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className={`list-group-item list-group-item-action text-start flex-grow-1 ${selectedChat === chat ? (darkMode ? 'bg-secondary text-light' : 'bg-primary bg-opacity-10 text-primary') : (darkMode ? 'bg-dark text-light' : 'bg-light text-dark')} border-0 py-3 px-3`}
                onClick={() => handleChatSelect(chat)}
                style={{ borderRadius: 0 }}
              >
                <div className="d-flex align-items-center">
                  <div className="avatar me-3" style={{ backgroundColor: selectedChat === chat ? '#25D366' : '#009688', width: '50px', height: '50px', fontSize: '1.2rem' }}>{chat.charAt(0).toUpperCase()}</div>
                  <div className="flex-grow-1 overflow-hidden">
                    <h6 className="mb-1 text-truncate fw-medium" style={{ fontSize: '1.05rem' }}>{chat}</h6>
                    <small className={`text-muted text-truncate d-block ${selectedChat === chat ? 'text-primary' : ''}`} style={{ fontSize: '0.85rem' }}>{lastMessages[chat] || (chat === 'General Chat' ? 'Chat with everyone...' : 'Last message preview...')}</small>
                  </div>
                  <div className="d-flex flex-column align-items-end">
                    <small className={`text-muted ms-2 ${selectedChat === chat ? 'text-primary' : ''}`} style={{ fontSize: '0.75rem' }}></small>
                    {unreadMessages[chat] > 0 && <span className="badge bg-danger rounded-pill mt-1" style={{ fontSize: '0.7rem', padding: '0.25em 0.5em' }}>{unreadMessages[chat]}</span>}
                  </div>
                </div>
              </button>
              {chat !== 'General Chat' && (
                <button
                  className="btn btn-icon ms-1"
                  title="Eliminar chat/contacto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat);
                  }}
                  style={{ color: darkMode ? '#e57373' : '#c62828', background: 'none', border: 'none', padding: '8px', borderRadius: '50%' }}
                >
                  <FiTrash2 size={20} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="col-md-8 col-lg-9 p-0 d-flex flex-column" style={{ height: '100vh' }}>
        {selectedChat ? (
          <>
            <div className={`d-flex align-items-center justify-content-between p-3 border-bottom ${darkMode ? 'bg-secondary text-light' : 'bg-white text-dark'} shadow-sm`}>
              <div className="d-flex align-items-center">
                <div className="avatar me-3" style={{ backgroundColor: '#009688', width: '45px', height: '45px', fontSize: '1.1rem' }}>{selectedChat === 'General Chat' ? 'G' : selectedChat.charAt(0).toUpperCase()}</div>
                <div>
                  <h5 className="mb-0 fw-medium" style={{ fontSize: '1.2rem' }}>{selectedChat}</h5>
                  <small className={`text-muted ${darkMode ? 'text-light' : ''}`} style={{ fontSize: '0.8rem' }}>{typingStatus || (selectedChat === 'General Chat' ? 'Everyone is here' : 'Online')}</small>
                </div>
              </div>
              <div>
                <button className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'} me-2`}><FiPhone size={22} /></button>
                <button className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'} me-2`}><FiVideo size={22} /></button>
                <button className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'}`}><FiMoreVertical size={22} /></button>
              </div>
            </div>
            <div
              ref={chatContainerRef}
              className={`flex-grow-1 p-3 overflow-auto ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`}
              style={{ backgroundImage: darkMode ? 'none' : 'none', backgroundColor: darkMode ? 'var(--chat-background-dark)' : 'var(--chat-background-light)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
            >
              <div className="text-center mb-4">
                <small className={`text-muted d-inline-block px-3 py-1 rounded-pill ${darkMode ? 'bg-secondary' : 'bg-white'}`} style={{ fontSize: '0.75rem' }}>Today</small>
              </div>
              <AnimatePresence>
                {getVisibleMessages().map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`d-flex ${msg.username === username ? 'justify-content-end' : 'justify-content-start'} mb-3`}
                  >
                    <div className={`message-bubble ${msg.username === username ? 'sent' : 'received'} ${darkMode ? 'dark' : 'light'} p-3 rounded-3 shadow-sm`}>
                      <div className="d-flex align-items-end">
                        <p className="mb-0 me-3" style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.text}</p>
                        <small className={`text-muted d-flex align-items-center ${darkMode ? 'text-light' : ''}`} style={{ fontSize: '0.7rem' }}>
                          {formatTime(msg.timestamp)}
                          {msg.username === username && (
                            msg.read ? <FiCheckCircle className="ms-1 text-primary" size={14} /> : <FiCheck className="ms-1" size={14} />
                          )}
                        </small>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className={`d-flex p-3 ${darkMode ? 'bg-secondary' : 'bg-white'} shadow-sm`}>
              <div className="d-flex align-items-center me-2 flex-grow-1">
                <button type="button" className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'} me-1`}><FiSmile size={22} /></button>
                <input
                  type="text"
                  className={`form-control form-control-lg me-2 ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'} border-0 rounded-pill py-2`}
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ boxShadow: 'none', fontSize: '0.95rem' }}
                />
                <button type="button" className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'} me-1`}><FiPaperclip size={22} /></button>
                <button type="button" className={`btn btn-icon ${darkMode ? 'text-light' : 'text-dark'} me-1`}><FiImage size={22} /></button>
              </div>
              <button type="submit" className="btn btn-primary btn-lg rounded-pill py-2 px-3"><FiSend size={22} /></button>
            </form>
          </>
        ) : (
          <div className={`d-flex flex-column justify-content-center align-items-center flex-grow-1 ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`} style={{ height: '100%', backgroundImage: darkMode ? 'none' : 'none', backgroundColor: darkMode ? 'var(--chat-background-dark)' : 'var(--chat-background-light)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <FiUsers size={80} className="mb-3 text-muted" style={{ opacity: 0.6 }} />
            <h3 className="mb-2 fw-medium">Welcome to SecureChat</h3>
            <h4 className="mb-3 fw-medium" style={{ fontSize: '1.3rem' }}>Select a chat to start messaging</h4>
            <p className="text-muted" style={{ fontSize: '0.95rem', maxWidth: '400px', textAlign: 'center' }}>Choose from your existing conversations, start a new one, or create a group chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat; 