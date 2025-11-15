module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/index',
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/foro',
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/dashboard',
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/perfil',
        'http://localhost/FORO%20WEB%20ACAD%C3%89MICO/frontend/calendario',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu',
      },
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['warn', {minScore: 0.75}],
        'first-contentful-paint': ['warn', {maxNumericValue: 2000}],
        'largest-contentful-paint': ['warn', {maxNumericValue: 2500}],
        'speed-index': ['warn', {maxNumericValue: 3000}],
        'interactive': ['warn', {maxNumericValue: 3000}],
        'cumulative-layout-shift': ['warn', {maxNumericValue: 0.1}],
        
        // Accessibility
        'categories:accessibility': ['error', {minScore: 0.90}],
        
        // Best Practices
        'categories:best-practices': ['warn', {minScore: 0.85}],
        
        // SEO
        'categories:seo': ['warn', {minScore: 0.90}],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};

