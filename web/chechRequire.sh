#!/bin/bash

# Navigate to your project directory
cd /path/to/your/project

# Search for 'require' in all JavaScript and TypeScript files
echo "Searching for 'require' in .js and .ts files:"
grep -R "require(" --include=*.js --include=*.ts --include=*.tsx .

# Search for 'require' in package.json files
echo -e "\nSearching for 'require' in package.json files:"
grep -R "\"require\":" --include=package.json .

# Search for 'require' in all files (this might produce a lot of output)
echo -e "\nSearching for 'require' in all files:"
grep -R "require" .

# Count the number of occurrences
echo -e "\nTotal number of 'require' occurrences:"
grep -R "require" . | wc -l