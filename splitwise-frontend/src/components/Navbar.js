import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Navbar = () => {
  const [balance, setBalance] = useState(0);
  const [owed, setOwed] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/balance');
        const balance = response.data.balance || 0;
        const owed = response.data.owed || 0;
        setBalance(balance);
        setOwed(owed);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
  }, []);

  return (
    <header className="App-header">
      <h1>Splitwise Clone</h1>
      <div className="balance-info">
        <p>Your Balance: ₹{parseFloat(balance).toFixed(2)}</p>
        <p>Total Owed: ₹{parseFloat(owed).toFixed(2)}</p>
      </div>
    </header>
  );
};

export default Navbar;
