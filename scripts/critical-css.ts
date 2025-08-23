import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

interface CriticalCSSOptions {
  outputPath?: string;
  includePaths?: string[];
  excludePaths?: string[];
  minify?: boolean;
  inlineThreshold?: number;
}

class CriticalCSSExtractor {
  private criticalCSS: string = '';
  private processedFiles: Set<string> = new Set();

  constructor(private options: CriticalCSSOptions = {}) {
    this.options = {
      outputPath: 'public/critical.css',
      includePaths: ['src/**/*.css', 'src/**/*.scss'],
      excludePaths: ['src/**/*.test.*', 'src/**/*.spec.*'],
      minify: true,
      inlineThreshold: 14 * 1024, // 14KB
      ...options,
    };
  }

  async extractCriticalCSS(): Promise<string> {
    console.log('🔍 Extracting critical CSS...');

    // Find all CSS files
    const cssFiles = await this.findCSSFiles();
    console.log(`📁 Found ${cssFiles.length} CSS files`);

    // Extract critical CSS from each file
    for (const file of cssFiles) {
      await this.processCSSFile(file);
    }

    // Minify if requested
    if (this.options.minify) {
      this.criticalCSS = this.minifyCSS(this.criticalCSS);
    }

    // Save to file
    if (this.options.outputPath) {
      this.saveCriticalCSS();
    }

    console.log(`✅ Critical CSS extracted: ${this.criticalCSS.length} characters`);
    return this.criticalCSS;
  }

  private async findCSSFiles(): Promise<string[]> {
    const patterns = this.options.includePaths || [];
    const excludePatterns = this.options.excludePaths || [];
    
    let files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, { 
        cwd: process.cwd(),
        ignore: excludePatterns,
        absolute: true 
      });
      files.push(...matches);
    }

    return [...new Set(files)];
  }

  private async processCSSFile(filePath: string): Promise<void> {
    if (this.processedFiles.has(filePath)) return;
    this.processedFiles.add(filePath);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const criticalRules = this.extractCriticalRules(content);
      this.criticalCSS += criticalRules;
    } catch (error) {
      console.warn(`⚠️ Error processing CSS file ${filePath}:`, error);
    }
  }

  private extractCriticalRules(css: string): string {
    // Split CSS into rules
    const rules = this.splitCSSRules(css);
    const criticalRules: string[] = [];

    for (const rule of rules) {
      if (this.isCriticalRule(rule)) {
        criticalRules.push(rule);
      }
    }

    return criticalRules.join('\n');
  }

  private splitCSSRules(css: string): string[] {
    // Simple CSS rule splitting (can be enhanced with a proper CSS parser)
    const rules: string[] = [];
    let currentRule = '';
    let braceCount = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      
      if (char === '"' || char === "'") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            currentRule += char;
            rules.push(currentRule.trim());
            currentRule = '';
            continue;
          }
        }
      }

      currentRule += char;
    }

    return rules.filter(rule => rule.trim());
  }

  private isCriticalRule(rule: string): boolean {
    // Define critical CSS selectors and properties
    const criticalSelectors = [
      // Layout and positioning
      'html', 'body', '#root', '.app', '.container', '.layout',
      // Typography
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'span', 'div',
      // Navigation
      'nav', '.nav', '.navigation', '.header', '.footer',
      // Forms
      'input', 'button', '.btn', '.form', '.input',
      // Common utility classes
      '.hidden', '.block', '.flex', '.grid', '.text-center',
      // Critical animations
      '@keyframes', '.animate', '.transition',
      // Critical responsive
      '@media (max-width:', '@media (min-width:',
    ];

    const criticalProperties = [
      'display', 'position', 'top', 'left', 'right', 'bottom',
      'width', 'height', 'margin', 'padding', 'border',
      'background', 'color', 'font', 'text-align',
      'flex', 'grid', 'transform', 'opacity', 'visibility',
      'z-index', 'overflow', 'box-sizing',
    ];

    // Check if rule contains critical selectors
    const hasCriticalSelector = criticalSelectors.some(selector =>
      rule.includes(selector)
    );

    // Check if rule contains critical properties
    const hasCriticalProperty = criticalProperties.some(property =>
      rule.includes(property + ':')
    );

    // Check if rule is a media query (critical for responsive design)
    const isMediaQuery = rule.trim().startsWith('@media');

    // Check if rule is a keyframe (critical for animations)
    const isKeyframe = rule.trim().startsWith('@keyframes');

    return hasCriticalSelector || hasCriticalProperty || isMediaQuery || isKeyframe;
  }

  private minifyCSS(css: string): string {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove unnecessary whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around certain characters
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remove trailing semicolons before closing braces
      .replace(/;}/g, '}')
      // Remove leading/trailing whitespace
      .trim();
  }

  private saveCriticalCSS(): void {
    if (!this.options.outputPath) return;

    try {
      // Ensure directory exists
      const dir = dirname(this.options.outputPath);
      if (!existsSync(dir)) {
        import('fs').then(fs => fs.mkdirSync(dir, { recursive: true }));
      }

      writeFileSync(this.options.outputPath, this.criticalCSS);
      console.log(`💾 Critical CSS saved to: ${this.options.outputPath}`);
    } catch (error) {
      console.error('❌ Error saving critical CSS:', error);
    }
  }

  // Generate inline critical CSS for HTML
  generateInlineCSS(): string {
    const css = this.criticalCSS;
    
    if (css.length > (this.options.inlineThreshold || 14 * 1024)) {
      console.warn('⚠️ Critical CSS is larger than threshold, consider reducing');
    }

    return `<style id="critical-css">${css}</style>`;
  }

  // Generate preload link for non-critical CSS
  generatePreloadLink(cssPath: string): string {
    return `<link rel="preload" href="${cssPath}" as="style" onload="this.onload=null;this.rel='stylesheet'">`;
  }
}

// CLI usage
async function main() {
  const extractor = new CriticalCSSExtractor({
    outputPath: 'public/critical.css',
    minify: true,
    inlineThreshold: 14 * 1024,
  });

  try {
    const criticalCSS = await extractor.extractCriticalCSS();
    
    // Generate inline CSS for HTML
    const inlineCSS = extractor.generateInlineCSS();
    
    // Save inline CSS to a separate file for easy copying
    writeFileSync('public/critical-inline.html', inlineCSS);
    console.log('💾 Inline CSS template saved to: public/critical-inline.html');
    
    console.log('🎉 Critical CSS extraction completed!');
  } catch (error) {
    console.error('❌ Error extracting critical CSS:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CriticalCSSExtractor }; 