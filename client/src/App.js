import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaFilePdf, FaFileImage, FaFileAlt, FaFileWord, FaFileExcel } from 'react-icons/fa';
import { MdInsertDriveFile, MdDownload } from 'react-icons/md';

const App = () => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('https://o8g4lnzug2.execute-api.us-east-1.amazonaws.com/test/list');
        setFiles(JSON.parse(response.data.body));
      } catch (error) {
        console.error('Error fetching file list', error);
      }
    };

    fetchFiles();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const url = 'https://o8g4lnzug2.execute-api.us-east-1.amazonaws.com/test/upload';

    try {
      setUploading(true);
      setSuccessMessage('');
      setErrorMessage('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.put(url, formData, {
        headers: {
          'File-name': file.name,
          'Content-Type': 'multipart/form-data',
        }
      });

      setUploading(false);
      setSuccessMessage('File uploaded successfully!');
      console.log('File uploaded successfully', response.data);
      
      // Refresh the file list
      const updatedFiles = await axios.get('https://o8g4lnzug2.execute-api.us-east-1.amazonaws.com/test/list');
      setFiles(JSON.parse(updatedFiles.data.body));
      setFile(null);
      setFilePreview(null);
    } catch (error) {
      setUploading(false);
      setErrorMessage('Error uploading file');
      console.error('Error uploading file', error);
    }
  };

  const handleFileDownload = async (objectKey) => {
    const url = `https://o8g4lnzug2.execute-api.us-east-1.amazonaws.com/test/download?object_key=${objectKey}`;

    try {
      const response = await axios.get(url);
      const fileContent = response.data.body;
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${fileContent}`;
      link.download = objectKey;
      link.click();
    } catch (error) {
      console.error('Error downloading file', error);
    }
  };

  const getFileIcon = (fileName) => {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    switch (fileExtension) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <FaFileImage className="text-blue-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-700" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-500" />;
      case 'txt':
        return <FaFileAlt className="text-gray-500" />;
      default:
        return <MdInsertDriveFile className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-gray-100 p-4 space-y-8 lg:space-y-0 lg:space-x-8">
      <div className="bg-white shadow-md rounded-lg p-8 w-full lg:w-1/2 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-center">Upload Your File</h1>
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
        {file && (
          <div className="mt-4 w-full text-center">
            {filePreview ? (
              <img src={filePreview} alt="File Preview" className="max-w-full h-auto rounded-lg shadow-md" />
            ) : (
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg">
                <span className="text-gray-500">{file.name}</span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleFileUpload}
          disabled={uploading}
          className="mt-4 w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
        {successMessage && <p className="mt-4 text-green-500 text-center">{successMessage}</p>}
        {errorMessage && <p className="mt-4 text-red-500 text-center">{errorMessage}</p>}
      </div>
      <div className="bg-white shadow-md rounded-lg p-8 w-full lg:w-1/2">
        <h1 className="text-2xl font-bold mb-6 text-center">Files in S3 Bucket</h1>
        {files.length > 0 ? (
          <ul className="space-y-4">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg shadow-sm transition-all duration-300"
              >
                <span className="flex items-center">
                  <span className="mr-2">{getFileIcon(file)}</span>
                  <span>{file}</span>
                </span>
                <button
                  onClick={() => handleFileDownload(file)}
                  className="ml-4 py-1 px-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                >
                  <MdDownload />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No files found in S3 bucket</p>
        )}
      </div>
    </div>
  );
};

export default App;
