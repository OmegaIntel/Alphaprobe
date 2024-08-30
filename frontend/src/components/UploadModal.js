import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axiosInstance from '../axiosConfig';
import '../App.css';

Modal.setAppElement('#root');

const UploadModal = ({ isOpen, onRequestClose }) => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState(false);
  const [company, setCompany] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token'); // Get the auth token from localStorage
        const response = await axiosInstance.get('/companies', {
          headers: {
            'Authorization': `Bearer ${token}`, // Pass the token in the Authorization header
          },
        });
        setCompanies(response.data.companies);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    setLoading(true);
    setUploadStatus('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company', company);
  
    const token = localStorage.getItem('token');
  
    try {
      const response = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`, // Pass the token in the Authorization header
        },
      });
      if (response.status === 200) {
        setUploadStatus('File uploaded successfully');
        // Keep the modal open and show the success message
      } else {
        setUploadStatus('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Upload File"
      className="upload-modal"
      overlayClassName="upload-modal-overlay"
    >
      <button className="modal-close-button" onClick={onRequestClose}>×</button>
      <h2>Upload a File</h2>
      <div className="input-container">
        <div className="toggle-container">
          <label className="switch">
            <input 
              type="checkbox" 
              checked={newCompany} 
              onChange={() => setNewCompany(!newCompany)} 
            />
            <span className="slider round"></span>
          </label>
          <label>Add New Company</label>
        </div>
        {newCompany ? (
          <input
            type="text"
            placeholder="Enter new company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        ) : (
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
        )}
        <input type="file" onChange={handleFileChange} />
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <button onClick={handleUpload}>Upload</button>
        )}
        {uploadStatus && <div className="upload-status">{uploadStatus}</div>}
      </div>
    </Modal>
  );
};

export default UploadModal;
