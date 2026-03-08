#!/usr/bin/env node
/**
 * THC Dope Budz - Comprehensive Deployment Health Check
 * Validates all critical systems for production deployment
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
const TEST_WALLET = '98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK';

class HealthChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'PASS': '✅',
      'FAIL': '❌', 
      'WARN': '⚠️',
      'INFO': 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'PASS') this.results.passed++;
    if (type === 'FAIL') {
      this.results.failed++;
      this.results.issues.push(message);
    }
    if (type === 'WARN') this.results.warnings++;
  }

  async testApiEndpoint(endpoint, expectedStatus = 200) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (response.status === expectedStatus) {
        this.log('PASS', `API endpoint ${endpoint} responding correctly (${response.status})`);
        return await response.json();
      } else {
        this.log('FAIL', `API endpoint ${endpoint} returned ${response.status}, expected ${expectedStatus}`);
        return null;
      }
    } catch (error) {
      this.log('FAIL', `API endpoint ${endpoint} failed: ${error.message}`);
      return null;
    }
  }

  async testPostEndpoint(endpoint, data, expectedStatus = 200) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.status === expectedStatus) {
        this.log('PASS', `POST endpoint ${endpoint} responding correctly (${response.status})`);
        return await response.json();
      } else {
        this.log('FAIL', `POST endpoint ${endpoint} returned ${response.status}, expected ${expectedStatus}`);
        return null;
      }
    } catch (error) {
      this.log('FAIL', `POST endpoint ${endpoint} failed: ${error.message}`);
      return null;
    }
  }

  checkFileExists(filePath) {
    if (fs.existsSync(filePath)) {
      this.log('PASS', `Required file exists: ${filePath}`);
      return true;
    } else {
      this.log('FAIL', `Required file missing: ${filePath}`);
      return false;
    }
  }

  checkBuildOutput() {
    try {
      execSync('npm run build', { stdio: 'pipe' });
      this.log('PASS', 'Build process completed successfully');
      return true;
    } catch (error) {
      this.log('FAIL', `Build process failed: ${error.message}`);
      return false;
    }
  }

  async testDatabaseConnection() {
    const result = await this.testApiEndpoint('/api/system/health');
    if (result && result.success) {
      this.log('PASS', 'Database connection healthy');
      return true;
    } else {
      this.log('FAIL', 'Database connection issues detected');
      return false;
    }
  }

  async testWeb3Integration() {
    const result = await this.testApiEndpoint(`/api/my-nfts/${TEST_WALLET}`);
    if (result && result.success !== undefined) {
      this.log('PASS', 'Web3 NFT detection system operational');
      return true;
    } else {
      this.log('FAIL', 'Web3 NFT detection system issues');
      return false;
    }
  }

  async testTokenPricing() {
    const result = await this.testApiEndpoint('/api/token-prices/batch');
    if (result && result.gbux && result.budz && result.thcLabz) {
      this.log('PASS', 'Token pricing system operational');
      return true;
    } else {
      this.log('FAIL', 'Token pricing system issues');
      return false;
    }
  }

  async testFloorPrice() {
    const result = await this.testApiEndpoint('/api/floor-price/thc-growerz');
    if (result && result.success && result.floorPrice) {
      this.log('PASS', `Floor price system operational (${result.floorPrice} SOL)`);
      return true;
    } else {
      this.log('FAIL', 'Floor price system issues');
      return false;
    }
  }

  async testAchievementSystem() {
    const result = await this.testPostEndpoint('/api/achievements/initialize');
    if (result && result.success) {
      this.log('PASS', `Achievement system operational (${result.totalRewards} BUDZ rewards)`);
      return true;
    } else {
      this.log('FAIL', 'Achievement system issues');
      return false;
    }
  }

  checkEnvironmentVariables() {
    const required = ['DATABASE_URL'];
    const optional = ['OPENAI_API_KEY', 'HELIUS_PROJECT_ID', 'CROSSMINT_SERVER_API_KEY'];
    
    let hasRequired = true;
    required.forEach(env => {
      if (process.env[env]) {
        this.log('PASS', `Required environment variable ${env} is set`);
      } else {
        this.log('FAIL', `Required environment variable ${env} is missing`);
        hasRequired = false;
      }
    });

    optional.forEach(env => {
      if (process.env[env]) {
        this.log('PASS', `Optional environment variable ${env} is configured`);
      } else {
        this.log('WARN', `Optional environment variable ${env} not configured`);
      }
    });

    return hasRequired;
  }

  checkSecurityHeaders() {
    // Check for hardcoded URLs that should be environment-aware
    const serverFiles = execSync('find server -name "*.ts" -type f').toString().split('\n').filter(f => f);
    let securityIssues = 0;

    serverFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('localhost:5000') && !content.includes('process.env')) {
          this.log('WARN', `Hardcoded localhost found in ${file}`);
          securityIssues++;
        }
      }
    });

    if (securityIssues === 0) {
      this.log('PASS', 'No hardcoded URLs detected in server files');
    } else {
      this.log('WARN', `${securityIssues} potential hardcoded URL issues found`);
    }

    return securityIssues === 0;
  }

  async runHealthCheck() {
    this.log('INFO', 'Starting comprehensive deployment health check...');
    
    // File system checks
    this.log('INFO', 'Checking required files...');
    this.checkFileExists('package.json');
    this.checkFileExists('server/index.ts');
    this.checkFileExists('client/src/App.tsx');
    this.checkFileExists('Final/client/src/App.tsx');
    
    // Environment checks
    this.log('INFO', 'Checking environment configuration...');
    this.checkEnvironmentVariables();
    this.checkSecurityHeaders();
    
    // Build checks
    this.log('INFO', 'Testing build process...');
    this.checkBuildOutput();
    
    // API health checks
    this.log('INFO', 'Testing API endpoints...');
    await this.testDatabaseConnection();
    await this.testWeb3Integration();
    await this.testTokenPricing();
    await this.testFloorPrice();
    await this.testAchievementSystem();
    
    // Final report
    this.log('INFO', '='.repeat(60));
    this.log('INFO', 'DEPLOYMENT HEALTH CHECK SUMMARY');
    this.log('INFO', '='.repeat(60));
    this.log('INFO', `Tests Passed: ${this.results.passed}`);
    this.log('INFO', `Tests Failed: ${this.results.failed}`);
    this.log('INFO', `Warnings: ${this.results.warnings}`);
    
    if (this.results.failed === 0) {
      this.log('PASS', 'ALL SYSTEMS OPERATIONAL - READY FOR DEPLOYMENT');
    } else {
      this.log('FAIL', 'DEPLOYMENT ISSUES DETECTED - REVIEW REQUIRED');
      this.log('INFO', 'Issues found:');
      this.results.issues.forEach(issue => {
        this.log('INFO', `  - ${issue}`);
      });
    }
    
    return this.results.failed === 0;
  }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  checker.runHealthCheck()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

export default HealthChecker;