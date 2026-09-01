const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new HttpError(500, 'JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    secret,
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

async function login({ email, password }) {
  const user = await db('users').where({ email }).first();
  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

async function getMe(userId) {
  const user = await db('users')
    .select('id', 'email', 'role')
    .where({ id: userId })
    .first();

  if (!user) {
    throw new HttpError(401, 'User not found');
  }

  return user;
}

module.exports = { login, getMe, signToken };
