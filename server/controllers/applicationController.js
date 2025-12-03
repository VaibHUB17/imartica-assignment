import Application from '../models/Application.js';
import Course from '../models/Course.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// @desc    Submit application form
// @route   POST /api/applications
// @access  Public
export const submitApplication = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      phone,
      courseApplied,
      message,
      source = 'website',
      marketingConsent = false,
      utmSource,
      utmMedium,
      utmCampaign
    } = req.body;

    // Check if application already exists with same email and course
    const existingApplication = await Application.findOne({
      email: email.toLowerCase(),
      courseApplied,
      status: { $ne: 'rejected' }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'An application for this course with this email already exists'
      });
    }

    // Try to find matching course
    let courseId = null;
    try {
      const course = await Course.findOne({
        title: new RegExp(courseApplied, 'i'),
        isPublished: true
      });
      if (course) {
        courseId = course._id;
      }
    } catch (error) {
      console.log('Course matching failed:', error.message);
    }

    // Get client information
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
      userAgent: req.get('User-Agent'),
      referrerUrl: req.get('Referer')
    };

    // Create application
    const application = await Application.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      courseApplied: courseApplied.trim(),
      courseId,
      message: message?.trim(),
      source,
      marketingConsent,
      utmSource,
      utmMedium,
      utmCampaign,
      ...clientInfo
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. We will contact you soon!',
      data: {
        applicationId: application._id,
        submittedAt: application.createdAt
      }
    });

    // Log new application
    console.log(`New application received: ${application.email} for ${application.courseApplied}`);

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during application submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private/Admin
export const getApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      status,
      courseApplied,
      source,
      priority,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      dateFrom,
      dateTo
    } = req.query;

    // Build filter object
    let filter = {};

    if (status) filter.status = status;
    if (courseApplied) filter.courseApplied = new RegExp(courseApplied, 'i');
    if (source) filter.source = source;
    if (priority) filter.priority = priority;

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { courseApplied: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    // Sort object
    const sortObject = {};
    sortObject[sortBy] = order === 'desc' ? -1 : 1;

    const applications = await Application.find(filter)
      .populate('courseId', 'title price')
      .populate('contactedBy', 'name email')
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
          count: applications.length,
          totalApplications: total
        },
        filters: {
          status,
          courseApplied,
          source,
          priority,
          search,
          dateFrom,
          dateTo
        }
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private/Admin
export const getApplication = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const application = await Application.findById(req.params.id)
      .populate('courseId', 'title description price')
      .populate('contactedBy', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { application }
    });

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private/Admin
export const updateApplicationStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const { status, notes, priority } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'contacted', 'enrolled', 'rejected', 'follow_up'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update status with proper tracking
    await application.updateStatus(status, req.user.id, notes);

    if (priority) {
      application.priority = priority;
      await application.save();
    }

    await application.populate([
      { path: 'courseId', select: 'title price' },
      { path: 'contactedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: { application }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Set follow-up for application
// @route   PUT /api/applications/:id/follow-up
// @access  Private/Admin
export const setFollowUp = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const { followUpDate, notes } = req.body;

    if (!followUpDate) {
      return res.status(400).json({
        success: false,
        message: 'Follow-up date is required'
      });
    }

    const date = new Date(followUpDate);
    if (date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Follow-up date must be in the future'
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await application.setFollowUp(date, notes);

    res.status(200).json({
      success: true,
      message: 'Follow-up scheduled successfully',
      data: { 
        followUpDate: application.followUpDate,
        status: application.status
      }
    });

  } catch (error) {
    console.error('Set follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get applications needing follow-up
// @route   GET /api/applications/follow-up/pending
// @access  Private/Admin
export const getPendingFollowUps = async (req, res) => {
  try {
    const applications = await Application.getNeedingFollowUp()
      .populate('courseId', 'title price')
      .populate('contactedBy', 'name email');

    res.status(200).json({
      success: true,
      data: {
        applications,
        count: applications.length
      }
    });

  } catch (error) {
    console.error('Get pending follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private/Admin
export const getApplicationStats = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = {};
    }

    // Get status breakdown
    const statusStats = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get source breakdown
    const sourceStats = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get popular courses
    const popularCourses = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$courseApplied',
          applicationCount: { $sum: 1 },
          enrollmentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'enrolled'] }, 1, 0] }
          }
        }
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 10 }
    ]);

    // Get daily application trend
    const trendData = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 30 }
    ]);

    const totalApplications = await Application.countDocuments(dateFilter);
    const pendingFollowUps = await Application.countDocuments({
      followUpDate: { $lte: new Date() },
      status: { $in: ['follow_up', 'pending'] }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalApplications,
          pendingFollowUps,
          timeframe
        },
        statusBreakdown: statusStats,
        sourceBreakdown: sourceStats,
        popularCourses,
        applicationTrend: trendData
      }
    });

  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private/Admin
export const deleteApplication = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk update applications
// @route   PUT /api/applications/bulk-update
// @access  Private/Admin
export const bulkUpdateApplications = async (req, res) => {
  try {
    const { applicationIds, updates } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    // Validate application IDs
    const invalidIds = applicationIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application IDs',
        invalidIds
      });
    }

    // Allowed fields for bulk update
    const allowedFields = ['status', 'priority', 'notes'];
    const updateData = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: `No valid update fields provided. Allowed fields: ${allowedFields.join(', ')}`
      });
    }

    // Add timestamp for tracking
    updateData.updatedAt = new Date();

    const result = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: updateData }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} applications updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        updates: updateData
      }
    });

  } catch (error) {
    console.error('Bulk update applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  submitApplication,
  getApplications,
  getApplication,
  updateApplicationStatus,
  setFollowUp,
  getPendingFollowUps,
  getApplicationStats,
  deleteApplication,
  bulkUpdateApplications
};