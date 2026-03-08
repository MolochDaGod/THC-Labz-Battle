/**
 * OpenAI Webhook API Routes
 * RESTful endpoints for OpenAI webhook event handling
 */

import { Request, Response } from 'express';
import { openAIWebhookService } from './openai-webhook-service.js';

export const openAIWebhookRoutes = {
  /**
   * Handle incoming OpenAI webhook events
   * POST /api/openai/webhook
   */
  async handleWebhook(req: Request, res: Response) {
    await openAIWebhookService.handleWebhook(req, res);
  },

  /**
   * Get recent AI events for polling
   * GET /api/openai/events
   */
  async getEvents(req: Request, res: Response) {
    await openAIWebhookService.getRecentEvents(req, res);
  },

  /**
   * Test OpenAI webhook system
   * POST /api/openai/test
   */
  async testWebhook(req: Request, res: Response) {
    await openAIWebhookService.testWebhook(req, res);
  },

  /**
   * Get OpenAI webhook status
   * GET /api/openai/status
   */
  async getStatus(req: Request, res: Response) {
    await openAIWebhookService.getStatus(req, res);
  }
};