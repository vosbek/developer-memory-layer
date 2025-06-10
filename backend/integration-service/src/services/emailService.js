const express = require('express');
const { Client } = require('@microsoft/microsoft-graph-client');
const { AuthenticationProvider } = require('@azure/msal-node');
const router = express.Router();

// Microsoft Graph Email Integration
class EmailService {
  constructor(accessToken) {
    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => accessToken
      }
    });
  }

  // Capture and analyze emails for memory creation
  async captureRelevantEmails(userId, filters = {}) {
    try {
      // Get emails from last 24 hours with technical keywords
      const emails = await this.graphClient
        .api('/me/messages')
        .filter(this.buildEmailFilter(filters))
        .select('id,subject,bodyPreview,body,from,toRecipients,receivedDateTime,hasAttachments')
        .top(50)
        .get();

      const relevantEmails = [];

      for (const email of emails.value) {
        // Analyze email content for technical relevance
        const analysis = await this.analyzeEmailContent(email);
        
        if (analysis.isRelevant) {
          const memory = await this.createMemoryFromEmail(email, analysis, userId);
          relevantEmails.push(memory);
        }
      }

      return relevantEmails;
    } catch (error) {
      console.error('Error capturing emails:', error);
      throw error;
    }
  }

  // Build filter for technical/decision-making emails
  buildEmailFilter(filters) {
    const keywords = [
      'architecture', 'deployment', 'bug', 'fix', 'solution', 'decision',
      'API', 'database', 'performance', 'security', 'review', 'meeting',
      'requirements', 'specification', 'design', 'implementation',
      'github', 'jira', 'pull request', 'merge', 'release'
    ];

    const keywordFilter = keywords.map(k => `contains(subject,'${k}') or contains(bodyPreview,'${k}')`).join(' or ');
    const timeFilter = `receivedDateTime ge ${new Date(Date.now() - 24*60*60*1000).toISOString()}`;
    
    return `(${keywordFilter}) and ${timeFilter}`;
  }

  // Analyze email content using AI
  async analyzeEmailContent(email) {
    const content = `${email.subject} ${email.bodyPreview}`;
    
    // Simple keyword-based analysis (can be enhanced with OpenAI)
    const technicalKeywords = ['bug', 'fix', 'deploy', 'API', 'database', 'architecture', 'decision'];
    const hasDecision = /decided|decision|agreed|approved|rejected/i.test(content);
    const hasTechnicalContent = technicalKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    return {
      isRelevant: hasDecision || hasTechnicalContent,
      type: hasDecision ? 'decision' : 'technical',
      keywords: this.extractKeywords(content),
      confidence: this.calculateRelevanceScore(content)
    };
  }

  // Create memory from email
  async createMemoryFromEmail(email, analysis, userId) {
    const memory = {
      title: `Email: ${email.subject}`,
      content: this.cleanEmailContent(email.body?.content || email.bodyPreview),
      source: 'Outlook',
      type: analysis.type === 'decision' ? 'meeting' : 'documentation',
      tags: analysis.keywords,
      external_id: email.id,
      external_url: `https://outlook.office.com/mail/id/${email.id}`,
      user_id: userId,
      memory_date: new Date(email.receivedDateTime),
      metadata: {
        from: email.from?.emailAddress?.address,
        participants: email.toRecipients?.map(r => r.emailAddress.address),
        thread_topic: email.subject,
        has_attachments: email.hasAttachments
      }
    };

    return memory;
  }

  // Clean and extract meaningful content from email
  cleanEmailContent(htmlContent) {
    // Remove HTML tags, signatures, quoted text
    let cleanContent = htmlContent
      .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
      .replace(/-----Original Message-----[\s\S]*$/, '')  // Remove forwarded content
      .replace(/From:.*?Subject:.*?\n/gs, '')  // Remove email headers
      .replace(/\n{3,}/g, '\n\n')  // Normalize line breaks
      .trim();

    // Limit to first 1000 characters for memory storage
    return cleanContent.length > 1000 ? 
      cleanContent.substring(0, 1000) + '...' : 
      cleanContent;
  }

  extractKeywords(content) {
    const technicalTerms = [
      'API', 'database', 'frontend', 'backend', 'deployment', 'architecture',
      'react', 'node', 'python', 'javascript', 'typescript', 'kubernetes',
      'docker', 'aws', 'azure', 'github', 'jira', 'performance', 'security'
    ];

    return technicalTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );
  }

  calculateRelevanceScore(content) {
    let score = 0;
    
    // Decision-making language
    if (/decided|decision|agreed|approved/i.test(content)) score += 0.4;
    
    // Technical terms
    const techTermCount = this.extractKeywords(content).length;
    score += Math.min(techTermCount * 0.1, 0.3);
    
    // Project/product mentions
    if (/project|sprint|release|milestone/i.test(content)) score += 0.2;
    
    // Problem-solving language
    if (/solution|fix|resolve|implement/i.test(content)) score += 0.3;

    return Math.min(score, 1.0);
  }
}

// Routes
router.post('/sync-emails', async (req, res) => {
  try {
    const { accessToken, userId, filters } = req.body;
    
    const emailService = new EmailService(accessToken);
    const memories = await emailService.captureRelevantEmails(userId, filters);
    
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
        confidence: m.metadata?.confidence
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get email threads for a specific memory
router.get('/email-thread/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const { accessToken } = req.headers;
    
    // Get memory to find email ID
    const memory = await getMemoryFromDatabase(memoryId);
    if (!memory?.external_id) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const emailService = new EmailService(accessToken);
    const thread = await emailService.getEmailThread(memory.external_id);
    
    res.json({ thread });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, EmailService };