import React, { useEffect, useState } from 'react';
import { getAllCarriers, createCarrier } from '../../services/adminAuctionService';
import '../../styles/TableStyles.css'; // Reuse existing styles

function CarrierForm({ onCarrierCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Carrier name cannot be empty.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createCarrier({ name });
      setName('');
      if(onCarrierCreated) onCarrierCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create carrier.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className='form-container' style={{width: '300px', marginBottom: '20px'}}>
      <h4>Add New Carrier</h4>
      {error && <p className='error-message' style={{color: 'red'}}>{error}</p>}
      <input type='text' placeholder='Carrier Name' value={name} onChange={(e) => setName(e.target.value)} required />
      <button type='submit' disabled={loading}>{loading ? 'Saving...' : 'Add Carrier'}</button>
    </form>
  );
}

function CarrierListPage() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCarriers = async () => {
    setLoading(true);
    try {
      const response = await getAllCarriers();
      setCarriers(response.data.carriers);
    } catch (err) { setError('Failed to fetch carriers.'); console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCarriers(); }, []);

  if (loading) return <p>Loading carriers...</p>;

  return (
    <div className='page-container'>
      <h2>Carrier Management</h2>
      {error && <p className='error-message' style={{color: 'red'}}>{error}</p>}
      <CarrierForm onCarrierCreated={fetchCarriers} />
      <table className='data-table'>
        <thead><tr><th>ID</th><th>Name</th><th>Created At</th></tr></thead>
        <tbody>
          {carriers.map(carrier => (
            <tr key={carrier.carrier_id}>
              <td>{carrier.carrier_id}</td><td>{carrier.name}</td><td>{new Date(carrier.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default CarrierListPage;
