/**
 * Download API Routes
 * Provides endpoints for downloading the Final deployment package
 */

import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export const downloadRoutes = {
  /**
   * Download Final deployment package as ZIP
   * GET /api/download/final
   */
  async downloadFinal(req: Request, res: Response) {
    try {
      const finalPath = path.join(process.cwd(), 'Final');
      const tempZipPath = path.join(process.cwd(), 'temp-final.zip');
      
      // Check if Final directory exists
      if (!fs.existsSync(finalPath)) {
        return res.status(404).json({ 
          error: 'Final deployment package not found' 
        });
      }

      try {
        // Try using tar command (available on most Unix systems)
        const tempArchivePath = path.join(process.cwd(), 'temp-final.tar.gz');
        await execAsync(`tar -czf "${tempArchivePath}" -C . Final`);
        
        // Archive created successfully, stream it to response
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', 'attachment; filename="thc-dope-budz-final.tar.gz"');
        
        const readStream = createReadStream(tempArchivePath);
        readStream.pipe(res);
        
        readStream.on('end', () => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempArchivePath);
            console.log('✅ Final package downloaded successfully');
          } catch (err) {
            console.warn('Failed to clean up temp archive file:', err);
          }
        });
        
        readStream.on('error', (err) => {
          console.error('Error streaming archive file:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream download' });
          }
          // Clean up temp file
          if (fs.existsSync(tempArchivePath)) {
            fs.unlinkSync(tempArchivePath);
          }
        });
        
      } catch (archiveError) {
        console.error('Archive creation failed:', archiveError);
        
        // Fallback: Provide manual download instructions
        if (!res.headersSent) {
          res.json({
            error: 'Archive creation not available',
            message: 'Please download files manually',
            deploymentInstructions: [
              '1. Copy the entire Final/ directory from this Replit workspace',
              '2. Create a new folder on your computer called "thc-dope-budz"',
              '3. Copy all files from Final/ into your new folder',
              '4. Upload the folder to Puter.com as a new app',
              '5. Set index.html as the main file',
              '6. Deploy and enjoy!'
            ],
            finalPath: 'Final/',
            note: 'The Final/ directory contains the complete ready-to-deploy game'
          });
        }
      }

    } catch (error) {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to download package',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  },

  /**
   * Get Final package info
   * GET /api/download/info
   */
  async getPackageInfo(req: Request, res: Response) {
    try {
      const finalPath = path.join(process.cwd(), 'Final');
      
      if (!fs.existsSync(finalPath)) {
        return res.status(404).json({ 
          error: 'Final deployment package not found' 
        });
      }

      // Get directory size and file count
      const getDirectoryStats = (dirPath: string): { size: number, files: number } => {
        let totalSize = 0;
        let fileCount = 0;

        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            const subStats = getDirectoryStats(itemPath);
            totalSize += subStats.size;
            fileCount += subStats.files;
          } else {
            totalSize += stats.size;
            fileCount++;
          }
        }
        
        return { size: totalSize, files: fileCount };
      };

      const stats = getDirectoryStats(finalPath);
      
      res.json({
        success: true,
        package: {
          name: 'THC Dope Budz Final',
          version: '1.0.0',
          size: stats.size,
          sizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(1)}MB`,
          fileCount: stats.files,
          lastModified: fs.statSync(finalPath).mtime,
          description: 'Complete Web3 cannabis trading game package ready for deployment'
        }
      });

    } catch (error) {
      console.error('Package info error:', error);
      res.status(500).json({ 
        error: 'Failed to get package info',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};