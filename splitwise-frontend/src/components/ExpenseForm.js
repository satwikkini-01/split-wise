import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExpenseForm = () => {
  const [payer, setPayer] = useState('');
  const [amount, setAmount] = useState('');
  const [participants, setParticipants] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/users')
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
      const splitAmount = amount / participants.length;

      const expenseData = {
        payer,
        amount: parseFloat(amount),
        participants,
        splitAmount: parseFloat(splitAmount.toFixed(2))
      };

      const response = await axios.post('http://localhost:3001/api/expenses', expenseData);

      console.log('Expense added:', response.data);
      
      setPayer('');
      setAmount('');
      setParticipants([]);
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
        <div>
          <label>Amount:</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Participants:</label>
          {users.map((user, index) => (
            <div key={index}>
              <input type="checkbox" id={user} value={user} onChange={handleCheckboxChange} />
              <label htmlFor={user}>{user}</label>
            </div>
          ))}
        </div>
        <button type="submit">Add Expense</button>
      </form>
    </div>
  );
};

export default ExpenseForm;
