import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectories based on file type or date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const subDir = path.join(uploadsDir, `${year}`, `${month}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }
    
    cb(null, subDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${name}-${uniqueSuffix}${ext}`;
    
    // Store filename in request for later use
    req.uploadedFilename = filename;
    
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    // Allowed file types
    const allowedTypes = process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx'];
    
    // Allowed MIME types
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    // Get file extension
    const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    // Check file extension and MIME type
    if (allowedTypes.includes(fileExt) && allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // Default 10MB
    files: 5 // Maximum 5 files at once
  }
});

// Single file upload middleware
export const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      
      // Add file info to request
      if (req.file) {
        req.fileInfo = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
          mimetype: req.file.mimetype,
          fileType: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
          url: `/uploads/${path.relative(uploadsDir, req.file.path).replace(/\\/g, '/')}`
        };
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      
      // Add files info to request
      if (req.files && req.files.length > 0) {
        req.filesInfo = req.files.map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          fileType: path.extname(file.originalname).toLowerCase().replace('.', ''),
          url: `/uploads/${path.relative(uploadsDir, file.path).replace(/\\/g, '/')}`
        }));
      }
      
      next();
    });
  };
};

// Fields upload middleware (for different field names)
export const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      if (err) {
        return handleUploadError(err, res);
      }
      
      // Process uploaded files
      req.uploadedFiles = {};
      
      fields.forEach(field => {
        if (req.files && req.files[field.name]) {
          req.uploadedFiles[field.name] = req.files[field.name].map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            fileType: path.extname(file.originalname).toLowerCase().replace('.', ''),
            url: `/uploads/${path.relative(uploadsDir, file.path).replace(/\\/g, '/')}`
          }));
        }
      });
      
      next();
    });
  };
};

// Error handler for upload errors
const handleUploadError = (err, res) => {
  console.error('Upload error:', err);
  
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size allowed is ${Math.round((parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Please select fewer files.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
          error: err.message
        });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.'
    });
  }
};

// Utility function to delete uploaded file
export const deleteUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file info
export const getFileInfo = (filename) => {
  try {
    const filePath = findFilePath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    return {
      filename: filename,
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: ext,
      url: `/uploads/${path.relative(uploadsDir, filePath).replace(/\\/g, '/')}`
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

// Utility function to find file path recursively
const findFilePath = (filename) => {
  try {
    const searchInDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile() && item === filename) {
          return fullPath;
        } else if (stat.isDirectory()) {
          const found = searchInDir(fullPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchInDir(uploadsDir);
  } catch (error) {
    console.error('Error finding file:', error);
    return null;
  }
};

// Cleanup old files (utility function for maintenance)
export const cleanupOldFiles = (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const cleanupDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile() && stat.mtime < cutoffDate) {
          fs.unlinkSync(fullPath);
          console.log(`Cleaned up old file: ${fullPath}`);
        } else if (stat.isDirectory()) {
          cleanupDir(fullPath);
          
          // Remove empty directories
          try {
            const dirItems = fs.readdirSync(fullPath);
            if (dirItems.length === 0) {
              fs.rmdirSync(fullPath);
              console.log(`Removed empty directory: ${fullPath}`);
            }
          } catch (err) {
            // Directory not empty or other error
          }
        }
      });
    };
    
    cleanupDir(uploadsDir);
    console.log(`Cleanup completed for files older than ${daysOld} days`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteUploadedFile,
  getFileInfo,
  cleanupOldFiles
};