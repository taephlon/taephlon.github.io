import os
import shutil
import markdown
import yaml
from pathlib import Path
from collections import defaultdict

BASE_URL = "/taephlon.github.io"
CONTENT_DIR = "content/blog"
OUTPUT_DIR = "."
TEMPLATE_DIR = "templates"

posts = []
tags_map = defaultdict(list)

# clean output
generated_dirs = [
    "blog",
    "tags",
    "assets"
]

for d in generated_dirs:
    if os.path.exists(d):
        shutil.rmtree(d)

for f in ["index.html", "feed.xml"]:
    if os.path.exists(f):
        os.remove(f)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# copy assets
if os.path.exists("assets"):
    shutil.copytree("assets", f"{OUTPUT_DIR}/assets")
else:
    print("assets directory not found, skipping...")
if OUTPUT_DIR != ".":
    shutil.copy("style.css", f"{OUTPUT_DIR}/style.css")
    shutil.copy("script.js", f"{OUTPUT_DIR}/script.js")

# load templates
base_template = open(f"{TEMPLATE_DIR}/base.html").read()
post_template = open(f"{TEMPLATE_DIR}/post.html").read()
index_template = open(f"{TEMPLATE_DIR}/index.html").read()
tag_template = open(f"{TEMPLATE_DIR}/tag.html").read()

# parse markdown posts
for file in os.listdir(CONTENT_DIR):

    if not file.endswith(".md"):
        continue

    filepath = os.path.join(CONTENT_DIR, file)

    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    # safer frontmatter parsing
    if raw.startswith("---"):

        parts = raw.split("---", 2)

        if len(parts) < 3:
            print(f"Invalid frontmatter in {file}")
            continue

        meta = yaml.safe_load(parts[1]) or {}
        body = parts[2]

    else:
        print(f"No frontmatter found in {file}")
        continue

    html_body = markdown.markdown(body)

    slug = file.replace(".md", "")

    post = {
        "slug": slug,
        "title": str(meta.get("title", slug)),
        "date": str(meta.get("date", "")),
        "tags": meta.get("tags", []),
        "favorite": meta.get("favorite", False),
        "popular": meta.get("popular", False),
        "thumbnail": str(meta.get("thumbnail", "/assets/default.jpg")),
        "description": str(meta.get("description", "")),
        "content": html_body
    }

    posts.append(post)

    for tag in post["tags"]:
        tags_map[tag].append(post)

# sort newest first
posts.sort(key=lambda x: x["date"], reverse=True)

# generate individual posts
for post in posts:
    html = post_template

    html = html.replace("{{title}}", post["title"])
    html = html.replace("{{date}}", post["date"])
    html = html.replace("{{content}}", post["content"])

    tag_links = " ".join([
        f'<a href="/tags/{t}/">#{t}</a>'
        for t in post["tags"]
    ])

    html = html.replace("{{tags}}", tag_links)

    final = base_template.replace("{{content}}", html)

    outdir = f"{OUTPUT_DIR}/blog/{post['slug']}"
    os.makedirs(outdir, exist_ok=True)

    with open(f"{outdir}/index.html", "w", encoding="utf-8") as f:
        f.write(final)

# generate cards
cards = ""

for post in posts:
    badges = ""

    if post["favorite"]:
        badges += '<span class="badge">favorite</span> '

    if post["popular"]:
        badges += '<span class="badge">popular</span>'

    cards += f"""
    <a class="card" href="/blog/{post['slug']}/">
        <img src="{post['thumbnail']}">

        <div class="card-content">
            <h3>{post['title']}</h3>

            <p>{post['description']}</p>

            <div class="badges">
                {badges}
            </div>
        </div>
    </a>
    """

homepage = index_template.replace("{{posts}}", cards)

favorites = [
    p for p in posts if p["favorite"]
]

popular = [
    p for p in posts if p["popular"]
]

fav_html = ""
for p in favorites:
    fav_html += f'<a href="/blog/{p["slug"]}/">{p["title"]}</a><br>'

pop_html = ""
for p in popular:
    pop_html += f'<a href="/blog/{p["slug"]}/">{p["title"]}</a><br>'

homepage = homepage.replace("{{favorites}}", fav_html)
homepage = homepage.replace("{{popular}}", pop_html)

final_home = base_template.replace("{{content}}", homepage)

with open(f"{OUTPUT_DIR}/index.html", "w", encoding="utf-8") as f:
    f.write(final_home)

# generate blog index page

blog_cards = ""

for post in posts:

    blog_cards += f"""
    <a class="card" href="/blog/{post['slug']}/">

        <img src="{post['thumbnail']}">

        <div class="card-content">

            <h3>{post['title']}</h3>

            <p>{post['description']}</p>

        </div>

    </a>
    """

blog_index = f"""
<h1>Blog</h1>

<div class="grid">
{blog_cards}
</div>
"""

final_blog = base_template.replace(
    "{{content}}",
    blog_index
)

os.makedirs(f"{OUTPUT_DIR}/blog", exist_ok=True)

with open(
    f"{OUTPUT_DIR}/blog/index.html",
    "w",
    encoding="utf-8"
) as f:

    f.write(final_blog)

# generate tags
for tag, tagged_posts in tags_map.items():

    cards_html = ""

    for post in tagged_posts:
        cards_html += f"""
        <a class="card" href="/blog/{post['slug']}/">
            <img src="{post['thumbnail']}">

            <div class="card-content">
                <h3>{post['title']}</h3>
                <p>{post['description']}</p>
            </div>
        </a>
        """

    html = tag_template
    html = html.replace("{{tag}}", tag)
    html = html.replace("{{posts}}", cards_html)

    final = base_template.replace("{{content}}", html)

    outdir = f"{OUTPUT_DIR}/tags/{tag}"
    os.makedirs(outdir, exist_ok=True)

    with open(f"{outdir}/index.html", "w", encoding="utf-8") as f:
        f.write(final)

# generate RSS
rss = """<?xml version="1.0"?>
<rss version="2.0">
<channel>
<title>Enver Avisena</title>
<link>https://taephlon.github.io</link>
<description>Developer blog</description>
"""

for post in posts:
    rss += f"""
    <item>
        <title>{post['title']}</title>
        <link>https://taephlon.github.io/blog/{post['slug']}/</link>
        <description>{post['description']}</description>
    </item>
    """

rss += "</channel></rss>"

with open(f"{OUTPUT_DIR}/feed.xml", "w") as f:
    f.write(rss)

print("site generated")
