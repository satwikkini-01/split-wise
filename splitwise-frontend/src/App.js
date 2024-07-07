import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import ExpenseForm from './components/ExpenseForm';
import PreLoader from './components/preLoader';

const App = () => {
  const balanceToGet = 1000;
  const balanceToPay = 500;

  return (
    <div className="App">
      <PreLoader/>
      <Navbar balanceToGet={balanceToGet} balanceToPay={balanceToPay} />
      <div className="container">
        <ExpenseForm />
      </div>
    </div>
  );
};

export default App;
