import random
import time
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import requests
import json


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
    Scrape Amazon category page for top product URLs using advanced anti-detection techniques.
    """
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
    max_retries = 5
    base_delay = 3
    
    for attempt in range(max_retries):
        try:
            # Use session for better connection management
            session = requests.Session()
            
            # Set realistic headers
            headers = get_realistic_headers()
            session.headers.update(headers)
            
            # Add random delay before request
            time.sleep(random.uniform(1, 3))
            
            # Make request with timeout
            response = session.get(search_url, timeout=15)
            response.raise_for_status()
            
            # Check if we got a valid HTML response
            if "amazon" not in response.text.lower():
                raise Exception("Response doesn't appear to be from Amazon")
                
            soup = BeautifulSoup(response.text, "html.parser")

            # Multiple selectors for product links to handle different page layouts
            selectors = [
                "a.a-link-normal.s-no-outline",
                "a[href*='/dp/']",
                "h2 a[href*='/dp/']",
                ".s-result-item a[href*='/dp/']",
                "[data-component-type='s-search-result'] a[href*='/dp/']",
                ".s-card-container a[href*='/dp/']",
                ".a-section a[href*='/dp/']",
                "div[data-asin] a[href*='/dp/']",
                ".sg-col-inner a[href*='/dp/']"
            ]
            
            for selector in selectors:
                results = soup.select(selector)
                for link in results:
                    href = link.get("href")
                    if href and "/dp/" in href:
                        # Clean and construct full URL
                        if href.startswith("/"):
                            full_url = f"https://{domain}{href.split('?')[0]}"
                        elif href.startswith("http"):
                            full_url = href.split('?')[0]
                        else:
                            continue
                            
                        # Ensure proper domain
                        if domain not in full_url:
                            full_url = full_url.replace("amazon.com", domain)
                            
                        # Additional URL validation
                        if "/dp/" in full_url and len(full_url) > 20:
                            if full_url not in urls:
                                urls.append(full_url)
                            if len(urls) >= num_results:
                                break
                if len(urls) >= num_results:
                    break
                    
            # If we got URLs, break out of retry loop
            if urls:
                print(f"Successfully found {len(urls)} URLs for category '{clean_category}'")
                break
            else:
                # Try alternative approach - look for data-asin attributes
                asin_elements = soup.select("[data-asin]")
                for element in asin_elements:
                    asin = element.get("data-asin")
                    if asin and len(asin) == 10:  # Valid ASIN length
                        full_url = f"https://{domain}/dp/{asin}"
                        if full_url not in urls:
                            urls.append(full_url)
                        if len(urls) >= num_results:
                            break
                            
                if urls:
                    print(f"Successfully found {len(urls)} URLs using ASIN method for category '{clean_category}'")
                    break
                else:
                    raise Exception("No product URLs found in response")
                
        except Exception as e:
            print(f"Amazon category scraping error (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                # Exponential backoff with jitter
                delay = base_delay * (2 ** attempt) + random.uniform(0, 2)
                print(f"Retrying in {delay:.1f} seconds...")
                time.sleep(delay)
            else:
                print(f"Max retries reached for category '{clean_category}'. Moving on.")

    # Be polite and avoid hammering Amazon
    time.sleep(random.uniform(2, 5))

    # Clean URLs to ensure https and proper domain
    cleaned_urls = []
    for url in urls[:num_results]:
        if url.startswith("http://"):
            url = "https://" + url[len("http://") :]
        if "www." not in url:
            parts = url.split("//")
            url = parts[0] + "//www." + parts[1]
        cleaned_urls.append(url)

    return cleaned_urls


import re


def parse_price_to_float(price_str):
    if not price_str:
        return None
    # Remove currency symbols and commas, extract numeric part
    match = re.search(r"[\d,.]+", price_str)
    if not match:
        return None
    num_str = match.group(0).replace(",", "").replace(".", "")
    # Handle decimal point by checking last two digits
    if len(num_str) > 2:
        num = float(num_str[:-2] + "." + num_str[-2:])
    else:
        num = float(num_str)
    return num


def scrape_amazon_product(url):
    """Scrape individual Amazon product with improved error handling"""
    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            # Use session for better connection management
            session = requests.Session()
            
            # Set realistic headers
            headers = get_realistic_headers()
            session.headers.update(headers)
            
            # Add random delay
            time.sleep(random.uniform(1, 2))
            
            # Make request with timeout
            response = session.get(url, timeout=15)
            response.raise_for_status()
            
            # Check if we got a valid HTML response
            if "amazon" not in response.text.lower():
                raise Exception("Response doesn't appear to be from Amazon")
                
            soup = BeautifulSoup(response.text, "html.parser")

            # Multiple selectors for title
            title_selectors = [
                "#productTitle",
                "h1#title",
                ".product-title",
                "h1[data-automation-id='product-title']",
                "#title",
                ".a-size-large.product-title-word-break",
                "h1.a-size-large"
            ]
            
            title = None
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    if title and len(title) > 5:  # Basic validation
                        break

            # Multiple selectors for image
            image_selectors = [
                "#imgTagWrapperId img",
                "#landingImage",
                ".a-dynamic-image",
                "img[data-old-hires]",
                "img[data-a-dynamic-image]",
                "#main-image",
                ".a-image-container img",
                "img[alt*='product']"
            ]
            
            image_url = None
            for selector in image_selectors:
                image_elem = soup.select_one(selector)
                if image_elem:
                    # Try different image attributes
                    for attr in ['src', 'data-src', 'data-old-hires', 'data-a-dynamic-image']:
                        if image_elem.has_attr(attr):
                            attr_value = image_elem[attr]
                            if attr_value and 'http' in attr_value:
                                # Handle data-a-dynamic-image JSON format
                                if attr == 'data-a-dynamic-image':
                                    try:
                                        dynamic_data = json.loads(attr_value)
                                        if dynamic_data:
                                            # Get the first available image URL
                                            first_key = list(dynamic_data.keys())[0]
                                            image_url = first_key
                                            break
                                    except:
                                        continue
                                else:
                                    image_url = attr_value
                                    break
                    if image_url:
                        break

            # Multiple selectors for price
            price_selectors = [
                ".a-price .a-offscreen",
                "#priceblock_ourprice",
                "#priceblock_dealprice",
                ".a-price-whole",
                ".a-price-range .a-offscreen",
                "[data-a-color='price'] .a-offscreen",
                ".a-price.a-text-price .a-offscreen",
                ".a-price.a-text-price.a-size-medium.a-color-price .a-offscreen",
                ".a-price.a-text-price.a-size-base.a-color-price .a-offscreen"
            ]
            
            price_text = None
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    if price_text and any(char.isdigit() for char in price_text):
                        break

            price_value = parse_price_to_float(price_text)

            # Multiple selectors for rating
            rating_selectors = [
                "span.a-icon-alt",
                ".a-icon-alt",
                "[data-hook='rating-out-of-text']",
                ".a-star-rating-text",
                ".a-icon-star-small .a-icon-alt",
                ".a-icon-star .a-icon-alt"
            ]
            
            rating = None
            for selector in rating_selectors:
                rating_elem = soup.select_one(selector)
                if rating_elem:
                    rating_text = rating_elem.get_text(strip=True)
                    # Extract numeric rating
                    rating_match = re.search(r"(\d+(?:\.\d+)?)", rating_text)
                    if rating_match:
                        rating = float(rating_match.group(1))
                        if 0 <= rating <= 5:  # Validate rating range
                            break

            # Validate that we got at least a title and URL
            if not title or len(title) < 5:
                raise Exception("Could not extract valid product title")

            # Ensure we have a valid product URL
            if not url or "/dp/" not in url:
                raise Exception("Invalid product URL")

            return {
                "url": url,
                "title": title,
                "image_url": image_url,
                "price": price_text,
                "price_value": price_value,
                "average_rating": rating,
            }
            
        except Exception as e:
            print(f"Error scraping product {url} (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                time.sleep(delay)
            else:
                print(f"Failed to scrape product after {max_retries} attempts: {url}")
                return None

    return None


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
