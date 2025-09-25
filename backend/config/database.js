const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection - using MySQL
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'chattasks',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// If you prefer MySQL, uncomment below and comment out SQLite config above:
// const sequelize = new Sequelize({
//   dialect: 'mysql',
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   database: process.env.DB_NAME || 'chattasks',
//   username: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   logging: process.env.NODE_ENV === 'development' ? console.log : false,
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   },
//   define: {
//     timestamps: true,
//     underscored: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at'
//   }
// });

// Test the connection
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('✅ MySQL database connected successfully');
    
    // Load models with associations
    console.log('🔄 Loading database models...');
    require('../models');
    
    // Create database if it doesn't exist
    console.log('🔄 Synchronizing database models...');
    
    // Use force: false to avoid dropping existing tables
    // Use alter: true to modify existing tables if needed
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false 
    });
    
    console.log('📊 Database models synchronized successfully');
    
    // Verify tables were created
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('📋 Available tables:', results.map(r => Object.values(r)[0]).join(', '));
    
  } catch (error) {
    console.error('❌ Database connection/setup error:', error.message);
    
    if (error.original?.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database "chattasks" does not exist. Creating it...');
      try {
        // Create database connection without specifying database name
        const { Sequelize } = require('sequelize');
        const adminSequelize = new Sequelize({
          dialect: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          username: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          logging: false
        });
        
        await adminSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'chattasks'}\``);
        await adminSequelize.close();
        
        console.log('✅ Database created successfully. Retrying connection...');
        
        // Retry the original connection
        await sequelize.authenticate();
        require('../models');
        await sequelize.sync({ alter: true });
        console.log('📊 Database models synchronized after database creation');
        
      } catch (createError) {
        console.error('❌ Failed to create database:', createError.message);
        console.log('⚠️  The server will continue running, but database features may not work.');
        printDatabaseTroubleshooting();
      }
    } else {
      console.log('⚠️  The server will continue running, but database features may not work.');
      printDatabaseTroubleshooting();
    }
  }
};

const printDatabaseTroubleshooting = () => {
  console.log('\n💡 Database Troubleshooting:');
  console.log('   1. Make sure MySQL is installed and running');
  console.log('   2. Check MySQL service: `net start mysql` (Windows) or `systemctl start mysql` (Linux)');
  console.log('   3. Verify MySQL credentials in .env file');
  console.log('   4. Test connection: `mysql -u root -p` (then enter password)');
  console.log('   5. Create database manually: `CREATE DATABASE chattasks;`');
  console.log('   6. Check firewall settings if using remote database');
  console.log('');
};

module.exports = { sequelize, connectDB };