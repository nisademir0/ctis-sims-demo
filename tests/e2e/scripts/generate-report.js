/**
 * Comprehensive Test Report Generator
 * Generates detailed reports based on SRS requirements and test results
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.resultsDir = path.join(__dirname, '..', 'test-results');
    this.reportsDir = path.join(this.resultsDir, 'reports');
    
    // Create reports directory if doesn't exist
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Load test results from JSON files
   */
  loadTestResults() {
    const resultsFile = path.join(this.resultsDir, 'test-results.json');
    const srsFile = path.join(this.resultsDir, 'srs-coverage.json');
    
    let playwrightResults = {};
    let srsResults = [];
    
    if (fs.existsSync(resultsFile)) {
      playwrightResults = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    }
    
    if (fs.existsSync(srsFile)) {
      srsResults = JSON.parse(fs.readFileSync(srsFile, 'utf8'));
    }
    
    return { playwrightResults, srsResults };
  }

  /**
   * Generate SRS Coverage Report
   */
  generateSRSCoverageReport(srsResults) {
    const requirementGroups = {
      'Authentication': [],
      'Inventory Management': [],
      'Transaction Management': [],
      'Maintenance Management': [],
      'Purchase Requests': [],
      'Reporting': [],
      'Notifications': [],
      'AI Chatbot': [],
      'Non-Functional': []
    };

    // Group by requirement category
    srsResults.forEach(result => {
      const reqId = result.requirement;
      const category = this.getRequirementCategory(reqId);
      
      if (requirementGroups[category]) {
        requirementGroups[category].push(result);
      }
    });

    // Generate HTML report
    let html = this.generateHTMLHeader('SRS Requirements Coverage Report');
    
    html += `
      <div class="summary">
        <h2>📊 Test Coverage Summary</h2>
        <div class="stats">
          <div class="stat passed">
            <h3>${this.countByStatus(srsResults, 'passed')}</h3>
            <p>Tests Passed</p>
          </div>
          <div class="stat failed">
            <h3>${this.countByStatus(srsResults, 'failed')}</h3>
            <p>Tests Failed</p>
          </div>
          <div class="stat total">
            <h3>${srsResults.length}</h3>
            <p>Total Tests</p>
          </div>
          <div class="stat coverage">
            <h3>${this.calculateCoverage(srsResults)}%</h3>
            <p>Coverage</p>
          </div>
        </div>
      </div>
    `;

    // Add detailed results by category
    for (const [category, results] of Object.entries(requirementGroups)) {
      if (results.length > 0) {
        html += `
          <div class="category">
            <h2>${category}</h2>
            <table>
              <thead>
                <tr>
                  <th>Requirement ID</th>
                  <th>Requirement</th>
                  <th>Test Name</th>
                  <th>Status</th>
                  <th>Screenshot</th>
                  <th>Notes</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        results.forEach(result => {
          const statusClass = result.status === 'passed' ? 'pass' : 'fail';
          const statusIcon = result.status === 'passed' ? '✅' : '❌';
          
          html += `
            <tr class="${statusClass}">
              <td><strong>${result.requirement}</strong></td>
              <td>${result.requirementName}</td>
              <td>${result.testName}</td>
              <td><span class="status-badge ${statusClass}">${statusIcon} ${result.status}</span></td>
              <td>${result.screenshot ? `<a href="../screenshots/${result.screenshot}" target="_blank">View</a>` : '-'}</td>
              <td>${result.notes || '-'}</td>
              <td>${new Date(result.timestamp).toLocaleString('tr-TR')}</td>
            </tr>
          `;
        });
        
        html += `
              </tbody>
            </table>
          </div>
        `;
      }
    }

    html += this.generateHTMLFooter();
    
    // Save report
    const reportPath = path.join(this.reportsDir, 'srs-coverage-report.html');
    fs.writeFileSync(reportPath, html);
    
    console.log(`✅ SRS Coverage Report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Generate Playwright Results Report
   */
  generatePlaywrightReport(playwrightResults) {
    const suites = playwrightResults.suites || [];
    
    let html = this.generateHTMLHeader('Playwright Test Execution Report');
    
    html += `
      <div class="summary">
        <h2>🎭 Playwright Test Results</h2>
        <div class="test-info">
          <p><strong>Total Suites:</strong> ${suites.length}</p>
          <p><strong>Execution Time:</strong> ${this.formatDuration(playwrightResults.duration || 0)}</p>
        </div>
      </div>
    `;

    // Process each suite
    suites.forEach(suite => {
      html += `
        <div class="suite">
          <h3>📁 ${suite.title}</h3>
      `;
      
      if (suite.specs && suite.specs.length > 0) {
        html += '<table><thead><tr><th>Test</th><th>Status</th><th>Duration</th><th>Browser</th></tr></thead><tbody>';
        
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            const result = test.results[0];
            const status = result.status;
            const statusClass = status === 'passed' ? 'pass' : status === 'failed' ? 'fail' : 'skip';
            const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
            
            html += `
              <tr class="${statusClass}">
                <td>${spec.title}</td>
                <td><span class="status-badge ${statusClass}">${icon} ${status}</span></td>
                <td>${this.formatDuration(result.duration)}</td>
                <td>${test.projectName || 'chromium'}</td>
              </tr>
            `;
          });
        });
        
        html += '</tbody></table>';
      }
      
      html += '</div>';
    });

    html += this.generateHTMLFooter();
    
    const reportPath = path.join(this.reportsDir, 'playwright-execution-report.html');
    fs.writeFileSync(reportPath, html);
    
    console.log(`✅ Playwright Report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Generate Combined Report
   */
  generateCombinedReport() {
    const { playwrightResults, srsResults } = this.loadTestResults();
    
    // Generate individual reports
    this.generateSRSCoverageReport(srsResults);
    this.generatePlaywrightReport(playwrightResults);
    
    // Generate index page
    let html = this.generateHTMLHeader('CTIS-SIMS Test Reports');
    
    html += `
      <div class="summary">
        <h1>🎯 CTIS-SIMS Test Reports</h1>
        <p class="subtitle">Comprehensive Frontend Testing Results</p>
        
        <div class="report-cards">
          <div class="card">
            <h3>📋 SRS Coverage Report</h3>
            <p>Detailed coverage of all SRS requirements with test results and screenshots</p>
            <a href="srs-coverage-report.html" class="btn">View Report</a>
          </div>
          
          <div class="card">
            <h3>🎭 Playwright Execution Report</h3>
            <p>Test execution results across multiple browsers and devices</p>
            <a href="playwright-execution-report.html" class="btn">View Report</a>
          </div>
          
          <div class="card">
            <h3>📸 Screenshots Gallery</h3>
            <p>Visual documentation of all tested features</p>
            <a href="../screenshots/" class="btn">View Gallery</a>
          </div>
        </div>
        
        <div class="stats-overview">
          <h2>Overall Statistics</h2>
          <div class="stats">
            <div class="stat">
              <h3>${srsResults.length}</h3>
              <p>SRS Tests</p>
            </div>
            <div class="stat">
              <h3>${this.countByStatus(srsResults, 'passed')}</h3>
              <p>Passed</p>
            </div>
            <div class="stat">
              <h3>${this.calculateCoverage(srsResults)}%</h3>
              <p>Coverage</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    html += this.generateHTMLFooter();
    
    const indexPath = path.join(this.reportsDir, 'index.html');
    fs.writeFileSync(indexPath, html);
    
    console.log(`\n✅ All reports generated successfully!`);
    console.log(`📂 Reports location: ${this.reportsDir}`);
    console.log(`🌐 Open: ${indexPath}`);
    
    return indexPath;
  }

  // Helper methods
  getRequirementCategory(reqId) {
    if (reqId.startsWith('FR-1')) return 'Authentication';
    if (reqId.startsWith('FR-2')) return 'Inventory Management';
    if (reqId.startsWith('FR-3')) return 'Transaction Management';
    if (reqId.startsWith('FR-4')) return 'Maintenance Management';
    if (reqId.startsWith('FR-5')) return 'Purchase Requests';
    if (reqId.startsWith('FR-6')) return 'Reporting';
    if (reqId.startsWith('FR-7')) return 'Notifications';
    if (reqId.startsWith('FR-8')) return 'AI Chatbot';
    if (reqId.startsWith('NFR')) return 'Non-Functional';
    return 'Other';
  }

  countByStatus(results, status) {
    return results.filter(r => r.status === status).length;
  }

  calculateCoverage(results) {
    if (results.length === 0) return 0;
    const passed = this.countByStatus(results, 'passed');
    return Math.round((passed / results.length) * 100);
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  generateHTMLHeader(title) {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f7fa;
      color: #333;
      padding: 20px;
    }
    .summary {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #2c3e50; margin-bottom: 10px; }
    h2 { color: #34495e; margin: 20px 0; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h3 { color: #555; }
    .subtitle { color: #7f8c8d; font-size: 1.1em; margin-bottom: 30px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat.passed { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    .stat.failed { background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); }
    .stat.total { background: linear-gradient(135deg, #4776E6 0%, #8E54E9 100%); }
    .stat.coverage { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .stat h3 { font-size: 2.5em; margin-bottom: 5px; }
    .stat p { opacity: 0.9; }
    .category {
      background: white;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th {
      background: #34495e;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    tr:hover { background: #f8f9fa; }
    tr.pass { background: #d4edda; }
    tr.fail { background: #f8d7da; }
    tr.skip { background: #fff3cd; }
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: 600;
    }
    .status-badge.pass {
      background: #28a745;
      color: white;
    }
    .status-badge.fail {
      background: #dc3545;
      color: white;
    }
    .status-badge.skip {
      background: #ffc107;
      color: #333;
    }
    .report-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
      margin: 30px 0;
    }
    .card {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 25px;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    .btn {
      display: inline-block;
      background: #3498db;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 15px;
      transition: background 0.3s;
    }
    .btn:hover {
      background: #2980b9;
    }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
    `;
  }

  generateHTMLFooter() {
    return `
  <div style="text-align: center; margin-top: 50px; padding: 20px; color: #7f8c8d;">
    <p>Generated on ${new Date().toLocaleString('tr-TR')}</p>
    <p>CTIS-SIMS Automated Testing Suite</p>
  </div>
</body>
</html>
    `;
  }
}

// Run report generation
const generator = new ReportGenerator();
generator.generateCombinedReport();
