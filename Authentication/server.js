import app from './src/app.js';
import connectDB from './src/config/database.js';

connectDB().catch((err) => {
    console.error('DB connection failed:', err.message);
});

app.listen(3000, () => {
    console.log('Server is running');
});

