import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCarriers } from '../../services/adminAuctionService';

function AuctionForm({ onSubmit, initialData = {}, isEditMode = false }) {
  const [formData, setFormData] = useState({
    name: '', carrier_id: '', start_time: '', end_time: '',
    status: 'scheduled', grading_guide: '', is_visible: false,
  });
  const [carriers, setCarriers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCarriers = async () => {
      try { const response = await getAllCarriers(); setCarriers(response.data.carriers); } catch (err) { console.error('Failed to fetch carriers', err); setError('Failed to load carriers for selection.'); }
    };
    fetchCarriers();
  }, []);

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || '',
        carrier_id: initialData.carrier_id || '',
        start_time: initialData.start_time ? new Date(initialData.start_time).toISOString().substring(0, 16) : '',
        end_time: initialData.end_time ? new Date(initialData.end_time).toISOString().substring(0, 16) : '',
        status: initialData.status || 'scheduled',
        grading_guide: initialData.grading_guide || '',
        is_visible: initialData.is_visible === undefined ? false : initialData.is_visible,
      });
    }
  }, [initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...formData, carrier_id: parseInt(formData.carrier_id) };
      if (!payload.start_time) payload.start_time = new Date().toISOString(); // Default start_time if not set
      await onSubmit(payload);
      navigate('/admin/auctions');
    } catch (err) { setError(err.response?.data?.message || 'Operation failed.'); console.error(err); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className='form-container' style={{width: '500px'}}>
      <h3>{isEditMode ? 'Edit Auction' : 'Create New Auction'}</h3>
      {error && <p className='error-message' style={{color: 'red'}}>{error}</p>}
      <div><label>Name:</label><input type='text' name='name' value={formData.name} onChange={handleChange} required /></div>
      <div><label>Carrier:</label><select name='carrier_id' value={formData.carrier_id} onChange={handleChange} required>
        <option value=''>Select Carrier</option>
        {carriers.map(c => <option key={c.carrier_id} value={c.carrier_id}>{c.name}</option>)}</select></div>
      <div><label>Start Time (Optional, defaults to now):</label><input type='datetime-local' name='start_time' value={formData.start_time} onChange={handleChange} /></div>
      <div><label>End Time:</label><input type='datetime-local' name='end_time' value={formData.end_time} onChange={handleChange} required /></div>
      <div><label>Status:</label><select name='status' value={formData.status} onChange={handleChange}>
        <option value='scheduled'>Scheduled</option><option value='active'>Active</option><option value='closed'>Closed</option><option value='cancelled'>Cancelled</option></select></div>
      <div><label>Grading Guide:</label><textarea name='grading_guide' value={formData.grading_guide} onChange={handleChange}></textarea></div>
      <div><label><input type='checkbox' name='is_visible' checked={formData.is_visible} onChange={handleChange} /> Visible to Clients</label></div>
      <button type='submit' disabled={loading}>{loading ? 'Saving...' : (isEditMode ? 'Update Auction' : 'Create Auction')}</button>
      <button type='button' onClick={() => navigate('/admin/auctions')} style={{marginTop: '10px', backgroundColor: 'grey'}}>Cancel</button>
    </form>
  );
}
export default AuctionForm;
