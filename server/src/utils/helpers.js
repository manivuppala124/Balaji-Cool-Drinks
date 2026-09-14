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
 * replica set or MongoDB Atlas, or gracefully falls back to direct execution on
 * standalone single-instance local MongoDB deployments.
 */
export const runWithOptionalTransaction = async (work) => {
  const isReplica = isReplicaSet();
  let session = null;

  if (isReplica) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }
  }

  if (session) {
    try {
      const result = await work(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      if (
        err.message &&
        err.message.includes('Transaction numbers are only allowed on a replica set member or mongos')
      ) {
        return await work(null);
      }
      throw err;
    } finally {
      session.endSession();
    }
  }

  return await work(null);
};
