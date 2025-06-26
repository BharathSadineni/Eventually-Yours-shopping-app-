import random
import time
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import requests
import json
import re


def get_realistic_headers():
    """Generate realistic browser headers to avoid detection"""
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    ]
    
    accept_languages = [
        "en-GB,en-US;q=0.9,en;q=0.8",
        "en-US,en;q=0.9,en-GB;q=0.8",
        "en-CA,en-US;q=0.9,en;q=0.8",
        "en-AU,en-US;q=0.9,en;q=0.8",
    ]
    
    return {
        "User-Agent": random.choice(user_agents),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": random.choice(accept_languages),
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }


def amazon_category_top_products(
    category, amazon_domain, num_results=10, budget_range=None
):
    """
    Scrape Amazon category page for top product URLs using rotating user agents and random delays to avoid blocking.
    Supports optional budget_range filtering in the format "$low-$high".
    """
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0",
    ]

    # Parse budget_range if provided
    low_price = None
    high_price = None
    if budget_range:
        try:
            parts = (
                budget_range.replace("£", "")
                .replace("€", "")
                .replace("$", "")
                .split("-")
            )
            if len(parts) == 2:
                low_price = parts[0].strip()
                high_price = parts[1].strip()
        except Exception:
            print("Error parsing budget range. Please check the format.")

    # Construct Amazon search URL for the category, sorted by review rank
    domain = amazon_domain
    if domain.startswith("www."):
        domain = domain[4:]

    # Add price filters if available
    price_filter = ""
    if low_price and high_price:
        price_filter = f"&low-price={low_price}&high-price={high_price}"

    # Clean category name for better search results
    clean_category = category.replace("*", "").replace("  ", " ").strip()
    
    search_url = (
        f"https://www.{domain}/s?k={quote_plus(clean_category)}&s=review-rank{price_filter}"
    )

    urls = []
    max_retries = 3
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            headers = {
                "User-Agent": random.choice(user_agents),
                "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
            }
            response = requests.get(search_url, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            # Find product links in search results
            results = soup.select("a.a-link-normal.s-no-outline")
            for link in results:
                href = link.get("href")
                if href and "/dp/" in href:
                    full_url = f"https://{domain}{href.split('?')[0]}"
                    if full_url not in urls:
                        urls.append(full_url)
                    if len(urls) >= num_results:
                        break
            break  # success, exit retry loop
        except Exception as e:
            print(f"Amazon category scraping error: {e}")
            if attempt < max_retries - 1:
                delay = retry_delay + random.uniform(0, 3)
                print(f"Retrying in {delay:.1f} seconds...")
                time.sleep(delay)
            else:
                print("Max retries reached. Moving on.")

    # Be polite and avoid hammering Amazon
    time.sleep(random.uniform(1, 3))

    # Clean URLs to ensure https and www prefix
    cleaned_urls = []
    for url in urls[:num_results]:
        if url.startswith("http://"):
            url = "https://" + url[len("http://") :]
        if "www." not in url:
            parts = url.split("//")
            url = parts[0] + "//www." + parts[1]
        cleaned_urls.append(url)

    return cleaned_urls


def parse_price_to_float(price_str):
    if not price_str:
        return None
    
    # Remove currency symbols and clean the string
    cleaned = price_str.replace("£", "").replace("€", "").replace("$", "").replace(",", "").strip()
    
    # Handle different price formats
    if "p" in cleaned.lower():  # UK pence format
        # Convert pence to pounds
        pence_match = re.search(r"(\d+)p", cleaned.lower())
        if pence_match:
            pence = int(pence_match.group(1))
            return pence / 100.0
    
    # Handle decimal prices
    decimal_match = re.search(r"(\d+\.\d+)", cleaned)
    if decimal_match:
        return float(decimal_match.group(1))
    
    # Handle whole number prices
    whole_match = re.search(r"(\d+)", cleaned)
    if whole_match:
        return float(whole_match.group(1))
    
    return None


def scrape_amazon_product(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching URL {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    title = soup.find(id="productTitle")
    title = title.get_text(strip=True) if title else None

    image = soup.select_one("#imgTagWrapperId img")
    image_url = image["src"] if image and image.has_attr("src") else None

    # Try multiple price selectors for better price extraction
    price_selectors = [
        ".a-price .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        ".a-price.a-text-price .a-offscreen",
        ".a-price.a-text-price.a-size-medium.a-color-price .a-offscreen",
        ".a-price.a-text-price.a-size-base.a-color-price .a-offscreen",
        ".a-price-whole",
        ".a-price-range .a-offscreen"
    ]
    
    price_text = None
    for selector in price_selectors:
        price_elem = soup.select_one(selector)
        if price_elem:
            price_text = price_elem.get_text(strip=True)
            if price_text and any(char.isdigit() for char in price_text):
                break
    
    price_value = parse_price_to_float(price_text)

    rating_tag = soup.select_one("span.a-icon-alt")
    rating = None
    if rating_tag:
        rating_text = rating_tag.get_text(strip=True)
        # Extract numeric rating
        rating_match = re.search(r"(\d+(?:\.\d+)?)", rating_text)
        if rating_match:
            rating = float(rating_match.group(1))

    return {
        "url": url,
        "title": title,
        "image_url": image_url,
        "price": price_text,
        "price_value": price_value,
        "average_rating": rating,
    }


if __name__ == "__main__":
    # Example usage and test of amazon_scraper.py
    test_categories = [
        "laptop bags",
        "wireless headphones",
        "smart watches",
        "gaming chairs",
        "external hard drives",
        "coffee makers",
        "fitness trackers",
        "robot vacuum cleaners",
        "electric toothbrushes",
        "portable chargers",
    ]
    test_domain = "amazon.com"

    for category in test_categories:
        # print(f"\nFetching top products for category '{category}' on {test_domain}...")
        top_urls = amazon_category_top_products(category, test_domain, num_results=3)
        # print("Top product URLs:")
        for url in top_urls:
            pass  # Add your logic here
            # print(url)

        # if top_urls:
        #     # print("\nScraping product details for top products:")
        for url in top_urls:
            product_info = scrape_amazon_product(url)
            print(product_info)
