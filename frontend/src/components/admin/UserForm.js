import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserForm({ onSubmit, initialData = {}, isEditMode = false }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company_name: '',
    role: 'client',
    deposit_status: 'pending',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        email: initialData.email || '',
        password: '', // Password typically not pre-filled for edit
        company_name: initialData.company_name || '',
        role: initialData.role || 'client',
        deposit_status: initialData.deposit_status || 'pending',
        is_active: initialData.is_active === undefined ? true : initialData.is_active,
      });
    }
  }, [initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Create a payload, omitting password if it's edit mode and password is blank
      const payload = { ...formData };
      if (isEditMode && !payload.password) {
        delete payload.password;
      }
      if (!isEditMode && !payload.password) { // Password required for new user
        setError('Password is required for new users.');
        setLoading(false);
        return;
      }
      await onSubmit(payload);
      navigate('/admin/users');
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update user.' : 'Failed to create user.'));
      console.error('User form error:', err);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className='form-container' style={{width: '400px'}}>
      <h3>{isEditMode ? 'Edit User' : 'Create New User'}</h3>
      {error && <p className='error-message' style={{color: 'red'}}>{error}</p>}
      <div><label>Email:</label><input type='email' name='email' value={formData.email} onChange={handleChange} required /></div>
      <div><label>Password ({isEditMode ? 'leave blank to keep current' : 'required'}):</label><input type='password' name='password' value={formData.password} onChange={handleChange} /></div>
      <div><label>Company Name:</label><input type='text' name='company_name' value={formData.company_name} onChange={handleChange} /></div>
      <div><label>Role:</label><select name='role' value={formData.role} onChange={handleChange}>
        <option value='client'>Client</option>
        <option value='admin'>Admin</option>
      </select></div>
      <div><label>Deposit Status:</label><select name='deposit_status' value={formData.deposit_status} onChange={handleChange}>
        <option value='pending'>Pending</option>
        <option value='on_file'>On File</option>
        <option value='cleared'>Cleared</option>
      </select></div>
      <div><label><input type='checkbox' name='is_active' checked={formData.is_active} onChange={handleChange} /> Active</label></div>
      <button type='submit' disabled={loading}>{loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}</button>
      <button type='button' onClick={() => navigate('/admin/users')} style={{marginTop: '10px', backgroundColor: 'grey'}}>Cancel</button>
    </form>
  );
}

export default UserForm;
