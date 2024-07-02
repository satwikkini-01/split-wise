import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
    const [balances, setBalances] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Function to fetch balances from the backend

    // For publish: 'https://split-wise-gvpp.onrender.com/api/balance'
    // For testing: 'http://localhost:3001/api/balance'

    const fetchBalances = async () => {
        try {
            const response = await axios.get('https://split-wise-gvpp.onrender.com/api/balance');
            setBalances(response.data);
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    };

    // Fetch balances from the backend on component mount
    useEffect(() => {
        fetchBalances();
    }, []);

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Function to handle clearing settlements for a user
    const handlePaidClick = async (userId) => {
        try {
            await axios.post(`https://split-wise-gvpp.onrender.com/api/clear-settlements/${userId}`);
            fetchBalances(); // Refresh balances after clearing settlements
        } catch (error) {
            console.error('Error clearing settlements:', error);
        }
    };

    return (
        <div className="Main-Header">
            <header className="App-header">
                <h1>Splitwise</h1>
                <div className="balances">
                    {balances.map((userBalance) => (
                        <div key={userBalance.userId} className="balance-info">
                            <p>User ID: {userBalance.userId}</p>
                            <p>Name: {userBalance.name}</p>
                            <p className={userBalance.balance < 0 ? 'negative' : userBalance.balance > 0 ? 'positive' : 'zero'}>
                                Balance: ₹{parseFloat(userBalance.balance).toFixed(2)}
                            </p>
                            <div className="hide-time">
                                <p>To Pay: {userBalance.toPay}</p>
                                <button className='btn' onClick={() => handlePaidClick(userBalance.userId)}>Paid</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="dropdown">
                    <button className="dropdown-button" onClick={toggleDropdown}>
                        Show Balances
                    </button>
                    {dropdownOpen && (
                        <div className="dropdown-content">
                            {balances.map((userBalance) => (
                                <div key={userBalance.userId} className="balance-info">
                                    <p>User ID: {userBalance.userId}</p>
                                    <p>Name: {userBalance.name}</p>
                                    <p className={userBalance.balance < 0 ? 'negative' : userBalance.balance > 0 ? 'positive' : 'zero'}>
                                        Your Balance: ₹{parseFloat(userBalance.balance).toFixed(2)}
                                    </p>
                                    <p>Total Owed: ₹{parseFloat(userBalance.owed).toFixed(2)}</p>
                                    <div className="hide-time">
                                        <p>To Pay: {userBalance.toPay}</p>
                                        <button className='btn' onClick={() => handlePaidClick(userBalance.userId)}>Paid</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
};

export default Navbar;
