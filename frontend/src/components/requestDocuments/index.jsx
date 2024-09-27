import React, { useState } from 'react';
import Modal from 'react-modal';
import './DiligenceDocuments.css';
import { CloseOutlined, DownloadOutlined, PaperClipOutlined } from "@ant-design/icons";

Modal.setAppElement('#root');

const DiligenceDocumentsModal = ({ isOpen, onRequestClose }) => {
    const [activeSection, setActiveSection] = useState('File');
    const [files, setFiles] = useState({
        File: [],
        'Corporate & Legal': [],
        'Financial & Tax': [],
        'Operations & Technology': [],
        'HR & Employee': [],
        'Sales & Marketing': []
    });
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const validFiles = selectedFiles.filter(file => file.size <= 25 * 1024 * 1024); // 25MB limit
        const invalidFiles = selectedFiles.filter(file => file.size > 25 * 1024 * 1024);
    
        if (invalidFiles.length > 0) {
            setError(`Some files are too large. The maximum file size is 25MB.`);
        } else {
            setError(null); // Clear error if all files are valid
        }
    
        if (validFiles.length > 0) {
            setFiles(prevFiles => ({
                ...prevFiles,
                [activeSection]: [...prevFiles[activeSection], ...validFiles]
            }));
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        const validFiles = droppedFiles.filter(file => file.size <= 25 * 1024 * 1024); // 25MB limit
        const invalidFiles = droppedFiles.filter(file => file.size > 25 * 1024 * 1024);
    
        if (invalidFiles.length > 0) {
            setError(`Some files are too large. The maximum file size is 25MB.`);
        } else {
            setError(null); // Clear error if all files are valid
        }
    
        if (validFiles.length > 0) {
            setFiles(prevFiles => ({
                ...prevFiles,
                [activeSection]: [...prevFiles[activeSection], ...validFiles]
            }));
        }
    };

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handleSubmit = () => {
        if (!email) {
            setError('Please enter a valid email.');
            return;
        }

        console.log("Sending email request to: ", email);
    };

    const renderSectionContent = () => {
        return (
            <div>
                <div className='text-base font-bold'>Upload Deal documents or send a request to Management</div>
                {files[activeSection].length === 0 ? (
                    <div
                        className="file-dropzone mt-5 flex flex-col p-5"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <DownloadOutlined />
                        <input
                            type="file"
                            onChange={handleFileChange}
                            multiple
                            style={{ display: 'none' }}
                            id="fileInput"
                        />
                        <label htmlFor="fileInput" className="file-drop-label">
                            <div className='my-2'>Drag and Drop file(s) here</div>
                            <div className='my-2'>or</div>
                            <div className='bg-[#303038] p-2 rounded my-2 font-bold'>Browse for file(s)</div>
                        </label>
                        <div className='text-base font-extralight mb-1'>File size limit: 25MB</div>
                    </div>
                ) : (
                    <div className="file-list overflow-auto">
                        <ul>
                            {files[activeSection].map((file, index) => (
                                <li key={index} className='flex flex-row justify-between p-1 px-2 bg-[#303038] rounded mb-3'>
                                    <div className='flex flex-row'>
                                        <div className='mr-2'>{index + 1}.
                                        </div>
                                        <div>
                                            {file.name}
                                        </div>
                                    </div>
                                    <PaperClipOutlined />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => {
                onRequestClose(); setFiles({
                    File: [],
                    'Corporate & Legal': [],
                    'Financial & Tax': [],
                    'Operations & Technology': [],
                    'HR & Employee': [],
                    'Sales & Marketing': []
                })
            }}
            className="diligence-modal"
            overlayClassName="diligence-modal-overlay"
        >
            <div className='flex flex-row justify-between pb-2 mb-2'>
                <div className='text-xl font-bold'>Diligence Documents</div>
                <CloseOutlined className='cursor-pointer' onClick={() => {
                    onRequestClose(); setFiles({
                        File: [],
                        'Corporate & Legal': [],
                        'Financial & Tax': [],
                        'Operations & Technology': [],
                        'HR & Employee': [],
                        'Sales & Marketing': []
                    });
                }} />
            </div>
            <div className="diligence-documents flex-grow flex flex-row h-full">

                <div className="side-navigation">
                    <ul>
                        <li
                            className={activeSection === 'File' ? 'active' : ''}
                            onClick={() => setActiveSection('File')}
                        >
                            File
                        </li>
                        <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                        <li
                            className={activeSection === 'Corporate & Legal' ? 'active' : ''}
                            onClick={() => setActiveSection('Corporate & Legal')}
                        >
                            Corporate & Legal
                        </li>
                        <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                        <li
                            className={activeSection === 'Financial & Tax' ? 'active' : ''}
                            onClick={() => setActiveSection('Financial & Tax')}
                        >
                            Financial & Tax
                        </li>
                        <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                        <li
                            className={activeSection === 'Operations & Technology' ? 'active' : ''}
                            onClick={() => setActiveSection('Operations & Technology')}
                        >
                            Operations & Technology
                        </li>
                        <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                        <li
                            className={activeSection === 'HR & Employee' ? 'active' : ''}
                            onClick={() => setActiveSection('HR & Employee')}
                        >
                            HR & Employee
                        </li>
                        <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                        <li
                            className={activeSection === 'Sales & Marketing' ? 'active' : ''}
                            onClick={() => setActiveSection('Sales & Marketing')}
                        >
                            Sales & Marketing
                        </li>
                        <hr className="h-px bg-gray-200 border-0 dark:bg-[#36363F]"></hr>
                    </ul>
                </div>

                <div className="content-section p-3 w-[73%] h-[92%] rounded">
                    {renderSectionContent()}
                    <div className="request-section">
                        <div className='font-bold'>Send a Consolidate Request List to Management</div>
                        <div className=' my-2 flex flex-row justify-between mt-8'>
                            <div className='flex flex-row items-center'>
                                <div className='mr-2'>Email Address</div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className='email-input px-2 border border-[#46464f]'
                                />
                                {error && <p className="error-text">{error}</p>}
                            </div>
                            <button onClick={handleSubmit} className='bg-[#eaeaea] text-black px-3 rounded'>
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DiligenceDocumentsModal;
