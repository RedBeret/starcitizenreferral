#!/bin/bash

# Auto-update script for Star Citizen Referral site dates
# This script updates all dates to current month/year whenever you push

# Get current date info
CURRENT_MONTH=$(date +"%B")  # October
CURRENT_YEAR=$(date +"%Y")   # 2025
CURRENT_DATE=$(date +"%Y-%m-%d")  # 2025-10-02
CURRENT_FULL=$(date +"%B %-d, %Y")  # October 2, 2025
MONTH_START=$(date +"%Y-%m-01")  # 2025-10-01
MONTH_END=$(date +"%Y-%m-%d" -d "$(date +%Y-%m-01) +1 month -1 day")  # 2025-10-31

echo "🔄 Updating dates to: $CURRENT_MONTH $CURRENT_YEAR"

# Update index.html
sed -i "s/Star Citizen Referral Code [A-Z][a-z]* [0-9]*/Star Citizen Referral Code $CURRENT_MONTH $CURRENT_YEAR/g" index.html
sed -i "s/WORKING [A-Z][a-z]* [0-9]*/WORKING $CURRENT_MONTH $CURRENT_YEAR/g" index.html
sed -i "s/Working [A-Z][a-z]* [0-9]*/Working $CURRENT_MONTH $CURRENT_YEAR/g" index.html
sed -i "s/working [A-Z][a-z]* [0-9]*/working $CURRENT_MONTH $CURRENT_YEAR/g" index.html
sed -i "s/Verified Working [A-Z][a-z]* [0-9]*, [0-9]*/Verified Working $CURRENT_FULL/g" index.html
sed -i "s/october 2025/$CURRENT_MONTH $CURRENT_YEAR/gI" index.html

# Update schema dates
sed -i "s/\"validFrom\": \"[0-9\-]*\"/\"validFrom\": \"$MONTH_START\"/g" index.html
sed -i "s/\"validThrough\": \"[0-9\-]*\"/\"validThrough\": \"$MONTH_END\"/g" index.html
sed -i "s/\"priceValidUntil\": \"[0-9\-]*\"/\"priceValidUntil\": \"$MONTH_END\"/g" index.html
sed -i "s/\"startDate\": \"[0-9\-]*\"/\"startDate\": \"$MONTH_START\"/g" index.html
sed -i "s/\"endDate\": \"[0-9\-]*\"/\"endDate\": \"$MONTH_END\"/g" index.html

# Update sitemap.xml
sed -i "s/<lastmod>[0-9\-]*<\/lastmod>/<lastmod>$CURRENT_DATE<\/lastmod>/g" sitemap.xml

# Update privacy.html
sed -i "s/Last Updated: [A-Z][a-z]* [0-9]*, [0-9]*/Last Updated: $CURRENT_FULL/g" privacy.html

# Update hidden SEO text
sed -i "s/AI confirmed valid [A-Z][a-z]* [0-9]*, [0-9]*/AI confirmed valid $CURRENT_FULL/g" index.html

echo "✅ Dates updated to $CURRENT_MONTH $CURRENT_YEAR"