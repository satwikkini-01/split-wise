import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExpenseForm.css';

const ExpenseForm = () => {
    const [payer, setPayer] = useState('');
    const [amount, setAmount] = useState('');
    const [participants, setParticipants] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // For publish: 'https://split-wise-gvpp.onrender.com/api/users'
    // For testing: 'http://localhost:3001/api/users'

    useEffect(() => {
        axios.get('https://split-wise-gvpp.onrender.com/api/users')
            .then(response => {
                setUsers(response.data.users);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setTimeout(() => {
                window.location.reload();
              }, 3000);
            const splitAmount = amount / participants.length;

            const expenseData = {
                payer,
                amount: parseFloat(amount),
                participants,
                splitAmount: parseFloat(splitAmount.toFixed(2))
            };

            // For publish: 'https://split-wise-gvpp.onrender.com/api/expenses'
            // For testing: 'http://localhost:3001/api/expenses'


            const response = await axios.post('https://split-wise-gvpp.onrender.com/api/expenses', expenseData);

            console.log('Expense added:', response.data);

            setPayer('');
            setAmount('');
            setParticipants([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleCheckboxChange = (event) => {
        const { value, checked } = event.target;

        if (checked) {
            setParticipants([...participants, value]);
        } else {
            setParticipants(participants.filter(participant => participant !== value));
        }
    };

    const handleSelectAllChange = (event) => {
        const { checked } = event.target;
        setSelectAll(checked);
        if (checked) {
            setParticipants(users.map(user => user));
        } else {
            setParticipants([]);
        }
    };

    return (
        <div className="expense-form">
            <h2>Add New Expense</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Payer:</label>
                    <select value={payer} onChange={(e) => setPayer(e.target.value)} required>
                        <option value="">Select payer</option>
                        {users.map((user, index) => (
                            <option key={index} value={user}>{user}</option>
                        ))}
                    </select>
                </div>
                <div className='amt'>
                    <label className='lbl'>Amount:</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div>
                    <label>Participants:</label>
                    <div>
                        <input
                            type="checkbox"
                            id="selectAll"
                            className='checkbx'
                            checked={selectAll}
                            onChange={handleSelectAllChange}
                        />
                        <label htmlFor="selectAll">Select All</label>
                    </div>
                    {users.map((user, index) => (
                        <div key={index}>
                            <input
                                type="checkbox"
                                className='checkbx'
                                id={user}
                                value={user}
                                checked={participants.includes(user)}
                                onChange={handleCheckboxChange}
                            />
                            <label htmlFor={user}>{user}</label>
                        </div>
                    ))}
                </div>
                <button type="submit" className='btn'>Add Expense</button>
            </form>
        </div>
    );
};

export default ExpenseForm;
