import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [
      /^[\+]?[0-9\s\-\(\)]{10,15}$/,
      'Please provide a valid phone number'
    ]
  },
  courseApplied: {
    type: String,
    required: [true, 'Course selection is required'],
    trim: true,
    maxlength: [200, 'Course name cannot be more than 200 characters']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false // Optional reference to actual course
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  source: {
    type: String,
    enum: ['website', 'social_media', 'referral', 'advertisement', 'other'],
    default: 'website'
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'enrolled', 'rejected', 'follow_up'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },
  followUpDate: {
    type: Date
  },
  contactedAt: {
    type: Date
  },
  contactedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  enrolledAt: {
    type: Date
  },
  marketingConsent: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  referrerUrl: {
    type: String
  },
  utmSource: {
    type: String
  },
  utmMedium: {
    type: String
  },
  utmCampaign: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
applicationSchema.index({ email: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ priority: 1 });
applicationSchema.index({ courseApplied: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ followUpDate: 1 });

// Compound index for filtering
applicationSchema.index({ status: 1, priority: 1 });
applicationSchema.index({ courseApplied: 1, status: 1 });

// Virtual for days since application
applicationSchema.virtual('daysSinceApplication').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to update status
applicationSchema.methods.updateStatus = function(newStatus, userId = null, notes = '') {
  this.status = newStatus;
  
  if (newStatus === 'contacted') {
    this.contactedAt = new Date();
    this.contactedBy = userId;
  } else if (newStatus === 'enrolled') {
    this.enrolledAt = new Date();
  }
  
  if (notes) {
    this.notes = (this.notes ? this.notes + '\n\n' : '') + 
                 `${new Date().toISOString()}: ${notes}`;
  }
  
  return this.save();
};

// Method to set follow-up
applicationSchema.methods.setFollowUp = function(date, notes = '') {
  this.followUpDate = date;
  this.status = 'follow_up';
  
  if (notes) {
    this.notes = (this.notes ? this.notes + '\n\n' : '') + 
                 `Follow-up set for ${date.toDateString()}: ${notes}`;
  }
  
  return this.save();
};

// Static method to get applications needing follow-up
applicationSchema.statics.getNeedingFollowUp = function() {
  return this.find({
    followUpDate: { $lte: new Date() },
    status: { $in: ['follow_up', 'pending'] }
  }).sort({ followUpDate: 1, priority: -1 });
};

// Static method to get application statistics
applicationSchema.statics.getStats = function(dateRange = null) {
  const match = dateRange ? {
    createdAt: {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    }
  } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);
};

// Static method to get popular courses from applications
applicationSchema.statics.getPopularCourses = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$courseApplied',
        applicationCount: { $sum: 1 },
        enrollmentCount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'enrolled'] }, 1, 0]
          }
        }
      }
    },
    { $sort: { applicationCount: -1 } },
    { $limit: 10 }
  ]);
};

// Ensure virtuals are included in JSON output
applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;