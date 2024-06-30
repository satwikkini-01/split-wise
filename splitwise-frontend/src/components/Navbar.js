import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Navbar.css'

const Navbar = () => {
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const response = await axios.get('https://split-wise-gvpp.onrender.com/api/balance');
        setBalances(response.data);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchBalances();
  }, []);

  return (
    <div className="Main-Header">
      <header className="App-header">
        <h1>Splitwise Clone</h1>
        {balances.map((userBalance) => (
          <div key={userBalance.userId} className="balance-info">
            <p>User ID: {userBalance.userId}</p>
            <p>Your Balance: ₹{parseFloat(userBalance.balance).toFixed(2)}</p>
            <p>Total Owed: ₹{parseFloat(userBalance.owed).toFixed(2)}</p>
          </div>
        ))}
      </header>
    </div>
    
  );
};

export default Navbar;
