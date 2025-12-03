import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const learnerId = req.user._id || req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const existingEnrollment = await Enrollment.findOne({ learnerId, courseId });
    if (existingEnrollment) {
      if (existingEnrollment.status === 'cancelled') {
        existingEnrollment.status = 'active';
        existingEnrollment.enrolledAt = new Date();
        await existingEnrollment.save();
        return res.status(200).json({ success: true, message: 'Enrollment reactivated successfully' });
      } else {
        return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
      }
    }

    const enrollment = await Enrollment.create({
      learnerId,
      courseId,
      status: 'active',
      progress: [],
      completionPercentage: 0,
      paymentStatus: course.price > 0 ? 'pending' : 'free',
      paymentAmount: course.price
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

    res.status(201).json({ success: true, message: 'Successfully enrolled in course' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status } = req.query;
    let filter = { learnerId: userId };
    if (status) filter.status = status;

    const enrollments = await Enrollment.find(filter)
      .populate('courseId', 'title description thumbnailUrl difficulty price')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Enrollment.countDocuments(filter);

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
        pagination: { current: page, total: Math.ceil(total / limit), count: enrollments.length }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateEnrollmentProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { courseId, itemId, isCompleted, timeSpent = 0 } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const enrollment = await Enrollment.findOne({ learnerId: userId, courseId });
    if (!enrollment || enrollment.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Active enrollment not found' });
    }

    await enrollment.updateItemProgress(itemId, isCompleted, timeSpent);
    const completionPercentage = await enrollment.calculateCompletion();
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { completionPercentage, status: enrollment.status }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getEnrollmentDetails = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const requestingUserId = (req.user._id || req.user.id).toString();
    
    if (req.user.role !== 'admin' && requestingUserId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const enrollment = await Enrollment.findOne({ learnerId: userId, courseId })
      .populate([{ path: 'learnerId', select: 'name email' }, { path: 'courseId', select: 'title description modules' }]);

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    await enrollment.calculateCompletion();
    res.status(200).json({ success: true, data: { enrollment } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const cancelEnrollment = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const enrollment = await Enrollment.findOne({ learnerId: userId, courseId });
    if (!enrollment || enrollment.status === 'cancelled') {
      return res.status(404).json({ success: false, message: 'Active enrollment not found' });
    }

    enrollment.status = 'cancelled';
    await enrollment.save();
    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: -1 } });

    res.status(200).json({ success: true, message: 'Enrollment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const rateCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { score, review } = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating score must be between 1 and 5' });
    }

    const enrollment = await Enrollment.findOne({ learnerId: userId, courseId });
    if (!enrollment || !['active', 'completed'].includes(enrollment.status)) {
      return res.status(404).json({ success: false, message: 'Cannot rate this course' });
    }

    enrollment.rating = { score, review: review || '', ratedAt: new Date() };
    await enrollment.save();
    await updateCourseRating(courseId);

    res.status(200).json({ success: true, message: 'Course rated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getEnrollmentStats = async (req, res) => {
  try {
    const { courseId } = req.query;
    let matchFilter = {};
    if (courseId) matchFilter.courseId = new mongoose.Types.ObjectId(courseId);

    const stats = await Enrollment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalEnrollments = await Enrollment.countDocuments(matchFilter);
    const completedCount = stats.find(s => s._id === 'completed')?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalEnrollments,
        completed: completedCount,
        completionRate: totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
  } catch (error) {}
};