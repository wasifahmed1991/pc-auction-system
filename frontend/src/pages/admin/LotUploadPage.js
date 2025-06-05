import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { uploadLotsFile } from '../../services/adminAuctionService';

function LotUploadPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await uploadLotsFile(auctionId, formData);
      setSuccessMessage(response.data.message || 'Lots uploaded successfully!');
      setFile(null); // Clear file input
      // Optionally navigate back or refresh auction details
      // navigate(`/admin/auctions/edit/${auctionId}`);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors) && apiErrors.length > 0) {
        setError('File processing errors: ' + apiErrors.join('; '));
      } else {
        setError(err.response?.data?.message || 'Failed to upload lots file.');
      }
      console.error('Lot upload error:', err);
    }
    setLoading(false);
  };

  return (
    <div className='page-container'>
      <h2>Upload Lots for Auction ID: {auctionId}</h2>
      <p>Upload a CSV or XLSX file with lot information. The file should include columns like 'Lot ID', 'Device Name', 'Details', 'Condition', 'Quantity', 'Minimum Bid'.</p>
      <form onSubmit={handleSubmit} className='form-container' style={{width: '400px'}}>
        {error && <p className='error-message' style={{color: 'red', whiteSpace: 'pre-wrap'}}>{error}</p>}
        {successMessage && <p style={{color: 'green'}}>{successMessage}</p>}
        <div>
          <label htmlFor='lotFile'>Lot File (CSV/XLSX):</label>
          <input type='file' id='lotFile' accept='.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel' onChange={handleFileChange} />
        </div>
        <button type='submit' disabled={loading || !file}>{loading ? 'Uploading...' : 'Upload File'}</button>
      </form>
      <div style={{marginTop: '20px'}}>
         <Link to={`/admin/auctions/edit/${auctionId}`} className='button-link' style={{backgroundColor: 'grey'}}>Back to Auction Details</Link>
         <Link to='/admin/auctions' className='button-link' style={{backgroundColor: 'grey', marginLeft: '10px'}}>Back to Auction List</Link>
      </div>
    </div>
  );
}

export default LotUploadPage;
