/**
 * Validates namespace prefix usage in translation calls.
 *
 * This script ensures:
 * 1. Code in packages uses the package's namespace when the key exists in the package's locale
 * 2. Code in public/ uses public~ namespace (not package namespaces)
 *
 * Examples:
 * - t('public~Resources') in OLM package → ERROR if 'Resources' exists in olm.json
 * - t('olm~Something') in public/ → ERROR (public should use public~)
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');
const PACKAGES_DIR = path.join(FRONTEND_DIR, 'packages');

// Directories to skip when scanning
const SKIP_DIRS = ['node_modules', '__tests__', 'dist', 'build', 'locales', '__mocks__'];

const errors = [];

/**
 * Load translation keys from a locale file
 */
function loadLocaleKeys(localeFilePath) {
  if (!fs.existsSync(localeFilePath)) return new Set();

  try {
    const data = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'));
    return new Set(Object.keys(data));
  } catch (_e) {
    return new Set();
  }
}

/**
 * Build mapping: directory path → { namespace, keys }
 */
function buildNamespaceMap() {
  const map = new Map();
  const allPackageNamespaces = new Set();

  // Scan packages for their namespaces
  if (fs.existsSync(PACKAGES_DIR)) {
    fs.readdirSync(PACKAGES_DIR).forEach((pkg) => {
      const pkgPath = path.join(PACKAGES_DIR, pkg);
      const localesDir = path.join(pkgPath, 'locales', 'en');

      if (fs.existsSync(localesDir) && fs.statSync(pkgPath).isDirectory()) {
        const jsonFiles = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
        if (jsonFiles.length > 0) {
          const namespace = path.basename(jsonFiles[0], '.json');
          const localeFile = path.join(localesDir, jsonFiles[0]);
          map.set(pkgPath, {
            namespace,
            keys: loadLocaleKeys(localeFile),
          });
          allPackageNamespaces.add(namespace);
        }
      }
    });
  }

  return { map, allPackageNamespaces };
}

/**
 * Get the package info for a source file based on its location
 */
function getPackageInfo(filePath, namespaceMap) {
  for (const [dirPath, info] of namespaceMap) {
    if (filePath.startsWith(dirPath)) {
      return info;
    }
  }
  return null;
}

/**
 * Extract translation calls with namespace prefix
 */
function extractTranslationCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const calls = [];

  // Match: t('namespace~key'), t("namespace~key")
  const regex = /(?:^|[^a-zA-Z])t\s*\(\s*['"]([a-zA-Z0-9-]+)~([^'"]+)['"]/g;

  lines.forEach((line, index) => {
    const lineMatches = line.matchAll(regex);
    for (const match of lineMatches) {
      calls.push({
        namespace: match[1],
        key: match[2],
        line: index + 1,
      });
    }
  });

  return calls;
}

/**
 * Validate namespace usage in package files
 */
function validatePackages(namespaceMap) {
  let fileCount = 0;
  let errorCount = 0;

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach((entry) => {
      const fullPath = path.join(dir, entry);

      if (fs.statSync(fullPath).isDirectory()) {
        if (!SKIP_DIRS.includes(entry)) {
          scanDir(fullPath);
        }
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        fileCount++;

        const pkgInfo = getPackageInfo(fullPath, namespaceMap);
        if (!pkgInfo) return;

        const calls = extractTranslationCalls(fullPath);

        calls.forEach(({ namespace, key, line }) => {
          // Error if using public~ but key exists in package's own locale
          if (namespace === 'public' && pkgInfo.keys.has(key)) {
            const relativePath = fullPath.replace(FRONTEND_DIR, '.');
            errors.push(
              `Wrong namespace in ${relativePath}:${line}\n` +
                `   Used: 'public~${key}'\n` +
                `   Key exists in '${pkgInfo.namespace}' locale\n` +
                `   Use: '${pkgInfo.namespace}~${key}'`,
            );
            errorCount++;
          }
        });
      }
    });
  }

  scanDir(PACKAGES_DIR);
  return { fileCount, errorCount };
}

/**
 * Validate namespace usage in public/ files
 */
function validatePublic(allPackageNamespaces) {
  let fileCount = 0;
  let errorCount = 0;

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach((entry) => {
      const fullPath = path.join(dir, entry);

      if (fs.statSync(fullPath).isDirectory()) {
        if (!SKIP_DIRS.includes(entry)) {
          scanDir(fullPath);
        }
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        fileCount++;

        const calls = extractTranslationCalls(fullPath);

        calls.forEach(({ namespace, key, line }) => {
          // Error if using a package namespace in public/
          if (allPackageNamespaces.has(namespace)) {
            const relativePath = fullPath.replace(FRONTEND_DIR, '.');
            errors.push(
              `Wrong namespace in ${relativePath}:${line}\n` +
                `   Used: '${namespace}~${key}'\n` +
                `   Code in public/ should use: 'public~${key}'`,
            );
            errorCount++;
          }
        });
      }
    });
  }

  scanDir(PUBLIC_DIR);
  return { fileCount, errorCount };
}

/**
 * Main entry point
 */
function main() {
  console.log('Validating namespace prefix usage in translation calls...\n');

  const { map: namespaceMap, allPackageNamespaces } = buildNamespaceMap();

  console.log(`Found ${namespaceMap.size} package(s) with locales\n`);

  // Validate packages (public~ usage when key exists in package locale)
  const pkgResult = validatePackages(namespaceMap);
  console.log(`Packages: Scanned ${pkgResult.fileCount} files`);

  // Validate public (package namespace usage)
  const pubResult = validatePublic(allPackageNamespaces);
  console.log(`Public:   Scanned ${pubResult.fileCount} files\n`);

  if (errors.length > 0) {
    console.error(`Found ${errors.length} error(s):\n`);
    errors.forEach((err, i) => console.error(`${i + 1}. ${err}\n`));
    process.exit(1);
  }

  console.log('All namespace prefixes are correct!');
}

if (require.main === module) {
  main();
}

module.exports = { buildNamespaceMap };
