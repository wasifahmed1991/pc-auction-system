import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, deleteUser } from '../../services/adminUserService';
import '../../styles/TableStyles.css'; // Assuming a common table style

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
      console.error('Fetch users error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        fetchUsers(); // Refresh list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user.');
        console.error('Delete user error:', err);
      }
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className='page-container'>
      <h2>User Management</h2>
      {error && <p className='error-message' style={{color: 'red'}}>{error}</p>}
      <Link to='/admin/users/new' className='button-link'>Add New User</Link>
      <table className='data-table'>
        <thead>
          <tr>
            <th>Email</th>
            <th>Company Name</th>
            <th>Role</th>
            <th>Deposit Status</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users && users.length > 0 ? users.map(user => (
            <tr key={user.user_id}>
              <td>{user.email}</td>
              <td>{user.company_name || 'N/A'}</td>
              <td>{user.role}</td>
              <td>{user.deposit_status}</td>
              <td>{user.is_active ? 'Yes' : 'No'}</td>
              <td>
                <Link to={`/admin/users/edit/${user.user_id}`} className='action-link edit-link'>Edit</Link>
                <button onClick={() => handleDelete(user.user_id)} className='action-link delete-link'>Delete</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan='6'>No users found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default UserListPage;
