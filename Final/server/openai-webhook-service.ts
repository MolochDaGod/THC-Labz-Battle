/**
 * OpenAI Webhook Service for THC Dope Budz
 * Handles real-time AI assistant events and responses
 */

import { Request, Response } from 'express';
import crypto from 'crypto';

interface OpenAIWebhookEvent {
  id: string;
  object: string;
  created_at: number;
  type: string;
  data: {
    id: string;
    object: string;
    [key: string]: any;
  };
}

interface AssistantMessage {
  id: string;
  content: string;
  role: 'assistant' | 'user';
  thread_id: string;
  created_at: number;
}

class OpenAIWebhookService {
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.OPENAI_WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      console.warn('⚠️ OPENAI_WEBHOOK_SECRET not configured - OpenAI webhooks disabled');
    }
  }

  /**
   * Verify webhook signature for security
   */
  private verifyWebhookSignature(signature: string, body: string): boolean {
    if (!this.webhookSecret) return false;
    
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  }

  /**
   * Handle incoming OpenAI webhook events
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['openai-signature'] as string;
      const body = JSON.stringify(req.body);

      // Verify webhook signature if secret is configured
      if (this.webhookSecret && !this.verifyWebhookSignature(signature, body)) {
        console.error('❌ Invalid OpenAI webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event: OpenAIWebhookEvent = req.body;
      console.log(`🤖 OpenAI webhook event received: ${event.type}`);

      await this.processEvent(event);
      
      res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      console.error('❌ OpenAI webhook processing failed:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process different types of OpenAI events
   */
  private async processEvent(event: OpenAIWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'thread.message.created':
        await this.handleMessageCreated(event);
        break;
      
      case 'thread.message.completed':
        await this.handleMessageCompleted(event);
        break;
      
      case 'thread.run.completed':
        await this.handleRunCompleted(event);
        break;
      
      case 'thread.run.failed':
        await this.handleRunFailed(event);
        break;
      
      case 'assistant.tool_call.created':
        await this.handleToolCallCreated(event);
        break;
      
      default:
        console.log(`📝 Unhandled OpenAI event type: ${event.type}`);
    }
  }

  /**
   * Handle new message creation
   */
  private async handleMessageCreated(event: OpenAIWebhookEvent): Promise<void> {
    const message = event.data as AssistantMessage;
    
    console.log(`💬 New AI message created: ${message.id}`);
    
    // Trigger real-time notification to connected clients
    await this.notifyClients('ai_message_created', {
      messageId: message.id,
      threadId: message.thread_id,
      timestamp: message.created_at
    });
  }

  /**
   * Handle message completion
   */
  private async handleMessageCompleted(event: OpenAIWebhookEvent): Promise<void> {
    const message = event.data as AssistantMessage;
    
    console.log(`✅ AI message completed: ${message.id}`);
    
    // Check if this is The Plug assistant providing game advice
    if (message.role === 'assistant' && message.content) {
      await this.processGameAdvice(message);
    }
    
    // Notify clients of completion
    await this.notifyClients('ai_message_completed', {
      messageId: message.id,
      content: message.content,
      threadId: message.thread_id
    });
  }

  /**
   * Handle assistant run completion
   */
  private async handleRunCompleted(event: OpenAIWebhookEvent): Promise<void> {
    console.log(`🎯 AI run completed: ${event.data.id}`);
    
    // Trigger AI influence system if this was a successful strategy conversation
    await this.notifyClients('ai_run_completed', {
      runId: event.data.id,
      shouldTriggerInfluence: true
    });
  }

  /**
   * Handle failed runs
   */
  private async handleRunFailed(event: OpenAIWebhookEvent): Promise<void> {
    console.error(`❌ AI run failed: ${event.data.id}`);
    
    // Log failure for debugging
    await this.notifyClients('ai_run_failed', {
      runId: event.data.id,
      error: event.data.last_error || 'Unknown error'
    });
  }

  /**
   * Handle tool call creation
   */
  private async handleToolCallCreated(event: OpenAIWebhookEvent): Promise<void> {
    console.log(`🔧 AI tool call created: ${event.data.id}`);
    
    // Could be used for game integration tools
    await this.notifyClients('ai_tool_call', {
      toolCallId: event.data.id,
      toolType: event.data.type
    });
  }

  /**
   * Process game advice from The Plug
   */
  private async processGameAdvice(message: AssistantMessage): Promise<void> {
    const advice = message.content.toLowerCase();
    
    // Check for specific game advice patterns
    const patterns = {
      heatWarning: /heat|police|law|bust/,
      priceAlert: /price|cheap|expensive|buy|sell/,
      strategyTip: /strategy|profit|money|deal/,
      locationAdvice: /city|travel|move|location/
    };

    let adviceType = 'general';
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(advice)) {
        adviceType = type;
        break;
      }
    }

    console.log(`🧠 The Plug provided ${adviceType} advice`);
    
    // Trigger appropriate game response
    await this.notifyClients('game_advice_received', {
      type: adviceType,
      messageId: message.id,
      threadId: message.thread_id
    });
  }

  /**
   * Notify connected clients via WebSocket or server-sent events
   */
  private async notifyClients(eventType: string, data: any): Promise<void> {
    // This would integrate with your WebSocket system
    // For now, we'll use server-side event storage
    console.log(`📡 Broadcasting event: ${eventType}`, data);
    
    // Store event for polling-based clients
    global.recentAIEvents = global.recentAIEvents || [];
    global.recentAIEvents.push({
      type: eventType,
      data,
      timestamp: Date.now()
    });
    
    // Keep only last 50 events
    if (global.recentAIEvents.length > 50) {
      global.recentAIEvents = global.recentAIEvents.slice(-50);
    }
  }

  /**
   * Get recent AI events for polling clients
   */
  async getRecentEvents(req: Request, res: Response): Promise<void> {
    const since = parseInt(req.query.since as string) || 0;
    const events = (global.recentAIEvents || []).filter(
      (event: any) => event.timestamp > since
    );
    
    res.json({
      success: true,
      events,
      currentTime: Date.now()
    });
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(req: Request, res: Response): Promise<void> {
    console.log('🧪 Testing OpenAI webhook system...');
    
    const testEvent: OpenAIWebhookEvent = {
      id: 'test_' + Date.now(),
      object: 'event',
      created_at: Math.floor(Date.now() / 1000),
      type: 'thread.message.completed',
      data: {
        id: 'msg_test',
        object: 'thread.message',
        content: 'Test message from The Plug',
        role: 'assistant',
        thread_id: 'thread_test',
        created_at: Math.floor(Date.now() / 1000)
      }
    };
    
    await this.processEvent(testEvent);
    
    res.json({
      success: true,
      message: 'OpenAI webhook test completed',
      testEvent
    });
  }

  /**
   * Get webhook status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      webhookConfigured: !!this.webhookSecret,
      recentEventsCount: (global.recentAIEvents || []).length,
      status: 'active'
    });
  }
}

export const openAIWebhookService = new OpenAIWebhookService();