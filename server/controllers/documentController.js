import Document from '../models/Document.js';
import Course from '../models/Course.js';
import { getFileInfo, deleteUploadedFile } from '../middlewares/upload.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private/Admin
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { courseId, moduleId, title, tags } = req.body;

    // Validate required fields
    if (!courseId || !moduleId) {
      // Delete uploaded file if validation fails
      deleteUploadedFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Course ID and Module ID are required'
      });
    }

    // Validate course and module existence
    const course = await Course.findById(courseId);
    if (!course) {
      deleteUploadedFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      deleteUploadedFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Extract text from document
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
    } catch (extractError) {
      console.log('Text extraction failed:', extractError.message);
      // Continue without extracted text
    }

    // Create document record
    const document = await Document.create({
      courseId,
      moduleId,
      title: title || req.file.originalname,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl: req.fileInfo.url,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileType: req.fileInfo.fileType,
      extractedText,
      uploadedBy: req.user.id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await document.populate([
      { path: 'courseId', select: 'title' },
      { path: 'uploadedBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }
    
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID'
      });
    }

    const document = await Document.findById(req.params.id)
      .populate('courseId', 'title description')
      .populate('uploadedBy', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.status(200).json({
      success: true,
      data: { document }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
export const downloadDocument = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document || !document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    await document.incrementDownload();

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', document.fileSize);

    // Stream file to response
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get documents by course
// @route   GET /api/documents/course/:courseId
// @access  Private
export const getDocumentsByCourse = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { moduleId, fileType, hasSummary } = req.query;

    let filter = { 
      courseId: req.params.courseId, 
      isActive: true 
    };

    if (moduleId) filter.moduleId = moduleId;
    if (fileType) filter.fileType = fileType;
    if (hasSummary !== undefined) {
      filter.summaryGenerated = hasSummary === 'true';
    }

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: documents.length,
          totalDocuments: total
        }
      }
    });

  } catch (error) {
    console.error('Get documents by course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private/Admin
export const updateDocument = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const { title, tags, aiSummary } = req.body;

    // Update fields
    if (title) document.title = title.trim();
    if (tags) document.tags = tags.split(',').map(tag => tag.trim());
    if (aiSummary !== undefined) {
      document.aiSummary = aiSummary;
      document.summaryGenerated = Boolean(aiSummary);
      document.summaryGeneratedAt = aiSummary ? new Date() : null;
    }

    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: { document }
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private/Admin
export const deleteDocument = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Soft delete - just mark as inactive
    document.isActive = false;
    await document.save();

    // Optional: Delete physical file (uncomment if you want hard delete)
    // if (fs.existsSync(document.filePath)) {
    //   deleteUploadedFile(document.filePath);
    // }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Search documents
// @route   GET /api/documents/search
// @access  Private
export const searchDocuments = async (req, res) => {
  try {
    const { q, courseId, fileType, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = { isActive: true };

    // Add course filter if provided
    if (courseId) filter.courseId = courseId;
    if (fileType) filter.fileType = fileType;

    // Text search
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { extractedText: new RegExp(q, 'i') },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ];

    const documents = await Document.find(filter)
      .populate('courseId', 'title')
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        documents,
        searchQuery: q,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: documents.length,
          totalResults: total
        }
      }
    });

  } catch (error) {
    console.error('Search documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to extract text from files
const extractTextFromFile = async (filePath, mimeType) => {
  try {
    switch (mimeType) {
      case 'application/pdf':
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;

      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docBuffer = fs.readFileSync(filePath);
        const docData = await mammoth.extractRawText({ buffer: docBuffer });
        return docData.value;

      case 'text/plain':
        return fs.readFileSync(filePath, 'utf8');

      default:
        throw new Error('Unsupported file type for text extraction');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// @desc    Get document statistics
// @route   GET /api/documents/stats
// @access  Private/Admin
export const getDocumentStats = async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments({ isActive: true });
    const documentsWithSummary = await Document.countDocuments({ 
      isActive: true, 
      summaryGenerated: true 
    });

    const fileTypeStats = await Document.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const downloadStats = await Document.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloadCount' },
          avgDownloads: { $avg: '$downloadCount' }
        }
      }
    ]);

    const stats = downloadStats[0] || { totalDownloads: 0, avgDownloads: 0 };

    res.status(200).json({
      success: true,
      data: {
        total: totalDocuments,
        withSummary: documentsWithSummary,
        summaryPercentage: totalDocuments > 0 ? 
          Math.round((documentsWithSummary / totalDocuments) * 100) : 0,
        downloads: {
          total: stats.totalDownloads,
          average: Math.round(stats.avgDownloads * 100) / 100
        },
        fileTypes: fileTypeStats
      }
    });

  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  uploadDocument,
  getDocument,
  downloadDocument,
  getDocumentsByCourse,
  updateDocument,
  deleteDocument,
  searchDocuments,
  getDocumentStats
};