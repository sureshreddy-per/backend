import { DataSource } from 'typeorm';

async function checkDatabase() {
  const maxRetries = 30; // 5 minutes total with 10-second intervals
  const retryInterval = 10000; // 10 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to connect to database...`);
      
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'postgres.railway.internal',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'railway',
        connectTimeoutMS: 10000,
        extra: {
          connectionTimeoutMillis: 10000,
        },
      });

      // Test connection with timeout
      await Promise.race([
        dataSource.initialize(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);

      // Test query with timeout
      await Promise.race([
        dataSource.query('SELECT 1'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        )
      ]);

      await dataSource.destroy();
      
      console.log('Database is ready!');
      process.exit(0);
    } catch (error) {
      console.error(`Database connection failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('Script interrupted. Exiting...');
  process.exit(1);
});

checkDatabase(); 