#!/usr/bin/env python3
"""Wikipedia lookup wrapper for deep research.

Usage: wikipedia.py <term> [language]
Output: JSON with summary, sections, and related pages.
"""

import json
import sys
import wikipedia

def main():
    if len(sys.argv) < 2:
        print("Usage: wikipedia.py <term> [language]", file=sys.stderr)
        sys.exit(1)

    term = " ".join(sys.argv[1:-1]) if len(sys.argv) > 2 else sys.argv[1]
    lang = sys.argv[-1] if len(sys.argv) > 2 and sys.argv[-1] in ("en", "zh", "ja", "de", "fr") else "en"

    wikipedia.set_lang(lang)

    result = {"term": term, "language": lang, "found": False}

    try:
        page = wikipedia.page(term, auto_suggest=False)
        result["found"] = True
        result["title"] = page.title
        result["url"] = page.url
        result["summary"] = page.summary
        result["sections"] = page.sections[:20]  # top-level sections only
        result["categories"] = page.categories[:10]

        # Try to get the first few section contents
        try:
            for section_name in result["sections"][:3]:
                try:
                    content = page.section(section_name)
                    if content:
                        result.setdefault("section_contents", {})[section_name] = content[:2000]
                except Exception:
                    pass
        except Exception:
            pass

    except wikipedia.exceptions.DisambiguationError as e:
        result["disambiguation"] = True
        result["options"] = str(e.options)[:500]
    except wikipedia.exceptions.PageError:
        # Try with auto-suggest
        try:
            page = wikipedia.page(term, auto_suggest=True)
            result["found"] = True
            result["title"] = page.title
            result["url"] = page.url
            result["summary"] = page.summary
            result["sections"] = page.sections[:20]
        except Exception:
            result["error"] = f"No Wikipedia page found for '{term}'"
    except Exception as e:
        result["error"] = str(e)

    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
