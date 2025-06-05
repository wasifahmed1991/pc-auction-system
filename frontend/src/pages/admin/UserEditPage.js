import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import UserForm from '../../components/admin/UserForm';
import { getUserById, updateUser } from '../../services/adminUserService';

function UserEditPage() {
  const { userId } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserById(userId);
        setInitialData(response.data);
      } catch (err) {
        setError('Failed to fetch user data.');
        console.error(err);
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId]);

  const handleSubmit = (userData) => {
    return updateUser(userId, userData);
  };

  if (loading) return <p>Loading user data...</p>;
  if (error) return <p style={{color: 'red'}}>{error}</p>;
  if (!initialData) return <p>User not found.</p>;

  return <UserForm onSubmit={handleSubmit} initialData={initialData} isEditMode={true} />;
}
export default UserEditPage;
