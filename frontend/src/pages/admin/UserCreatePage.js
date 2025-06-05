import React from 'react';
import UserForm from '../../components/admin/UserForm';
import { createUser } from '../../services/adminUserService';

function UserCreatePage() {
  return <UserForm onSubmit={createUser} />;
}
export default UserCreatePage;
