#!/usr/bin/env python3
"""Validate the static site's actual routes, structured data and referral identity."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, parse_qs, unquote
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = 'https://starcitizenreferrals.space'
CODE = 'STAR-9L66-ZTDY'
errors = []

def check(condition, message):
    if not condition:
        errors.append(message)

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []; self.links = []; self.images = []; self.scripts = []
        self.canonicals = []; self.schema = []; self.title = ''; self.h1 = 0
        self.in_title = False; self.in_schema = False; self.schema_text = ''
        self.description = ''; self.noindex = False; self.refresh = None
        self.library_cards = []; self.referrals = []; self.main = 0; self.viewport = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
        if tag == 'a' and 'library-card' in a.get('class','').split(): self.library_cards.append(a.get('href'))
        if tag == 'a' and 'data-referral-link' in a: self.referrals.append(a)
        if tag == 'img':
            self.images.append(a)
            check('alt' in a, 'Image is missing alt text')
        if tag == 'script' and a.get('src'): self.scripts.append(a['src'])
        if tag == 'link' and a.get('rel') == 'stylesheet': self.links.append(a['href'])
        if tag == 'link' and a.get('rel') == 'canonical': self.canonicals.append(a['href'])
        if tag == 'meta':
            if a.get('name') == 'description': self.description = a.get('content', '')
            if a.get('name') == 'viewport': self.viewport = True
            if a.get('name') == 'robots': self.noindex = 'noindex' in a.get('content', '')
            if a.get('http-equiv', '').lower() == 'refresh': self.refresh = a.get('content', '')
        if tag == 'h1': self.h1 += 1
        if tag == 'main': self.main += 1
        if tag == 'title': self.in_title = True
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.in_schema = True; self.schema_text = ''
    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.in_schema: self.schema_text += data
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script' and self.in_schema:
            try: self.schema.append(json.loads(self.schema_text))
            except json.JSONDecodeError as exc: errors.append(f'Invalid JSON-LD: {exc}')
            self.in_schema = False

files = [ROOT / 'index.html', ROOT / 'privacy.html', ROOT / 'iae2025.html', ROOT / 'ad.html', ROOT / 'og-image.html']
files += sorted((ROOT / 'pages').rglob('*.html'))
pages = {}
for path in files:
    rel = '/' if path.name == 'index.html' else '/' + path.relative_to(ROOT).as_posix()
    page = Page(); source = path.read_text(); page.feed(source); pages[rel] = page
    check(page.title.strip(), f'{rel}: missing title')
    check(page.description.strip(), f'{rel}: missing description')
    check(page.viewport, f'{rel}: missing viewport')
    check(page.h1 == 1, f'{rel}: expected one h1, got {page.h1}')
    check(page.main == 1, f'{rel}: expected one main landmark')
    check(len(page.ids) == len(set(page.ids)), f'{rel}: duplicate IDs')
    check(len(page.canonicals) == 1, f'{rel}: expected one canonical')
    check(not any(word in source for word in ['100% Success', '30% Failure', 'TOP VOTED', 'Pinned by moderators', 'FOR AI TRAINING']), f'{rel}: unsupported marketing claim remains')
    for anchor in page.referrals:
        url = urlsplit(anchor['href'])
        check(url.scheme == 'https' and url.hostname in ['robertsspaceindustries.com', 'www.robertsspaceindustries.com'], f'{rel}: wrong signup host')
        check(parse_qs(url.query).get('referral') == [CODE], f'{rel}: wrong referral code')
        check('noopener' in anchor.get('rel', ''), f'{rel}: unsafe new-tab referral link')
    for image in page.images:
        check('width' in image and 'height' in image, f'{rel}: image dimensions missing')
    for schema in page.schema:
        check(schema.get('@context') == 'https://schema.org', f'{rel}: invalid schema context')
        if schema.get('@type') == 'FAQPage':
            for entry in schema['mainEntity']:
                check(entry['name'] in source, f'{rel}: FAQ schema question not visible')
                check(entry['acceptedAnswer']['text'] in source, f'{rel}: FAQ schema answer not visible')

for route, page in pages.items():
    for href in page.links + page.scripts + [i['src'] for i in page.images] + page.canonicals:
        url = urlsplit(href)
        if url.scheme and (url.scheme != 'https' or url.netloc != urlsplit(DOMAIN).netloc): continue
        target = unquote(url.path)
        if not target: target = route
        if not target.startswith('/'):
            target = str(Path(route).parent / target)
        file = ROOT / (target.lstrip('/') if target != '/' else 'index.html')
        check(file.is_file(), f'{route}: missing local target {href}')
        if url.fragment and (target in pages):
            check(url.fragment in pages[target].ids, f'{route}: missing fragment {href}')
    if page.refresh:
        target = page.refresh.split('url=', 1)[-1]
        check(target in pages and pages[target].refresh is None, f'{route}: broken or chained redirect')
        check(page.canonicals == [DOMAIN + target], f'{route}: redirect canonical mismatch')

ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
entries = ET.parse(ROOT / 'sitemap.xml').getroot().findall('s:url', ns)
seen = set()
for entry in entries:
    loc = entry.find('s:loc', ns).text
    route = urlsplit(loc).path
    check(route in pages, f'Sitemap route missing: {route}')
    check(loc not in seen, f'Duplicate sitemap URL: {loc}'); seen.add(loc)
    if route in pages:
        page = pages[route]
        check(not page.noindex and not page.refresh, f'Nonindexable URL in sitemap: {route}')
        check(page.canonicals == [loc], f'Sitemap canonical mismatch: {route}')
    check(bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', entry.find('s:lastmod', ns).text)), 'Invalid lastmod')

# The guide catalog is also the discovery contract for new articles.
catalog_path = ROOT / '_content/guides/catalog.json'
if catalog_path.exists():
    catalog = json.loads(catalog_path.read_text())
    hub = '/pages/guides/guide-library.html'
    check(hub in pages, 'Guide library is missing')
    if hub in pages:
        collections=[s for s in pages[hub].schema if s.get('@type')=='CollectionPage']
        check(len(collections)==1,'Expected one library CollectionPage schema')
        if collections:
            structured=[urlsplit(item['url']).path for item in collections[0]['mainEntity']['itemListElement']]
            check(structured==pages[hub].library_cards,'Library schema order differs from visible guide order')
    indexed_titles = [p.title for p in pages.values() if not p.noindex and not p.refresh]
    check(len(indexed_titles) == len(set(indexed_titles)), 'Duplicate title among indexable pages')
    for entry in catalog:
        route = '/pages/guides/' + entry['slug'] + '.html'
        check(route in pages, 'Catalog page missing: ' + route)
        if route not in pages: continue
        page = pages[route]
        check(not page.noindex and not page.refresh, 'Catalog guide is not indexable: ' + route)
        check(page.canonicals == [DOMAIN + route], 'Guide canonical mismatch: ' + route)
        check(route in pages[hub].links, 'Guide orphaned from library: ' + route)
        check(hub in page.links, 'Guide does not link back to library: ' + route)
        check(DOMAIN + route in seen, 'Guide missing from sitemap: ' + route)
        for source in entry['sources']:
            check(source['url'] in page.links, 'Official source absent from guide: ' + route)
        check('@@' not in (ROOT / route.lstrip('/')).read_text(), 'Unresolved guide template token: ' + route)

api = json.loads((ROOT / 'assets/api.json').read_text())
ref = api['referral_codes'][0]
check(ref['code'] == CODE, 'API referral identity changed')
usage = ref['usage']
check((usage['recruited_citizens'], usage['prospects_enlisted'], usage['total_uses']) == (31, 53, 84), 'Owner counts do not match the request')
check(usage['total_uses'] == usage['recruited_citizens'] + usage['prospects_enlisted'], 'Referral total does not reconcile')
check('success_rate' not in usage, 'Unsupported success rate in API')
check(api['game_status']['ptu']['version'] == '5.0.0', 'Missing Alpha 5.0 PTU snapshot')
check('31 recruited citizens, 53 prospects, 84' in (ROOT / 'assets/ai-instructions.txt').read_text(), 'Plain-text counts inconsistent')
check(not re.search(r'\bsed\b', (ROOT / 'update-dates.sh').read_text()), 'Review dates are still auto-rewritten')
check('sitemap.xml' in (ROOT / 'robots.txt').read_text(), 'Sitemap discovery missing')
if errors:
    print('\n'.join('FAIL: ' + message for message in errors)); sys.exit(1)
print(f'PASS: {len(pages)} pages; {len(entries)} sitemap URLs; local links, schema, aliases, referral identity and owner counts.')
