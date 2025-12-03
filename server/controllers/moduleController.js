import Course from '../models/Course.js';
import mongoose from 'mongoose';

export const addItem = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const { type, title, url, duration, description, order } = req.body;

    if (!type || !title || !url) {
      return res.status(400).json({ success: false, message: 'Type, title, and URL are required' });
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

    res.status(201).json({
      success: true,
      message: 'Item added successfully',
      data: { item: module.items[module.items.length - 1] }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateItem = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const item = module.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { type, title, url, duration, description, order } = req.body;

    if (type && ['video', 'document'].includes(type)) item.type = type;
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    module.items.pull(req.params.itemId);
    await course.save();

    res.status(200).json({ success: true, message: 'Item deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getModuleItems = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!course.isPublished && req.user?.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const sortedItems = module.items.sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      data: {
        moduleId: module._id,
        moduleTitle: module.title,
        items: sortedItems,
        totalDuration: sortedItems.reduce((total, item) => total + (item.duration || 0), 0)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getItem = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!course.isPublished && req.user?.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const item = module.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({
      success: true,
      data: { item }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const reorderItems = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const { itemOrders } = req.body;
    if (!Array.isArray(itemOrders)) {
      return res.status(400).json({ success: false, message: 'Item orders must be an array' });
    }

    itemOrders.forEach(({ itemId, order }) => {
      const item = module.items.id(itemId);
      if (item) item.order = order;
    });

    await course.save();
    res.status(200).json({ success: true, message: 'Items reordered successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const bulkAddItems = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const module = course.modules.id(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const validItems = [];
    items.forEach((item, index) => {
      if (item.type && item.title && item.url) {
        validItems.push({
          type: item.type,
          title: item.title.trim(),
          url: item.url.trim(),
          duration: item.duration || 0,
          description: item.description?.trim() || '',
          order: item.order !== undefined ? item.order : (module.items.length + validItems.length)
        });
      }
    });

    module.items.push(...validItems);
    await course.save();

    res.status(201).json({
      success: true,
      message: `${validItems.length} items added successfully`,
      data: { addedItems: validItems }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
