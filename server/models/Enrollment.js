import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

const enrollmentSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: [progressSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    ratedAt: {
      type: Date
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'free'],
    default: 'free'
  },
  paymentAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure one enrollment per user per course
enrollmentSchema.index({ learnerId: 1, courseId: 1 }, { unique: true });

// Other indexes for performance
enrollmentSchema.index({ learnerId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

// Virtual for completed items count
enrollmentSchema.virtual('completedItemsCount').get(function() {
  return this.progress.filter(item => item.isCompleted).length;
});

// Virtual for total time spent
enrollmentSchema.virtual('totalTimeSpent').get(function() {
  return this.progress.reduce((total, item) => total + (item.timeSpent || 0), 0);
});

// Method to update progress for a specific item
enrollmentSchema.methods.updateItemProgress = function(itemId, isCompleted, timeSpent = 0) {
  const existingProgress = this.progress.find(p => p.itemId.toString() === itemId.toString());
  
  if (existingProgress) {
    existingProgress.isCompleted = isCompleted;
    existingProgress.timeSpent += timeSpent;
    existingProgress.lastAccessedAt = new Date();
    if (isCompleted && !existingProgress.completedAt) {
      existingProgress.completedAt = new Date();
    }
  } else {
    this.progress.push({
      itemId,
      isCompleted,
      timeSpent,
      completedAt: isCompleted ? new Date() : null,
      lastAccessedAt: new Date()
    });
  }
  
  this.lastAccessedAt = new Date();
  return this.save();
};

// Method to calculate completion percentage
enrollmentSchema.methods.calculateCompletion = async function() {
  try {
    const course = await mongoose.model('Course').findById(this.courseId);
    if (!course) return 0;

    let totalItems = 0;
    course.modules.forEach(module => {
      totalItems += module.items.length;
    });

    if (totalItems === 0) return 0;

    const completedItems = this.progress.filter(p => p.isCompleted).length;
    const percentage = Math.round((completedItems / totalItems) * 100);
    
    this.completionPercentage = percentage;
    
    // Update status based on completion
    if (percentage === 100 && this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
    
    return percentage;
  } catch (error) {
    console.error('Error calculating completion:', error);
    return 0;
  }
};

// Static method to get enrollment statistics
enrollmentSchema.statics.getStats = function(courseId = null) {
  const match = courseId ? { courseId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompletion: { $avg: '$completionPercentage' }
      }
    }
  ]);
};

// Ensure virtuals are included in JSON output
enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;