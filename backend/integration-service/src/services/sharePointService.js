const express = require('express');
const { Client } = require('@microsoft/microsoft-graph-client');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const router = express.Router();

class SharePointService {
  constructor(accessToken) {
    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => accessToken
      }
    });
  }

  // Discover and analyze SharePoint sites for relevant content
  async discoverRelevantContent(userId, siteIds = []) {
    try {
      const sites = siteIds.length > 0 ? siteIds : await this.getTeamSites();
      const relevantContent = [];

      for (const siteId of sites) {
        // Get document libraries
        const libraries = await this.getDocumentLibraries(siteId);
        
        for (const library of libraries) {
          // Scan for technical documents
          const documents = await this.scanLibraryForTechnicalDocs(siteId, library.id);
          relevantContent.push(...documents);
        }

        // Get SharePoint lists (like project trackers, decisions logs)
        const lists = await this.getSharePointLists(siteId);
        for (const list of lists) {
          const listItems = await this.scanListForDecisions(siteId, list.id);
          relevantContent.push(...listItems);
        }
      }

      // Process and create memories
      const memories = [];
      for (const content of relevantContent) {
        const memory = await this.createMemoryFromSharePointContent(content, userId);
        if (memory) memories.push(memory);
      }

      return memories;
    } catch (error) {
      console.error('Error discovering SharePoint content:', error);
      throw error;
    }
  }

  // Get team sites user has access to
  async getTeamSites() {
    const sites = await this.graphClient
      .api('/sites')
      .filter("siteCollection/root ne null")
      .select('id,displayName,webUrl')
      .get();

    return sites.value.map(site => site.id);
  }

  // Get document libraries in a site
  async getDocumentLibraries(siteId) {
    const drives = await this.graphClient
      .api(`/sites/${siteId}/drives`)
      .select('id,name,description')
      .get();

    return drives.value;
  }

  // Scan document library for technical documents
  async scanLibraryForTechnicalDocs(siteId, driveId) {
    const documents = await this.graphClient
      .api(`/sites/${siteId}/drives/${driveId}/root/children`)
      .select('id,name,size,createdDateTime,lastModifiedDateTime,file')
      .filter("file ne null")
      .get();

    const technicalDocs = [];

    for (const doc of documents.value) {
      if (this.isTechnicalDocument(doc)) {
        try {
          const content = await this.extractDocumentContent(siteId, driveId, doc.id, doc.file.mimeType);
          if (content) {
            technicalDocs.push({
              ...doc,
              content,
              type: 'document',
              source: 'SharePoint'
            });
          }
        } catch (error) {
          console.error(`Error processing document ${doc.name}:`, error);
        }
      }
    }

    return technicalDocs;
  }

  // Check if document is likely technical/relevant
  isTechnicalDocument(doc) {
    const technicalKeywords = [
      'architecture', 'design', 'specification', 'requirements', 'API',
      'database', 'deployment', 'runbook', 'documentation', 'decision',
      'ADR', 'RFC', 'technical', 'system', 'infrastructure'
    ];

    const fileName = doc.name.toLowerCase();
    const isTechnical = technicalKeywords.some(keyword => fileName.includes(keyword));
    
    // Check file types
    const technicalExtensions = ['.docx', '.pdf', '.md', '.txt', '.xlsx'];
    const hasTechnicalExtension = technicalExtensions.some(ext => fileName.endsWith(ext));
    
    return isTechnical && hasTechnicalExtension;
  }

  // Extract content from different document types
  async extractDocumentContent(siteId, driveId, itemId, mimeType) {
    try {
      // Get document content
      const contentStream = await this.graphClient
        .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}/content`)
        .getStream();

      const buffer = await this.streamToBuffer(contentStream);

      switch (mimeType) {
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractWordContent(buffer);
        
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return await this.extractExcelContent(buffer);
        
        case 'text/plain':
        case 'text/markdown':
          return buffer.toString('utf8');
        
        case 'application/pdf':
          // PDF extraction would require additional library like pdf-parse
          return '[PDF content - requires PDF parser]';
        
        default:
          return null;
      }
    } catch (error) {
      console.error('Error extracting document content:', error);
      return null;
    }
  }

  // Extract content from Word documents
  async extractWordContent(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting Word content:', error);
      return null;
    }
  }

  // Extract content from Excel files
  async extractExcelContent(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let content = '';

      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        content += `\n\n=== ${sheetName} ===\n`;
        
        // Convert first few rows to text (headers + sample data)
        sheetData.slice(0, 10).forEach((row, index) => {
          if (row.length > 0) {
            content += `${row.join(' | ')}\n`;
          }
        });
      });

      return content;
    } catch (error) {
      console.error('Error extracting Excel content:', error);
      return null;
    }
  }

  // Get SharePoint lists for structured data
  async getSharePointLists(siteId) {
    const lists = await this.graphClient
      .api(`/sites/${siteId}/lists`)
      .select('id,displayName,description')
      .filter("hidden eq false and list/template ne 'documentLibrary'")
      .get();

    return lists.value;
  }

  // Scan SharePoint lists for decision records, project updates, etc.
  async scanListForDecisions(siteId, listId) {
    try {
      const items = await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items`)
        .expand('fields')
        .top(50)
        .get();

      const decisions = [];

      for (const item of items.value) {
        const fields = item.fields;
        
        // Look for decision-like content
        if (this.isDecisionRecord(fields)) {
          decisions.push({
            id: item.id,
            content: this.formatListItemContent(fields),
            type: 'list-item',
            source: 'SharePoint',
            createdDateTime: item.createdDateTime,
            lastModifiedDateTime: item.lastModifiedDateTime
          });
        }
      }

      return decisions;
    } catch (error) {
      console.error('Error scanning SharePoint list:', error);
      return [];
    }
  }

  // Check if list item contains decision information
  isDecisionRecord(fields) {
    const decisionKeywords = ['decision', 'approved', 'rejected', 'status', 'outcome', 'action'];
    const fieldValues = Object.values(fields).join(' ').toLowerCase();
    
    return decisionKeywords.some(keyword => fieldValues.includes(keyword));
  }

  // Format list item content for memory storage
  formatListItemContent(fields) {
    let content = '';
    
    // Common SharePoint field names to look for
    const importantFields = ['Title', 'Description', 'Comments', 'Decision', 'Status', 'Outcome'];
    
    for (const fieldName of importantFields) {
      if (fields[fieldName] && fields[fieldName].toString().trim()) {
        content += `${fieldName}: ${fields[fieldName]}\n`;
      }
    }

    return content.trim();
  }

  // Create memory from SharePoint content
  async createMemoryFromSharePointContent(content, userId) {
    if (!content.content || content.content.length < 50) {
      return null; // Skip very short content
    }

    const memory = {
      title: content.name || this.generateTitleFromContent(content.content),
      content: this.cleanAndTruncateContent(content.content),
      source: 'SharePoint',
      type: content.type === 'document' ? 'documentation' : 'insight',
      tags: this.extractTechnicalTags(content.content),
      external_url: content.webUrl || `#sharepoint-${content.id}`,
      user_id: userId,
      memory_date: new Date(content.lastModifiedDateTime || content.createdDateTime),
      metadata: {
        document_type: content.file?.mimeType || 'list-item',
        size: content.size,
        sharepoint_item_id: content.id
      }
    };

    return memory;
  }

  // Helper methods
  generateTitleFromContent(content) {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  }

  cleanAndTruncateContent(content) {
    // Clean up content and limit to reasonable size
    const cleaned = content
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned.length > 2000 ? cleaned.substring(0, 2000) + '...' : cleaned;
  }

  extractTechnicalTags(content) {
    const technicalTerms = [
      'API', 'database', 'frontend', 'backend', 'deployment', 'architecture',
      'microservices', 'kubernetes', 'docker', 'aws', 'azure', 'security',
      'performance', 'scalability', 'monitoring', 'logging', 'testing'
    ];

    const contentLower = content.toLowerCase();
    return technicalTerms.filter(term => contentLower.includes(term.toLowerCase()));
  }

  async streamToBuffer(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

// Routes
router.post('/sync-sharepoint', async (req, res) => {
  try {
    const { accessToken, userId, siteIds } = req.body;
    
    const sharePointService = new SharePointService(accessToken);
    const memories = await sharePointService.discoverRelevantContent(userId, siteIds);
    
    // Save memories to database
    for (const memory of memories) {
      await saveMemoryToDatabase(memory);
    }

    res.json({
      success: true,
      captured: memories.length,
      memories: memories.map(m => ({
        title: m.title,
        type: m.type,
        tags: m.tags,
        source: m.source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available SharePoint sites
router.get('/sharepoint-sites', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    
    const sharePointService = new SharePointService(accessToken);
    const sites = await sharePointService.getTeamSites();
    
    res.json({ sites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, SharePointService };