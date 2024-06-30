const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./database');
const app = express();
const PORT = 3001; 

app.use(bodyParser.json());
const allowedOrigins = ['https://split-wise-self.vercel.app'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id, name FROM users');
    const users = rows.map(user => user.name);
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch all users
app.get('/api/users', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT user_id, name FROM users');
      const users = rows.map(user => ({ id: user.user_id, name: user.name }));
      res.json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
app.post('/api/expenses', async (req, res) => {
const { payer, amount, participants, splitAmount } = req.body;
const userMap = {
    satwik: 1,
    manu: 2,
    chetan: 3,
    kushal: 4,
    krishna: 5,
    rishikesh: 6,
    prajna: 7
};

const p = userMap[payer];

if (!p) {
    return res.status(400).json({ error: 'Invalid payer' });
}

if (!Array.isArray(participants) || participants.some(participant => !userMap[participant])) {
    return res.status(400).json({ error: 'Invalid participants' });
}

try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    const insertExpenseQuery = 'INSERT INTO expenses (payer, amount, payer_name) VALUES (?, ?, ?)';
    const insertExpenseParams = [p, amount, payer];
    const [result] = await connection.query(insertExpenseQuery, insertExpenseParams);
    const expenseId = result.insertId;

    const getBalQuery = 'SELECT balance FROM balances WHERE user_id = ?';
    const getBalParams = [p];
    const [balResult] = await connection.query(getBalQuery, getBalParams);
    const currentBalance = balResult.length > 0 ? parseFloat(balResult[0].balance) : 0;
    const newBalance = currentBalance + parseFloat(amount);

    const balUpdateQuery = 'UPDATE balances SET balance = ? WHERE user_id = ?';
    const balUpdateParams = [newBalance, p];
    await connection.query(balUpdateQuery, balUpdateParams);

    for (let participant of participants) {
    const participantId = userMap[participant];
    const insertDistributionQuery = 'INSERT INTO expense_distribution (expense_id, participant, amount_paid, participant_name) VALUES (?, ?, ?, ?)';
    const insertDistributionParams = [expenseId, participantId, splitAmount, participant];
    await connection.query(insertDistributionQuery, insertDistributionParams);

    const getOweQuery = 'SELECT owe FROM balances WHERE user_id = ?';
    const getOweParams = [participantId];
    const [oweResult] = await connection.query(getOweQuery, getOweParams);
    const currentOwe = oweResult.length > 0 ? parseFloat(oweResult[0].owe) : 0;
    const newOwe = currentOwe + parseFloat(splitAmount);

    const oweUpdateQuery = 'UPDATE balances SET owe = ? WHERE user_id = ?';
    const oweUpdateParams = [newOwe, participantId];
    await connection.query(oweUpdateQuery, oweUpdateParams);
    }

    await connection.commit();
    connection.release();

    res.status(201).json({ message: 'Expense added successfully' });
} catch (error) {
    console.error('Error adding expense:', error);
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: 'Internal server error' });
}
});
  

app.get('/api/balance', async (req, res) => {
    try {
        const userIds = [1, 2, 3, 4, 5, 6, 7];
        const results = [];

        for (const userId of userIds) {
            const [nameResult] = await pool.query('SELECT name FROM balances WHERE user_id = ? LIMIT 1', [userId]);
            const name = nameResult.length > 0 ? nameResult[0].name : 'Unknown';

            const [balanceResult] = await pool.query('SELECT balance FROM balances WHERE user_id = ?', [userId]);
            const balance = balanceResult[0].balance || 0;

            const [owedResult] = await pool.query('SELECT owe FROM balances WHERE user_id = ?', [userId]);
            const owed = owedResult[0].owe || 0;

            results.push({ userId, name, balance, owed });
        }

        res.json(results);
    } catch (error) {
        console.error('Error fetching balance and owed for all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
