import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Optional, for linking to specific course item
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true,
    unique: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx'],
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  aiSummary: {
    type: String,
    default: ''
  },
  summaryGenerated: {
    type: Boolean,
    default: false
  },
  summaryGeneratedAt: {
    type: Date
  },
  aiProvider: {
    type: String,
    enum: ['openai', 'gemini'],
    default: 'gemini'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot be more than 50 characters']
  }]
}, {
  timestamps: true
});

// Indexes for better performance
documentSchema.index({ courseId: 1, moduleId: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ title: 'text', extractedText: 'text' });
documentSchema.index({ summaryGenerated: 1 });
documentSchema.index({ isActive: 1 });

// Virtual for file URL generation
documentSchema.virtual('fullUrl').get(function() {
  return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${this.fileName}`;
});

// Method to increment download count
documentSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Static method to find documents by course
documentSchema.statics.findByCourse = function(courseId) {
  return this.find({ courseId, isActive: true }).populate('uploadedBy', 'name email');
};

// Static method to find documents needing AI summary
documentSchema.statics.findPendingSummary = function() {
  return this.find({ 
    summaryGenerated: false, 
    extractedText: { $ne: '' },
    isActive: true 
  });
};

// Ensure virtuals are included in JSON output
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

const Document = mongoose.model('Document', documentSchema);

export default Document;