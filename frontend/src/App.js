// src/App.js
import React, { useState } from 'react';
import AddUser from './components/AddUser';
import UserList from './components/UserList';

function App() {
  const [refresh, setRefresh] = useState(false);

  const handleUserAdded = () => {
    setRefresh(!refresh);
  };

  return (
    <div>
      <header style={{
        backgroundColor: '#282c34',
        padding: '20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1>Quản lý Users - Group1 Project</h1>
        <p>Kết nối MongoDB Atlas</p>
      </header>
      
      <main>
        <AddUser onUserAdded={handleUserAdded} />
        <UserList key={refresh} />
      </main>
    </div>
  );
}

export default App;