import Document from '../models/Document.js';
import Course from '../models/Course.js';
import { deleteUploadedFile } from '../middlewares/upload.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { permittedCrossDomainPolicies } from 'helmet';

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { courseId, moduleId, title, tags } = req.body;
    if (!courseId || !moduleId) {
      deleteUploadedFile(req.file.path);
      return res.status(400).json({ success: false, message: 'Course ID and Module ID are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      deleteUploadedFile(req.file.path);
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      deleteUploadedFile(req.file.path);
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
    } catch (extractError) {
      extractedText = '';
    }

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

    res.status(201).json({ success: true, message: 'Document uploaded successfully' });
  } catch (error) {
    if (req.file) deleteUploadedFile(req.file.path);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('courseId', 'title description')
      .populate('uploadedBy', 'name email');

    if (!document || !document.isActive) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.status(200).json({ success: true, data: { document } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || !document.isActive) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    await document.incrementDownload();

    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', document.fileSize);
    
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDocumentsByCourse = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { moduleId, fileType } = req.query;

    let filter = { courseId: req.params.courseId, isActive: true };
    if (moduleId) filter.moduleId = moduleId;
    if (fileType) filter.fileType = fileType;

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
        pagination: { current: page, total: Math.ceil(total / limit), count: documents.length }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const { title, tags, aiSummary } = req.body;
    if (title) document.title = title.trim();
    if (tags) document.tags = tags.split(',').map(tag => tag.trim());
    if (aiSummary !== undefined) {
      document.aiSummary = aiSummary;
      document.summaryGenerated = Boolean(aiSummary);
    }

    await document.save();
    res.status(200).json({ success: true, message: 'Document updated successfully', data: { document } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    document.isActive = false;
    await document.save();
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const extractTextFromFile = async (filePath, mimeType) => {
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
      throw new Error('Unsupported file type');
  }
};