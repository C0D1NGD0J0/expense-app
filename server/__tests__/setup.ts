import dotenv from 'dotenv';

import { db } from '@db/index';

dotenv.config({
  path: '<rootDir>/.env.test',
});

beforeAll(() => {
  (async () => {
    console.log(process.env, '----env----');
    const isconnected = await db.isDbConnected();

    if (isconnected) {
      return console.log('Connected to test database');
    }
  })();
});

afterAll(async () => {
  await db.disconnect();
});
