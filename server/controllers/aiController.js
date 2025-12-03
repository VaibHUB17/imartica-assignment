import Document from '../models/Document.js';
import mongoose from 'mongoose';

export const summarizeDocument = async (req, res) => {
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

    if (!document.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if document has extracted text
    if (!document.extractedText || document.extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No text content available for summarization'
      });
    }

    // Check if summary already exists and force flag
    const { force = false, provider = 'gemini' } = req.body;
    
    if (document.summaryGenerated && !force) {
      return res.status(200).json({
        success: true,
        message: 'Summary already exists',
        data: { 
          summary: document.aiSummary,
          provider: document.aiProvider,
          generatedAt: document.summaryGeneratedAt,
          isExisting: true
        }
      });
    }

    // Generate summary using specified AI provider
    let summary;
    try {
      if (provider === 'openai' && process.env.OPENAI_API_KEY) {
        summary = await generateOpenAISummary(document.extractedText);
      } else if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
        summary = await generateGeminiSummary(document.extractedText);
      } else {
        return res.status(400).json({
          success: false,
          message: `AI provider '${provider}' is not configured or API key is missing`
        });
      }
    } catch (aiError) {
      console.error('AI summarization error:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate summary using AI service',
        error: process.env.NODE_ENV === 'development' ? aiError.message : undefined
      });
    }

    // Update document with summary
    document.aiSummary = summary;
    document.summaryGenerated = true;
    document.summaryGeneratedAt = new Date();
    document.aiProvider = provider;
    
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document summarized successfully',
      data: {
        summary,
        provider,
        generatedAt: document.summaryGeneratedAt,
        documentId: document._id,
        isExisting: false
      }
    });

  } catch (error) {
    console.error('Summarize document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during summarization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Batch summarize documents
// @route   POST /api/ai/summarize-batch
// @access  Private/Admin
export const batchSummarizeDocuments = async (req, res) => {
  try {
    const { documentIds, provider = 'gemini', force = false } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    // Validate document IDs
    const invalidIds = documentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document IDs provided',
        invalidIds
      });
    }

    // Find documents
    const documents = await Document.find({
      _id: { $in: documentIds },
      isActive: true
    });

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid documents found'
      });
    }

    const results = {
      total: documents.length,
      processed: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // Process each document
    for (const document of documents) {
      try {
        // Skip if already summarized and not forcing
        if (document.summaryGenerated && !force) {
          results.skipped++;
          results.details.push({
            documentId: document._id,
            title: document.title,
            status: 'skipped',
            reason: 'Already summarized'
          });
          continue;
        }

        // Check if document has text content
        if (!document.extractedText || document.extractedText.trim().length === 0) {
          results.errors++;
          results.details.push({
            documentId: document._id,
            title: document.title,
            status: 'error',
            reason: 'No text content available'
          });
          continue;
        }

        // Generate summary
        let summary;
        if (provider === 'openai' && process.env.OPENAI_API_KEY) {
          summary = await generateOpenAISummary(document.extractedText);
        } else if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
          summary = await generateGeminiSummary(document.extractedText);
        } else {
          results.errors++;
          results.details.push({
            documentId: document._id,
            title: document.title,
            status: 'error',
            reason: `AI provider '${provider}' not configured`
          });
          continue;
        }

        // Update document
        document.aiSummary = summary;
        document.summaryGenerated = true;
        document.summaryGeneratedAt = new Date();
        document.aiProvider = provider;
        await document.save();

        results.processed++;
        results.details.push({
          documentId: document._id,
          title: document.title,
          status: 'success',
          summary: summary.substring(0, 100) + '...'
        });

        // Add delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing document ${document._id}:`, error);
        results.errors++;
        results.details.push({
          documentId: document._id,
          title: document.title,
          status: 'error',
          reason: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch summarization completed: ${results.processed} processed, ${results.skipped} skipped, ${results.errors} errors`,
      data: results
    });

  } catch (error) {
    console.error('Batch summarize error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during batch summarization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get AI service status
// @route   GET /api/ai/status
// @access  Private/Admin
export const getAIStatus = async (req, res) => {
  try {
    const status = {
      openai: {
        available: Boolean(process.env.OPENAI_API_KEY),
        configured: Boolean(process.env.OPENAI_API_KEY)
      },
      gemini: {
        available: Boolean(process.env.GEMINI_API_KEY),
        configured: Boolean(process.env.GEMINI_API_KEY)
      }
    };

    // Test AI services availability
    if (status.openai.configured) {
      try {
        await testOpenAIConnection();
        status.openai.working = true;
      } catch (error) {
        status.openai.working = false;
        status.openai.error = error.message;
      }
    }

    if (status.gemini.configured) {
      try {
        await testGeminiConnection();
        status.gemini.working = true;
      } catch (error) {
        status.gemini.working = false;
        status.gemini.error = error.message;
      }
    }

    // Get summarization statistics
    const totalDocuments = await Document.countDocuments({ isActive: true });
    const summarizedDocuments = await Document.countDocuments({ 
      isActive: true, 
      summaryGenerated: true 
    });
    const pendingDocuments = await Document.countDocuments({
      isActive: true,
      summaryGenerated: false,
      extractedText: { $ne: '', $exists: true }
    });

    res.status(200).json({
      success: true,
      data: {
        providers: status,
        statistics: {
          total: totalDocuments,
          summarized: summarizedDocuments,
          pending: pendingDocuments,
          coverage: totalDocuments > 0 ? 
            Math.round((summarizedDocuments / totalDocuments) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Get AI status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to generate summary using OpenAI
const generateOpenAISummary = async (text) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of educational documents. Focus on key concepts, main ideas, and important takeaways.'
        },
        {
          role: 'user',
          content: `Please provide a comprehensive summary of the following document in 2-3 paragraphs:\n\n${text.substring(0, 4000)}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from OpenAI API');
  }

  return data.choices[0].message.content.trim();
};

// Helper function to generate summary using Google Gemini
const generateGeminiSummary = async (text) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Please provide a comprehensive and well-structured summary of the following educational document. Focus on the main concepts, key points, and important takeaways. The summary should be informative and concise, around 2-3 paragraphs:\n\n${text.substring(0, 4000)}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
    throw new Error('Invalid response format from Gemini API');
  }

  return data.candidates[0].content.parts[0].text.trim();
};

// Helper function to test OpenAI connection
const testOpenAIConnection = async () => {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`OpenAI API test failed: ${response.status} ${response.statusText}`);
  }

  return true;
};

// Helper function to test Gemini connection
const testGeminiConnection = async () => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Gemini API test failed: ${response.status} ${response.statusText}`);
  }

  return true;
};

export default {
  summarizeDocument,
  batchSummarizeDocuments,
  getAIStatus
};