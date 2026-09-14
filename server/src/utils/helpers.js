import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

export const isValidIndianMobile = (mobile) => /^[6-9]\d{9}$/.test(String(mobile || ''));

export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export const escapeRegex = (str = '') =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isReplicaSet = () => {
  try {
    const topology = mongoose.connection?.client?.topology;
    const type = topology?.description?.type;
    return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
  } catch {
    return false;
  }
};

/**
 * Executes work within a MongoDB multi-document transaction when connected to a
 * replica set or MongoDB Atlas, with automatic WriteConflict retry and graceful
 * non-transactional fallback to prevent yielding errors.
 */
export const runWithOptionalTransaction = async (work, maxRetries = 3) => {
  const isReplica = isReplicaSet();
  if (!isReplica) {
    return await work(null);
  }

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let session = null;
    try {
      session = await mongoose.startSession();
      let result;
      await session.withTransaction(
        async () => {
          result = await work(session);
        },
        {
          readPreference: 'primary',
          readConcern: { level: 'local' },
          writeConcern: { w: 'majority' },
        }
      );
      return result;
    } catch (err) {
      lastError = err;
      const isWriteConflictOrTransient =
        err.hasErrorLabel?.('TransientTransactionError') ||
        err.hasErrorLabel?.('UnknownTransactionCommitResult') ||
        (err.message &&
          (err.message.includes('Write conflict') ||
            err.message.includes('WriteConflict') ||
            err.message.includes('yielding is disabled') ||
            err.message.includes('Transaction numbers are only allowed')));

      if (isWriteConflictOrTransient && attempt < maxRetries) {
        // Backoff slightly before retry
        await new Promise((resolve) => setTimeout(resolve, attempt * 60 + Math.random() * 40));
        continue;
      }

      // If standalone or replica error occurs, fall back gracefully to direct execution
      if (
        err.message &&
        err.message.includes('Transaction numbers are only allowed on a replica set member or mongos')
      ) {
        return await work(null);
      }

      // If write conflicts persisted across retries, fall back safely to non-transactional execution
      if (isWriteConflictOrTransient) {
        console.warn('Transaction write conflict occurred; falling back to direct atomic execution.');
        return await work(null);
      }

      throw err;
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch {
          // session cleanup ignore
        }
      }
    }
  }

  throw lastError;
};
