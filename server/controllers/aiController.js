import Document from '../models/Document.js';
import mongoose from 'mongoose';

export const summarizeDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || !document.isActive) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!document.extractedText || document.extractedText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'No text content available' });
    }

    const { force = false } = req.body;
    
    if (document.summaryGenerated && !force) {
      return res.status(200).json({
        success: true,
        message: 'Summary already exists',
        data: { summary: document.aiSummary }
      });
    }

    let summary;
    try {
      summary = await generateGeminiSummary(document.extractedText);
    } catch (aiError) {
      return res.status(500).json({ success: false, message: 'Failed to generate summary' });
    }

    document.aiSummary = summary;
    document.summaryGenerated = true;
    document.summaryGeneratedAt = new Date();
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document summarized successfully',
      data: { summary }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const batchSummarizeDocuments = async (req, res) => {
  try {
    const { documentIds, force = false } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Document IDs array is required' });
    }

    const documents = await Document.find({
      _id: { $in: documentIds },
      isActive: true
    });

    if (documents.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid documents found' });
    }

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const document of documents) {
      try {
        if (document.summaryGenerated && !force) {
          skipped++;
          continue;
        }

        if (!document.extractedText) {
          errors++;
          continue;
        }

        const summary = await generateGeminiSummary(document.extractedText);
        document.aiSummary = summary;
        document.summaryGenerated = true;
        document.summaryGeneratedAt = new Date();
        await document.save();
        processed++;

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch completed: ${processed} processed, ${skipped} skipped, ${errors} errors`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAIStatus = async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments({ isActive: true });
    const summarizedDocuments = await Document.countDocuments({ 
      isActive: true, 
      summaryGenerated: true 
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalDocuments,
        summarized: summarizedDocuments,
        coverage: totalDocuments > 0 ? 
          Math.round((summarizedDocuments / totalDocuments) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generateGeminiSummary = async (text) => {
  const requestBody = {
    contents: [{
      parts: [{
        text: `Summarize this document: ${text.substring(0, 4000)}`
      }]
    }]
  };
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!summary) {
    throw new Error('No summary generated');
  }

  return summary;
};