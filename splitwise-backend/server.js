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

app.post('/api/expenses', async (req, res) => {
  const { payer, amount, participants, splitAmount } = req.body;
  let p = 0;
  if(payer === 'satwik') p = 1;
  else if(payer === 'manu') p = 2;
  else if(payer === 'chetan') p = 3;
  else if(payer === 'kushal') p = 4;
  else if(payer === 'krishna') p = 5;
  else if(payer === 'rishikesh') p = 6;
  else if(payer === 'prajna') p = 7;

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

    const currentOwe = balResult.length > 0 ? balResult[0].balance : 0;
    const newOwe = currentOwe + amount;

    const balUpdateQuery = 'UPDATE balances SET balance = ? WHERE user_id = ?';
    const balUpdateParams = [newOwe, p];
    await connection.query(balUpdateQuery, balUpdateParams);

    const [recentExpense] = await connection.query('SELECT id FROM expenses ORDER BY id DESC LIMIT 1');
    const recentExpenseId = recentExpense[0].id;
    for (let participant of participants) {
        let participantId;
        if(participant === 'satwik') participantId = 1;
        else if(participant === 'manu') participantId = 2;
        else if(participant === 'chetan') participantId = 3;
        else if(participant === 'kushal') participantId = 4;
        else if(participant === 'krishna') participantId = 5;
        else if(participant === 'rishikesh') participantId = 6;
        else if(participant === 'prajna') participantId = 7;
        
        const insertDistributionQuery = 'INSERT INTO expense_distribution (expense_id, participant, amount_paid, participant_name) VALUES (?, ?, ?, ?)';
        const insertDistributionParams = [recentExpenseId, participantId, splitAmount, participant];
        await connection.query(insertDistributionQuery, insertDistributionParams);

        const getBalQuery = 'SELECT owe FROM balances WHERE user_id = ?';
        const getBalParams = [participantId];
        const [balResult] = await connection.query(getBalQuery, getBalParams);
        const currentOwe = balResult.length > 0 ? balResult[0].owe : 0;
        const newOwe = currentOwe + splitAmount;

        const balUpdateQuery = 'UPDATE balances SET owe = ? WHERE user_id = ?';
        const balUpdateParams = [newOwe, participantId];
        await connection.query(balUpdateQuery, balUpdateParams);
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
