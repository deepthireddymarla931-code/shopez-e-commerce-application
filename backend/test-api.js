const API_BASE = 'http://localhost:5000/api';

const request = async (path, options = {}) => {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! Status: ${response.status}`);
  }
  return data;
};

const runTests = async () => {
  console.log('Starting ShopEZ Stock Trader API Integration Tests (Native Fetch)...');

  let userToken = null;
  let adminToken = null;
  const testStockSymbol = 'AAPL';

  try {
    // 1. Register User
    console.log('\n--- 1. Testing User Registration ---');
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        username: 'testtrader2',
        email: 'testtrader2@gmail.com',
        password: 'password123',
        role: 'USER'
      }
    });
    console.log('Registration status:', regRes.success ? 'PASS' : 'FAIL');
    console.log('Username:', regRes.username);
    console.log('Initial Balance:', regRes.balance);
    userToken = regRes.token;

    const userHeaders = { Authorization: `Bearer ${userToken}` };

    // 2. Fetch User Profile (me)
    console.log('\n--- 2. Testing Fetch Profile (/auth/me) ---');
    const meRes = await request('/auth/me', { headers: userHeaders });
    console.log('Profile fetch status:', meRes.success ? 'PASS' : 'FAIL');
    console.log('Logged in username:', meRes.username);

    // 3. Fetch Stocks List
    console.log('\n--- 3. Testing Stock Listing (/stocks) ---');
    const stocksRes = await request('/stocks');
    console.log('Fetch stocks count:', stocksRes.count);
    console.log('Seeded stocks available:', stocksRes.data.map(s => s.symbol).join(', '));

    // 4. Fetch Stock Details (AAPL)
    console.log('\n--- 4. Testing Stock Details (/stocks/AAPL) ---');
    const stockDetailRes = await request(`/stocks/${testStockSymbol}`);
    console.log('Detail status:', stockDetailRes.success ? 'PASS' : 'FAIL');
    console.log('Name:', stockDetailRes.data.name);
    console.log('Price:', stockDetailRes.data.price);
    console.log('History data points:', stockDetailRes.data.history.length);

    // 5. Execute BUY Trade
    console.log('\n--- 5. Testing Simulated BUY Trade ---');
    const buyRes = await request('/transactions/trade', {
      method: 'POST',
      headers: userHeaders,
      body: {
        symbol: testStockSymbol,
        type: 'BUY',
        quantity: 5
      }
    });
    console.log('Buy status:', buyRes.success ? 'PASS' : 'FAIL');
    console.log('Order Message:', buyRes.message);
    console.log('Remaining cash balance:', buyRes.data.newBalance);

    // 6. Fetch Portfolio
    console.log('\n--- 6. Testing Portfolio Summary (/portfolio) ---');
    const portRes = await request('/portfolio', { headers: userHeaders });
    console.log('Portfolio fetch status:', portRes.success ? 'PASS' : 'FAIL');
    console.log('Summary Total Invested:', portRes.data.summary.totalInvested);
    console.log('Summary Holdings Value:', portRes.data.summary.currentHoldingsValue);
    console.log('Holdings list:', portRes.data.holdings.map(h => `${h.symbol} (${h.quantity} shares, avg purchase price $${h.averagePrice})`).join(', '));

    // 7. Execute SELL Trade
    console.log('\n--- 7. Testing Simulated SELL Trade ---');
    const sellRes = await request('/transactions/trade', {
      method: 'POST',
      headers: userHeaders,
      body: {
        symbol: testStockSymbol,
        type: 'SELL',
        quantity: 2
      }
    });
    console.log('Sell status:', sellRes.success ? 'PASS' : 'FAIL');
    console.log('Order Message:', sellRes.message);
    console.log('New cash balance:', sellRes.data.newBalance);
    console.log('Remaining shares in holdings:', sellRes.data.holdings.find(h => h.symbol === testStockSymbol)?.quantity || 0);

    // 8. Fetch User Transaction History
    console.log('\n--- 8. Testing User Transaction Logs (/transactions/my) ---');
    const txRes = await request('/transactions/my', { headers: userHeaders });
    console.log('Transaction list count:', txRes.count);
    txRes.data.forEach(tx => {
      console.log(`- ${tx.type} ${tx.quantity} shares of ${tx.symbol} @ $${tx.price} (Total: $${tx.totalPrice})`);
    });

    // 9. Register Administrator
    console.log('\n--- 9. Testing Admin Registration ---');
    const adminRegRes = await request('/auth/register', {
      method: 'POST',
      body: {
        username: 'testadmin2',
        email: 'testadmin2@gmail.com',
        password: 'password123',
        role: 'ADMIN'
      }
    });
    console.log('Admin registration status:', adminRegRes.success ? 'PASS' : 'FAIL');
    adminToken = adminRegRes.token;

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 10. Admin User Registry Audit
    console.log('\n--- 10. Testing Admin User Registry Audit ---');
    const adminUsersRes = await request('/admin/users', { headers: adminHeaders });
    console.log('Audit status:', adminUsersRes.success ? 'PASS' : 'FAIL');
    console.log('Users registered on platform:', adminUsersRes.data.map(u => `${u.username} (${u.role})`).join(', '));

    // 11. Admin Global Transactions Audit
    console.log('\n--- 11. Testing Admin Global Transactions Audit ---');
    const adminTxsRes = await request('/admin/transactions', { headers: adminHeaders });
    console.log('Audit status:', adminTxsRes.success ? 'PASS' : 'FAIL');
    console.log('Global transactions count:', adminTxsRes.count);
    adminTxsRes.data.forEach(t => {
      console.log(`- Trader: ${t.user?.username || 'unknown'}, ${t.type} ${t.quantity} ${t.symbol}`);
    });

    // 12. Admin Stock Listing Creation (CRUD - Create)
    console.log('\n--- 12. Testing Admin Create Stock Listing ---');
    const createStockRes = await request('/admin/stocks', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        symbol: 'INTC',
        name: 'Intel Corporation',
        price: 35.00
      }
    });
    console.log('Create stock status:', createStockRes.success ? 'PASS' : 'FAIL');
    console.log('Created stock:', createStockRes.data.symbol, '-', createStockRes.data.name);

    // 13. Admin Stock Listing Update (CRUD - Update)
    console.log('\n--- 13. Testing Admin Update Stock Listing ---');
    const updateStockRes = await request('/admin/stocks/INTC', {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        price: 36.50
      }
    });
    console.log('Update stock status:', updateStockRes.success ? 'PASS' : 'FAIL');
    console.log('Updated price:', updateStockRes.data.price);
    console.log('New daily change percent:', updateStockRes.data.change + '%');

    // 14. Admin Stock Listing Delete (CRUD - Delete)
    console.log('\n--- 14. Testing Admin Delete Stock Listing ---');
    const deleteStockRes = await request('/admin/stocks/INTC', {
      method: 'DELETE',
      headers: adminHeaders
    });
    console.log('Delete stock status:', deleteStockRes.success ? 'PASS' : 'FAIL');
    console.log('Deletion message:', deleteStockRes.message);

    console.log('\n=======================================');
    console.log('ALL API WORKFLOW TESTS PASSED SUCCESSFULLY!');
    console.log('=======================================');
    process.exit(0);

  } catch (error) {
    console.error('\n!!! TEST STEP FAILURE !!!');
    console.error('Error Details:', error.message);
    process.exit(1);
  }
};

runTests();
