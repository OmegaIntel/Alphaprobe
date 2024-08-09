import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import '../App.css';
import UploadModal from './UploadModal';
import { marked } from 'marked';

const Chat = () => {
  const [companies, setCompanies] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axiosInstance.get('/companies');
        setCompanies(response.data.companies);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = { role: 'user', content: message };
    const updatedConversation = [...conversation, newMessage];
    setConversation(updatedConversation);
    setMessage('');
    setIsTyping(true);

    try {
      const response = await axiosInstance.post('/chat', {
        company,
        conversation: updatedConversation,
      });

      const aiResponse = response.data.response;
      setConversation((prevConversation) => [
        ...prevConversation,
        { role: 'ai', content: aiResponse },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setConversation((prevConversation) => [
        ...prevConversation,
        { role: 'ai', content: 'An error occurred while processing your request.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [conversation, isTyping]);

  return (
    <div className="main-container">
      <div className="header">
        Chat with Alphaprobe
      </div>
      <div className="chat-container">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}-message`}>
            {msg.role === 'ai' ? (
              <div
                dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
              />
            ) : (
              <pre>{msg.content}</pre>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="message ai-message typing-animation">
            <span></span><span></span><span></span>
          </div>
        )}
      </div>
      <div className="input-container">
        <select onChange={(e) => setCompany(e.target.value)} value={company}>
          <option value="" disabled>
            Select a company
          </option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="1"
          disabled={isTyping}
        />
        <button onClick={sendMessage} disabled={isTyping}>
          {isTyping ? 'Sending...' : 'Send Message'}
        </button>
      </div>
      <UploadModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Chat;
