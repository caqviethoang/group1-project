// frontend/src/App.js
import React, { useState } from 'react';
import UserList from './components/UserList';
import AddUser from './components/AddUser';
import './App.css';

function App() {
  const [refresh, setRefresh] = useState(false);

  const handleUserAdded = () => {
    setRefresh(prev => !prev);
  };

  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1>Quản lý Users</h1>
      <AddUser onUserAdded={handleUserAdded} />
      <UserList key={refresh} />
    </div>
  );
}

export default App;