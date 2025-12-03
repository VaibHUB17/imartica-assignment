import Course from '../models/Course.js';
import mongoose from 'mongoose';

// @desc    Add item to module
// @route   POST /api/courses/:courseId/modules/:moduleId/items
// @access  Private/Admin
export const addItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId) || 
        !mongoose.Types.ObjectId.isValid(req.params.moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course or module ID'
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const { type, title, url, duration, description, order } = req.body;

    // Validation
    if (!type || !title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and URL are required'
      });
    }

    if (!['video', 'document'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "video" or "document"'
      });
    }

    const newItem = {
      type,
      title: title.trim(),
      url: url.trim(),
      duration: duration || 0,
      description: description?.trim() || '',
      order: order !== undefined ? order : module.items.length
    };

    module.items.push(newItem);
    await course.save();

    const addedItem = module.items[module.items.length - 1];

    res.status(201).json({
      success: true,
      message: 'Item added successfully',
      data: { 
        item: addedItem,
        moduleId: module._id,
        courseId: course._id
      }
    });

  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update item in module
// @route   PUT /api/courses/:courseId/modules/:moduleId/items/:itemId
// @access  Private/Admin
export const updateItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId) || 
        !mongoose.Types.ObjectId.isValid(req.params.moduleId) ||
        !mongoose.Types.ObjectId.isValid(req.params.itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course, module, or item ID'
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const item = module.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const { type, title, url, duration, description, order } = req.body;

    // Update fields
    if (type && ['video', 'document'].includes(type)) {
      item.type = type;
    }
    if (title) item.title = title.trim();
    if (url) item.url = url.trim();
    if (duration !== undefined) item.duration = duration;
    if (description !== undefined) item.description = description.trim();
    if (order !== undefined) item.order = order;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: { item }
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete item from module
// @route   DELETE /api/courses/:courseId/modules/:moduleId/items/:itemId
// @access  Private/Admin
export const deleteItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId) || 
        !mongoose.Types.ObjectId.isValid(req.params.moduleId) ||
        !mongoose.Types.ObjectId.isValid(req.params.itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course, module, or item ID'
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const item = module.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    module.items.pull(req.params.itemId);
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all items in a module
// @route   GET /api/courses/:courseId/modules/:moduleId/items
// @access  Public (if course is published) / Private (if enrolled)
export const getModuleItems = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId) || 
        !mongoose.Types.ObjectId.isValid(req.params.moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course or module ID'
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is published (for non-admin users)
    if (!course.isPublished && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Sort items by order
    const sortedItems = module.items.sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      data: {
        moduleId: module._id,
        moduleTitle: module.title,
        moduleDescription: module.description,
        items: sortedItems,
        totalItems: sortedItems.length,
        totalDuration: sortedItems.reduce((total, item) => total + (item.duration || 0), 0)
      }
    });

  } catch (error) {
    console.error('Get module items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single item
// @route   GET /api/courses/:courseId/modules/:moduleId/items/:itemId
// @access  Public (if course is published) / Private (if enrolled)
export const getItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId) || 
        !mongoose.Types.ObjectId.isValid(req.params.moduleId) ||
        !mongoose.Types.ObjectId.isValid(req.params.itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course, module, or item ID'
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is published (for non-admin users)
    if (!course.isPublished && req.user?.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const item = module.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        item,
        module: {
          id: module._id,
          title: module.title,
          description: module.description
        },
        course: {
          id: course._id,
          title: course.title
        }
      }
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reorder items in module
// @route   PUT /api/courses/:courseId/modules/:moduleId/items/reorder
// @access  Private/Admin
export const reorderItems = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId) || 
        !mongoose.Types.ObjectId.isValid(req.params.moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course or module ID'
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const { itemOrders } = req.body;

    if (!Array.isArray(itemOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Item orders must be an array'
      });
    }

    // Update item orders
    itemOrders.forEach(({ itemId, order }) => {
      const item = module.items.id(itemId);
      if (item) {
        item.order = order;
      }
    });

    await course.save();

    // Sort items by order for response
    const sortedItems = module.items.sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      message: 'Items reordered successfully',
      data: { items: sortedItems }
    });

  } catch (error) {
    console.error('Reorder items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Bulk add items to module
// @route   POST /api/courses/:courseId/modules/:moduleId/items/bulk
// @access  Private/Admin
export const bulkAddItems = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.courseId) || 
        !mongoose.Types.ObjectId.isValid(req.params.moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course or module ID'
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = course.modules.id(req.params.moduleId);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty'
      });
    }

    // Validate each item
    const validItems = [];
    const errors = [];

    items.forEach((item, index) => {
      if (!item.type || !item.title || !item.url) {
        errors.push(`Item ${index + 1}: Type, title, and URL are required`);
        return;
      }

      if (!['video', 'document'].includes(item.type)) {
        errors.push(`Item ${index + 1}: Type must be either "video" or "document"`);
        return;
      }

      validItems.push({
        type: item.type,
        title: item.title.trim(),
        url: item.url.trim(),
        duration: item.duration || 0,
        description: item.description?.trim() || '',
        order: item.order !== undefined ? item.order : (module.items.length + validItems.length)
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }

    // Add all valid items
    module.items.push(...validItems);
    await course.save();

    res.status(201).json({
      success: true,
      message: `${validItems.length} items added successfully`,
      data: { 
        addedItems: validItems,
        totalItems: module.items.length
      }
    });

  } catch (error) {
    console.error('Bulk add items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  addItem,
  updateItem,
  deleteItem,
  getModuleItems,
  getItem,
  reorderItems,
  bulkAddItems
};