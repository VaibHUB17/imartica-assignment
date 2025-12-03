import { validationResult } from 'express-validator';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import mongoose from 'mongoose';

export const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, description, thumbnailUrl, category, tags, difficulty, price } = req.body;

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl: thumbnailUrl || '',
      createdBy: req.user.id,
      category: category?.trim(),
      tags: tags || [],
      difficulty: difficulty || 'beginner',
      price: price || 0,
      isPublished: false
    });

    await course.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, category, difficulty, published, sortBy = 'createdAt', order = 'desc' } = req.query;

    let filter = {};
    if (req.user?.role !== 'admin') {
      filter.isPublished = true;
    } else if (published !== undefined) {
      filter.isPublished = published === 'true';
    }

    if (category) filter.category = new RegExp(category, 'i');
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortObject = {};
    sortObject[sortBy] = order === 'desc' ? -1 : 1;

    const courses = await Course.find(filter)
      .populate('createdBy', 'name email')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Course.countDocuments(filter);

    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({
          courseId: course._id,
          status: 'active'
        });
        return { ...course, enrollmentCount };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        courses: coursesWithEnrollment,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: courses.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!course || (!course.isPublished && req.user?.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollmentCount = await Enrollment.countDocuments({
      courseId: course._id,
      status: 'active'
    });

    let isEnrolled = false;
    let userProgress = null;

    if (req.user) {
      const enrollment = await Enrollment.findOne({
        learnerId: req.user.id,
        courseId: course._id
      });

      if (enrollment) {
        isEnrolled = true;
        userProgress = {
          completionPercentage: enrollment.completionPercentage,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        course: {
          ...course.toObject(),
          enrollmentCount,
          isEnrolled,
          userProgress
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const { title, description, thumbnailUrl, category, tags, difficulty, price, isPublished } = req.body;

    if (title) course.title = title.trim();
    if (description) course.description = description.trim();
    if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl;
    if (category) course.category = category.trim();
    if (tags) course.tags = tags;
    if (difficulty) course.difficulty = difficulty;
    if (price !== undefined) course.price = price;
    if (isPublished !== undefined) course.isPublished = isPublished;

    await course.save();
    await course.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
    if (enrollmentCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete course with active enrollments' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const { title, description, order } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Module title is required' });
    }

    const newModule = {
      title: title.trim(),
      description: description?.trim() || '',
      order: order || course.modules.length,
      items: []
    };

    course.modules.push(newModule);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Module added successfully',
      data: { module: course.modules[course.modules.length - 1] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const updateModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const { title, description, order } = req.body;
    if (title) module.title = title.trim();
    if (description !== undefined) module.description = description.trim();
    if (order !== undefined) module.order = order;

    await course.save();
    res.status(200).json({ success: true, message: 'Module updated successfully', data: { module } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.modules.pull(req.params.moduleId);
    await course.save();
    res.status(200).json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCourseStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });

    const enrollmentStats = await Enrollment.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          totalCompletions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);

    const stats = enrollmentStats[0] || { totalEnrollments: 0, totalCompletions: 0 };

    res.status(200).json({
      success: true,
      data: {
        courses: { total: totalCourses, published: publishedCourses },
        enrollments: { total: stats.totalEnrollments, completed: stats.totalCompletions },
        completionRate: stats.totalEnrollments > 0 ? 
          Math.round((stats.totalCompletions / stats.totalEnrollments) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};