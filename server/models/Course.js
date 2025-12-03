import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  type: {
    type: String,
    enum: ['video', 'document'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  url: {
    type: String,
    required: [true, 'Item URL is required']
  },
  duration: {
    type: Number, // Duration in minutes for videos
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  order: {
    type: Number,
    default: 0
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const moduleSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  order: {
    type: Number,
    default: 0
  },
  items: [itemSchema]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modules: [moduleSchema],
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot be more than 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot be more than 50 characters']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ createdBy: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ 'rating.average': -1 });

courseSchema.virtual('totalDuration').get(function() {
  if (!this.modules || !Array.isArray(this.modules)) {
    return 0;
  }
  return this.modules.reduce((total, module) => {
    if (!module.items || !Array.isArray(module.items)) {
      return total;
    }
    return total + module.items.reduce((moduleTotal, item) => {
      return moduleTotal + (item.duration || 0);
    }, 0);
  }, 0);
});

courseSchema.virtual('totalItems').get(function() {
  if (!this.modules || !Array.isArray(this.modules)) {
    return 0;
  }
  return this.modules.reduce((total, module) => {
    if (!module.items || !Array.isArray(module.items)) {
      return total;
    }
    return total + module.items.length;
  }, 0);
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;