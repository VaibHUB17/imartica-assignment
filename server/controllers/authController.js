import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
  return { accessToken, refreshToken };
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });

  const options = {
    expires: new Date(Date.now() + (process.env.JWT_REFRESH_EXPIRE_DAYS || 30) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.status(statusCode)
    .cookie('refreshToken', refreshToken, options)
    .json({
      success: true,
      message,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken
      }
    });
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash: password,
      role: role || 'learner'
    });

    sendTokenResponse(user, 201, res, 'User registered successfully');

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful');

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already taken' });
      }
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    let refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    sendTokenResponse(user, 200, res, 'Token refreshed successfully');
  } catch (jwtError) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: users.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};