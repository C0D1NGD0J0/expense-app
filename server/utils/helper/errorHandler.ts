import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { GraphQLFormattedError } from 'graphql';

interface ErrorWithCode extends Error {
  code?: string;
}

interface ErrorResponse {
  msg: string;
  httpCode: number;
}

const getErrorMessageForRange = (err: any) => {
  const codeNum = parseInt(err.code.slice(1), 10);
  const errors: { msg: string; httpCode: number }[] = [];

  console.error('Error occurred:', err.message);
  switch (true) {
    case codeNum >= 2000 && codeNum <= 2010:
      errors.push({
        msg: 'An error occurred while processing the request.',
        httpCode: 400,
      });
      break;
    case codeNum >= 2011 && codeNum <= 2021:
      errors.push({
        msg: 'The database encountered an unexpected error.',
        httpCode: 500,
      });
      break;
    case codeNum >= 2022 && codeNum <= 2032:
      errors.push({
        msg: 'The database encountered an error while performing an operation.',
        httpCode: 500,
      });
      break;
    case codeNum >= 2033 && codeNum <= 2043:
      errors.push({
        msg: 'The database encountered an error related to data integrity or consistency.',
        httpCode: 409,
      });
      break;
    case codeNum >= 2044 && codeNum <= 2053:
      errors.push({
        msg: 'The database encountered an error related to database maintenance or management.',
        httpCode: 503,
      });
      break;
    case codeNum >= 2054 && codeNum <= 2073:
      errors.push({
        msg: 'The database encountered an error related to database configuration or settings.',
        httpCode: 500,
      });
      break;
    default:
      errors.push({ msg: 'Unknown error occured.', httpCode: 400 });
  }

  return errors;
};

export const errorHandler = (error: ErrorWithCode | Error | GraphQLFormattedError) => {
  if (error && error instanceof PrismaClientKnownRequestError) {
    const errorMessage = getErrorMessageForRange(error);
    return `${errorMessage}`;
  }

  throw new Error(error.message);
};
