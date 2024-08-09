import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import '../App.css';

const Upload = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState('');
  const [company, setCompany] = useState('');
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('descriptive');
  const [addNewCompany, setAddNewCompany] = useState(false);

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

  const registerCompany = async (name) => {
    try {
      const response = await axiosInstance.post('/register_company', { company_name: name });
      return response.status === 200;
    } catch (error) {
      console.error('Error registering company:', error);
      return false;
    }
  };

  const uploadFile = async () => {
    try {
      if (addNewCompany && newCompany) {
        const success = await registerCompany(newCompany);
        if (success) {
          setCompany(newCompany);
        } else {
          alert('Failed to register new company.');
          return;
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('company', company);
      formData.append('file_type', fileType);

      const response = await axiosInstance.post('/upload', formData);
      if (response.status === 200) {
        alert('File uploaded successfully.');
      } else {
        alert('Failed to upload the file.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload the file.');
    }
  };

  return (
    <div className="main-container">
      <h2>Upload a File to API</h2>
      <div className="input-container">
        <label>
          <input
            type="checkbox"
            checked={addNewCompany}
            onChange={() => setAddNewCompany(!addNewCompany)}
          />
          Add a new company
        </label>
        {addNewCompany ? (
          <input
            type="text"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="New Company Name"
            className="input-text"
          />
        ) : (
          <select
            onChange={(e) => setCompany(e.target.value)}
            value={company}
            className="input-select"
          >
            <option value="" disabled>Select a company</option>
            {companies.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        )}
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="input-file" />
        <select onChange={(e) => setFileType(e.target.value)} value={fileType} className="input-select">
          <option value="descriptive">Descriptive</option>
          <option value="financial">Financial</option>
        </select>
        <button onClick={uploadFile} className="upload-button">
          Upload File
        </button>
      </div>
    </div>
  );
};

export default Upload;
