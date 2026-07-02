import 'dotenv/config';
import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306');
const username = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'flymedia_db';

export async function ensureDatabaseExists() {
  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user: username,
      password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();
    console.log(`Database '${database}' verified/created.`);
  } catch (error) {
    console.error('Error ensuring database exists:', error);
  }
}

export const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});
if (process.env.NODE_ENV === 'development') {
  (async () => {
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ DB sync (dev) complete');
    } catch (err) {
      console.error('⚠️ DB sync error', err);
    }
  })();
}
