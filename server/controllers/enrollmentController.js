import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Enroll user in course
// @route   POST /api/enrollments
// @access  Private
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const learnerId = req.user._id || req.user.id; // Handle both _id and id formats

    console.log('Enrollment request:', {
      courseId,
      learnerId,
      userFromReq: req.user
    });

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      learnerId,
      courseId
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'cancelled') {
        // Reactivate cancelled enrollment
        existingEnrollment.status = 'active';
        existingEnrollment.enrolledAt = new Date();
        await existingEnrollment.save();
        
        return res.status(200).json({
          success: true,
          message: 'Enrollment reactivated successfully',
          data: { enrollment: existingEnrollment }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'You are already enrolled in this course'
        });
      }
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      learnerId,
      courseId,
      status: 'active',
      progress: [],
      completionPercentage: 0,
      paymentStatus: course.price > 0 ? 'pending' : 'free',
      paymentAmount: course.price
    });

    await enrollment.populate([
      { path: 'learnerId', select: 'name email' },
      { path: 'courseId', select: 'title description price' }
    ]);

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: 1 }
    });

    console.log('Enrollment created successfully:', enrollment);

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: { enrollment }
    });

  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during enrollment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user enrollments
// @route   GET /api/enrollments/:userId
// @access  Private (own data) / Private/Admin (any user data)
export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check authorization (users can only access their own data unless admin)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own enrollments'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status } = req.query;

    let filter = { learnerId: userId };
    if (status) {
      filter.status = status;
    }

    const enrollments = await Enrollment.find(filter)
      .populate('courseId', 'title description thumbnailUrl difficulty category price')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments(filter);

    // Calculate completion for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        await enrollment.calculateCompletion();
        return enrollment;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        enrollments: enrollmentsWithProgress,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: enrollments.length,
          totalEnrollments: total
        }
      }
    });

  } catch (error) {
    console.error('Get user enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:userId/update
// @access  Private (own data) / Private/Admin (any user data)
export const updateEnrollmentProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { courseId, itemId, isCompleted, timeSpent = 0 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID, course ID, or item ID'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own progress'
      });
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      learnerId: userId,
      courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update progress for inactive enrollment'
      });
    }

    // Update item progress
    await enrollment.updateItemProgress(itemId, isCompleted, timeSpent);

    // Calculate overall completion
    const completionPercentage = await enrollment.calculateCompletion();

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        enrollmentId: enrollment._id,
        completionPercentage,
        status: enrollment.status,
        updatedItem: {
          itemId,
          isCompleted,
          timeSpent
        }
      }
    });

  } catch (error) {
    console.error('Update enrollment progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get enrollment details
// @route   GET /api/enrollments/:userId/:courseId
// @access  Private (own data) / Private/Admin (any user data)
export const getEnrollmentDetails = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    console.log('Get enrollment details request:', {
      userId,
      courseId,
      requestingUser: req.user._id || req.user.id
    });

    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or course ID'
      });
    }

    // Check authorization
    const requestingUserId = (req.user._id || req.user.id).toString();
    if (req.user.role !== 'admin' && requestingUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const enrollment = await Enrollment.findOne({
      learnerId: userId,
      courseId
    }).populate([
      { path: 'learnerId', select: 'name email' },
      { path: 'courseId', select: 'title description modules' }
    ]);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Calculate completion
    await enrollment.calculateCompletion();

    // Get detailed progress with module/item information
    const detailedProgress = enrollment.progress.map(progressItem => {
      const course = enrollment.courseId;
      let moduleInfo = null;
      let itemInfo = null;

      // Find module and item details
      for (const module of course.modules) {
        const item = module.items.id(progressItem.itemId);
        if (item) {
          moduleInfo = {
            id: module._id,
            title: module.title
          };
          itemInfo = {
            id: item._id,
            title: item.title,
            type: item.type,
            duration: item.duration
          };
          break;
        }
      }

      return {
        ...progressItem.toObject(),
        module: moduleInfo,
        item: itemInfo
      };
    });

    res.status(200).json({
      success: true,
      data: {
        enrollment: {
          ...enrollment.toObject(),
          progress: detailedProgress
        }
      }
    });

  } catch (error) {
    console.error('Get enrollment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Cancel enrollment
// @route   PUT /api/enrollments/:userId/:courseId/cancel
// @access  Private (own data) / Private/Admin (any user data)
export const cancelEnrollment = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or course ID'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const enrollment = await Enrollment.findOne({
      learnerId: userId,
      courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Enrollment is already cancelled'
      });
    }

    enrollment.status = 'cancelled';
    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrollmentCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Enrollment cancelled successfully',
      data: { enrollment }
    });

  } catch (error) {
    console.error('Cancel enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Rate course
// @route   PUT /api/enrollments/:userId/:courseId/rate
// @access  Private (own data)
export const rateCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { score, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or course ID'
      });
    }

    // Check authorization (only own ratings)
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own enrollments'
      });
    }

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating score must be between 1 and 5'
      });
    }

    const enrollment = await Enrollment.findOne({
      learnerId: userId,
      courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.status !== 'active' && enrollment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate active or completed courses'
      });
    }

    // Update rating
    enrollment.rating = {
      score,
      review: review || '',
      ratedAt: new Date()
    };

    await enrollment.save();

    // Update course rating
    await updateCourseRating(courseId);

    res.status(200).json({
      success: true,
      message: 'Course rated successfully',
      data: { rating: enrollment.rating }
    });

  } catch (error) {
    console.error('Rate course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get enrollment statistics (Admin only)
// @route   GET /api/enrollments/stats
// @access  Private/Admin
export const getEnrollmentStats = async (req, res) => {
  try {
    const { courseId, timeframe = '30d' } = req.query;

    // Calculate date range based on timeframe
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        dateFilter = { enrolledAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { enrolledAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { enrolledAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = {};
    }

    let matchFilter = { ...dateFilter };
    if (courseId) {
      matchFilter.courseId = new mongoose.Types.ObjectId(courseId);
    }

    // Get enrollment statistics
    const stats = await Enrollment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgCompletion: { $avg: '$completionPercentage' }
        }
      }
    ]);

    const totalEnrollments = await Enrollment.countDocuments(matchFilter);
    
    // Get completion stats
    const completionStats = await Enrollment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalCompleted: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgCompletionTime: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$enrolledAt', null] }] },
                { $divide: [{ $subtract: ['$completedAt', '$enrolledAt'] }, 1000 * 60 * 60 * 24] },
                null
              ]
            }
          }
        }
      }
    ]);

    const completion = completionStats[0] || { totalCompleted: 0, avgCompletionTime: 0 };

    // Get enrollment trend
    const trendData = await Enrollment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 30 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalEnrollments,
          completed: completion.totalCompleted,
          completionRate: totalEnrollments > 0 ? 
            Math.round((completion.totalCompleted / totalEnrollments) * 100) : 0,
          avgCompletionDays: Math.round((completion.avgCompletionTime || 0) * 100) / 100
        },
        statusBreakdown: stats,
        enrollmentTrend: trendData,
        timeframe
      }
    });

  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to update course rating
const updateCourseRating = async (courseId) => {
  try {
    const ratings = await Enrollment.aggregate([
      { 
        $match: { 
          courseId: new mongoose.Types.ObjectId(courseId),
          'rating.score': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating.score' },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    if (ratings.length > 0) {
      const { averageRating, ratingCount } = ratings[0];
      await Course.findByIdAndUpdate(courseId, {
        'rating.average': Math.round(averageRating * 10) / 10,
        'rating.count': ratingCount
      });
    }
  } catch (error) {
    console.error('Error updating course rating:', error);
  }
};

export default {
  enrollInCourse,
  getUserEnrollments,
  updateEnrollmentProgress,
  getEnrollmentDetails,
  cancelEnrollment,
  rateCourse,
  getEnrollmentStats
};