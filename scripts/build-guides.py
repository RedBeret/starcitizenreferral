#!/usr/bin/env python3
"""Build the guide expansion only. Never writes homepage, shared CSS/JS or site data."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
from datetime import date
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = 'https://starcitizenreferrals.space'
HUB = '/pages/guides/guide-library.html'
CATALOG = json.loads((ROOT / '_content/guides/catalog.json').read_text())
TEMPLATE = (ROOT / '_content/guide-template.html').read_text()
PROTECTED = ['index.html', 'assets/css/site.css', 'assets/js/script.js', 'og-image.jpg']
BEFORE = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in PROTECTED}

class Headings(HTMLParser):
    def __init__(self):
        super().__init__(); self.items = []; self.current = None; self.text = ''
    def handle_starttag(self, tag, attrs):
        if tag == 'h2': self.current = dict(attrs).get('id'); self.text = ''
    def handle_data(self, data):
        if self.current: self.text += data
    def handle_endtag(self, tag):
        if tag == 'h2' and self.current:
            self.items.append((self.current, self.text)); self.current = None

def route(slug):
    return f'/pages/guides/{slug}.html'

def external(url, title):
    return f'<a href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">{escape(title)}</a>'

def source_block(items, reviewed):
    return '<section class="source-list" aria-label="Official sources"><h2>Official sources</h2><ul>' + ''.join('<li>' + external(x['url'], x['title']) + '</li>' for x in items) + '</ul><p class="small-text">Researched from RSI documentation checked on ' + date.fromisoformat(reviewed).strftime('%d %B %Y').lstrip('0') + '. Controls and alpha systems may change; use the current in-game prompts and source articles.</p></section>'

def related_block(slugs):
    by_slug = {x['slug']: x for x in CATALOG}
    return '<nav class="side-links" aria-label="Related guides"><strong>Continue exploring</strong><a href="' + HUB + '">All Star Citizen guides →</a>' + ''.join(f'<a href="{route(s)}">{escape(by_slug[s]["heading"])} →</a>' for s in slugs) + '<a href="/pages/guides/referral-codes.html">Referral rules →</a></nav>'

def render(entry, body, is_hub=False):
    path = HUB if is_hub else route(entry['slug'])
    canonical = DOMAIN + path
    breadcrumb = [{'@type':'ListItem','position':1,'name':'Home','item':DOMAIN+'/'}, {'@type':'ListItem','position':2,'name':'Guide library','item':DOMAIN+HUB}]
    visible = '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>'
    if not is_hub:
        breadcrumb.append({'@type':'ListItem','position':3,'name':entry['heading'],'item':canonical})
        visible += f'<a href="{HUB}">Guide library</a><span aria-hidden="true">/</span><span>{escape(entry["heading"])}</span>'
    else:
        visible += '<span>Guide library</span>'
    visible += '</nav>'
    schema = [{'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':breadcrumb}]
    if is_hub:
        schema.append({'@context':'https://schema.org','@type':'CollectionPage','name':entry['heading'],'url':canonical,'description':entry['description'],'mainEntity':{'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':e['heading'],'url':DOMAIN+route(e['slug'])} for i,e in enumerate(CATALOG)]}})
    else:
        schema.append({'@context':'https://schema.org','@type':'Article','headline':entry['heading'],'description':entry['description'],'datePublished':entry['reviewed'],'dateModified':entry['reviewed'],'author':{'@type':'Person','name':'PatchOps','url':'https://robertsspaceindustries.com/en/citizens/PatchOps'},'mainEntityOfPage':canonical,'image':DOMAIN+'/og-image.jpg','citation':[s['url'] for s in entry['sources']]})
        headings=Headings(); headings.feed(body)
        toc='<nav class="toc" aria-label="On this page"><strong>On this page</strong><ul>'+''.join(f'<li><a href="#{escape(i)}">{escape(t)}</a></li>' for i,t in headings.items)+'</ul></nav>'
        # Keep the quick answer before the contents so a visitor gets an immediate answer.
        end=body.find('</div>')+len('</div>')
        body=body[:end]+'\n'+toc+'\n'+body[end:]+source_block(entry['sources'], entry['reviewed'])
    values={'REVIEW_DATE':entry['reviewed'],'REVIEW_LABEL':date.fromisoformat(entry['reviewed']).strftime('%d %B %Y').lstrip('0'),'TITLE':escape(entry['title'],quote=True),'DESCRIPTION':escape(entry['description'],quote=True),'CANONICAL':canonical,'SCHEMA':'\n'.join('<script type="application/ld+json">'+json.dumps(x,ensure_ascii=False)+'</script>' for x in schema),'BREADCRUMB':visible,'HEADING':escape(entry['heading']),'LEDE':escape(entry['lede']),'BODY':body,'RELATED':related_block(entry.get('related',[]))}
    html=TEMPLATE
    for key,value in values.items(): html=html.replace('@@'+key+'@@',value)
    assert not re.search(r'@@[A-Z]+@@',html),path
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/guides.css?v=20261115">\n</head>')
    (ROOT/path.lstrip('/')).write_text(html)

for entry in CATALOG:
    body=(ROOT/'_content/guides'/f'{entry["slug"]}.html').read_text()
    render(entry,body)

hub={'reviewed':max(x['reviewed'] for x in CATALOG),'heading':'Star Citizen guides for your first adventures.','title':'Star Citizen Guide Library | Setup, Flight & Beginner Help','description':'Browse Star Citizen guides for PC requirements, installation, first flight, quantum travel, friends, missions, Free Fly access and insurance.','lede':'Choose the next thing you want to do. Each guide tackles a practical question, with official sources and related steps.','related':['system-requirements','first-flight-new-babbage','beginner-missions']}
body='<div class="guide-answer"><strong>Find your next step</strong><p>New to the game? Start with the <a href="/pages/guides/new-player-guide.html">account-to-first-flight overview</a>. Already playing? Pick a specific topic below.</p></div>'
for i,group in enumerate(dict.fromkeys(x['group'] for x in CATALOG)):
    body+=f'<section aria-labelledby="group-{i}"><h2 id="group-{i}">{escape(group)}</h2><div class="library-grid">'
    for entry in [x for x in CATALOG if x['group']==group]:
        body+=f'<a class="library-card" href="{route(entry["slug"])}"><span class="kicker">Field guide</span><h3>{escape(entry["heading"])}</h3><p>{escape(entry["description"])}</p><span class="guide-more">Read the guide <span aria-hidden="true">↗</span></span></a>'
    body+='</div></section>'
body+='<section><h2>Accounts, packages and referral help</h2><ul><li><a href="/pages/guides/new-player-guide.html">New player overview</a> — account creation through the first session.</li><li><a href="/pages/guides/starter-pack-guide.html">Choosing a game package</a> — access, owned ships and temporary loaners.</li><li><a href="/pages/guides/50000-uec-bonus.html">The standard 50,000 UEC bonus</a> — account UEC, alpha credits and signup terms.</li><li><a href="/pages/guides/referral-codes.html">How referral codes work</a> — eligibility and the account-creation window.</li><li><a href="/pages/info/star-citizen-referral-code-not-working.html">Referral troubleshooting</a> — an empty field, an existing account or delayed credits.</li></ul></section>'
body+='<p>Release information is separate from these task guides: see the <a href="/pages/monthly/current-month.html">dated LIVE/PTU and event snapshot</a> for that context. This library is an independent community resource by PatchOps.</p>'
render(hub,body,True)

# Add discovery within the existing guide section. The homepage is deliberately excluded.
for path in (ROOT/'pages').rglob('*.html'):
    html=path.read_text()
    html=html.replace('href="/#guides"','href="'+HUB+'"')
    if path.parent.name=='guides' and path.name not in [x['slug']+'.html' for x in CATALOG]+['guide-library.html']:
        marker='<!-- GUIDE-LIBRARY-DISCOVERY -->'
        discovery=marker+'<section class="guide-discovery" aria-labelledby="guide-library-next"><h2 id="guide-library-next">Plan your next step</h2><p><a href="'+HUB+'">Browse the complete Star Citizen guide library →</a></p><ul><li><a href="'+route('system-requirements')+'">Check your PC requirements</a></li><li><a href="'+route('install-star-citizen')+'">Install the game and check the launcher</a></li><li><a href="'+route('first-flight-new-babbage')+'">Find your ship in New Babbage</a></li><li><a href="'+route('beginner-missions')+'">Choose a first mission</a></li></ul></section><!-- END-GUIDE-LIBRARY-DISCOVERY -->'
        html=re.sub(re.escape(marker)+r'.*?<!-- END-GUIDE-LIBRARY-DISCOVERY -->\s*','',html,flags=re.S)
        html=html.replace('<section class="source-list"',discovery+'\n<section class="source-list"',1)
        if '/assets/css/guides.css' not in html:
            html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/guides.css?v=20261115">\n</head>')
    if html!=path.read_text(): path.write_text(html)

# Append only the new canonical URLs; do not manufacture fresh dates on older pages.
p=ROOT/'sitemap.xml'
s=p.read_text(); ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
existing={x.text for x in ET.fromstring(s).findall('s:url/s:loc',ns)}
dated_paths={HUB:hub['reviewed'], **{route(x['slug']):x['reviewed'] for x in CATALOG}}
additions=''.join(f'  <url><loc>{DOMAIN+r}</loc><lastmod>{reviewed}</lastmod></url>\n' for r,reviewed in dated_paths.items() if DOMAIN+r not in existing)
for r,reviewed in dated_paths.items():
    pattern=r'(<url>\s*<loc>'+re.escape(DOMAIN+r)+r'</loc>\s*<lastmod>)[^<]+(</lastmod>)'
    s=re.sub(pattern,lambda m:m[1]+reviewed+m[2],s)
s=s.replace('</urlset>',additions+'</urlset>')
if s!=p.read_text():p.write_text(s)
for path,digest in BEFORE.items(): assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==digest, 'Protected file changed: '+path
print(f'Built {len(CATALOG)} guides and one library. Homepage and shared assets unchanged.')
