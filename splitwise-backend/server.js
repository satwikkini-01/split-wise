const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./database');
const app = express();
const PORT = 3001; 

app.use(bodyParser.json());
const allowedOrigins = ['https://split-wise-self.vercel.app'];
// const allowedOrigins = ['http://localhost:3000']

function settleDebts(users) {
    const transactions = [];

    const creditors = users.filter(user => user.balance > 0);
    const debtors = users.filter(user => user.balance < 0);

    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance);

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];
        const amountToSettle = Math.min(creditor.balance, -debtor.balance);

        if (amountToSettle > 0) {
            transactions.push({
                debtor_id: debtor.user_id,
                creditor_id: creditor.user_id,
                amount: amountToSettle,
                debitorn: debtor.name,
                creditorn: creditor.name 
            });

            creditors[i].balance -= amountToSettle;
            debtors[j].balance += amountToSettle;

            if (creditors[i].balance === 0) {
                i++;
            }
            if (debtors[j].balance === 0) {
                j++;
            }
        } else {
            break;
        }
    }

    return transactions;
}



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

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const insertExpenseQuery = 'INSERT INTO expenses (payer, amount, payer_name) VALUES (?, ?, ?)';
        const insertExpenseParams = [p, amount, payer];
        const [result] = await connection.query(insertExpenseQuery, insertExpenseParams);
        const expenseId = result.insertId;

        const getPayerBalQuery = 'SELECT balance FROM balances WHERE user_id = ?';
        const getPayerBalParams = [p];
        const [payerBalResult] = await connection.query(getPayerBalQuery, getPayerBalParams);
        const payerCurrentBalance = payerBalResult.length > 0 ? parseFloat(payerBalResult[0].balance) : 0;
        const payerNewBalance = payerCurrentBalance + parseFloat(amount);

        const updatePayerBalQuery = 'UPDATE balances SET balance = ? WHERE user_id = ?';
        const updatePayerBalParams = [payerNewBalance, p];
        await connection.query(updatePayerBalQuery, updatePayerBalParams);

        for (let participant of participants) {
            const participantId = userMap[participant];
            const insertDistributionQuery = 'INSERT INTO expense_distribution (expense_id, participant, amount_paid, participant_name, to_pay) VALUES (?, ?, ?, ?, ?)';
            const insertDistributionParams = [expenseId, participantId, splitAmount, participant, payer];
            await connection.query(insertDistributionQuery, insertDistributionParams);

            const getParticipantBalQuery = 'SELECT balance FROM balances WHERE user_id = ?';
            const getParticipantBalParams = [participantId];
            const [participantBalResult] = await connection.query(getParticipantBalQuery, getParticipantBalParams);
            const participantCurrentBalance = participantBalResult.length > 0 ? parseFloat(participantBalResult[0].balance) : 0;
            const participantNewBalance = participantCurrentBalance - parseFloat(splitAmount);

            const updateParticipantBalQuery = 'UPDATE balances SET balance = ? WHERE user_id = ?';
            const updateParticipantBalParams = [participantNewBalance, participantId];
            await connection.query(updateParticipantBalQuery, updateParticipantBalParams);
        }

        const [usersResult] = await connection.query('SELECT user_id, balance, name FROM balances');
        const users = usersResult.map(row => ({ user_id: row.user_id, balance: parseFloat(row.balance), name: row.name }));

        const transactions = settleDebts(users);

        await connection.query('TRUNCATE TABLE settlements');

        for (let transaction of transactions) {
            const insertSettlementQuery = 'INSERT INTO settlements (debtor_id, creditor_id, amount, debitor, creditor) VALUES (?, ?, ?, ?, ?)';
            const insertSettlementParams = [transaction.debtor_id, transaction.creditor_id, transaction.amount, transaction.debitorn, transaction.creditorn];
            await connection.query(insertSettlementQuery, insertSettlementParams);
        }

        await connection.commit();
        connection.release();

        res.status(201).json({ message: 'Expense added and debts settled successfully' });
    } catch (error) {
        console.error('Error adding expense and settling debts:', error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
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

            const [toPayResult] = await pool.query('SELECT creditor, amount FROM settlements WHERE debtor_id = ?', [userId]);
            const toPay = toPayResult.length > 0 ? toPayResult.map(row => `${row.creditor} (₹${row.amount})`).join(', ') : '';


            results.push({ userId, name, balance, owed, toPay });
        }

        res.json(results);
    } catch (error) {
        console.error('Error fetching balance and owed for all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/clear-settlements/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Delete settlements for the specified user
        const deleteSettlementsQuery = 'DELETE FROM settlements WHERE debtor_id = ?';
        await pool.query(deleteSettlementsQuery, [userId]);

        // Recompute balances and settlements
        const [usersResult] = await pool.query('SELECT user_id, balance, name FROM balances');
        const users = usersResult.map(row => ({ user_id: row.user_id, balance: parseFloat(row.balance), name: row.name }));

        const transactions = settleDebts(users);

        // Clear existing settlements
        await pool.query('TRUNCATE TABLE settlements');

        // Insert updated settlements
        for (let transaction of transactions) {
            const insertSettlementQuery = 'INSERT INTO settlements (debtor_id, creditor_id, amount, debitor, creditor) VALUES (?, ?, ?, ?, ?)';
            const insertSettlementParams = [transaction.debtor_id, transaction.creditor_id, transaction.amount, transaction.debitorn, transaction.creditorn];
            await pool.query(insertSettlementQuery, insertSettlementParams);
        }

        res.json({ message: `Settlements cleared and recomputed for user with ID ${userId}` });
    } catch (error) {
        console.error('Error clearing settlements and recomputing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
