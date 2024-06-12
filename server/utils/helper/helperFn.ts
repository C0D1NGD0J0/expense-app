import colors from 'colors';
import bunyan from 'bunyan';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

export const hashGenerator = (): string => {
  const token = crypto.randomBytes(10).toString('hex');
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const jwtGenerator = (userId: string, secret = process.env.JWT_SECRET as string, opts: SignOptions) => {
  return `Bearer ${jwt.sign({ id: userId }, secret, opts)}`;
};

export const excludeProperties = <T extends Record<string, any>>(obj: T, excludedProps: Set<keyof T>): Partial<T> => {
  const newObj: Partial<T> = {};

  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!excludedProps.has(key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        newObj[key] = excludeProperties(obj[key], new Set(excludedProps)) as T[typeof key];
      } else {
        newObj[key] = obj[key] as T[typeof key];
      }
    }
  }

  return newObj;
};

export const createLogger = (name: string) => {
  const LOG_LEVELS = {
    INFO: 30,
    ERROR: 50,
  };

  // Custom stream to filter and format log entries
  const customStream = {
    write: (record: any) => {
      let output;
      if (record.level === LOG_LEVELS.ERROR) {
        output = colors.red.bold(`${record.name}: ${record.msg}`);
      } else if (record.level === LOG_LEVELS.INFO) {
        // console.log(record, '----record');
        output = colors.cyan.bold(`${record.name}: ${record.msg}`);
      } else {
        output = colors.grey.bold(`${record.name}: ${record.msg}`);
      }
      console.log(output);
    },
  };

  return bunyan.createLogger({
    name,
    level: 'debug',
    streams: [
      {
        level: 'debug',
        type: 'raw', // Use raw stream type
        stream: customStream,
      },
    ],
  });
};
