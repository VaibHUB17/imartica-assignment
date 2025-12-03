import Application from '../models/Application.js';
import Course from '../models/Course.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const submitApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, phone, courseApplied, message } = req.body;

    const existingApplication = await Application.findOne({
      email: email.toLowerCase(),
      courseApplied,
      status: { $ne: 'rejected' }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Application already exists for this course'
      });
    }

    let courseId = null;
    try {
      const course = await Course.findOne({
        title: new RegExp(courseApplied, 'i'),
        isPublished: true
      });
      if (course) courseId = course._id;
    } catch (error) {}

    const application = await Application.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      courseApplied: courseApplied.trim(),
      courseId,
      message: message?.trim(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { applicationId: application._id }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { courseApplied: new RegExp(search, 'i') }
      ];
    }

    const sortObject = {};
    sortObject[sortBy] = order === 'desc' ? -1 : 1;

    const applications = await Application.find(filter)
      .populate('courseId', 'title price')
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: applications.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('courseId', 'title description price');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, data: { application } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['pending', 'contacted', 'enrolled', 'rejected', 'follow_up'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await application.updateStatus(status, req.user.id, notes);
    await application.populate('courseId', 'title price');

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: { application }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getApplicationStats = async (req, res) => {
  try {
    const statusStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        total: totalApplications,
        statusBreakdown: statusStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};